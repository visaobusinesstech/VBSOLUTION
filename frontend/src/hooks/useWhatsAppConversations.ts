"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadUnreadBackup, syncWithServer, markChatAsRead } from "@/utils/unreadBackup";
import { useConnections } from "@/contexts/ConnectionsContext";
import { connectSocket as createSocket, getSocket, safeEmit } from "@/lib/socketManager";
import { log } from "@/utils/productionLogger";
import { resolveDisplayName, mergeIdentity, isPlaceholderName } from "@/utils/identity";
import { hydrateIdentities } from "@/services/identityHydrator";
import { buildMessagePreview } from "@/utils/messagePreview";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL?.trim() || "http://localhost:3000";
const API_URL = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3000';

// PAGINATION CONSTANTS
const PAGE_SIZE = 30;
const CONVERSATIONS_PER_PAGE = 20;
const MESSAGES_PER_PAGE = 50;

// IDENTITY DIRECTORY TYPE
type Identity = { name?: string | null; avatar?: string | null; };

export type WhatsAppMessage = {
  id?: string;
  message_id?: string;
  owner_id?: string;
  connection_id?: string;
  chat_id: string;
  phone?: string;
  conteudo?: string;
  message_type?: string;
  media_url?: string;
  media_mime?: string;
  remetente?: "CLIENTE" | "OPERADOR" | "AI";
  status?: string;
  lida?: boolean;
  timestamp: string | Date;
};

export type Conversation = {
  id: string;
  owner_id?: string;
  connection_id?: string;
  chat_id: string;
  nome_cliente: string;
  numero_cliente: string;
  status?: string;
  lastMessageAt?: string;
  lastMessage?: WhatsAppMessage | null;
  lastMessagePreview?: string;
  unread: number;
  total_messages?: number;
  profile_picture?: string;
};

type HookReturn = {
  conversations: Conversation[];
  messages: WhatsAppMessage[];
  loading: boolean;
  error: string | null;
  connected: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  selectedChatId: string | null;
  selectConversation: (chatId: string, opts?: { localMarkRead?: boolean }) => void;
  sendMessageTo: (chatId: string, text: string, uiType?: string, mediaUrl?: string) => Promise<void>;
  markConversationRead: (chatId: string) => Promise<void>;
  setSelectedChatId: (chatId: string | null) => void;
  setMessages: (messages: WhatsAppMessage[]) => void;
  setConversations: (conversations: Conversation[]) => void;
  connectSocket: (ownerId: string) => void;
  disconnectSocket: () => void;
  loadConversations: (ownerId: string) => Promise<void>;
  loadOlderMessages: (chatId: string, ownerId: string) => Promise<void>;
  getIdentity: (key: string) => Identity | undefined;
};

function normalizeConversation(raw: any): Conversation {
  const lastMsg = (raw.last_message ?? raw.lastMessage) || null;
  const lastAt = raw.last_message?.timestamp || raw.lastMessageAt || (lastMsg?.timestamp as string | undefined);

  return {
    id: raw.id ?? raw.chat_id,
    owner_id: raw.owner_id,
    connection_id: raw.connection_id,
    chat_id: raw.chat_id,
    nome_cliente: raw.nome_cliente || raw.numero_cliente || "Contato",
    numero_cliente: raw.numero_cliente,
    status: raw.status,
    lastMessageAt: lastAt ? String(lastAt) : undefined,
    lastMessage: lastMsg || null,
    unread: typeof raw.unread_count === "number" ? raw.unread_count : typeof raw.unread === "number" ? raw.unread : 0,
    total_messages: raw.total_messages,
  };
}

