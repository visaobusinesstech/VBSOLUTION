import { supabase } from '../supabaseClient';

export interface AttendanceModeConfig {
  mode: 'ai' | 'human';
  source: 'global' | 'conversation' | 'default';
  conversationId?: string;
  connectionId: string;
  ownerId: string;
}

export class AttendanceModeService {
  /**
   * Determina qual modo de atendimento usar para uma conversa
   * Prioridade: configuração da conversa > configuração global da conexão > padrão (human)
   */
  static async getAttendanceMode(
    ownerId: string,
    connectionId: string,
    conversationId?: string
  ): Promise<AttendanceModeConfig> {
    try {
      // 1. Se temos um conversationId, verificar se a conversa tem configuração específica
      if (conversationId) {
        const { data: conversation, error: convError } = await supabase
          .from('whatsapp_atendimentos')
          .select('attendance_mode, chat_id')
          .eq('id', conversationId)
          .eq('owner_id', ownerId)
          .single();

        if (!convError && conversation && conversation.attendance_mode) {
          console.log(`🎯 Modo de atendimento da conversa: ${conversation.attendance_mode}`);
          return {
            mode: conversation.attendance_mode as 'ai' | 'human',
            source: 'conversation',
            conversationId,
            connectionId,
            ownerId
          };
        }
      }

      // 2. Caso contrário, usar configuração global da conexão
      const { data: connection, error: connError } = await supabase
        .from('whatsapp_sessions')
        .select('attendance_type')
        .eq('owner_id', ownerId)
        .eq('connection_id', connectionId)
        .single();

      if (!connError && connection && connection.attendance_type) {
        console.log(`🌐 Modo de atendimento global da conexão: ${connection.attendance_type}`);
        return {
          mode: connection.attendance_type as 'ai' | 'human',
          source: 'global',
          connectionId,
          ownerId
        };
      }

      // 3. Fallback para modo humano
      console.log(`👤 Modo de atendimento padrão: human`);
      return {
        mode: 'human',
        source: 'default',
        connectionId,
        ownerId
      };

    } catch (error) {
      console.error('❌ Erro ao determinar modo de atendimento:', error);
      return {
        mode: 'human',
        source: 'default',
        connectionId,
        ownerId
      };
    }
  }

  /**
   * Define o modo de atendimento para uma conversa específica
   */
  static async setConversationAttendanceMode(
    ownerId: string,
    conversationId: string,
    mode: 'ai' | 'human'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('whatsapp_atendimentos')
        .update({ attendance_mode: mode })
        .eq('id', conversationId)
        .eq('owner_id', ownerId);

      if (error) {
        console.error('❌ Erro ao atualizar modo da conversa:', error);
        return false;
      }

      console.log(`✅ Modo da conversa ${conversationId} definido como: ${mode}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao definir modo da conversa:', error);
      return false;
    }
  }

  /**
   * Define o modo de atendimento global para uma conexão
   */
  static async setGlobalAttendanceMode(
    ownerId: string,
    connectionId: string,
    mode: 'ai' | 'human'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('whatsapp_sessions')
        .update({ attendance_type: mode })
        .eq('owner_id', ownerId)
        .eq('connection_id', connectionId);

      if (error) {
        console.error('❌ Erro ao atualizar modo global da conexão:', error);
        return false;
      }

      console.log(`✅ Modo global da conexão ${connectionId} definido como: ${mode}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao definir modo global da conexão:', error);
      return false;
    }
  }

  /**
   * Remove a configuração específica de uma conversa (volta a usar configuração global)
   */
  static async clearConversationAttendanceMode(
    ownerId: string,
    conversationId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('whatsapp_atendimentos')
        .update({ attendance_mode: null })
        .eq('id', conversationId)
        .eq('owner_id', ownerId);

      if (error) {
        console.error('❌ Erro ao limpar modo da conversa:', error);
        return false;
      }

      console.log(`✅ Modo da conversa ${conversationId} limpo (voltará a usar configuração global)`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao limpar modo da conversa:', error);
      return false;
    }
  }

  /**
   * Verifica se uma nova mensagem deve ser processada pelo AI Agent
   */
  static async shouldUseAIForNewMessage(
    ownerId: string,
    connectionId: string,
    conversationId?: string
  ): Promise<boolean> {
    try {
      const config = await this.getAttendanceMode(ownerId, connectionId, conversationId);
      const shouldUse = config.mode === 'ai';
      
      console.log(`🤖 Nova mensagem deve usar AI: ${shouldUse} (fonte: ${config.source})`);
      return shouldUse;
    } catch (error) {
      console.error('❌ Erro ao verificar se deve usar AI:', error);
      return false; // Por segurança, usar modo humano em caso de erro
    }
  }

  /**
   * Obtém informações detalhadas sobre a configuração atual
   */
  static async getAttendanceModeInfo(
    ownerId: string,
    connectionId: string,
    conversationId?: string
  ): Promise<{
    current: AttendanceModeConfig;
    global: { mode: 'ai' | 'human' } | null;
    conversation: { mode: 'ai' | 'human' } | null;
  }> {
    try {
      const current = await this.getAttendanceMode(ownerId, connectionId, conversationId);
      
      // Buscar configuração global
      const { data: global } = await supabase
        .from('whatsapp_sessions')
        .select('attendance_type')
        .eq('owner_id', ownerId)
        .eq('connection_id', connectionId)
        .single();

      // Buscar configuração da conversa (se fornecida)
      let conversation = null;
      if (conversationId) {
        const { data: conv } = await supabase
          .from('whatsapp_atendimentos')
          .select('attendance_mode')
          .eq('id', conversationId)
          .eq('owner_id', ownerId)
          .single();
        
        if (conv && conv.attendance_mode) {
          conversation = { mode: conv.attendance_mode as 'ai' | 'human' };
        }
      }

      return {
        current,
        global: global ? { mode: global.attendance_type as 'ai' | 'human' } : null,
        conversation
      };
    } catch (error) {
      console.error('❌ Erro ao obter informações do modo de atendimento:', error);
      throw error;
    }
  }
}
