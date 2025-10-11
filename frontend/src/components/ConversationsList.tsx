import { useEffect, useRef, useCallback, useState } from "react";
import { useWhatsAppConversations } from "@/hooks/useWhatsAppConversations";
import { useIdentity } from "@/state/identityStore";
import { isPlaceholderName } from "@/utils/identity";
import { useConnections } from "@/contexts/ConnectionsContext";
import { log } from "@/utils/logger";
import WhatsAppProfilePicture from "./WhatsAppProfilePicture";
import { getGroupSubject, getProfilePictureUrl } from "@/whatsapi/client";

interface ConversationsListProps {
  ownerId?: string;
  onConversationSelect?: (conversationId: string) => void;
}

// OPTIMIZED: Conversation item with lazy loading
function ConversationItem({ 
  conversation, 
  onClick, 
  isSelected 
}: { 
  conversation: any; 
  onClick: () => void; 
  isSelected: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const { activeConnection } = useConnections();

  // Get stable identity with auto-rerender
  const id = useIdentity(conversation.chat_id);
  
  // State for group subject and avatar
  const [groupSubject, setGroupSubject] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(conversation.profile_picture ?? null);

  // Fetch group subject when item becomes visible and is a group
  useEffect(() => {
    let cancelled = false;
    const jid = conversation.chat_id;
    if (!isVisible || !jid?.endsWith("@g.us")) return;

    (async () => {
      if (id?.name && !isPlaceholderName(id.name)) return;
      const subject = await getGroupSubject(jid, activeConnection?.id || "default");
      if (cancelled) return;
      if (subject) setGroupSubject(subject);
    })();

    return () => { cancelled = true; };
  }, [isVisible, conversation.chat_id, id?.name, activeConnection?.id]);

  // Fetch profile picture (for both groups and individuals)
  useEffect(() => {
    let cancelled = false;
    const jid = conversation.chat_id;
    if (!isVisible || !jid) return;
    if (avatarUrl) return;

    (async () => {
      const url = await getProfilePictureUrl(jid, activeConnection?.id);
      if (cancelled) return;
      if (url) setAvatarUrl(url);
    })();

    return () => { cancelled = true; };
  }, [isVisible, conversation.chat_id, avatarUrl]);
  
  // Compute displayName - prioritize real names over IDs
  const displayName = (() => {
    // For groups: prioritize wpp_name, group subject, then nome_cliente
    if (conversation.chat_id?.includes("@g.us")) {
      if (conversation.wpp_name && !isPlaceholderName(conversation.wpp_name)) return conversation.wpp_name;
      if (conversation.whatsapp_group_subject) return conversation.whatsapp_group_subject;
      if (groupSubject) return groupSubject;
      if (conversation.nome_cliente && !isPlaceholderName(conversation.nome_cliente)) return conversation.nome_cliente;
      return `Grupo ${conversation.chat_id.replace("@g.us", "")}`;
    }
    
    // For contacts: prioritize wpp_name, then nome_cliente
    if (conversation.wpp_name && !isPlaceholderName(conversation.wpp_name)) return conversation.wpp_name;
    if (conversation.nome_cliente && !isPlaceholderName(conversation.nome_cliente)) return conversation.nome_cliente;
    if (id?.name && !isPlaceholderName(id.name)) return id.name;
    
    // Fallback to phone number without @s.whatsapp.net
    const phoneNumber = conversation.numero_cliente?.replace("@s.whatsapp.net", "") || 
                       conversation.chat_id?.replace("@s.whatsapp.net", "");
    return phoneNumber || conversation.chat_id?.replace("@s.whatsapp.net", "") || 'Contato';
  })();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Stop observing once visible
        }
      },
      { rootMargin: '100px' } // Start loading 100px before visible
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 transition-colors ${
        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* OPTIMIZED: Lazy load profile picture */}
        <div className="flex-shrink-0">
          {isVisible ? (
            <WhatsAppProfilePicture 
              profilePicture={avatarUrl}
              name={displayName}
              jid={conversation.chat_id}
              size="md"
              connectionId={activeConnection?.id}
            />
          ) : (
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium text-sm">
                {displayName?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {displayName}
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }) : ''}
              </span>
              {conversation.unread > 0 && (
                <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {conversation.unread > 99 ? '99+' : conversation.unread}
                </span>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 truncate mt-1">
            {conversation.lastMessagePreview || "Nenhuma mensagem"}
          </p>
          
          <div className="flex items-center justify-between mt-1">
            <span className={`text-xs px-2 py-1 rounded ${
              conversation.status === 'ATENDENDO' ? 'bg-green-100 text-green-800' :
              conversation.status === 'AGUARDANDO' ? 'bg-yellow-100 text-yellow-800' :
              conversation.status === 'FINALIZADO' ? 'bg-gray-100 text-gray-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {conversation.status || 'ATIVO'}
            </span>
            {conversation.total_messages && (
              <span className="text-xs text-gray-400">
                {conversation.total_messages} msgs
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// OPTIMIZED: Skeleton loader
function SkeletonConversation() {
  return (
    <div className="px-3 py-2 border-b animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

export default function ConversationsList({ ownerId, onConversationSelect }: ConversationsListProps) {
  const { activeConnection } = useConnections();
  const { 
    conversations, 
    loading, 
    hasMore, 
    loadMore,
    selectConversation,
    markConversationRead,
    selectedChatId
  } = useWhatsAppConversations();
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // OPTIMIZED: Infinite scroll with Intersection Observer
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && hasMore && !loading) {
      log('🔄 Loading more conversations...');
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  // OPTIMIZED: Setup intersection observer
  useEffect(() => {
    if (!loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    });

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  const handleConversationClick = useCallback((conversationId: string) => {
    log('🖱️ ConversationsList: Clique na conversa:', conversationId);
    
    // Select conversation (this will mark as read)
    selectConversation(conversationId, { localMarkRead: true });
    
    // Call parent handler if provided
    if (onConversationSelect) {
      onConversationSelect(conversationId);
    }
  }, [selectConversation, onConversationSelect]);

  // Remove old utility functions - now handled in ConversationItem

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Conversas</h2>
          <div className="text-sm text-gray-500">
            {loading ? "Carregando..." : `${conversations.length} conversas`}
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {/* OPTIMIZED: Show skeleton loaders while loading first batch */}
        {loading && conversations.length === 0 && (
          <>
            <SkeletonConversation />
            <SkeletonConversation />
            <SkeletonConversation />
          </>
        )}

        {/* OPTIMIZED: Show conversations with lazy loading */}
        {conversations.length === 0 && !loading ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            Nenhuma conversa encontrada
          </div>
        ) : (
          conversations.map((conv) => (
            <ConversationItem
              key={conv.chat_id}
              conversation={conv}
              onClick={() => handleConversationClick(conv.chat_id)}
              isSelected={selectedChatId === conv.chat_id}
            />
          ))
        )}

        {/* Loading More Trigger */}
        {hasMore && (
          <div 
            ref={loadMoreRef}
            className="flex items-center justify-center p-4"
          >
            {loading ? (
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm">Carregando mais conversas...</span>
              </div>
            ) : (
              <div className="text-sm text-gray-400">
                Role para carregar mais conversas
              </div>
            )}
          </div>
        )}

        {/* End of List */}
        {!hasMore && conversations.length > 0 && (
          <div className="flex items-center justify-center p-4 text-sm text-gray-400">
            Todas as conversas foram carregadas
          </div>
        )}
      </div>
    </div>
  );
}