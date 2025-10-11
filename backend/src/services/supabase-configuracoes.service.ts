import { supabase, isWhatsAppV2Enabled, DEFAULT_OWNER_ID, DEFAULT_COMPANY_ID } from '../config/supabase';
import logger from '../logger';

export interface WhatsAppConfiguracaoData {
  id?: string;
  owner_id: string;
  company_id?: string;
  nome: string;
  mensagem_boas_vindas: string;
  mensagem_menu: string;
  mensagem_despedida: string;
  tempo_resposta: number;
  max_tentativas: number;
  ativo: boolean;
}

export class SupabaseConfiguracoesService {
  /**
   * Create or update configuration
   */
  async upsertConfiguracao(configData: Partial<WhatsAppConfiguracaoData>): Promise<WhatsAppConfiguracaoData | null> {
    if (!isWhatsAppV2Enabled()) {
      logger.debug('WhatsApp V2 disabled, skipping config upsert');
      return null;
    }

    try {
      const data = {
        id: configData.id || crypto.randomUUID(),
        owner_id: configData.owner_id || DEFAULT_OWNER_ID,
        company_id: configData.company_id || DEFAULT_COMPANY_ID,
        nome: configData.nome || 'Configuração Padrão',
        mensagem_boas_vindas: configData.mensagem_boas_vindas || 'Olá! Como posso ajudá-lo hoje?',
        mensagem_menu: configData.mensagem_menu || 'Escolha uma opção:\n1. Falar com atendente\n2. Informações\n3. Suporte',
        mensagem_despedida: configData.mensagem_despedida || 'Obrigado por entrar em contato!',
        tempo_resposta: configData.tempo_resposta || 300, // 5 minutes
        max_tentativas: configData.max_tentativas || 3,
        ativo: configData.ativo !== undefined ? configData.ativo : true,
        updated_at: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from('whatsapp_configuracoes')
        .upsert(data, {
          onConflict: 'owner_id,company_id'
        })
        .select()
        .single();

      if (error) {
        logger.error('Error upserting configuracao:', error);
        return null;
      }

      logger.debug('Configuracao upserted successfully:', result.id);
      return result as WhatsAppConfiguracaoData;
    } catch (error) {
      logger.error('Error in upsertConfiguracao:', error);
      return null;
    }
  }

  /**
   * Get configuration for owner/company
   */
  async getConfiguracao(ownerId: string, companyId?: string): Promise<WhatsAppConfiguracaoData | null> {
    if (!isWhatsAppV2Enabled()) {
      return null;
    }

    try {
      let query = supabase
        .from('whatsapp_configuracoes')
        .select('*')
        .eq('owner_id', ownerId)
        .eq('ativo', true);

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No config found, create default
          return await this.createDefaultConfig(ownerId, companyId);
        }
        logger.error('Error getting configuracao:', error);
        return null;
      }

      return data as WhatsAppConfiguracaoData;
    } catch (error) {
      logger.error('Error in getConfiguracao:', error);
      return null;
    }
  }

  /**
   * Create default configuration
   */
  async createDefaultConfig(ownerId: string, companyId?: string): Promise<WhatsAppConfiguracaoData | null> {
    const defaultConfig: Partial<WhatsAppConfiguracaoData> = {
      owner_id: ownerId,
      company_id: companyId,
      nome: 'Configuração Padrão',
      mensagem_boas_vindas: 'Olá! Bem-vindo ao nosso atendimento. Como posso ajudá-lo hoje?',
      mensagem_menu: 'Escolha uma das opções abaixo:\n\n1️⃣ Falar com atendente\n2️⃣ Informações sobre produtos\n3️⃣ Suporte técnico\n4️⃣ Falar com vendas\n\nDigite o número da opção desejada.',
      mensagem_despedida: 'Obrigado por entrar em contato conosco! Se precisar de mais alguma coisa, estaremos aqui para ajudar. Tenha um ótimo dia!',
      tempo_resposta: 300, // 5 minutes
      max_tentativas: 3,
      ativo: true
    };

    return await this.upsertConfiguracao(defaultConfig);
  }

  /**
   * Update configuration
   */
  async updateConfiguracao(
    configId: string,
    updates: Partial<WhatsAppConfiguracaoData>
  ): Promise<boolean> {
    if (!isWhatsAppV2Enabled()) {
      return false;
    }

    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('whatsapp_configuracoes')
        .update(updateData)
        .eq('id', configId);

      if (error) {
        logger.error('Error updating configuracao:', error);
        return false;
      }

      logger.debug(`Configuracao ${configId} updated successfully`);
      return true;
    } catch (error) {
      logger.error('Error in updateConfiguracao:', error);
      return false;
    }
  }

  /**
   * Get all configurations for owner
   */
  async getConfiguracoesByOwner(ownerId: string): Promise<WhatsAppConfiguracaoData[]> {
    if (!isWhatsAppV2Enabled()) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('whatsapp_configuracoes')
        .select('*')
        .eq('owner_id', ownerId)
        .order('updated_at', { ascending: false });

      if (error) {
        logger.error('Error getting configuracoes by owner:', error);
        return [];
      }

      return data as WhatsAppConfiguracaoData[];
    } catch (error) {
      logger.error('Error in getConfiguracoesByOwner:', error);
      return [];
    }
  }

  /**
   * Delete configuration
   */
  async deleteConfiguracao(configId: string): Promise<boolean> {
    if (!isWhatsAppV2Enabled()) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('whatsapp_configuracoes')
        .delete()
        .eq('id', configId);

      if (error) {
        logger.error('Error deleting configuracao:', error);
        return false;
      }

      logger.debug(`Configuracao ${configId} deleted successfully`);
      return true;
    } catch (error) {
      logger.error('Error in deleteConfiguracao:', error);
      return false;
    }
  }
}

export const supabaseConfiguracoesService = new SupabaseConfiguracoesService();
