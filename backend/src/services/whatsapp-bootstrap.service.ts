import { EventEmitter } from 'events';
import { logger } from '../logger';
import { whatsappIntegrationService } from './whatsapp-integration.service';
import { supabaseWhatsAppService } from './supabase-whatsapp.service';
import { whatsappWatchdogService } from './whatsapp-watchdog.service';

export interface BootstrapStatus {
  isInitialized: boolean;
  supabaseConnected: boolean;
  integrationServiceRunning: boolean;
  watchdogRunning: boolean;
  errors: string[];
  startTime: Date;
}

export class WhatsAppBootstrapService extends EventEmitter {
  private isInitialized: boolean = false;
  private startTime: Date = new Date();
  private errors: string[] = [];

  constructor() {
    super();
  }

  /**
   * Inicializa todos os serviços do WhatsApp
   */
  async initialize(): Promise<BootstrapStatus> {
    try {
      logger.info('🚀 Inicializando serviços do WhatsApp...');
      this.startTime = new Date();
      this.errors = [];

      // 1. Verificar conexão com Supabase
      await this.initializeSupabase();

      // 2. Inicializar serviço de integração
      await this.initializeIntegrationService();

      // 3. Inicializar watchdog
      await this.initializeWatchdog();

      // 4. Configurar event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      
      const status = this.getStatus();
      logger.info('✅ Todos os serviços do WhatsApp inicializados com sucesso');
      this.emit('initialized', status);
      
      return status;
    } catch (error) {
      logger.error('❌ Erro ao inicializar serviços do WhatsApp:', error);
      this.errors.push(error.message);
      this.emit('initializationError', error);
      throw error;
    }
  }

  /**
   * Inicializa conexão com Supabase
   */
  private async initializeSupabase(): Promise<void> {
    try {
      logger.info('🔌 Verificando conexão com Supabase...');
      
      // Verificar se a conexão está funcionando
      const isHealthy = supabaseWhatsAppService.isHealthy();
      
      if (!isHealthy) {
        // Aguardar um pouco e tentar novamente
        await new Promise(resolve => setTimeout(resolve, 2000));
        const retryHealthy = supabaseWhatsAppService.isHealthy();
        
        if (!retryHealthy) {
          throw new Error('Falha na conexão com Supabase após retry');
        }
      }

      logger.info('✅ Conexão com Supabase estabelecida');
    } catch (error) {
      logger.error('❌ Erro ao conectar com Supabase:', error);
      this.errors.push(`Supabase: ${error.message}`);
      throw error;
    }
  }

  /**
   * Inicializa serviço de integração
   */
  private async initializeIntegrationService(): Promise<void> {
    try {
      logger.info('🔗 Inicializando serviço de integração WhatsApp...');
      
      // Iniciar o serviço de integração
      whatsappIntegrationService.start();
      
      // Verificar se está rodando
      if (!whatsappIntegrationService.isServiceRunning()) {
        throw new Error('Serviço de integração não iniciou corretamente');
      }

      logger.info('✅ Serviço de integração WhatsApp iniciado');
    } catch (error) {
      logger.error('❌ Erro ao inicializar serviço de integração:', error);
      this.errors.push(`Integração: ${error.message}`);
      throw error;
    }
  }

  /**
   * Inicializa watchdog
   */
  private async initializeWatchdog(): Promise<void> {
    try {
      logger.info('🐕 Inicializando watchdog...');
      
      // Iniciar o watchdog
      whatsappWatchdogService.start();
      
      // Verificar se está rodando
      if (!whatsappWatchdogService.isServiceRunning()) {
        throw new Error('Watchdog não iniciou corretamente');
      }

      logger.info('✅ Watchdog iniciado');
    } catch (error) {
      logger.error('❌ Erro ao inicializar watchdog:', error);
      this.errors.push(`Watchdog: ${error.message}`);
      throw error;
    }
  }

  /**
   * Configura event listeners
   */
  private setupEventListeners(): void {
    // Eventos do Supabase
    supabaseWhatsAppService.on('connected', () => {
      logger.info('🔌 Supabase reconectado');
      this.emit('supabaseReconnected');
    });

    supabaseWhatsAppService.on('disconnected', () => {
      logger.warn('⚠️ Supabase desconectado');
      this.emit('supabaseDisconnected');
    });

    supabaseWhatsAppService.on('maxReconnectAttemptsReached', () => {
      logger.error('❌ Máximo de tentativas de reconexão do Supabase atingido');
      this.emit('supabaseMaxReconnectAttempts');
    });

    // Eventos do serviço de integração
    whatsappIntegrationService.on('connected', (data) => {
      logger.info(`✅ Conexão WhatsApp estabelecida: ${data.connectionId}`);
      this.emit('whatsappConnected', data);
    });

    whatsappIntegrationService.on('disconnected', (data) => {
      logger.warn(`⚠️ Conexão WhatsApp perdida: ${data.connectionId}`);
      this.emit('whatsappDisconnected', data);
    });

    whatsappIntegrationService.on('messageReceived', (data) => {
      logger.info(`📨 Mensagem recebida: ${data.connectionId}`);
      this.emit('messageReceived', data);
    });

    whatsappIntegrationService.on('messageSent', (data) => {
      logger.info(`📤 Mensagem enviada: ${data.connectionId}`);
      this.emit('messageSent', data);
    });

    // Eventos do watchdog
    whatsappWatchdogService.on('connectionLost', (data) => {
      logger.warn(`⚠️ Watchdog detectou conexão perdida: ${data.connectionId}`);
      this.emit('connectionLost', data);
    });

    whatsappWatchdogService.on('supabaseOffline', () => {
      logger.error('❌ Watchdog detectou Supabase offline');
      this.emit('supabaseOffline');
    });

    whatsappWatchdogService.on('healthCheck', (stats) => {
      logger.debug('🔍 Health check executado:', stats);
      this.emit('healthCheck', stats);
    });

    logger.info('👂 Event listeners configurados');
  }