export function useWhatsAppConversations(): HookReturn {
  const { activeConnection } = useConnections();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  
  const messagesCache = useRef<Record<string, WhatsAppMessage[]>>({});
  const joinedRef = useRef<{ key?: string }>({});
  
  // Pagination state
  const cursorsRef = useRef<Record<string, {
    hasMore: boolean;
    beforeCursor?: string; // ISO timestamp of oldest loaded
  }>>({});

  // Identity Directory
  const identityDirRef = useRef<Record<string, Identity>>({});

  // Helper to get cursor for a chat
  const getCursor = (chatId: string) => (cursorsRef.current[chatId] ??= { hasMore: true });

  // Identity helpers
  const rememberIdentity = useCallback((key: string, incoming: Identity) => {
    const cur = identityDirRef.current[key];
    identityDirRef.current[key] = mergeIdentity(cur, incoming);
    return identityDirRef.current[key];
  }, []);

  const getIdentity = useCallback((key: string): Identity | undefined => {
    return identityDirRef.current[key];
  }, []);


  // Single canonical listener for all message events
  useEffect(() => {
    const s = getSocket();
    if (!s || !activeConnection?.id) return;

    const events = ['newMessage', 'message', 'message-sent', 'whatsapp:message'];
    events.forEach(e => s.off(e)); // clear stale listeners

    const onIncoming = (payload: any) => {
      // Silent: Received payload for real-time message processing
      const msg = payload?.message ?? payload;
      if (!msg?.chat_id || !msg?.timestamp) return;

      // Silent: Processing message

      // Merge identity if metadata exists
      const jid = msg.chat_id;
      if (msg.chat || msg.sender) {
        const incomingName = resolveDisplayName({
          groupName: msg.chat?.subject,
          contactName: msg.sender?.name || msg.sender?.verifiedName,
          pushName: msg.pushName,
          notify: msg.notify,
          jid,
        });
        const incomingAvatar = msg.chat?.avatar || msg.sender?.avatar || msg.profile_picture_url;
        rememberIdentity(jid, { name: incomingName, avatar: incomingAvatar });
      }

      // CRITICAL: Normalize chat id comparison (fix "is current chat? false")
      const isCurrent = String(selectedChatId || '') === String(msg.chat_id || '');

      if (isCurrent) {
        setMessages(prev => {
          // Remove optimistic messages that match this real message
          const withoutTemp = prev.filter(m => {
            if (!m.id?.startsWith?.('temp-')) return true;
            const same = m.conteudo === msg.conteudo;
            const dt = Math.abs(new Date(m.timestamp).getTime() - new Date(msg.timestamp).getTime());
            return !(same && dt < 5000);
          });
          
          // Check for exact duplicates (same content, same timestamp, same sender)
          const exists = withoutTemp.some(m => {
            const sameContent = m.conteudo === msg.conteudo;
            const sameTime = Math.abs(new Date(m.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 1000; // 1 second tolerance
            const sameSender = m.remetente === msg.remetente;
            return sameContent && sameTime && sameSender;
          });
          
          const next = exists ? withoutTemp : [...withoutTemp, msg];
          messagesCache.current[msg.chat_id] = next;
          return next.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        });
      } else {
        const cached = messagesCache.current[msg.chat_id] || [];
        // Check for duplicates by content and timestamp (ignore sender mismatch)
        const exists = cached.some(m => {
          const sameContent = m.conteudo === msg.conteudo;
          const sameTime = Math.abs(new Date(m.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 1000; // 1 second tolerance
          // Don't check sender - optimistic uses 'OPERADOR', socket uses 'ATENDENTE'
          return sameContent && sameTime;
        });
        if (!exists) {
          messagesCache.current[msg.chat_id] = [...cached, msg].sort((a,b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        }
      }

      setConversations(prev =>
        prev
          .map(c => c.chat_id === msg.chat_id ? {
              ...c,
              lastMessage: msg,
              lastMessageAt: String(msg.timestamp),
              lastMessagePreview: buildMessagePreview({
                type: msg.message_type,
                text: msg.conteudo,
                caption: msg.caption,
                fileName: msg.fileName,
                mimetype: msg.mimetype
              }),
              unread: (!isCurrent && msg.remetente === 'CLIENTE') ? (c.unread || 0) + 1 : c.unread,
              // Update identity fields without nuking good values
              nome_cliente: getIdentity(jid)?.name || c.nome_cliente,
              profile_picture: getIdentity(jid)?.avatar || c.profile_picture
            } : c)
          .sort((a,b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime())
      );
    };

    events.forEach(e => s.on(e, onIncoming));
    
    // Also listen for conversation updates
    s.on('conversation:updated', (data: any) => {
      // Silent: Conversation updated, reloading conversations
      // Reload conversations when they're updated
      if (activeConnection?.owner_id) {
        loadConversations(activeConnection.owner_id);
      }
    });
    
    return () => { 
      events.forEach(e => s.off(e, onIncoming));
      s.off('conversation:updated');
    };
  }, [activeConnection?.id, selectedChatId]);


  // Make join idempotent (no more spam)
  useEffect(() => {
    if (!activeConnection?.id || !selectedChatId) return;
    const key = `${activeConnection.id}:${selectedChatId}`;
    if (joinedRef.current.key === key) return; // already joined, do nothing

    joinedRef.current.key = key;
    safeEmit('join', { connectionId: activeConnection.id, conversationId: selectedChatId });
  }, [activeConnection?.id, selectedChatId]);

  const connectSocket = useCallback((ownerId: string) => {
    if (!activeConnection?.owner_id) return;
    
    // Always ensure we have a socket connection
    const s = getSocket();
    if (!s) {
      // If no socket exists, create one
      const newSocket = createSocket(SOCKET_URL, { ownerId: activeConnection.owner_id });
      
      // Handle reconnect re-join
      const rejoin = () => {
        if (activeConnection?.id && selectedChatId) {
          safeEmit('join', { connectionId: activeConnection.id, conversationId: selectedChatId });
        }
      };
      newSocket.off('reconnect', rejoin).on('reconnect', rejoin);
    }
    
    setConnected(true);
  }, [activeConnection?.owner_id, activeConnection?.id, selectedChatId]);

  const disconnectSocket = useCallback(() => {
    setConnected(false);
  }, []);

  // OPTIMIZED: Paginated conversation loading
  const loadConversations = useCallback(async (ownerId: string) => {
    // Silent: loadConversations called
    
    if (!activeConnection?.id) {
      // Silent: No activeConnection.id, skipping loadConversations
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const from = page * CONVERSATIONS_PER_PAGE;
      const to = from + CONVERSATIONS_PER_PAGE - 1;
      
      const url = `${API_URL}/api/conversations?connectionId=${activeConnection.id}&limit=${CONVERSATIONS_PER_PAGE}`;

      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      
      if (!data.success) throw new Error(data.error || 'Erro ao buscar conversas');
      
      // Silent: Loaded conversations successfully
      
      const newConversations = (data.items || []).map((conv: any) => {
        const chatId = conv.id; // The API returns 'id' field
        const serverUnread = Math.max(0, conv.unreadCount || 0);
        const finalUnread = syncWithServer(chatId, serverUnread);
        
        // Use the name from the conversation data if available
        const jid = conv.id;
        // Prioritize real names over JIDs
        const displayName = conv.wpp_name || conv.whatsapp_group_subject || conv.nome_cliente || conv.id;
        
        const name = resolveDisplayName({
          groupName: conv.wpp_name || null,
          contactName: conv.nome_cliente || null,
          pushName: conv.wpp_name || null,
          notify: conv.id,
          jid
        });

        // Remember identity (anti-overwrite) - prioritize actual names over JIDs
        const stable = rememberIdentity(jid, { 
          name: displayName !== jid ? displayName : name, 
          avatar: conv.profile_picture || null 
        });
        
        return {
          id: conv.id,
          owner_id: activeConnection?.owner_id,
          connection_id: activeConnection?.id,
          chat_id: conv.id,
          nome_cliente: displayName !== jid ? displayName : stable.name || conv.id,
          numero_cliente: conv.phone || conv.id,
          status: 'ATENDENDO',
          lastMessageAt: conv.timestamp,
          lastMessage: conv.lastMessage ? {
            conteudo: conv.lastMessage,
            timestamp: conv.timestamp,
            remetente: 'CLIENTE',
            lida: false,
            tipo: 'TEXTO'
          } : null,
          lastMessagePreview: conv.lastMessage ? buildMessagePreview({
            type: 'TEXTO',
            text: conv.lastMessage,
            caption: null,
            fileName: null,
            mimetype: null
          }) : "Nenhuma mensagem",
          unread: finalUnread,
          total_messages: 1,
          // Use actual profile picture if available
          profile_picture: conv.profile_picture || null,
          // Include all the rich contact/group information from backend
          wpp_name: conv.wpp_name,
          whatsapp_is_group: conv.whatsapp_is_group || false,
          whatsapp_group_subject: conv.whatsapp_group_subject,
          whatsapp_group_description: conv.whatsapp_group_description,
          whatsapp_group_owner: conv.whatsapp_group_owner,
          whatsapp_group_participants: conv.whatsapp_group_participants,
          whatsapp_group_created: conv.whatsapp_group_created,
          whatsapp_business_name: conv.whatsapp_business_name,
          whatsapp_business_category: conv.whatsapp_business_category,
          whatsapp_business_email: conv.whatsapp_business_email,
          whatsapp_business_website: conv.whatsapp_business_website,
          whatsapp_verified: conv.whatsapp_verified,
          group_contact_name: conv.group_contact_name,
          phone: conv.phone,
          connection_phone: conv.connection_phone
        };
      });

      setConversations(prev => {
        if (page === 0) {
          return newConversations;
        } else {
          return [...prev, ...newConversations];
        }
      });
      setHasMore(newConversations.length === CONVERSATIONS_PER_PAGE);

      // Background hydration for conversations with placeholder names
      const jidsNeedingHydration = newConversations
        .map(c => c.chat_id)
        .filter(jid => {
          const id = getIdentity(jid);
          return !id || isPlaceholderName(id.name);
        });
      if (jidsNeedingHydration.length) {
        hydrateIdentities(jidsNeedingHydration, { ownerId: activeConnection?.owner_id });
      }
    } catch (e: any) {
      setError(e?.message || "Erro ao carregar conversas");
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id, page, syncWithServer]);

  // Periodic conversation refresh to ensure real-time updates
  useEffect(() => {
    if (!activeConnection?.owner_id) return;
    
    const interval = setInterval(() => {
      // Silent: Refreshing conversations periodically
      loadConversations(activeConnection.owner_id);
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, [activeConnection?.owner_id, loadConversations]);

  // OPTIMIZED: Load more conversations
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    setPage(p => p + 1);
  }, [hasMore, loading]);

  // OPTIMIZED: Load messages with caching
  const loadMessages = useCallback(async (chatId: string, ownerId: string) => {
    if (!chatId || !ownerId) return;

    setLoading(true);
    try {
      // Load latest 30 messages (descending order, then reverse for rendering)
      const { data, error } = await supabase
        .from("whatsapp_mensagens")
        .select("*")
        .eq("owner_id", ownerId)
        .eq("chat_id", chatId)
        .order("timestamp", { ascending: false })
        .limit(PAGE_SIZE);

      if (error) throw error;

      const list = (data ?? [])
        .map(m => ({ ...m, timestamp: m.timestamp || new Date().toISOString() }))
        .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); // render ascending

      messagesCache.current[chatId] = list;
      setMessages(list);

      // Set cursor for pagination
      const oldest = list[0]?.timestamp;
      const cur = getCursor(chatId);
      cur.beforeCursor = oldest;
      cur.hasMore = (data?.length ?? 0) === PAGE_SIZE; // if got a full page, there may be more

    } catch (e) {
      console.error('loadMessages error', e);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load older messages for infinite scroll
  const loadOlderMessages = useCallback(async (chatId: string, ownerId: string) => {
    if (!chatId || !ownerId) return;
    const cur = getCursor(chatId);
    if (!cur.hasMore) return;

    const before = cur.beforeCursor;
    const q = supabase
      .from("whatsapp_mensagens")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("chat_id", chatId)
      .order("timestamp", { ascending: false })
      .limit(PAGE_SIZE);

    if (before) q.lt("timestamp", before);

    const { data, error } = await q;
    if (error) {
      console.error('loadOlderMessages error', error);
      return;
    }

    const olderDesc = data ?? [];
    cur.hasMore = olderDesc.length === PAGE_SIZE;

    const olderAsc = olderDesc
      .map(m => ({ ...m, timestamp: m.timestamp || new Date().toISOString() }))
      .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    setMessages(prev => {
      // de-dup by id/message_id
      const ids = new Set(prev.map(m => m.id || m.message_id));
      const merged = [...olderAsc.filter(m => !ids.has(m.id || m.message_id)), ...prev];
      // update cache and cursor
      messagesCache.current[chatId] = merged;
      cur.beforeCursor = merged[0]?.timestamp;
      return merged;
    });
  }, []);

  // OPTIMIZED: Select conversation with instant cache
  const selectConversation = useCallback((chatId: string, opts?: { localMarkRead?: boolean }) => {
    setMessages([]); // clear stale view
    setSelectedChatId(chatId);
    if (activeConnection?.id) {
      safeEmit('join', { connectionId: activeConnection.id, conversationId: chatId });
    }
    loadMessages(chatId, activeConnection?.owner_id || '');
  }, [activeConnection?.id, activeConnection?.owner_id, loadMessages]);

  // OPTIMIZED: Mark as read
  const markConversationRead = useCallback(async (chatId: string) => {
    if (!activeConnection?.id) return;
    
    const conversation = conversations.find(c => c.chat_id === chatId);
    const connectionId = conversation?.connection_id || activeConnection.id;
    
    try {
      await fetch(`${API_URL}/api/baileys-simple/connections/${connectionId}/mark-read`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chatId }),
      });
      
      setConversations(prev => prev.map(c => 
        c.chat_id === chatId ? { ...c, unread: 0 } : c
      ));
    } catch (e) {
      log.error('Mark read failed:', e);
    }
  }, [activeConnection?.id, conversations]);

  // OPTIMIZED: Send message
  const sendMessageTo = useCallback(async (chatId: string, text: string, uiType: string = 'TEXTO', mediaUrl?: string) => {
    if (!activeConnection?.id) throw new Error("No connectionId");
    
    const url = `${API_URL}/api/baileys-simple/connections/${activeConnection.id}/send-message`;
    
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, type: uiType, text, mediaUrl })
    });
    
    const j = await res.json();
    if (!res.ok || !j?.ok) {
      throw new Error(j?.error || `HTTP ${res.status}`);
    }
  }, [activeConnection?.id]);

  // Initialize on mount - only when we have a valid activeConnection
  useEffect(() => {
    // Silent: useWhatsAppConversations - activeConnection check
    
    // Only proceed if we have both id and owner_id
    if (activeConnection?.id && activeConnection?.owner_id) {
      // Silent: Loading conversations for activeConnection
      loadConversations(activeConnection.owner_id);
      connectSocket(activeConnection.owner_id);
    } else {
      // Silent: Waiting for activeConnection to be loaded
    }
    return () => disconnectSocket();
  }, [activeConnection?.id, activeConnection?.owner_id, loadConversations, disconnectSocket]);

  // Reload when page changes
  useEffect(() => {
    if (page > 0 && activeConnection?.owner_id) {
      loadConversations(activeConnection.owner_id);
    }
  }, [page, activeConnection?.owner_id, loadConversations]);

  const filteredMessages = useMemo(() => {
    if (!selectedChatId) return [];
    const filtered = messages.filter(msg => msg.chat_id === selectedChatId);
    // Sort by timestamp to ensure chronological order
    return filtered.sort((a, b) => {
      const timestampA = new Date(a.timestamp).getTime();
      const timestampB = new Date(b.timestamp).getTime();
      return timestampA - timestampB;
    });
  }, [messages, selectedChatId]);

  return {
    conversations,
    messages: filteredMessages,
    loading,
    error,
    connected,
    hasMore,
    loadMore,
    selectedChatId,
    setSelectedChatId,
    selectConversation,
    sendMessageTo,
    markConversationRead,
    setMessages,
    setConversations,
    connectSocket,
    disconnectSocket,
    loadConversations,
    loadOlderMessages,
    getIdentity,
  };
}