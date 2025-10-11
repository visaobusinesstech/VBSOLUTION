import { supabase, isWhatsAppV2Enabled, DEFAULT_OWNER_ID, DEFAULT_COMPANY_ID } from '../config/supabase';
import logger from '../logger';

export interface WhatsAppAtendimentoData {
  id?: string;
  owner_id: string;
  company_id?: string;
  connection_id?: string;
  chat_id?: string;
  numero_cliente: string;
  nome_cliente?: string;
  status: 'AGUARDANDO' | 'ATENDENDO' | 'ENCERRADO' | 'PAUSADO';
  data_inicio: Date;
  data_fim?: Date;
  ultima_mensagem: Date;
  atendente_id?: string;
  prioridade?: number;
  tags?: any;
  observacoes?: string;
  canal?: string;
}

export class SupabaseAtendimentosService {
  /**
   * Create or update atendimento
   */
  async upsertAtendimento(atendimentoData: Partial<WhatsAppAtendimentoData>): Promise<WhatsAppAtendimentoData | null> {
    if (!isWhatsAppV2Enabled()) {
      logger.debug('WhatsApp V2 disabled, skipping atendimento upsert');
      return null;
    }

    try {
      const data = {
        id: atendimentoData.id || crypto.randomUUID(),
        owner_id: atendimentoData.owner_id || DEFAULT_OWNER_ID,
        company_id: atendimentoData.company_id || DEFAULT_COMPANY_ID,
        connection_id: atendimentoData.connection_id || null,
        chat_id: atendimentoData.chat_id || null,
        numero_cliente: atendimentoData.numero_cliente,
        nome_cliente: atendimentoData.nome_cliente || null,
        status: atendimentoData.status || 'AGUARDANDO',
        data_inicio: atendimentoData.data_inicio?.toISOString() || new Date().toISOString(),
        data_fim: atendimentoData.data_fim?.toISOString() || null,
        ultima_mensagem: atendimentoData.ultima_mensagem?.toISOString() || new Date().toISOString(),
        atendente_id: atendimentoData.atendente_id || null,
        prioridade: atendimentoData.prioridade || 1,
        tags: atendimentoData.tags ? JSON.stringify(atendimentoData.tags) : null,
        observacoes: atendimentoData.observacoes || null,
        canal: atendimentoData.canal || 'whatsapp',
        updated_at: new Date().toISOString()
      };

      // Use upsert with conflict resolution on connection_id + numero_cliente
      const { data: result, error } = await supabase
        .from('whatsapp_atendimentos')
        .upsert(data, {
          onConflict: 'connection_id,numero_cliente'
        })
        .select()
        .single();

      if (error) {
        logger.error('Error upserting atendimento:', error);
        return null;
      }

      logger.debug('Atendimento upserted successfully:', result.id);
      return result as WhatsAppAtendimentoData;
    } catch (error) {
      logger.error('Error in upsertAtendimento:', error);
      return null;
    }
  }

  /**
   * Update atendimento status
   */
  async updateAtendimentoStatus(
    atendimentoId: string,
    status: WhatsAppAtendimentoData['status'],
    additionalData?: Partial<WhatsAppAtendimentoData>
  ): Promise<boolean> {
    if (!isWhatsAppV2Enabled()) {
      return false;
    }

    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'ENCERRADO' && !additionalData?.data_fim) {
        updateData.data_fim = new Date().toISOString();
      }

      if (additionalData) {
        Object.assign(updateData, additionalData);
      }

      const { error } = await supabase
        .from('whatsapp_atendimentos')
        .update(updateData)
        .eq('id', atendimentoId);

      if (error) {
        logger.error('Error updating atendimento status:', error);
        return false;
      }

      logger.debug(`Atendimento ${atendimentoId} status updated to ${status}`);
      return true;
    } catch (error) {
      logger.error('Error in updateAtendimentoStatus:', error);
      return false;
    }
  }

  /**
   * Update last message timestamp
   */
  async updateLastMessage(atendimentoId: string, timestamp: Date): Promise<boolean> {
    if (!isWhatsAppV2Enabled()) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('whatsapp_atendimentos')
        .update({
          ultima_mensagem: timestamp.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', atendimentoId);

      if (error) {
        logger.error('Error updating last message:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error in updateLastMessage:', error);
      return false;
    }
  }

  /**
   * Get atendimento by ID
   */
  async getAtendimento(atendimentoId: string): Promise<WhatsAppAtendimentoData | null> {
    if (!isWhatsAppV2Enabled()) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('whatsapp_atendimentos')
        .select('*')
        .eq('id', atendimentoId)
        .single();

      if (error) {
        logger.error('Error getting atendimento:', error);
        return null;
      }

      return data as WhatsAppAtendimentoData;
    } catch (error) {
      logger.error('Error in getAtendimento:', error);
      return null;
    }
  }

  /**
   * Get atendimento by connection and phone
   */
  async getAtendimentoByConnection(
    connectionId: string, 
    numeroCliente: string
  ): Promise<WhatsAppAtendimentoData | null> {
    if (!isWhatsAppV2Enabled()) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('whatsapp_atendimentos')
        .select('*')
        .eq('connection_id', connectionId)
        .eq('numero_cliente', numeroCliente)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No atendimento found
          return null;
        }
        logger.error('Error getting atendimento by connection:', error);
        return null;
      }

      return data as WhatsAppAtendimentoData;
    } catch (error) {
      logger.error('Error in getAtendimentoByConnection:', error);
      return null;
    }
  }

  /**
   * Get all atendimentos for owner
   */
  async getAtendimentosByOwner(
    ownerId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<WhatsAppAtendimentoData[]> {
    if (!isWhatsAppV2Enabled()) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('whatsapp_atendimentos')
        .select('*')
        .eq('owner_id', ownerId)
        .order('ultima_mensagem', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Error getting atendimentos by owner:', error);
        return [];
      }

      return data as WhatsAppAtendimentoData[];
    } catch (error) {
      logger.error('Error in getAtendimentosByOwner:', error);
      return [];
    }
  }

  /**
   * Get active atendimentos (AGUARDANDO or ATENDENDO)
   */
  async getActiveAtendimentos(ownerId: string): Promise<WhatsAppAtendimentoData[]> {
    if (!isWhatsAppV2Enabled()) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('whatsapp_atendimentos')
        .select('*')
        .eq('owner_id', ownerId)
        .in('status', ['AGUARDANDO', 'ATENDENDO'])
        .order('ultima_mensagem', { ascending: false });

      if (error) {
        logger.error('Error getting active atendimentos:', error);
        return [];
      }

      return data as WhatsAppAtendimentoData[];
    } catch (error) {
      logger.error('Error in getActiveAtendimentos:', error);
      return [];
    }
  }
}

export const supabaseAtendimentosService = new SupabaseAtendimentosService();
