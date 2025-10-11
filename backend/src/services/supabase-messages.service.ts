import { supabase, isWhatsAppV2Enabled, DEFAULT_OWNER_ID } from '../config/supabase';
import logger from '../logger';

export interface WhatsAppMessageData {
  id?: string;
  owner_id: string;
  atendimento_id: string;
  message_id?: string;
  chat_id?: string;
  connection_id?: string;
  conteudo: string;
  tipo: 'TEXTO' | 'IMAGEM' | 'AUDIO' | 'VIDEO' | 'DOCUMENTO' | 'STICKER' | 'LOCALIZACAO' | 'CONTATO' | 'OUTRO';
  remetente: 'CLIENTE' | 'ATENDENTE';
  timestamp: Date;
  lida?: boolean;
  midia_url?: string;
  midia_tipo?: string;
  midia_nome?: string;
  midia_tamanho?: number;
  raw_data?: any;
}

export class SupabaseMessagesService {
  /**
   * Save message with idempotency
   */
  async saveMessage(messageData: WhatsAppMessageData): Promise<WhatsAppMessageData | null> {
    if (!isWhatsAppV2Enabled()) {
      logger.debug('WhatsApp V2 disabled, skipping message save');
      return null;
    }

    try {
      const data = {
        id: messageData.id || crypto.randomUUID(),
        owner_id: messageData.owner_id || DEFAULT_OWNER_ID,
        atendimento_id: messageData.atendimento_id,
        message_id: messageData.message_id || null,
        chat_id: messageData.chat_id || null,
        connection_id: messageData.connection_id || null,
        conteudo: messageData.conteudo,
        tipo: messageData.tipo || 'TEXTO',
        remetente: messageData.remetente,
        timestamp: messageData.timestamp.toISOString(),
        lida: messageData.lida || false,
        midia_url: messageData.midia_url || null,
        midia_tipo: messageData.midia_tipo || null,
        midia_nome: messageData.midia_nome || null,
        midia_tamanho: messageData.midia_tamanho || null,
        raw_data: messageData.raw_data ? JSON.stringify(messageData.raw_data) : null,
        created_at: new Date().toISOString()
      };

      // Use upsert with conflict resolution on message_id if available
      const { data: result, error } = await supabase
        .from('whatsapp_mensagens')
        .upsert(data, {
          onConflict: messageData.message_id ? 'message_id' : 'id'
        })
        .select()
        .single();

      if (error) {
        logger.error('Error saving message:', error);
        return null;
      }

      logger.debug('Message saved successfully:', result.id);
      return result as WhatsAppMessageData;
    } catch (error) {
      logger.error('Error in saveMessage:', error);
      return null;
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    atendimentoId: string, 
    ownerId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<WhatsAppMessageData[]> {
    if (!isWhatsAppV2Enabled()) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('whatsapp_mensagens')
        .select('*')
        .eq('atendimento_id', atendimentoId)
        .eq('owner_id', ownerId)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Error getting messages:', error);
        return [];
      }

      return data as WhatsAppMessageData[];
    } catch (error) {
      logger.error('Error in getMessages:', error);
      return [];
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(atendimentoId: string, ownerId: string): Promise<boolean> {
    if (!isWhatsAppV2Enabled()) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('whatsapp_mensagens')
        .update({ lida: true })
        .eq('atendimento_id', atendimentoId)
        .eq('owner_id', ownerId)
        .eq('remetente', 'CLIENTE');

      if (error) {
        logger.error('Error marking messages as read:', error);
        return false;
      }

      logger.debug(`Messages marked as read for atendimento ${atendimentoId}`);
      return true;
    } catch (error) {
      logger.error('Error in markMessagesAsRead:', error);
      return false;
    }
  }

  /**
   * Get unread message count for a conversation
   */
  async getUnreadCount(atendimentoId: string, ownerId: string): Promise<number> {
    if (!isWhatsAppV2Enabled()) {
      return 0;
    }

    try {
      const { count, error } = await supabase
        .from('whatsapp_mensagens')
        .select('*', { count: 'exact', head: true })
        .eq('atendimento_id', atendimentoId)
        .eq('owner_id', ownerId)
        .eq('remetente', 'CLIENTE')
        .eq('lida', false);

      if (error) {
        logger.error('Error getting unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      logger.error('Error in getUnreadCount:', error);
      return 0;
    }
  }

  /**
   * Get latest message for a conversation
   */
  async getLatestMessage(atendimentoId: string, ownerId: string): Promise<WhatsAppMessageData | null> {
    if (!isWhatsAppV2Enabled()) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('whatsapp_mensagens')
        .select('*')
        .eq('atendimento_id', atendimentoId)
        .eq('owner_id', ownerId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No messages found
          return null;
        }
        logger.error('Error getting latest message:', error);
        return null;
      }

      return data as WhatsAppMessageData;
    } catch (error) {
      logger.error('Error in getLatestMessage:', error);
      return null;
    }
  }
}

export const supabaseMessagesService = new SupabaseMessagesService();
