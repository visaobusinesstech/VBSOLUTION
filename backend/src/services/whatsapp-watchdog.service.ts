import { EventEmitter } from 'events';
import { logger } from '../logger';
import { whatsappIntegrationService } from './whatsapp-integration.service';
import { supabaseWhatsAppService } from './supabase-whatsapp.service';

export interface WatchdogStats {
  isRunning: boolean;
  connectionsMonitored: number;
  lastHealthCheck: Date;
  supabaseHealthy: boolean;
  queueSize: number;
  uptime: number;
}

export class WhatsAppWatchdogService extends EventEmitter {
  private isRunning: boolean = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private connectionCheckInterval: NodeJS.Timeout | null = null;
  private startTime: Date = new Date();
  private lastHealthCheck: Date = new Date();

  constructor() {
    super();
  }

  /**
   * Inicia o watchdog
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('⚠️ Watchdog já está rodando');
      return;
    }

    this.isRunning = true;
    this.startTime = new Date();
    
    // Verificação de saúde geral a cada 30 segundos
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000);

    // Verificação de conexões a cada 60 segundos
    this.connectionCheckInterval = setInterval(() => {
      this.checkConnections();
    }, 60000);

    logger.info('🐕 WhatsApp Watchdog iniciado');
    this.emit('started');
  }

  /**
   * Para o watchdog
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }

    logger.info('🛑 WhatsApp Watchdog parado');
    this.emit('stopped');
  }

  /**
   * Executa verificação de saúde geral
   */
  private async performHealthCheck(): Promise<void> {
    try {
      this.lastHealthCheck = new Date();
      
      // Verificar saúde do Supabase
      const supabaseHealthy = supabaseWhatsAppService.isHealthy();
      const queueStats = supabaseWhatsAppService.getQueueStats();

      // Verificar se há mensagens na fila há muito tempo
      if (queueStats.pending > 0) {
        logger.warn(`⚠️ ${queueStats.pending} mensagens na fila do Supabase`);
        
        // Se há muitas mensagens na fila, tentar processar
        if (queueStats.pending > 10) {
          logger.info('🔄 Tentando processar fila de mensagens...');
          // O processamento da fila é automático no serviço Supabase
        }
      }

      // Verificar se o Supabase está offline há muito tempo
      if (!supabaseHealthy) {
        logger.error('❌ Supabase offline - tentando reconectar...');
        this.emit('supabaseOffline');
      }

      // Emitir estatísticas
      const stats = this.getStats();
      this.emit('healthCheck', stats);

      logger.debug('✅ Health check executado com sucesso');
    } catch (error) {
      logger.error('❌ Erro no health check:', error);
      this.emit('healthCheckError', error);
    }
  }

  /**
   * Verifica conexões WhatsApp
   */
  private async checkConnections(): Promise<void> {
    try {
      const connections = whatsappIntegrationService.getAllConnections();
      
      for (const connection of connections) {
        // Verificar se a conexão está ativa
        if (!connection.isConnected) {
          logger.warn(`⚠️ Conexão ${connection.id} desconectada`);
          this.emit('connectionLost', { connectionId: connection.id });
        }

        // Verificar se a última atividade foi há muito tempo
        if (connection.lastSeen) {
          const timeSinceLastSeen = Date.now() - connection.lastSeen.getTime();
          const maxInactiveTime = 5 * 60 * 1000; // 5 minutos

          if (timeSinceLastSeen > maxInactiveTime) {
            logger.warn(`⚠️ Conexão ${connection.id} inativa há ${Math.round(timeSinceLastSeen / 1000)}s`);
            this.emit('connectionInactive', { 
              connectionId: connection.id, 
              inactiveTime: timeSinceLastSeen 
            });
          }
        }
      }

      logger.debug(`🔍 Verificadas ${connections.length} conexões`);
    } catch (error) {
      logger.error('❌ Erro ao verificar conexões:', error);
      this.emit('connectionCheckError', error);
    }
  }

