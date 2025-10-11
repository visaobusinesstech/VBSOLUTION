import Redis from 'ioredis';
import { supabase } from '../supabaseClient';
import { INTEGRATIONS_CONFIG } from '../config/integrations.config';

export interface BatchedMessage {
  id: string;
  chatId: string;
  ownerId: string;
  connectionId: string;
  messages: Array<{
    id: string;
    content: string;
    messageType: string;
    mediaUrl?: string;
    timestamp: string;
  }>;
  createdAt: string;
  lastMessageAt: string;
  status: 'waiting' | 'processing' | 'completed' | 'expired';
}

export interface MessageBatchConfig {
  enabled: boolean;
  waitTimeSeconds: number; // Tempo de espera em segundos
  maxMessages: number; // Máximo de mensagens por batch
  maxWaitTime: number; // Tempo máximo de espera em segundos
}

export class MessageBatchingService {
  private redis: Redis;
  private config: MessageBatchConfig;

  constructor(redisUrl?: string, config?: MessageBatchConfig) {
    // Usar configuração do Redis Cloud se não fornecida
    const finalRedisUrl = redisUrl || INTEGRATIONS_CONFIG.REDIS.URL;
    const finalConfig = config || {
      enabled: true,
      waitTimeSeconds: 30,
      maxMessages: 5,
      maxWaitTime: 300
    };

    this.redis = new Redis(finalRedisUrl, {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    this.config = finalConfig;
  }

  /**
   * Adiciona uma mensagem ao batch ou processa imediatamente
   */
  async addMessage(messageData: {
    id: string;
    chatId: string;
    ownerId: string;
    connectionId: string;
    content: string;
    messageType: string;
    mediaUrl?: string;
    timestamp: string;
  }): Promise<{ shouldProcess: boolean; batchId?: string }> {
    
    if (!this.config.enabled) {
      return { shouldProcess: true };
    }

    const batchKey = `message_batch:${messageData.ownerId}:${messageData.chatId}`;
    
    try {
      // Verificar se já existe um batch ativo
      const existingBatch = await this.redis.get(batchKey);
      
      if (existingBatch) {
        const batch: BatchedMessage = JSON.parse(existingBatch);
        
        // Adicionar mensagem ao batch existente
        batch.messages.push({
          id: messageData.id,
          content: messageData.content,
          messageType: messageData.messageType,
          mediaUrl: messageData.mediaUrl,
          timestamp: messageData.timestamp
        });
        
        batch.lastMessageAt = messageData.timestamp;
        
        // Verificar se deve processar o batch
        const shouldProcess = this.shouldProcessBatch(batch);
        
        if (shouldProcess) {
          batch.status = 'processing';
          await this.redis.del(batchKey);
          await this.processBatch(batch);
          return { shouldProcess: false, batchId: batch.id };
        } else {
          // Atualizar batch no Redis
          await this.redis.setex(batchKey, this.config.maxWaitTime, JSON.stringify(batch));
          return { shouldProcess: false, batchId: batch.id };
        }
      } else {
        // Criar novo batch
        const newBatch: BatchedMessage = {
          id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          chatId: messageData.chatId,
          ownerId: messageData.ownerId,
          connectionId: messageData.connectionId,
          messages: [{
            id: messageData.id,
            content: messageData.content,
            messageType: messageData.messageType,
            mediaUrl: messageData.mediaUrl,
            timestamp: messageData.timestamp
          }],
          createdAt: messageData.timestamp,
          lastMessageAt: messageData.timestamp,
          status: 'waiting'
        };
        
        // Salvar no Redis com TTL
        await this.redis.setex(batchKey, this.config.maxWaitTime, JSON.stringify(newBatch));
        
        // Agendar processamento após waitTimeSeconds
        setTimeout(async () => {
          await this.checkAndProcessBatch(batchKey);
        }, this.config.waitTimeSeconds * 1000);
        
        return { shouldProcess: false, batchId: newBatch.id };
      }
    } catch (error) {
      console.error('❌ Erro no batching de mensagens:', error);
      // Em caso de erro, processar imediatamente
      return { shouldProcess: true };
    }
  }

  /**
   * Verifica se deve processar o batch
   */
  private shouldProcessBatch(batch: BatchedMessage): boolean {
    // Processar se atingiu o máximo de mensagens
    if (batch.messages.length >= this.config.maxMessages) {
      return true;
    }
    
    // Processar se passou do tempo de espera
    const lastMessageTime = new Date(batch.lastMessageAt).getTime();
    const now = Date.now();
    const timeSinceLastMessage = (now - lastMessageTime) / 1000;
    
    if (timeSinceLastMessage >= this.config.waitTimeSeconds) {
      return true;
    }
    
    return false;
  }

  /**
   * Verifica e processa um batch se necessário
   */
  private async checkAndProcessBatch(batchKey: string): Promise<void> {
    try {
      const batchData = await this.redis.get(batchKey);
      if (!batchData) return;
      
      const batch: BatchedMessage = JSON.parse(batchData);
      
      if (this.shouldProcessBatch(batch)) {
        batch.status = 'processing';
        await this.redis.del(batchKey);
        await this.processBatch(batch);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar batch:', error);
    }
  }

  /**
   * Processa um batch de mensagens
   */
  private async processBatch(batch: BatchedMessage): Promise<void> {
    try {
      console.log(`🔄 Processando batch ${batch.id} com ${batch.messages.length} mensagens`);
      
      // Combinar todas as mensagens em um contexto
      const combinedContent = this.combineMessages(batch.messages);
      
      // Salvar batch processado no banco
      await this.saveBatchToDatabase(batch, combinedContent);
      
      // Aqui você pode chamar o AI Agent com o contexto combinado
      // await this.processWithAI(batch, combinedContent);
      
      console.log(`✅ Batch ${batch.id} processado com sucesso`);
    } catch (error) {
      console.error('❌ Erro ao processar batch:', error);
    }
  }

  /**
   * Combina mensagens em um contexto único
   */
  private combineMessages(messages: BatchedMessage['messages']): string {
    const contextMessages = messages.map((msg, index) => {
      let content = msg.content;
      
      if (msg.messageType === 'AUDIO') {
        content = `[Áudio ${index + 1}] ${msg.content}`;
      } else if (msg.messageType === 'IMAGEM') {
        content = `[Imagem ${index + 1}] ${msg.content}`;
      }
      
      return `Mensagem ${index + 1}: ${content}`;
    });
    
    return contextMessages.join('\n\n');
  }

  /**
   * Salva o batch processado no banco de dados
   */
  private async saveBatchToDatabase(batch: BatchedMessage, combinedContent: string): Promise<void> {
    try {
      // Salvar informações do batch
      const { error: batchError } = await supabase
        .from('whatsapp_message_batches')
        .insert({
          id: batch.id,
          owner_id: batch.ownerId,
          chat_id: batch.chatId,
          connection_id: batch.connectionId,
          message_count: batch.messages.length,
          combined_content: combinedContent,
          status: batch.status,
          created_at: batch.createdAt,
          processed_at: new Date().toISOString()
        });

      if (batchError) {
        console.error('❌ Erro ao salvar batch:', batchError);
      }

      // Marcar mensagens individuais como processadas em batch
      for (const message of batch.messages) {
        await supabase
          .from('whatsapp_mensagens')
          .update({
            batch_id: batch.id,
            batch_processed: true
          })
          .eq('id', message.id);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar batch no banco:', error);
    }
  }

  /**
   * Obtém estatísticas de batching
   */
  async getBatchingStats(ownerId: string): Promise<{
    activeBatches: number;
    totalProcessed: number;
    averageBatchSize: number;
  }> {
    try {
      // Contar batches ativos no Redis
      const keys = await this.redis.keys(`message_batch:${ownerId}:*`);
      const activeBatches = keys.length;
      
      // Buscar estatísticas do banco
      const { data: stats } = await supabase
        .from('whatsapp_message_batches')
        .select('message_count')
        .eq('owner_id', ownerId)
        .eq('status', 'completed');
      
      const totalProcessed = stats?.length || 0;
      const averageBatchSize = stats?.length > 0 
        ? stats.reduce((sum, batch) => sum + batch.message_count, 0) / stats.length 
        : 0;
      
      return {
        activeBatches,
        totalProcessed,
        averageBatchSize: Math.round(averageBatchSize * 100) / 100
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return { activeBatches: 0, totalProcessed: 0, averageBatchSize: 0 };
    }
  }

  /**
   * Limpa batches expirados
   */
  async cleanupExpiredBatches(): Promise<void> {
    try {
      const keys = await this.redis.keys('message_batch:*');
      const now = Date.now();
      
      for (const key of keys) {
        const batchData = await this.redis.get(key);
        if (batchData) {
          const batch: BatchedMessage = JSON.parse(batchData);
          const batchAge = (now - new Date(batch.createdAt).getTime()) / 1000;
          
          if (batchAge > this.config.maxWaitTime) {
            await this.redis.del(key);
            console.log(`🧹 Batch expirado removido: ${batch.id}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao limpar batches expirados:', error);
    }
  }

  /**
   * Fecha conexão Redis
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

export default MessageBatchingService;
