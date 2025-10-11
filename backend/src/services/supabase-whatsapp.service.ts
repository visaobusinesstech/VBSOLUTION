import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EventEmitter } from 'events';
import { logger } from '../logger';

export interface WhatsAppMessage {
  id: string;
  owner_id: string;
  atendimento_id: string;
  conteudo: string;
  tipo: 'TEXTO' | 'IMAGEM' | 'VIDEO' | 'AUDIO' | 'DOCUMENTO' | 'STICKER' | 'SISTEMA';
  remetente: 'CLIENTE' | 'ATENDENTE' | 'SISTEMA';
  timestamp: Date;
  lida: boolean;
  midia_url?: string;
  midia_tipo?: string;
  midia_nome?: string;
  midia_tamanho?: number;
  created_at?: Date;
}

export interface WhatsAppAtendimento {
  id: string;
  owner_id: string;
  company_id?: string;
  numero_cliente: string;
  nome_cliente?: string;
  status: 'AGUARDANDO' | 'EM_ATENDIMENTO' | 'FINALIZADO' | 'CANCELADO';
  data_inicio: Date;
  data_fim?: Date;
  ultima_mensagem: Date;
  atendente_id?: string;
  prioridade: number;
  tags?: any;
  observacoes?: string;
  canal: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface WhatsAppSession {
  id: string;
  owner_id: string;
  session_name: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  qr_code?: string;
  connected_at?: Date;
  disconnected_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface WhatsAppConfiguracao {
  id: string;
  owner_id: string;
  company_id?: string;
  nome: string;
  mensagem_boas_vindas: string;
  mensagem_menu: string;
  mensagem_despedida: string;
  tempo_resposta: number;
  max_tentativas: number;
  ativo: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class SupabaseWhatsAppService extends EventEmitter {
  private supabase: SupabaseClient;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectInterval: number = 5000; // 5 segundos
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private messageQueue: WhatsAppMessage[] = [];
  private isProcessingQueue: boolean = false;

  constructor() {
    super();
    
    const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://placeholder.supabase.co') {
      console.warn('⚠️  SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configurados. Usando valores padrão para desenvolvimento.');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    });

    this.startHealthCheck();
    this.startQueueProcessor();
  }

  /**
   * Inicia o monitoramento de saúde da conexão
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkConnection();
      } catch (error) {
        logger.error('Erro no health check:', error);
        this.handleConnectionError();
      }
    }, 30000); // Verifica a cada 30 segundos
  }

  /**
   * Verifica se a conexão está funcionando
   */
  private async checkConnection(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('whatsapp_sessions')
        .select('id')
        .limit(1);

      if (error) {
        throw error;
      }

      if (!this.isConnected) {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
        logger.info('✅ Conexão com Supabase restaurada');
      }

      return true;
    } catch (error) {
      logger.error('❌ Falha na verificação de conexão:', error);
      this.handleConnectionError();
      return false;
    }
  }