  /**
   * Cria uma conexão de teste
   */
  async createTestConnection(ownerId: string, companyId?: string): Promise<string> {
    try {
      const connectionId = `test-${Date.now()}`;
      const name = 'Conexão de Teste';

      logger.info(`🧪 Criando conexão de teste: ${connectionId}`);

      const result = await whatsappIntegrationService.createConnection(
        connectionId,
        name,
        ownerId,
        companyId
      );

      if (!result.success) {
        throw new Error(result.error || 'Falha ao criar conexão de teste');
      }

      logger.info(`✅ Conexão de teste criada: ${connectionId}`);
      return connectionId;
    } catch (error) {
      logger.error('❌ Erro ao criar conexão de teste:', error);
      throw error;
    }
  }

  /**
   * Executa teste completo do sistema
   */
  async runSystemTest(): Promise<{ success: boolean; results: any }> {
    try {
      logger.info('🧪 Executando teste completo do sistema...');
      
      const results = {
        supabase: false,
        integration: false,
        watchdog: false,
        messageQueue: false
      };

      // Teste 1: Supabase
      try {
        results.supabase = supabaseWhatsAppService.isHealthy();
        logger.info(`✅ Teste Supabase: ${results.supabase ? 'PASSOU' : 'FALHOU'}`);
      } catch (error) {
        logger.error('❌ Teste Supabase falhou:', error);
      }

      // Teste 2: Serviço de integração
      try {
        results.integration = whatsappIntegrationService.isServiceRunning();
        logger.info(`✅ Teste Integração: ${results.integration ? 'PASSOU' : 'FALHOU'}`);
      } catch (error) {
        logger.error('❌ Teste Integração falhou:', error);
      }

      // Teste 3: Watchdog
      try {
        results.watchdog = whatsappWatchdogService.isServiceRunning();
        logger.info(`✅ Teste Watchdog: ${results.watchdog ? 'PASSOU' : 'FALHOU'}`);
      } catch (error) {
        logger.error('❌ Teste Watchdog falhou:', error);
      }

      // Teste 4: Fila de mensagens
      try {
        const queueStats = supabaseWhatsAppService.getQueueStats();
        results.messageQueue = queueStats.pending >= 0; // Apenas verificar se consegue acessar
        logger.info(`✅ Teste Fila de Mensagens: ${results.messageQueue ? 'PASSOU' : 'FALHOU'}`);
      } catch (error) {
        logger.error('❌ Teste Fila de Mensagens falhou:', error);
      }

      const allPassed = Object.values(results).every(result => result === true);
      
      logger.info(`🧪 Teste completo: ${allPassed ? 'TODOS OS TESTES PASSARAM' : 'ALGUNS TESTES FALHARAM'}`);
      
      return {
        success: allPassed,
        results
      };
    } catch (error) {
      logger.error('❌ Erro durante teste do sistema:', error);
      return {
        success: false,
        results: { error: error.message }
      };
    }
  }

  /**
   * Obtém status atual
   */
  getStatus(): BootstrapStatus {
    return {
      isInitialized: this.isInitialized,
      supabaseConnected: supabaseWhatsAppService.isHealthy(),
      integrationServiceRunning: whatsappIntegrationService.isServiceRunning(),
      watchdogRunning: whatsappWatchdogService.isServiceRunning(),
      errors: [...this.errors],
      startTime: this.startTime
    };
  }

  /**
   * Para todos os serviços
   */
  async shutdown(): Promise<void> {
    try {
      logger.info('🛑 Parando todos os serviços do WhatsApp...');
      
      whatsappWatchdogService.stop();
      whatsappIntegrationService.stop();
      supabaseWhatsAppService.destroy();
      
      this.isInitialized = false;
      
      logger.info('✅ Todos os serviços parados');
      this.emit('shutdown');
    } catch (error) {
      logger.error('❌ Erro ao parar serviços:', error);
      throw error;
    }
  }

  /**
   * Reinicia todos os serviços
   */
  async restart(): Promise<void> {
    try {
      logger.info('🔄 Reiniciando todos os serviços...');
      
      await this.shutdown();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2 segundos
      await this.initialize();
      
      logger.info('✅ Todos os serviços reiniciados');
      this.emit('restarted');
    } catch (error) {
      logger.error('❌ Erro ao reiniciar serviços:', error);
      throw error;
    }
  }

  /**
   * Verifica se está inicializado
   */
  isInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Destrói o serviço
   */
  destroy(): void {
    this.shutdown();
    this.removeAllListeners();
    logger.info('💥 WhatsApp Bootstrap Service destruído');
  }
}

// Instância singleton
export const whatsappBootstrapService = new WhatsAppBootstrapService();
