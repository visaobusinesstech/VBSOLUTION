"use client";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import { MessageCircle, Search, Paperclip, Mic, Phone, MoreVertical, Square, ArrowRight, Bot, User, Settings, Save, Plus, X, Edit3, ExternalLink, Bell, Home, Calendar, ChevronDown, Check, Zap, FileText, AlignJustify } from "lucide-react";
import { useWhatsAppConversations } from "@/hooks/useWhatsAppConversations";
import { useContactSync } from "@/hooks/useContactSync";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useWhatsAppGroup } from "@/hooks/useWhatsAppGroup";
import { resolveDisplayName } from "@/utils/identity";
import { useIdentity } from "@/state/identityStore";
import { useContactSidebarData } from "@/whatsapi/useContactSidebarData";
import { useConnections } from "@/contexts/ConnectionsContext";
import { useConversationDrafts } from "@/hooks/useConversationDrafts";
import { useSearchParams, useNavigate } from "react-router-dom";
import MediaViewer from "../components/MediaViewer";
import { WhatsAppProfilePicture } from "../components/WhatsAppProfilePicture";
import { WhatsAppOptimizedComposer } from "../components/WhatsAppOptimizedComposer";
import ConversationsList from "../components/ConversationsList";
import { getBackupStats } from "../utils/unreadBackup";
import { useStreamChat } from "@/hooks/useStreamChat";
import { logger } from "@/utils/logging";
import { supabase } from "@/integrations/supabase/client";
import { isValidMediaUrl } from "@/utils/mediaHelpers";
import { safeEmit } from "@/lib/socketManager";
import { useSidebar } from "@/contexts/SidebarContext";

/************************************
 * Layout helpers & message bubble   *
 ************************************/