  /**
   * Trata erros de conexão e tenta reconectar
   */
  private handleConnectionError(): void {
    if (this.isConnected) {
      this.isConnected = false;
      this.emit('disconnected');
      logger.warn('⚠️ Conexão com Supabase perdida');
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      logger.info(`🔄 Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.checkConnection();
      }, this.reconnectInterval);
    } else {
      logger.error('❌ Máximo de tentativas de reconexão atingido');
      this.emit('maxReconnectAttemptsReached');
    }
  }

  /**
   * Processa a fila de mensagens em caso de falha de conexão
   */
  private startQueueProcessor(): void {
    setInterval(async () => {
      if (this.messageQueue.length > 0 && this.isConnected && !this.isProcessingQueue) {
        this.isProcessingQueue = true;
        await this.processMessageQueue();
        this.isProcessingQueue = false;
      }
    }, 10000); // Processa a cada 10 segundos
  }

  /**
   * Processa todas as mensagens na fila
   */
  private async processMessageQueue(): Promise<void> {
    const messages = [...this.messageQueue];
    this.messageQueue = [];

    for (const message of messages) {
      try {
        await this.saveMessage(message);
        logger.info(`✅ Mensagem processada da fila: ${message.id}`);
      } catch (error) {
        logger.error(`❌ Erro ao processar mensagem da fila: ${message.id}`, error);
        // Recoloca a mensagem na fila se falhar
        this.messageQueue.push(message);
      }
    }
  }

  /**
   * Salva uma mensagem no Supabase com retry automático
   */
  async saveMessage(message: WhatsAppMessage): Promise<void> {
    try {
      if (!this.isConnected) {
        // Adiciona à fila se não estiver conectado
        this.messageQueue.push(message);
        logger.warn(`⚠️ Mensagem adicionada à fila (conexão offline): ${message.id}`);
        return;
      }

      const { error } = await this.supabase
        .from('whatsapp_mensagens')
        .insert({
          id: message.id,
          owner_id: message.owner_id,
          atendimento_id: message.atendimento_id,
          conteudo: message.conteudo,
          tipo: message.tipo,
          remetente: message.remetente,
          timestamp: message.timestamp.toISOString(),
          lida: message.lida,
          midia_url: message.midia_url,
          midia_tipo: message.midia_tipo,
          midia_nome: message.midia_nome,
          midia_tamanho: message.midia_tamanho
        });

      if (error) {
        throw error;
      }

      logger.info(`✅ Mensagem salva no Supabase: ${message.id}`);
      this.emit('messageSaved', message);
    } catch (error) {
      logger.error(`❌ Erro ao salvar mensagem: ${message.id}`, error);
      
      // Adiciona à fila para retry posterior
      this.messageQueue.push(message);
      throw error;
    }
  }

  /**
   * Cria ou atualiza um atendimento
   */
  async saveAtendimento(atendimento: WhatsAppAtendimento): Promise<void> {
    try {
      if (!this.isConnected) {
        logger.warn('⚠️ Conexão offline, não é possível salvar atendimento');
        return;
      }

      const { error } = await this.supabase
        .from('whatsapp_atendimentos')
        .upsert({
          id: atendimento.id,
          owner_id: atendimento.owner_id,
          company_id: atendimento.company_id,
          numero_cliente: atendimento.numero_cliente,
          nome_cliente: atendimento.nome_cliente,
          status: atendimento.status,
          data_inicio: atendimento.data_inicio.toISOString(),
          data_fim: atendimento.data_fim?.toISOString(),
          ultima_mensagem: atendimento.ultima_mensagem.toISOString(),
          atendente_id: atendimento.atendente_id,
          prioridade: atendimento.prioridade,
          tags: atendimento.tags,
          observacoes: atendimento.observacoes,
          canal: atendimento.canal
        }, {
          onConflict: 'id'
        });

      if (error) {
        throw error;
      }

      logger.info(`✅ Atendimento salvo no Supabase: ${atendimento.id}`);
      this.emit('atendimentoSaved', atendimento);
    } catch (error) {
      logger.error(`❌ Erro ao salvar atendimento: ${atendimento.id}`, error);
      throw error;
    }
  }

  /**
   * Cria ou atualiza uma sessão WhatsApp
   */
  async saveSession(session: WhatsAppSession): Promise<void> {
    try {
      if (!this.isConnected) {
        logger.warn('⚠️ Conexão offline, não é possível salvar sessão');
        return;
      }

      const { error } = await this.supabase
        .from('whatsapp_sessions')
        .upsert({
          id: session.id,
          owner_id: session.owner_id,
          session_name: session.session_name,
          status: session.status,
          qr_code: session.qr_code,
          connected_at: session.connected_at?.toISOString(),
          disconnected_at: session.disconnected_at?.toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        throw error;
      }

      logger.info(`✅ Sessão salva no Supabase: ${session.id}`);
      this.emit('sessionSaved', session);
    } catch (error) {
      logger.error(`❌ Erro ao salvar sessão: ${session.id}`, error);
      throw error;
    }
  }

  /**
   * Cria ou atualiza configurações do WhatsApp
   */
  async saveConfiguracao(configuracao: WhatsAppConfiguracao): Promise<void> {
    try {
      if (!this.isConnected) {
        logger.warn('⚠️ Conexão offline, não é possível salvar configuração');
        return;
      }

      const { error } = await this.supabase
        .from('whatsapp_configuracoes')
        .upsert({
          id: configuracao.id,
          owner_id: configuracao.owner_id,
          company_id: configuracao.company_id,
          nome: configuracao.nome,
          mensagem_boas_vindas: configuracao.mensagem_boas_vindas,
          mensagem_menu: configuracao.mensagem_menu,
          mensagem_despedida: configuracao.mensagem_despedida,
          tempo_resposta: configuracao.tempo_resposta,
          max_tentativas: configuracao.max_tentativas,
          ativo: configuracao.ativo
        }, {
          onConflict: 'id'
        });

      if (error) {
        throw error;
      }

      logger.info(`✅ Configuração salva no Supabase: ${configuracao.id}`);
      this.emit('configuracaoSaved', configuracao);
    } catch (error) {
      logger.error(`❌ Erro ao salvar configuração: ${configuracao.id}`, error);
      throw error;
    }
  }

  /**
   * Busca mensagens de um atendimento
   */
  async getMessages(atendimentoId: string, ownerId: string, limit: number = 50, offset: number = 0): Promise<WhatsAppMessage[]> {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_mensagens')
        .select('*')
        .eq('atendimento_id', atendimentoId)
        .eq('owner_id', ownerId)
        .order('timestamp', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error(`❌ Erro ao buscar mensagens: ${atendimentoId}`, error);
      throw error;
    }
  }

  /**
   * Busca atendimentos ativos
   */
  async getActiveAtendimentos(ownerId: string, companyId?: string): Promise<WhatsAppAtendimento[]> {
    try {
      let query = this.supabase
        .from('whatsapp_atendimentos')
        .select('*')
        .eq('owner_id', ownerId)
        .in('status', ['AGUARDANDO', 'EM_ATENDIMENTO'])
        .order('ultima_mensagem', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error(`❌ Erro ao buscar atendimentos ativos`, error);
      throw error;
    }
  }

  /**
   * Busca sessões ativas
   */
  async getActiveSessions(ownerId: string): Promise<WhatsAppSession[]> {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_sessions')
        .select('*')
        .eq('owner_id', ownerId)
        .in('status', ['connected', 'connecting'])
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error(`❌ Erro ao buscar sessões ativas`, error);
      throw error;
    }
  }

  /**
   * Verifica se está conectado
   */
  isHealthy(): boolean {
    return this.isConnected;
  }

  /**
   * Retorna estatísticas da fila
   */
  getQueueStats(): { pending: number; isProcessing: boolean } {
    return {
      pending: this.messageQueue.length,
      isProcessing: this.isProcessingQueue
    };
  }

  /**
   * Limpa a fila de mensagens
   */
  clearQueue(): void {
    this.messageQueue = [];
    logger.info('🧹 Fila de mensagens limpa');
  }

  /**
   * Destrói o serviço e limpa recursos
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.removeAllListeners();
    logger.info('🔌 Serviço Supabase WhatsApp destruído');
  }
}

// Instância singleton
export const supabaseWhatsAppService = new SupabaseWhatsAppService();
