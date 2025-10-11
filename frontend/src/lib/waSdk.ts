import { supabase } from "@/integrations/supabase/client";

// Types
export interface Conversation {
  id: string;
  connection_id: string;
  numero_cliente: string;
  nome_cliente: string | null;
  status: string;
  ultima_mensagem_preview: string | null;
  ultima_mensagem_em: string | null;
  nao_lidas: number;
  profile_picture?: string;
  prioridade?: number;
  ai_enabled?: boolean;
  attendant_name?: string;
  attendant_photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  atendimento_id: string;
  conteudo: string | null;
  tipo: string;
  remetente: string;
  timestamp: string;
  lida: boolean;
  midia_url: string | null;
  midia_tipo: string | null;
  midia_nome: string | null;
  midia_tamanho: number | null;
  created_at: string;
}

// Direct Supabase functions
export async function listConversations(params: { ownerId: string; q?: string }): Promise<Conversation[]> {
  let query = supabase
    .from("whatsapp_atendimentos")
    .select("*")
    .eq("owner_id", params.ownerId)
    .order("ultima_mensagem_em", { ascending: false, nullsFirst: false });

  if (params.q && params.q.trim()) {
    query = query.or(`nome_cliente.ilike.%${params.q.trim()}%,numero_cliente.ilike.%${params.q.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  return (data ?? []) as Conversation[];
}

export async function getMessages(atendimentoId: string, before?: string, limit: number = 30): Promise<{ items: Message[] }> {
  let query = supabase
    .from("whatsapp_mensagens")
    .select("*")
    .eq("atendimento_id", atendimentoId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  return { items: data || [] };
}

export function subscribeConversationUpdates(ownerId: string, callback: (payload: any) => void) {
  const channel = supabase
    .channel(`wa_conversations_${ownerId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "whatsapp_atendimentos",
        filter: `owner_id=eq.${ownerId}`,
      },
      callback
    )
    .subscribe();

  return {
    unsubscribe: () => supabase.removeChannel(channel)
  };
}

export function subscribeMessages(atendimentoId: string, callback: (payload: any) => void) {
  const channel = supabase
    .channel(`wa_messages_${atendimentoId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "whatsapp_mensagens",
        filter: `atendimento_id=eq.${atendimentoId}`,
      },
      callback
    )
    .subscribe();

  return {
    unsubscribe: () => supabase.removeChannel(channel)
  };
}

// Legacy waSdk object for compatibility
export const waSdk = {
  async getMessages(params: {
    connectionId: string;
    chatId: string;
    atendimentoId?: string;
    before?: string;
    limit?: number;
  }): Promise<{ items: any[]; nextBefore: string | null }> {
    if (!params.atendimentoId) {
      throw new Error("atendimentoId is required");
    }
    
    const { items } = await getMessages(params.atendimentoId, params.before, params.limit || 30);
    return { items, nextBefore: null };
  },

  async sendMessage(
    body: {
      connectionId: string;
      chatId: string;
      type: "text" | "image" | "audio" | "video" | "document";
      text?: string;
      mediaKey?: string;
      mimeType?: string;
      replyToId?: string;
    },
    opts?: { idempotencyKey?: string }
  ): Promise<any> {
    const res = await fetch("http://localhost:3000/api/wa/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(opts?.idempotencyKey ? { "Idempotency-Key": opts.idempotencyKey } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`send failed: ${res.status} ${t}`);
    }
    return res.json();
  },

  async markRead(connectionId: string, chatId: string, messageId?: string) {
    // TODO: Implement mark as read
    console.log("markRead called:", connectionId, chatId, messageId);
  },

  async typing(connectionId: string, chatId: string, isTyping: boolean) {
    // TODO: Implement typing indicator
    console.log("typing called:", connectionId, chatId, isTyping);
  },
};