function useViewportHeightFor(ref: React.RefObject<HTMLElement>) {
  const [h, setH] = useState<number | undefined>(undefined);
  useLayoutEffect(() => {
    const fit = () => {
      if (!ref.current) return;
      const top = ref.current.getBoundingClientRect().top;
      const vh = window.innerHeight;
      const next = Math.max(0, Math.ceil(vh - top + 1));
      setH(next);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(document.documentElement);
    window.addEventListener("resize", fit);
    return () => { window.removeEventListener("resize", fit); ro.disconnect(); };
  }, [ref]);
  return h;
}

const isSameDay = (a: Date, b: Date) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
const dayLabel = (d: Date) => { 
  const t = new Date(); 
  const y = new Date(); 
  y.setDate(t.getDate()-1); 
  if(isSameDay(d,t)) return "Hoje"; 
  if(isSameDay(d,y)) return "Ontem"; 
  return d.toLocaleDateString("pt-BR", { day:"2-digit", month:"short", year:"numeric" }); 
};

function groupByDay(list: any[]) { 
  const out: {key:string;date:Date;items:any[]}[]=[]; 
  for(const m of list){ 
    const d=new Date(m.timestamp); 
    const key=d.toISOString().slice(0,10); 
    const last=out[out.length-1]; 
    if(!last||last.key!==key) out.push({ key, date: new Date(d.getFullYear(), d.getMonth(), d.getDate()), items:[m]}); 
    else last.items.push(m);
  } 
  return out; 
}

function getInitials(name: string){ 
  return (name||"?").split(" ").map(w=>w.charAt(0)).join("").toUpperCase().slice(0,2);
}

// Função para obter o ícone da plataforma baseado no tipo de conexão
const getPlatformIcon = (connectionType?: string, isWhatsApp?: boolean) => {
  // Se for uma conexão WhatsApp Web, sempre mostrar o ícone do WhatsApp
  if (isWhatsApp || connectionType === 'whatsapp') {
    return (
      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>
      </div>
    );
  }

  // Para outros tipos de conexão, retornar ícones específicos
  switch (connectionType) {
    case 'instagram':
      return (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-white rounded-full flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </div>
      );
    case 'facebook':
      return (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </div>
      );
    case 'telegram':
      return (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        </div>
      );
    default:
      return (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gray-500 border-2 border-white rounded-full flex items-center justify-center">
          <MessageCircle className="w-2.5 h-2.5 text-white" />
        </div>
      );
  }
};


const MessageBubble = React.memo(function MessageBubble({ message, onMediaLoaded, isGroup = false, isLastFromSender = false }: { message: any; onMediaLoaded: () => void; isGroup?: boolean; isLastFromSender?: boolean; }) {
  const t = String(message.message_type || "").toUpperCase();
  const fromClient = message.remetente === "CLIENTE";
  const isAI = message.remetente === "AI";
  const isAgent = message.remetente === "ATENDENTE";
  const { profile } = useUserProfile();
  
  
  return (
    <div className={`flex ${fromClient?"justify-start":"justify-end"} mb-3 gap-2 items-end`}>
      {/* Avatar do cliente - ESQUERDA da bolha */}
      {fromClient && isLastFromSender && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-md bg-gray-100 flex items-center justify-center">
            {message.profile_picture ? (
              <img 
                src={message.profile_picture} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <User className="w-4 h-4 text-gray-600" style={{ display: message.profile_picture ? 'none' : 'flex' }} />
          </div>
        </div>
      )}
      
      {/* Espaço vazio para mensagens do cliente que não são a última */}
      {fromClient && !isLastFromSender && (
        <div className="flex-shrink-0 w-8 h-8"></div>
      )}
      
      <div className={`max-w-[75%] px-4 py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl ${
        fromClient 
          ? "bg-gray-100 text-gray-900 border border-gray-200" 
          : isAI
          ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-blue-200"
          : "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-200"
      }`}>
        {/* Nome do contato em grupos */}
        {isGroup && fromClient && message.group_contact_name && (
          <div className="text-xs font-semibold text-gray-600 mb-1">
            {message.group_contact_name}
          </div>
        )}
        
        {t === "IMAGEM" && message.media_url && (
          <MediaViewer
            type="IMAGEM"
            mediaUrl={message.media_url}
            mediaMime={message.media_mime}
            fileName={message.fileName}
          />
        )}
        {t === "VIDEO" && message.media_url && (
          <MediaViewer
            type="VIDEO"
            mediaUrl={message.media_url}
            mediaMime={message.media_mime}
            fileName={message.fileName}
          />
        )}
        {t === "AUDIO" && message.media_url && (
          <MediaViewer
            type="AUDIO"
            mediaUrl={message.media_url}
            mediaMime={message.media_mime}
            fileName={message.fileName}
            duration={message.duration_ms ? Math.floor(message.duration_ms / 1000) : undefined}
          />
        )}
        {t === "STICKER" && message.media_url && (
          <MediaViewer
            type="STICKER"
            mediaUrl={message.media_url}
            mediaMime={message.media_mime}
            fileName={message.fileName}
          />
        )}
        {(t === "TEXTO" || !message.media_url) && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.conteudo ? renderMessageWithLinks(message.conteudo) : ""}
          </p>
        )}
        <div className={`mt-2 flex items-center justify-between ${
          fromClient
            ? "text-gray-500" 
            : "text-white/80"
        }`}>
          <span className="text-[10px]">
            {new Date(message.timestamp).toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" })}
          {!fromClient && (
              <>
                <span className="text-white/60"> • </span>
            <span className="text-white/60">
              {isAI ? "IA" : "Você"}
            </span>
              </>
          )}
          </span>
          
          {/* Checkmarks no canto inferior direito */}
          {!fromClient && (
            <div className="flex items-center gap-0.5">
              <div className="w-3 h-3">
                <svg viewBox="0 0 16 16" className="w-full h-full">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" fill="currentColor"/>
                </svg>
              </div>
              <div className="w-3 h-3">
                <svg viewBox="0 0 16 16" className="w-full h-full">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" fill="currentColor"/>
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Avatar do atendente/IA - DIREITA da bolha */}
      {!fromClient && isLastFromSender && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-md bg-gray-100 flex items-center justify-center">
            {isAI ? (
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            ) : profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Atendente" 
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </div>
      )}

      {/* Espaço vazio para mensagens da IA/Atendente que não são a última - manter alinhamento */}
      {!fromClient && !isLastFromSender && (
        <div className="flex-shrink-0 w-8 h-8"></div>
      )}
    </div>
  );
});

// Função centralizada para obter o nome de exibição
function getDisplayName(conversation: any, contactInfo?: any, getIdentity?: (key: string) => { name?: string | null; avatar?: string | null; } | undefined): string {
  // Use Identity Directory first
  if (getIdentity) {
    const id = getIdentity(conversation.chat_id);
    if (id?.name) {
      return id.name;
    }
  }

  // Para grupos - priorizar wpp_name
  if (conversation.chat_id?.includes('@g.us')) {
    return conversation.wpp_name || 
           contactInfo?.whatsapp_group_subject || 
           conversation.whatsapp_group_subject || 
           conversation.nome_cliente || 
           `Grupo ${conversation.chat_id.split('@')[0]}`;
  }
  
  // Para contatos individuais - priorizar wpp_name
  const realName = conversation.wpp_name || 
         contactInfo?.whatsapp_business_name || 
         contactInfo?.whatsapp_name || 
         conversation.whatsapp_business_name || 
         conversation.whatsapp_name || 
         conversation.nome_cliente;
  
  if (realName && realName !== conversation.chat_id) {
    return realName;
  }
  
  // Fallback: mostrar apenas o número sem @s.whatsapp.net
  return conversation.numero_cliente?.replace('@s.whatsapp.net', '') || 
         conversation.chat_id?.replace('@s.whatsapp.net', '') || 
         'Contato';
}

// ---- Modern Right panel (ManyChat style) ----
function ContactSummaryPanel({
  ownerId,
  conversation,
  messagesCount,
  onFinalizeConversation,
  getIdentity,
  groupMeta,
  participants,
}: {
  ownerId?: string;
  conversation: { chat_id: string; nome_cliente?: string; numero_cliente?: string; lastMessageAt?: string; status?: string };
  messagesCount: number;
  onFinalizeConversation: () => void;
  getIdentity?: (key: string) => { name?: string | null; avatar?: string | null; } | undefined;
  groupMeta?: any;
  participants?: any[];
}) {
  // Get activeConnection from context
  const { activeConnection } = useConnections();
  
  // Use the new data hook for clean, quiet data fetching
  const {
    isGroup,
    subject,
    description,
    participants: hookParticipants,
    membersCount,
    business,
  } = useContactSidebarData({ 
    chatId: conversation.chat_id, 
    connectionId: activeConnection?.id || '', 
    ownerId: ownerId || '',
    baseUrl: 'http://localhost:3000' // Use the correct backend URL
  });

  // New component to encapsulate useIdentity for each participant
  const ParticipantItem: React.FC<{ participant: { id: string; name: string; admin?: string | null } }> = ({ participant }) => {
    const id = useIdentity(participant.id) || {};
    const displayName = id.name || participant.name;
    const avatar = id.avatar;

    return (
      <div key={participant.id} className="flex items-center gap-2 py-1">
        <WhatsAppProfilePicture 
          jid={participant.id}
          profilePicture={avatar} 
          name={displayName} 
          size="sm" 
        />
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm text-gray-900 truncate">{displayName}</span>
          {participant.admin && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">
              👑 Admin
            </span>
          )}
        </div>
      </div>
    );
  };

  // 🔥 GUARD - Don't render if ownerId is not available
  if (!ownerId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm">Carregando informações do contato...</p>
        </div>
      </div>
    );
  }

  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiAgentMode, setAiAgentMode] = useState<'human' | 'ai'>('human');
  
  // ✅ Hook para buscar contatos
  const { getContactByJid, getContactByPhone, updateContact, createContact } = useContactSync();
  const [isRegisteringContact, setIsRegisteringContact] = useState(false);
  const [customFields, setCustomFields] = useState([]);
  const navigate = useNavigate();
  
  // 🔥 RACE CONDITION PROTECTION - prevent wrong contact data
  const activeRequestIdRef = useRef<string | null>(null);
  
  // ✅ Ref para evitar loops de carregamento de contatos
  const contactLoadingRef = useRef<Set<string>>(new Set());
  const [systemFields] = useState([
    { key: "Primeiro Nome", value: conversation.nome_cliente?.split(' ')[0] || "—" },
    { key: "Sobrenome", value: conversation.nome_cliente?.split(' ').slice(1).join(' ') || "—" }
  ]);

  // 🔥 RACE CONDITION FIX - immediate headers, cancel numsbom for outsync applies to ManyChat deterministic
  useEffect(() => {
    const abortController = new AbortController();
    const currentRequestId = `${conversation.chat_id}_${Date.now()}`;
    activeRequestIdRef.current = currentRequestId; 
    
    const loadContactInfo = async () => {
      if (!conversation.chat_id || !ownerId) return;
      
      // ✅ Evitar loops de carregamento - usar chat_id como chave única
      const contactKey = conversation.chat_id;
      if (contactLoadingRef.current.has(contactKey)) {
        return;
      }
      
      contactLoadingRef.current.add(contactKey);
      setIsLoading(true);
      
      try {
        // Check if this request is still the current one
        if (activeRequestIdRef.current !== currentRequestId) {
          return;
        }
        
        // Para grupos, buscar pelo chat_id, para contatos individuais pelo numero_cliente
        // Buscar contato usando o hook - sempre usar JID para consistência
        const contact = await getContactByJid(conversation.chat_id, activeConnection?.owner_id);
        
        // 🔒 COMMIT contact data ONLY if still current
        if (activeRequestIdRef.current !== currentRequestId || abortController.signal.aborted) {
          return;
        }
        
        if (contact) {
          setContactInfo(contact);
          setNote(contact.notes || "");
          setTags(contact.tags || []);
          setCustomFields(contact.custom_fields || customFields);
          
          // Carregar estado do agente IA do localStorage primeiro, depois do banco
          const savedMode = localStorage.getItem(`ai_agent_mode_${conversation.numero_cliente}`);
          if (savedMode && (savedMode === 'human' || savedMode === 'ai')) {
            setAiAgentMode(savedMode);
          } else {
            setAiAgentMode(contact.ai_enabled ? 'ai' : 'human');
          }
        } else {
          // Se não encontrar contato, carregar do localStorage
          const savedMode = localStorage.getItem(`ai_agent_mode_${conversation.numero_cliente}`);
          if (savedMode && (savedMode === 'human' || savedMode === 'ai')) {
            setAiAgentMode(savedMode);
          }
        }
      } catch (error) {
        if (abortController.signal.aborted) return; 
        console.error('Erro ao carregar informações do contato:', error);
      } finally {
        if (activeRequestIdRef.current === currentRequestId && !abortController.signal.aborted) {
          setIsLoading(false);
        }
        // ✅ Remover da lista de carregamento
        contactLoadingRef.current.delete(contactKey);
      }
    };

    loadContactInfo();

    return () => {
      abortController.abort(); 
      if (activeRequestIdRef.current === currentRequestId) {
        activeRequestIdRef.current = null;
      }
    };
  }, [conversation.chat_id, getContactByJid, ownerId]);

  // Buscar informações detalhadas do WhatsApp
  useEffect(() => {
    const loadWhatsAppInfo = async () => {
      if (!conversation.chat_id || !ownerId) return;
      
      try {
        // Buscar informações da conversa atual
        const response = await fetch(`/api/baileys-simple/test-conversations?ownerId=${ownerId}`);
        const data = await response.json();
        
        if (data.success && data.conversations) {
          const currentConv = data.conversations.find((conv: any) => conv.chat_id === conversation.chat_id);
          if (currentConv) {
            setContactInfo((prev: any) => ({
              ...prev,
              whatsapp_name: currentConv.whatsapp_name,
              whatsapp_jid: currentConv.whatsapp_jid,
              profile_picture: currentConv.profile_picture,
              whatsapp_business_name: currentConv.whatsapp_business_name,
              whatsapp_business_description: currentConv.whatsapp_business_description,
              whatsapp_business_email: currentConv.whatsapp_business_email,
              whatsapp_business_website: currentConv.whatsapp_business_website,
              whatsapp_business_category: currentConv.whatsapp_business_category,
              whatsapp_verified: currentConv.whatsapp_verified,
              whatsapp_is_group: currentConv.chat_id?.includes('@g.us'),
              whatsapp_group_subject: currentConv.whatsapp_group_subject,
              whatsapp_group_description: currentConv.whatsapp_group_description,
              whatsapp_group_participants: currentConv.whatsapp_group_participants,
              whatsapp_status: currentConv.whatsapp_status
            }));
          }
        }
      } catch (error) {
        // Silent: Erro ao carregar informações do WhatsApp
        // Se o erro for de parsing JSON (HTML retornado em vez de JSON), não quebrar a aplicação
        if (error instanceof SyntaxError && error.message.includes('JSON')) {
          // Silent: Server returned HTML instead of JSON - continuing with empty data
        }
      }
    };

    loadWhatsAppInfo();
  }, [conversation.chat_id, ownerId]);

  // Função para alternar modo do agente IA
  const toggleAiAgentMode = async (newMode: 'human' | 'ai') => {
    console.log('🤖 Alternando modo do agente IA para:', newMode);
    setAiAgentMode(newMode);
    
    // Salvar no localStorage para persistência
    const phoneNumber = conversation.numero_cliente || contactInfo?.phone || 'default';
    localStorage.setItem(`ai_agent_mode_${phoneNumber}`, newMode);
    console.log('🤖 Estado do agente IA salvo no localStorage para:', phoneNumber);
    
    if (contactInfo?.id) {
      try {
        console.log('🤖 Salvando estado do agente IA no banco de dados...');
        console.log('🤖 Contact ID:', contactInfo.id);
        console.log('🤖 New Mode:', newMode);
        console.log('🤖 AI Enabled:', newMode === 'ai');
        
        const result = await updateContact(contactInfo.id, { ai_enabled: newMode === 'ai' });
        console.log('🤖 Resultado da atualização:', result);
        console.log('🤖 Estado do agente IA salvo com sucesso!');
      } catch (error) {
        console.error('❌ Erro ao alterar modo do agente:', error);
        // Reverter em caso de erro
        setAiAgentMode(aiAgentMode);
      }
    } else {
      console.log('⚠️ Contato não encontrado, não é possível salvar estado do agente IA');
    }
  };

  // Função para registrar contato
  const registerContact = async () => {
    if (!conversation.numero_cliente) return;
    
    setIsRegisteringContact(true);
    try {
      const newContact = await createContact({
        name: conversation.nome_cliente || conversation.numero_cliente,
        phone: conversation.numero_cliente,
        whatsapp_name: conversation.nome_cliente,
        email: '',
        notes: note,
        tags: tags,
        custom_fields: customFields,
        ai_enabled: aiAgentMode === 'ai'
      });
      
      setContactInfo(newContact);
      alert('Contato registrado com sucesso!');
    } catch (error) {
      console.error('Erro ao registrar contato:', error);
      alert('Erro ao registrar contato. Tente novamente.');
    } finally {
      setIsRegisteringContact(false);
    }
  };

  // Função para navegar para a página de contatos
  const navigateToContacts = () => {
    if (contactInfo?.id) {
      // Se o contato já está registrado, navegar para a página de contatos com o ID específico
      navigate(`/contacts?edit=${contactInfo.id}`);
    } else {
      // Se não está registrado, navegar para a página de contatos para criar um novo
      navigate('/contacts?create=true');
    }
  };

  const saveNote = async () => {
    if (contactInfo?.id) {
      try {
        await updateContact(contactInfo.id, { notes: note });
        alert("Nota salva com sucesso!");
      } catch (error) {
        console.error('Erro ao salvar nota:', error);
        alert("Erro ao salvar nota. Tente novamente.");
      }
    } else {
      console.log("Nota salva localmente:", note);
      alert("Nota salva localmente!");
    }
  };

  const addTag = async () => {
    if (tagInput.trim()) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      setTagInput("");
      
      if (contactInfo?.id) {
        try {
          await updateContact(contactInfo.id, { tags: newTags });
        } catch (error) {
          console.error('Erro ao salvar tags:', error);
        }
      }
    }
  };

  const removeTag = async (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    
    if (contactInfo?.id) {
      try {
        await updateContact(contactInfo.id, { tags: newTags });
      } catch (error) {
        console.error('Erro ao remover tag:', error);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header com foto e nome */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <WhatsAppProfilePicture
              jid={conversation.chat_id}
              name={getDisplayName(conversation, contactInfo, getIdentity)}
              size="lg"
              profilePicture={conversation.profile_picture}
              showPresence={true}
              className="w-16 h-16 rounded-xl shadow-lg"
            />
            <div className="flex-1">
              <h3 className="font-bold text-xl text-gray-900">
                {getDisplayName(conversation, contactInfo, getIdentity)}
              </h3>
              <p className="text-sm text-gray-600">{(conversation.phone || conversation.numero_cliente)?.replace('@s.whatsapp.net', '')}</p>
              
              {/* Business Email */}
              {conversation.whatsapp_business_email && (
                <p className="text-sm text-gray-500">📧 {conversation.whatsapp_business_email}</p>
              )}
              
              {/* Business Website */}
              {conversation.whatsapp_business_website && (
                <p className="text-sm text-blue-600 hover:text-blue-800">
                  <a href={conversation.whatsapp_business_website} target="_blank" rel="noopener noreferrer">
                    🌐 {conversation.whatsapp_business_website}
                  </a>
                </p>
              )}
              
              {/* Group Description */}
              {conversation.whatsapp_group_description && (
                <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded-lg">
                  {conversation.whatsapp_group_description.substring(0, 200)}
                  {conversation.whatsapp_group_description.length > 200 && '...'}
                </p>
              )}
            </div>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <MoreVertical className="w-5 h-5"/>
          </button>
        </div>
        
        {/* Status badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            contactInfo 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              contactInfo ? 'bg-green-500' : 'bg-gray-400'
            }`}></div>
            {contactInfo ? 'Contato Registrado' : 'Não Registrado'}
          </span>
          
          {/* Group Badge */}
          {conversation.whatsapp_is_group && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
              Grupo ({conversation.whatsapp_group_participants?.length || 0} participantes)
            </span>
          )}
          
          {/* Business Badge */}
          {conversation.whatsapp_business_name && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
              {conversation.whatsapp_business_category || 'Negócio'}
            </span>
          )}
          
          {/* Verified Badge */}
          {conversation.whatsapp_verified && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              ✅ Verificado
            </span>
          )}
          
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            WhatsApp
          </span>
        </div>


      </div>

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Business Information */}
        {(conversation.whatsapp_business_name || conversation.whatsapp_business_email || conversation.whatsapp_business_website) && (
          <section>
            <h4 className="font-semibold text-gray-800 mb-3">Informações do Negócio</h4>
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
              {conversation.whatsapp_business_name && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Nome do Negócio</label>
                  <p className="text-gray-900">{conversation.whatsapp_business_name}</p>
                </div>
              )}
              {conversation.whatsapp_business_category && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Categoria</label>
                  <p className="text-gray-900">{conversation.whatsapp_business_category}</p>
                </div>
              )}
              {conversation.whatsapp_business_email && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{conversation.whatsapp_business_email}</p>
                </div>
              )}
              {conversation.whatsapp_business_website && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Website</label>
                  <a 
                    href={conversation.whatsapp_business_website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {conversation.whatsapp_business_website}
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Group Information */}
        {conversation.whatsapp_is_group && (
          <section>
            <h4 className="font-semibold text-gray-800 mb-3">Informações do Grupo</h4>
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
              {conversation.whatsapp_group_subject && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Nome do Grupo</label>
                  <p className="text-gray-900">{conversation.whatsapp_group_subject}</p>
                </div>
              )}
              {conversation.whatsapp_group_description && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Descrição</label>
                  <p className="text-gray-900 text-sm bg-gray-50 p-3 rounded-lg">
                    {conversation.whatsapp_group_description}
                  </p>
                </div>
              )}
              {conversation.whatsapp_group_created && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Criado em</label>
                  <p className="text-gray-900">{new Date(conversation.whatsapp_group_created).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
              {conversation.whatsapp_group_participants && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Participantes ({conversation.whatsapp_group_participants.length} membros)</label>
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                    {Array.isArray(conversation.whatsapp_group_participants) ? (
                      conversation.whatsapp_group_participants.map((participant, index) => (
                        <div key={participant.id || index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {participant.name || participant.id?.replace('@lid', '') || `Participante ${index + 1}`}
                              </p>
                              <p className="text-xs text-gray-500">
                                {participant.id?.replace('@lid', '')}
                              </p>
                            </div>
                          </div>
                          {participant.admin && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              participant.admin === 'superadmin' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {participant.admin === 'superadmin' ? 'Admin' : 'Moderador'}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">
                        {typeof conversation.whatsapp_group_participants === 'number' 
                          ? `${conversation.whatsapp_group_participants} membros`
                          : 'Informações de participantes não disponíveis'
                        }
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Tags do contato */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800">Tags do contato</h4>
            <button onClick={() => setTagInput("")} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              + Adicionar Tag
            </button>
          </div>
          <div className="flex gap-2 flex-wrap mb-3">
            {tags.length === 0 ? (
              <span className="text-sm text-gray-500">Nenhuma tag adicionada</span>
            ) : (
              tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 rounded-full px-3 py-1">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-blue-600 hover:text-blue-800">
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
          {tagInput !== "" && (
            <div className="flex gap-2">
              <input 
                value={tagInput} 
                onChange={e => setTagInput(e.target.value)} 
                placeholder="Digite a tag..." 
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                autoFocus
              />
              <button 
                onClick={addTag} 
                className="px-3 py-2 text-white rounded-lg text-sm hover:opacity-90"
                style={{ backgroundColor: '#4A5477' }}
              >
                ✓
              </button>
            </div>
          )}
        </section>



        {/* Campos */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800">Campos</h4>
            <button 
              onClick={navigateToContacts}
              className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 hover:opacity-90"
              style={{ background: 'linear-gradient(45deg, #4A5477 0%, #3F30F1 100%)' }}
            >
              <Edit3 className="w-4 h-4" />
              Editar Contato
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {/* Group Fields Only - Show only for groups */}
            {isGroup && (
              <>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600">Nome do Grupo:</span>
                  <span className="text-sm font-medium text-gray-900">{subject || '—'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className="text-sm font-medium text-gray-900">{conversation.status || '—'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600">N.º de Membros:</span>
                  <span className="text-sm font-medium text-gray-900">{membersCount}</span>
                </div>
                {description && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">Descrição:</span>
                    <span className="text-sm font-medium text-gray-900 whitespace-pre-wrap">{description}</span>
                  </div>
                )}
              </>
            )}
            
            {/* Individual Contact Fields */}
            {!isGroup && (
              <>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600">Nome:</span>
                  <span className="text-sm font-medium text-gray-900">{contactInfo?.first_name || conversation.nome_cliente || '—'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600">Sobrenome:</span>
                  <span className="text-sm font-medium text-gray-900">{contactInfo?.last_name || '—'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600">Telefone:</span>
                  <span className="text-sm font-medium text-gray-900">{conversation.numero_cliente || conversation.chat_id?.replace('@s.whatsapp.net', '') || '—'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="text-sm font-medium text-gray-900">{contactInfo?.email || '—'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600">Descrição:</span>
                  <span className="text-sm font-medium text-gray-900">{contactInfo?.whatsapp_business_description || '—'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600">Categoria:</span>
                  <span className="text-sm font-medium text-gray-900">{contactInfo?.whatsapp_business_category || '—'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600">Verificado:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {contactInfo?.whatsapp_verified ? '✅ Sim' : '❌ Não'}
                  </span>
                </div>
                
                {/* Business Profile Fields */}
                {business && (
                  <>
                    {business.description && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600">Descrição do Negócio:</span>
                        <span className="text-sm font-medium text-gray-900">{business.description}</span>
                      </div>
                    )}
                    {business.website && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600">Website:</span>
                        <span className="text-sm font-medium text-gray-900">{business.website}</span>
                      </div>
                    )}
                    {business.email && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600">Email do Negócio:</span>
                        <span className="text-sm font-medium text-gray-900">{business.email}</span>
                      </div>
                    )}
                    {business.category && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600">Categoria do Negócio:</span>
                        <span className="text-sm font-medium text-gray-900">{business.category}</span>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            
            {/* Group Participants Section */}
            {isGroup && (
              <div className="mt-4">
                <div className="text-xs font-medium text-gray-500 mb-2">Participantes</div>
                {hookParticipants.length === 0 ? (
                  <div className="text-xs text-gray-400">Nenhum participante</div>
                ) : (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {hookParticipants.map(p => (
                      <ParticipantItem key={p.id} participant={p} />
                    ))}
                  </div>
                )}
              </div>
            )}
            {customFields.length > 0 && (
              <>
                {customFields.map(field => (
                  <div key={field.key} className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">{field.key}:</span>
                    <span className="text-sm font-medium text-gray-900 break-all">{field.value}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </section>

      </div>

      {/* Footer com ações */}
      <div className="p-6 border-t bg-gray-50 space-y-3">
        {!contactInfo && (
          <button 
            onClick={registerContact}
            disabled={isRegisteringContact}
            className="w-full text-white rounded-lg py-3 font-medium transition-colors flex items-center justify-center gap-2 hover:opacity-90"
            style={{ backgroundColor: '#4A5477' }}
          >
            {isRegisteringContact ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Registrar como Contato
              </>
            )}
          </button>
        )}
        
        <button 
          onClick={onFinalizeConversation} 
          className="w-full bg-red-500 hover:bg-red-600 text-white rounded-lg py-3 font-medium transition-colors"
        >
          Finalizar Conversa
        </button>
        
        <button 
          onClick={() => alert("Converter em Lead")} 
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg py-3 font-medium transition-colors"
        >
          Converter em Lead
        </button>
      </div>
    </div>
  );
}

/************************************
 * Page component                    *
 ************************************/
// Function to render messages with clickable links
function renderMessageWithLinks(text: string) {
  if (!text) return text;
  
  // URL regex pattern
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;
  
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      const href = part.startsWith('http') ? part : `https://${part}`;
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export default function WhatsAppPage() {
  const { activeConnection, loadConnections } = useConnections();
  const { profile } = useUserProfile();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const {
    conversations, messages, selectedChatId, loading,
    selectConversation, sendMessageTo, markConversationRead,
    connectSocket, disconnectSocket, loadConversations,
    setConversations, setSelectedChatId, setMessages,
    loadOlderMessages, getIdentity,
  } = useWhatsAppConversations();
  
  // Hook para identidade da conversa atual
  const currentConversationIdentity = useIdentity(selectedChatId);

  const { syncWhatsAppContact, getContactByPhone, getContactByJid, updateContact } = useContactSync();
  const { meta: groupMeta, participants } = useWhatsAppGroup(selectedChatId, getIdentity);
  const { sidebarExpanded, setSidebarExpanded } = useSidebar();

  // 🔥 GUARD - don't spam connections durante renders
  const hasValidConnection = activeConnection?.owner_id && activeConnection?.id;
  
  // Ref for messages container
  const listRef = useRef<HTMLDivElement>(null);
  
  // Track whether user is "stuck" to bottom
  const isStuckToBottomRef = useRef(true);
  
  // True only while fetching older messages
  const loadingOlderRef = useRef(false);
  
  // Set when we send a message ourselves
  const justSentRef = useRef(false);
  
  // Helpers for scroll control
  const isNearBottom = (el: HTMLElement, threshold = 80) =>
    el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };
  
  // Scroll listener to update "stickiness"
  const onScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    isStuckToBottomRef.current = isNearBottom(el); // true when user is at bottom
  }, []);

  // Scroll handler for loading older messages
  const onScrollLoadOlder = useCallback(async () => {
    const el = listRef.current;
    if (!el || loadingOlderRef.current) return;
    if (el.scrollTop <= 80) {
      loadingOlderRef.current = true;
      
      const prevScrollHeight = el.scrollHeight;
      const prevTop = el.scrollTop;
      
      await loadOlderMessages(selectedChatId!, activeConnection?.owner_id || '');
      
      // After React renders, restore position
      requestAnimationFrame(() => {
        const newScrollHeight = el.scrollHeight;
        el.scrollTop = newScrollHeight - prevScrollHeight + prevTop;
        loadingOlderRef.current = false;
      });
    }
  }, [loading, selectedChatId, activeConnection?.owner_id, loadOlderMessages]);

  // Função para toggle da sidebar
  const handleSidebarToggle = () => {
    setSidebarExpanded(true);
  };

  // Add scroll listeners
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('scroll', onScrollLoadOlder, { passive: true });
    
    // initialize stickiness
    requestAnimationFrame(() => (isStuckToBottomRef.current = isNearBottom(el)));
    
    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('scroll', onScrollLoadOlder);
    };
  }, [onScroll, onScrollLoadOlder]);
  
  // Validação de conexão silenciosa
  
  // ✅ Callbacks estáveis para evitar re-renderizações
  const handleMessage = useCallback((message: any) => {
    // Silent: Nova mensagem recebida
    setMessages(prev => {
      // Verificar se a mensagem já existe para evitar duplicatas
      const exists = prev.some(m => {
        // Check by ID first
        if (m.id === message.id || (m.tempId && m.tempId === message.tempId)) {
          return true;
        }
        // Check by content and timestamp for duplicates
        const sameContent = m.conteudo === message.conteudo;
        const sameTime = Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 1000;
        const sameSender = m.remetente === message.remetente;
        return sameContent && sameTime && sameSender;
      });
      if (exists) {
        // Silent: Mensagem duplicada ignorada
        return prev;
      }
      
      const newMessages = [...prev, message];
      // Sort messages by timestamp to maintain chronological order
      return newMessages.sort((a, b) => {
        const timestampA = new Date(a.timestamp).getTime();
        const timestampB = new Date(b.timestamp).getTime();
        return timestampA - timestampB;
      });
    });
    
    // Scroll para baixo automaticamente quando receber nova mensagem
    setTimeout(() => {
      scrollToBottom('smooth');
    }, 100);
  }, []);

  const handleMessageUpdate = useCallback((messageId: string, update: any) => {
    setMessages(prev => {
      const updatedMessages = prev.map(m => m.id === messageId || m.tempId === messageId ? { ...m, ...update } : m);
      // Sort messages by timestamp to maintain chronological order after updates
      return updatedMessages.sort((a, b) => {
        const timestampA = new Date(a.timestamp).getTime();
        const timestampB = new Date(b.timestamp).getTime();
        return timestampA - timestampB;
      });
    });
  }, []);

  const handleTyping = useCallback((chatId: string, isTyping: boolean) => {
    if (chatId === selectedChatId) {
      // TODO: Show typing indicator
    }
  }, [selectedChatId]);

  // 🔥 STREAM-CHAT - Responsivo instantâneo como Respond.io
  // ✅ SEMPRE chamar o hook - sem condições (Rules of Hooks)
  const streamChat = useStreamChat({
    ownerId: activeConnection?.owner_id || '',
    connectionId: activeConnection?.id || '',
    onMessage: handleMessage,
    onMessageUpdate: handleMessageUpdate,
    onTyping: handleTyping
  });

  // ✅ REMOVED: This was overriding the paginated loadMessages from the hook

  const pageRef = useRef<HTMLDivElement>(null);
  const pageH = useViewportHeightFor(pageRef);
  const threadScrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const { drafts, setDraft, getDraft, clearDraft } = useConversationDrafts();
  const [statusFilter, setStatusFilter] = useState<"ATENDENDO"|"AGUARDANDO"|"FINALIZADO">("ATENDENDO");
  
  // Estados para os dropdowns do top bar
  const [attendanceModeDropdown, setAttendanceModeDropdown] = useState(false);
  const [closeOpenDropdown, setCloseOpenDropdown] = useState(false);
  const [closingNotesModal, setClosingNotesModal] = useState(false);
  const [closingNotesSummary, setClosingNotesSummary] = useState("");
  const [conversationCategory, setConversationCategory] = useState("");
  const [attendanceMode, setAttendanceMode] = useState<'human' | 'ai'>('human');
  const [showClosingNotesBox, setShowClosingNotesBox] = useState(false);

  // 🔥 INSTANT CONVERSATION SELECTION - Immediate lookup without delays 
  const currentConversation = useMemo(() => {
    const result = selectedChatId ? conversations.find(c=>c.chat_id===selectedChatId) || null : null;
    // Debug log removido para console silencioso
    return result;
  }, [selectedChatId, conversations]);

  // Ref para evitar sincronização duplicada
  const conversationsSyncedRef = useRef<Set<string>>(new Set());

  // Sincronizar contatos do WhatsApp com a tabela de contatos - UMA VEZ APENAS
  useEffect(() => {
    if (activeConnection?.owner_id && conversations.length > 0) {
      // Sync only new conversations (not in cache)
      const syncQueue = conversations.filter(conv => 
        !conversationsSyncedRef.current.has(conv.chat_id)
      );
      
      syncQueue.forEach(async (conv) => {
        try {
          await syncWhatsAppContact({
            chat_id: conv.chat_id,
            name: conv.nome_cliente || conv.numero_cliente,
            phone: conv.numero_cliente,
            whatsapp_name: conv.nome_cliente,
            last_message_at: conv.lastMessageAt,
            unread_count: conv.unread,
            owner_id: activeConnection.owner_id,
          });
          conversationsSyncedRef.current.add(conv.chat_id);
        } catch (error) {
          // Silent error
        }
      });
    }
  }, [activeConnection?.owner_id]); // Only run when owner changes

  // Carregar estado do attendanceMode quando uma conversa é selecionada
  useEffect(() => {
    if (currentConversation && activeConnection?.id) {
      const loadAttendanceMode = async () => {
        try {
          const phoneNumber = currentConversation.numero_cliente || 'default';
          
          // Primeiro, tentar carregar do localStorage
          const savedMode = localStorage.getItem(`ai_agent_mode_${phoneNumber}`);
          if (savedMode && (savedMode === 'human' || savedMode === 'ai')) {
            setAttendanceMode(savedMode);
            return;
          }
          
          // Se não encontrar no localStorage, carregar do banco de dados
          const contact = await getContactByPhone(phoneNumber, activeConnection?.owner_id);
          if (contact) {
            const mode = contact.ai_enabled ? 'ai' : 'human';
            setAttendanceMode(mode);
            // Salvar no localStorage para próxima vez
            localStorage.setItem(`ai_agent_mode_${phoneNumber}`, mode);
          } else {
            // Se não encontrar contato, usar padrão humano
            setAttendanceMode('human');
          }
        } catch (error) {
          console.error('Erro ao carregar attendanceMode:', error);
          setAttendanceMode('human');
        }
      };
      
      loadAttendanceMode();
    }
  }, [currentConversation, activeConnection?.id]);

  // Processar parâmetros de URL para seleção automática de contato
  useEffect(() => {
    const contactId = searchParams.get('contact');
    const phone = searchParams.get('phone');
    
    if (contactId && phone && conversations.length > 0) {
      // Procurar conversa pelo número de telefone
      const conversation = conversations.find(conv => 
        conv.numero_cliente === phone || 
        conv.chat_id.includes(phone.replace(/\D/g, ''))
      );
      
      if (conversation) {
        selectConversation(conversation.chat_id);
      } else {
        // Se não encontrar conversa, criar uma nova conversa ou registrar contato
        console.log('Conversa não encontrada para o contato:', { contactId, phone });
      }
    }
  }, [searchParams, conversations, selectConversation]);
  const [noteMode, setNoteMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recording, setRecording] = useState<MediaRecorder | null>(null);
  const [chunks, setChunks] = useState<Blob[]>([]);

  // ✅ REMOVED: Duplicate scrollToBottom function - using the new one from scroll anchoring
  const onMediaLoaded = useCallback(() => {
    scrollToBottom("smooth");
  }, [scrollToBottom]);

  // Finalizar conversa
  const finalizarConversa = useCallback(async (chatId: string) => {
    if (!activeConnection?.id) return;
    try {
      const conversation = conversations.find(c => c.chat_id === chatId);
      const connectionId = conversation?.connection_id || activeConnection?.id;
      await fetch(`/api/baileys-simple/connections/${connectionId}/finalizar-conversa`, { method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({ chatId }) });
      setConversations(conversations.map(c => c.chat_id === chatId ? { ...c, status:"FINALIZADO" } : c));
      setStatusFilter("FINALIZADO");
      setSelectedChatId(null); setMessages([]); setInput("");
    } catch (e) { console.error("finalizarConversa", e); }
  }, [activeConnection?.id, conversations, setConversations, setSelectedChatId, setMessages]);

  // Função para gerar resumo da conversa com IA (últimas 100 mensagens)
  const generateConversationSummary = async () => {
    if (!currentConversation || messages.length === 0) return;
    
    try {
      // Pegar apenas as últimas 100 mensagens
      const recentMessages = messages.slice(-100);
      const conversationText = recentMessages
        .map(m => `${m.remetente}: ${m.conteudo}`)
        .join('\n');
      
      const response = await fetch('/api/ai/process-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Gere um resumo profissional e claro desta conversa de atendimento. Destaque os pontos principais, problemas resolvidos e próximos passos. Seja conciso mas completo:\n\n${conversationText}`,
          model: 'gpt-4o-mini'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setClosingNotesSummary(result.result || '');
      }
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
    }
  };

  // Função para abrir conversa
  const openConversation = useCallback(async (chatId: string) => {
    try {
      const conversation = conversations.find(c => c.chat_id === chatId);
      const connectionId = conversation?.connection_id || activeConnection?.id;
      await fetch(`/api/baileys-simple/connections/${connectionId}/abrir-conversa`, { method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({ chatId }) });
      setConversations(conversations.map(c => c.chat_id === chatId ? { ...c, status:"ATENDENDO" } : c));
      setStatusFilter("ATENDENDO");
    } catch (e) { console.error("openConversation", e); }
  }, [activeConnection?.id, conversations, setConversations]);

  // Função para alternar modo de atendimento
  const toggleAttendanceMode = async (mode: 'human' | 'ai') => {
    if (!currentConversation || !activeConnection?.id) return;
    
    const phoneNumber = currentConversation.numero_cliente || 'default';
    
    // Atualizar estado local
    setAttendanceMode(mode);
    
    // Salvar no localStorage
    localStorage.setItem(`ai_agent_mode_${phoneNumber}`, mode);
    
    // Salvar no banco de dados
    try {
      const contact = await getContactByPhone(phoneNumber, activeConnection?.owner_id);
      if (contact) {
        await updateContact(contact.id, { ai_enabled: mode === 'ai' });
      }
    } catch (error) {
      console.error('Erro ao salvar estado no banco de dados:', error);
    }
    
    // Notificar o backend sobre a mudança de modo
    try {
      await fetch('http://localhost:3000/api/baileys-simple/atendimentos/change-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: currentConversation.chat_id,
          mode: mode,
          connectionId: activeConnection?.id,
          ownerId: activeConnection?.owner_id
        })
      });
    } catch (error) {
      console.error('Erro ao notificar backend:', error);
    }
  };

  // Open chat with instant switching and race condition prevention
  const openChat = useCallback((chatId: string) => {
    if (selectedChatId === chatId) {
      return;
    }
    
    // Draft workaround for inputs during switching
    if (selectedChatId && input.trim()) {
      setDraft(selectedChatId, input);
    }
    setInput(getDraft(chatId));
    
    // trigger fast immediate conversation switching from hook directly
    selectConversation(chatId, { localMarkRead: true });
    markConversationRead(chatId).catch(console.error);
    
    // scroll fixtures for new load bounce on ya
    setTimeout(() => {
      scrollToBottom("auto");
    }, 100);
    
    setTimeout(() => {
      scrollToBottom("auto");
    }, 500);
  }, [selectedChatId, input, setDraft, getDraft, selectConversation, markConversationRead, scrollToBottom]);

  // Only scroll to bottom when appropriate
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;

    // If we're loading older, NEVER force bottom.
    if (loadingOlderRef.current) return;

    // If we just sent or we are stuck to bottom, keep bottom sticky.
    if (justSentRef.current || isStuckToBottomRef.current) {
      requestAnimationFrame(() => scrollToBottom('auto'));
      // clear the flag after one tick
      justSentRef.current = false;
    }
  }, [messages.length]); // depend on count (not array ref)

  // ✅ REMOVED: This was causing unwanted scroll jumps

  // Uploads
  async function fakeUpload(file: File): Promise<string> { return URL.createObjectURL(file); }
  async function handleAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file || !selectedChatId) return;
    const url = await fakeUpload(file);
    const kind = file.type.startsWith("image/")?"IMAGEM": file.type.startsWith("video/")?"VIDEO":"ARQUIVO";
    const optimistic = { id:`temp-${Date.now()}`, message_id:`temp-${Date.now()}`, chat_id:selectedChatId, conteudo:file.name, message_type:kind as any, media_url:url, remetente:"OPERADOR", timestamp:new Date().toISOString(), lida:true } as any;
    setMessages([...messages, optimistic]); 
    justSentRef.current = true;
    requestAnimationFrame(() => scrollToBottom('auto'));
    try { await sendMessageTo(selectedChatId, file.name, kind as any, url); } catch {}
  }

  function startRecording(){ 
    if(!navigator.mediaDevices||recording) return; 
    navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{ 
      const rec=new MediaRecorder(stream); 
      setRecording(rec); 
      setChunks([]); 
      rec.ondataavailable=e=>setChunks(p=>[...p,e.data]); 
      rec.onstop=async()=>{ 
        const blob=new Blob(chunks,{type:"audio/webm"}); 
        const file=new File([blob],`audio-${Date.now()}.webm`,{type:"audio/webm"}); 
        const url=await fakeUpload(file); 
        if(selectedChatId){ 
          const optimistic={ id:`temp-${Date.now()}`, chat_id:selectedChatId, conteudo:"Áudio", message_type:"AUDIO", media_url:url, remetente:"OPERADOR", timestamp:new Date().toISOString(), lida:true } as any; 
          setMessages([...messages,optimistic]); 
          justSentRef.current = true;
          requestAnimationFrame(() => scrollToBottom('auto')); 
          try{ await sendMessageTo(selectedChatId, "Áudio", "AUDIO", url);}catch{} 
        } 
      }; 
      rec.start(); 
    }).catch(console.error);
  } 
  
  function stopRecording(){ recording?.stop(); setRecording(null); }

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || !selectedChatId || !activeConnection?.id) return;

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimistic = {
      id: tempId,
      message_id: tempId,
      chat_id: selectedChatId,
      conteudo: text,
      message_type: 'TEXTO',
      remetente: 'ATENDENTE', // Mudança para ATENDENTE para aparecer como mensagem enviada
      timestamp: new Date().toISOString(),
      lida: true,
      status: 'sending'
    };

    // Silent: Enviando mensagem otimista

    // Debug logs removed for production

    setInput('');
    clearDraft?.(selectedChatId);

    setMessages(prev =>
      [...prev, optimistic].sort((a,b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    );

    // Mark that we just sent a message
    justSentRef.current = true;
    requestAnimationFrame(() => scrollToBottom('auto'));

    // emit via socket with ACK (server should call ack with final message)
    safeEmit(
      'send-message',
      {
        connectionId: activeConnection.id,
        chatId: selectedChatId,
        message: text,
        type: 'TEXTO'
      },
      (serverMessage?: any) => {
        if (!serverMessage) return; // fallback to socket broadcast
        
        // Debug logs removed for production
        
        // Replace temp with final when ack arrives - prevent duplicates
        setMessages(prev => {
          const withoutTemp = prev.filter(m => m.id !== tempId);
          
          // Check if we already have this exact message (by content and timestamp)
          const exists = withoutTemp.some(m => {
            const sameContent = m.conteudo === serverMessage.conteudo;
            const sameTime = Math.abs(new Date(m.timestamp).getTime() - new Date(serverMessage.timestamp).getTime()) < 1000; // 1 second tolerance
            return sameContent && sameTime;
          });
          
          // Only add if it doesn't exist
          const list = exists ? withoutTemp : [...withoutTemp, serverMessage];
          return list.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        });
      }
    );
  }, [input, selectedChatId, activeConnection?.id, clearDraft, setMessages]);

  // Load connections when user is available
  useEffect(() => {
    if (user?.id) {
      // Silent: Loading connections for user
      loadConnections(user.id);
    }
  }, [user?.id, loadConnections]);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setAttendanceModeDropdown(false);
        setCloseOpenDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filters & selection
  const filteredConversations = useMemo(()=>{
    const list = (conversations||[]).filter(c=>c.status===statusFilter);
    const q = search.trim().toLowerCase(); if(!q) return list;
    return list.filter(conv => (conv.nome_cliente||conv.numero_cliente||"").toLowerCase().includes(q) || (conv.lastMessagePreview||"").toLowerCase().includes(q));
  }, [conversations, search, statusFilter]);

  // Status de conexão - sempre mostrar a página
  const connectionStatus = hasValidConnection ? 'Conectado' : 'Desconectado';
  const connectionStatusColor = hasValidConnection ? 'text-green-600' : 'text-red-600';
  const connectionStatusBg = hasValidConnection ? 'bg-green-50' : 'bg-red-50';

  return (
    <div ref={pageRef} style={pageH ? { height: pageH } : undefined} className="w-full overflow-hidden bg-gray-50 dark:bg-black">
      {/* Global scroll fix */}
      <style>{`html, body, #__next { height: 100%; overflow: hidden; } .app-content, .page-container { min-height: 0; }`}</style>

      {/* Layout com 3 colunas principais */}
      <div className="h-full flex">
        {/* LEFT – conversations list */}
          <aside className="w-96 h-full min-h-0 border-r border-gray-200 bg-white shadow-lg flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {/* Botão de toggle da sidebar - só aparece quando colapsada */}
                  {!sidebarExpanded && (
                    <button
                      onClick={handleSidebarToggle}
                      className="w-7 h-7 p-0 bg-white/20 backdrop-blur-sm border border-gray-200 hover:bg-gray-100 transition-all duration-300 opacity-70 hover:opacity-100 rounded-md flex items-center justify-center"
                      title="Exibir barra lateral"
                    >
                      <AlignJustify className="h-3.5 w-3.5 text-gray-600" />
                    </button>
                  )}
                  <h1 className="text-2xl font-bold text-gray-900">Conversas</h1>
                </div>
                <div className="flex items-center gap-3">
                  <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-sm transition-all duration-300 ${connectionStatusBg}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${hasValidConnection ? 'bg-green-500 animate-pulse shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'}`}/>
                    <span className={`text-sm font-bold tracking-wide ${connectionStatusColor}`}>{connectionStatus}</span>
                  </div>
            </div>
              </div>
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"/>
                <input 
                  value={search} 
                  onChange={(e)=>setSearch(e.target.value)} 
                  placeholder="Buscar conversas..." 
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-white text-sm"
                />
              </div>
              <div className="flex gap-3 justify-center">
              {(["ATENDENDO","AGUARDANDO","FINALIZADO"] as const).map(s => (
                  <button 
                    key={s} 
                    onClick={()=>setStatusFilter(s)} 
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm ${
                      statusFilter===s 
                        ? (s==="AGUARDANDO"?"bg-orange-500":"bg-blue-500")+" text-white shadow-md" 
                        : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                    }`}
                  >
                  {s==="ATENDENDO"?"Atendendo":s==="AGUARDANDO"?"Aguardando":"Finalizados"}
                </button>
              ))}
            </div>
          </div>
            <div className="flex-1 overflow-y-auto min-h-0 bg-blue-25 p-3">
              {filteredConversations.map(conv => (
                <button
                  key={conv.chat_id}
                  onClick={() => openChat(conv.chat_id)}
                  className={`w-full text-left mb-2 rounded-xl transition-all duration-200 ${
                    selectedChatId === conv.chat_id 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'bg-white hover:bg-blue-25 border border-blue-100'
                  }`}
                >
                  <div className="p-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar com imagem de perfil */}
                      <div className="relative flex-shrink-0">
                        <WhatsAppProfilePicture
                          jid={conv.chat_id}
                          name={conv.nome_cliente || conv.numero_cliente}
                          size="md"
                          profilePicture={conv.profile_picture}
                          className="w-12 h-12 rounded-full"
                        />
                        {/* Ícone do WhatsApp */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                          </svg>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate text-base">
                              {getDisplayName(conv)}
                            </h3>
                            <p className="text-sm text-gray-700 truncate mt-0.5">
                              {conv.lastMessage?.conteudo || "—"}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
                            <span className="text-xs text-gray-500">
                              {conv.lastMessageAt ? (() => {
                                const date = new Date(conv.lastMessageAt);
                                const now = new Date();
                                const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
                                
                                if (diffInHours < 24) {
                                  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                } else if (diffInHours < 48) {
                                  return 'Ontem';
                                } else {
                                  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                                }
                              })() : ""}
                            </span>
                            {conv.unread > 0 && (
                              <span className="inline-flex items-center justify-center rounded-full bg-green-500 text-white text-xs px-1.5 py-0.5 min-w-[16px] h-4 font-medium">
                                {conv.unread > 99 ? '99+' : conv.unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              
              {filteredConversations.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <MessageCircle className="w-8 h-8 mb-2 opacity-50"/>
                  <p className="text-sm">Nenhuma conversa encontrada</p>
                  {search && (
                    <p className="text-xs text-gray-400 mt-1">
                      Tente ajustar os filtros ou termo de busca
                    </p>
                  )}
                </div>
              )}
          </div>
        </aside>

        {/* CENTER – thread */}
          <main className="flex-1 h-full min-h-0 flex flex-col bg-white shadow-lg">
          {currentConversation ? (
            <>
              <div className="shrink-0 border-b border-gray-200 px-6 py-4 bg-white shadow-sm">
                <div className="flex items-center gap-4">
                  {/* Foto de perfil do contato */}
                  <WhatsAppProfilePicture
                    jid={currentConversation.chat_id}
                    profilePicture={currentConversationIdentity?.avatar || currentConversation.profile_picture}
                    name={getDisplayName(currentConversation, undefined, getIdentity)}
                    size="lg"
                    showPresence={true}
                    className="w-10 h-10 rounded-full shadow-lg"
                  />
                  
                  {/* Nome do contato */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {getDisplayName(currentConversation, undefined, getIdentity)}
                    </h3>
                  </div>

                  {/* Dropdown Modo de Atendimento */}
                  <div className="relative dropdown-container">
                    <button
                      onClick={() => setAttendanceModeDropdown(!attendanceModeDropdown)}
                      className="flex items-center gap-2 px-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors h-10"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {attendanceMode === 'human' ? 'Você' : 'Agente IA'}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    
                    {attendanceModeDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        <button
                          onClick={() => {
                            toggleAttendanceMode('human');
                            setAttendanceModeDropdown(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 ${
                            attendanceMode === 'human' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          <User className="w-4 h-4" />
                          <span>Você</span>
                          {attendanceMode === 'human' && <Check className="w-4 h-4 ml-auto" />}
                        </button>
                        <button
                          onClick={() => {
                            toggleAttendanceMode('ai');
                            setAttendanceModeDropdown(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 ${
                            attendanceMode === 'ai' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          <Bot className="w-4 h-4" />
                          <span>Agente IA</span>
                          {attendanceMode === 'ai' && <Check className="w-4 h-4 ml-auto" />}
                        </button>
                  </div>
                    )}
                  </div>

                  {/* Ícone de raio (automação) */}
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                    <Zap className="w-5 h-5" />
                  </button>

                  {/* Ícone de busca */}
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                    <Search className="w-5 h-5" />
                  </button>

                  {/* Dropdown Close/Open */}
                  <div className="relative dropdown-container">
                    <div className="flex items-center rounded-lg shadow-sm h-10">
                      <button
                        onClick={() => {
                          if (currentConversation.status === 'FINALIZADO') {
                            openConversation(currentConversation.chat_id);
                          } else {
                            setShowClosingNotesBox(!showClosingNotesBox);
                          }
                        }}
                        className="flex items-center justify-center gap-2 px-4 text-white bg-green-500 hover:bg-green-600 hover:shadow-md transition-all duration-200 rounded-l-lg flex-1 h-full"
                      >
                        <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-green-500" />
                        </div>
                        <span className="text-sm font-medium">Fechar</span>
                      </button>
                      <div className="w-px h-8 bg-white opacity-30"></div>
                      <button
                        onClick={() => {
                          if (currentConversation.status === 'FINALIZADO') {
                            openConversation(currentConversation.chat_id);
                          } else {
                            setShowClosingNotesBox(!showClosingNotesBox);
                          }
                        }}
                        className="flex items-center justify-center px-4 text-white bg-green-500 hover:bg-green-600 hover:shadow-md transition-all duration-200 rounded-r-lg flex-1 h-full"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Closing Notes Box Inline */}
              {showClosingNotesBox && (
                <div className="border-b border-gray-200 bg-white shadow-sm">
                  <div className="px-6 py-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">Nota de Fechamento</h2>
                      <button
                        onClick={() => setShowClosingNotesBox(false)}
                        className="ml-auto p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Categoria da Conversa
                        </label>
                        <select
                          value={conversationCategory}
                          onChange={(e) => setConversationCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Selecione a categoria da conversa</option>
                          <option value="support">Suporte</option>
                          <option value="sales">Vendas</option>
                          <option value="billing">Cobrança</option>
                          <option value="technical">Técnico</option>
                          <option value="general">Geral</option>
                        </select>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Resumo
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={generateConversationSummary}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Gerar Resumo com IA"
                            >
                              <Zap className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1 text-blue-600 hover:text-blue-800 border-2 border-red-500 rounded"
                              title="Resumo Manual"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-xs text-gray-500">
                            Para economizar tempo, use o recurso Resumir para gerar um resumo claro e profissional da conversa com IA
                          </p>
                        </div>
                        <textarea
                          value={closingNotesSummary}
                          onChange={(e) => setClosingNotesSummary(e.target.value)}
                          placeholder="Adicione um resumo da conversa..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        onClick={() => {
                          setShowClosingNotesBox(false);
                          setClosingNotesSummary("");
                          setConversationCategory("");
                        }}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => {
                          // Aqui você pode salvar as notas e fechar a conversa
                          finalizarConversa(currentConversation.chat_id);
                          setShowClosingNotesBox(false);
                          setClosingNotesSummary("");
                          setConversationCategory("");
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Fechar Conversa
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div ref={listRef} className="flex-1 overflow-y-auto px-6 py-6 min-h-0" style={{
                backgroundImage: 'url(/assets/backgrounds/whatsapp-thread-background.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageCircle className="w-12 h-12 mb-4 opacity-50"/>
                    <p className="text-lg font-medium">Nenhuma mensagem ainda</p>
                    <button className="mt-2 text-xs px-3 py-1.5 rounded-full border">Conversas anteriores</button>
                  </div>
                ) : (
                  <div className="flex flex-col justify-end min-h-full">
                    <div className="space-y-6 pb-6">
                      {groupByDay(messages.filter(msg => {
                        // Filter out messages with broken media URLs using utility
                        if (msg.media_url) {
                          // Additional aggressive filtering
                          const url = msg.media_url;
                          if (
                            url === 'undefined' || url === 'null' || url === '' ||
                            url.includes('localhost:3000/api/media') ||
                            url.includes('/mmg') || url.endsWith('mmg') ||
                            url.includes(';%20codecs') || url.includes('codecs=opus') ||
                            url.includes('web.whatsapp.net') || url.includes('mmg.whatsapp.net')
                          ) {
                            return false;
                          }
                          return isValidMediaUrl(url);
                        }
                        return true;
                      })).map(group => (
                        <div key={group.key}>
                          <div className="sticky top-2 z-10 w-full flex justify-center">
                            <span className="text-[11px] bg-white/80 backdrop-blur px-3 py-1 rounded-full border text-gray-600">{dayLabel(group.date)}</span>
                          </div>
                          <div className="mt-2 space-y-4">
                            {group.items.map((m:any, index: number) => {
                              // Determinar se é a última mensagem do mesmo remetente
                              const nextMessage = group.items[index + 1];
                              const isLastFromSender = !nextMessage || nextMessage.remetente !== m.remetente;
                              
                              return (
                              <MessageBubble 
                                key={m.id || m.message_id} 
                                message={m} 
                                onMediaLoaded={onMediaLoaded} 
                                isGroup={currentConversation?.chat_id?.includes('@g.us') || false}
                                  isLastFromSender={isLastFromSender}
                              />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      <div ref={bottomRef} />
                    </div>
                  </div>
                )}
              </div>

              {/* Composer Avançado */}
              <div className="shrink-0">
                <WhatsAppOptimizedComposer
                  jid={selectedChatId || ''}
                  onMessageSent={(message) => {
                    // Limpar rascunho após enviar
                    clearDraft(selectedChatId || '');
                    setInput('');
                    
                    // Adicionar mensagem otimista ao thread
                    const optimisticMessage = {
                      id: `temp-${Date.now()}-${Math.random()}`,
                      message_id: `temp-${Date.now()}-${Math.random()}`,
                      chat_id: selectedChatId || '',
                      conteudo: message.content || message.type,
                      message_type: message.type?.toUpperCase() || 'AUDIO',
                      remetente: "OPERADOR" as const,
                      timestamp: new Date().toISOString(),
                      lida: true,
                      status: 'sending',
                      media_url: message.mediaUrl || message.url
                    };
                    
                    setMessages(prev => {
                      const newMessages = [...prev, optimisticMessage];
                      return newMessages.sort((a, b) => 
                        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                      );
                    });
                    
                    // Atualizar preview da conversa
                    setConversations(conversations.map(c=> 
                      c.chat_id===selectedChatId ? {
                        ...c, 
                        lastMessage: optimisticMessage,
                        lastMessageAt: optimisticMessage.timestamp,
                        lastMessagePreview: message.content || message.type
                      } : c
                    ));
                    
                    // Mark that we just sent a message
                    justSentRef.current = true;
                    requestAnimationFrame(() => scrollToBottom('auto'));
                  }}
                  onNoteAdded={async (noteText) => {
                    // Nota adicionada
                  }}
                  onDraftChange={(jid, draft) => {
                    // Atualizar preview da conversa com rascunho
                    setConversations(conversations.map(c=> 
                      c.chat_id===jid ? {
                        ...c, 
                        lastMessagePreview: draft.trim() ? `Rascunho: ${draft}` : (c.lastMessagePreview || "Nenhuma mensagem")
                      } : c
                    ));
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500 max-w-md mx-auto px-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4"><MessageCircle className="w-10 h-10 text-green-500"/></div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Selecione uma conversa</h3>
                <p className="text-sm text-gray-500">Escolha uma conversa da lista ao lado para começar a enviar mensagens.</p>
              </div>
            </div>
          )}
        </main>


        {/* RIGHT – contact details */}
          <aside className="w-96 h-full min-h-0 border-l border-gray-200 bg-white shadow-lg flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {currentConversation ? (
              <ContactSummaryPanel
                ownerId={activeConnection?.owner_id}
                conversation={{
                  chat_id: currentConversation.chat_id,
                  nome_cliente: currentConversation.nome_cliente,
                  numero_cliente: currentConversation.numero_cliente,
                  lastMessageAt: currentConversation.lastMessageAt,
                  status: currentConversation.status,
                }}
                messagesCount={messages.length}
                onFinalizeConversation={() => finalizarConversa(currentConversation.chat_id)}
                getIdentity={getIdentity}
                groupMeta={groupMeta}
                participants={participants}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center"><MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50"/><p className="text-sm">Selecione uma conversa para ver os detalhes</p></div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