  /**
   * Força reconexão de uma conexão específica
   */
  async forceReconnect(connectionId: string): Promise<boolean> {
    try {
      logger.info(`🔄 Forçando reconexão da conexão ${connectionId}`);
      
      const connection = whatsappIntegrationService.getConnection(connectionId);
      if (!connection) {
        logger.error(`❌ Conexão ${connectionId} não encontrada`);
        return false;
      }

      // Remover conexão atual
      await whatsappIntegrationService.removeConnection(connectionId);
      
      // Aguardar um pouco antes de recriar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Recriar conexão
      const result = await whatsappIntegrationService.createConnection(
        connectionId,
        connection.name,
        connection.ownerId,
        connection.companyId
      );

      if (result.success) {
        logger.info(`✅ Conexão ${connectionId} recriada com sucesso`);
        this.emit('connectionReconnected', { connectionId });
        return true;
      } else {
        logger.error(`❌ Falha ao recriar conexão ${connectionId}: ${result.error}`);
        return false;
      }
    } catch (error) {
      logger.error(`❌ Erro ao forçar reconexão da conexão ${connectionId}:`, error);
      return false;
    }
  }

  /**
   * Limpa conexões órfãs
   */
  async cleanupOrphanedConnections(): Promise<number> {
    try {
      logger.info('🧹 Limpando conexões órfãs...');
      
      const connections = whatsappIntegrationService.getAllConnections();
      let cleanedCount = 0;

      for (const connection of connections) {
        // Se a conexão está desconectada há mais de 10 minutos, remove
        if (!connection.isConnected && connection.lastSeen) {
          const timeSinceLastSeen = Date.now() - connection.lastSeen.getTime();
          const maxOrphanTime = 10 * 60 * 1000; // 10 minutos

          if (timeSinceLastSeen > maxOrphanTime) {
            await whatsappIntegrationService.removeConnection(connection.id);
            cleanedCount++;
            logger.info(`🗑️ Conexão órfã removida: ${connection.id}`);
          }
        }
      }

      if (cleanedCount > 0) {
        logger.info(`✅ ${cleanedCount} conexões órfãs removidas`);
        this.emit('orphanedConnectionsCleaned', { count: cleanedCount });
      }

      return cleanedCount;
    } catch (error) {
      logger.error('❌ Erro ao limpar conexões órfãs:', error);
      return 0;
    }
  }

  /**
   * Obtém estatísticas do watchdog
   */
  getStats(): WatchdogStats {
    const connections = whatsappIntegrationService.getAllConnections();
    const supabaseHealthy = supabaseWhatsAppService.isHealthy();
    const queueStats = supabaseWhatsAppService.getQueueStats();
    const uptime = Date.now() - this.startTime.getTime();

    return {
      isRunning: this.isRunning,
      connectionsMonitored: connections.length,
      lastHealthCheck: this.lastHealthCheck,
      supabaseHealthy,
      queueSize: queueStats.pending,
      uptime
    };
  }

  /**
   * Verifica se está rodando
   */
  isServiceRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Executa limpeza manual
   */
  async performCleanup(): Promise<void> {
    logger.info('🧹 Executando limpeza manual...');
    
    const cleanedCount = await this.cleanupOrphanedConnections();
    
    // Limpar fila de mensagens se estiver muito grande
    const queueStats = supabaseWhatsAppService.getQueueStats();
    if (queueStats.pending > 100) {
      logger.warn('⚠️ Fila de mensagens muito grande, limpando...');
      supabaseWhatsAppService.clearQueue();
    }

    logger.info(`✅ Limpeza manual concluída - ${cleanedCount} conexões removidas`);
    this.emit('manualCleanupCompleted', { cleanedCount });
  }

  /**
   * Reinicia todas as conexões
   */
  async restartAllConnections(): Promise<void> {
    logger.info('🔄 Reiniciando todas as conexões...');
    
    const connections = whatsappIntegrationService.getAllConnections();
    const results = await Promise.allSettled(
      connections.map(conn => this.forceReconnect(conn.id))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - successful;

    logger.info(`✅ Reinicialização concluída - ${successful} sucessos, ${failed} falhas`);
    this.emit('allConnectionsRestarted', { successful, failed });
  }

  /**
   * Destrói o watchdog
   */
  destroy(): void {
    this.stop();
    this.removeAllListeners();
    logger.info('💥 WhatsApp Watchdog destruído');
  }
}

// Instância singleton
export const whatsappWatchdogService = new WhatsAppWatchdogService();
