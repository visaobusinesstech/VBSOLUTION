import Redis from 'ioredis';
import { Queue, Job } from 'bullmq';
import { INTEGRATIONS_CONFIG } from '../config/integrations.config';

interface BufferedMessage {
  id: string;
  text: string;
  timestamp: number;
  contactId: string;
  ownerId: string;
  connectionId: string;
  chatId: string;
  messageType: string;
  mediaUrl?: string;
  caption?: string;
}

interface ProcessedResponse {
  chunks: string[];
  totalLength: number;
  processedAt: number;
}

export class MessageBufferService {
  private redis: Redis;
  private messageQueue: Queue;
  private readonly DEBOUNCE_TIME = 30000; // 30 segundos
  private readonly MAX_CHUNK_SIZE = 300; // 300 caracteres máximo por chunk
  private readonly MAX_DELAY_SAFE = 2147483647; // 2^31 - 1 (máximo seguro para setTimeout)

  constructor() {
    // Configurar Redis com configurações seguras
    this.redis = new Redis({
      host: INTEGRATIONS_CONFIG.REDIS.HOST,
      port: INTEGRATIONS_CONFIG.REDIS.PORT,
      password: INTEGRATIONS_CONFIG.REDIS.PASSWORD,
      username: INTEGRATIONS_CONFIG.REDIS.USERNAME,
      connectTimeout: 60000,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxLoadingTimeout: 60000
    });

    // Configurar BullMQ com configurações seguras
    this.messageQueue = new Queue('message-buffer', {
      connection: {
        host: INTEGRATIONS_CONFIG.REDIS.HOST,
        port: INTEGRATIONS_CONFIG.REDIS.PORT,
        password: INTEGRATIONS_CONFIG.REDIS.PASSWORD,
        username: INTEGRATIONS_CONFIG.REDIS.USERNAME,
        connectTimeout: 60000,
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxLoadingTimeout: 60000
      },
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    });
  }

  /**
   * Adiciona uma mensagem ao buffer de debounce
   */
  async addMessage(message: BufferedMessage): Promise<void> {
    const bufferKey = `message_buffer:${message.contactId}:${message.ownerId}`;
    
    try {
      // Adicionar mensagem ao buffer Redis
      await this.redis.lpush(bufferKey, JSON.stringify(message));
      
      // Definir TTL para o buffer (30 segundos + 10 segundos de margem)
      await this.redis.expire(bufferKey, 40);
      
      // Verificar se é a primeira mensagem
      const bufferSize = await this.redis.llen(bufferKey);
      
      if (bufferSize === 1) {
        // Primeira mensagem - agendar processamento após debounce
        console.log('🔄 Primeira mensagem detectada, agendando processamento...');
        
        const jobId = `buffer_${message.contactId}_${message.ownerId}`;
        
        // Cancelar job anterior se existir
        await this.cancelExistingJob(jobId);
        
        // Agendar novo job com delay seguro
        const safeDelay = Math.min(this.DEBOUNCE_TIME, this.MAX_DELAY_SAFE);
        
        await this.messageQueue.add('process-buffered-messages', {
          contactId: message.contactId,
          ownerId: message.ownerId,
          bufferKey: bufferKey
        }, {
          delay: safeDelay,
          jobId: jobId
        });
        
        console.log(`⏰ Job de processamento agendado para ${safeDelay}ms`);
      } else {
        console.log(`📦 Mensagem ${bufferSize} adicionada ao buffer`);
      }
      
    } catch (error) {
      console.error('❌ Erro ao adicionar mensagem ao buffer:', error);
      throw error;
    }
  }

  /**
   * Cancela job existente se houver
   */
  private async cancelExistingJob(jobId: string): Promise<void> {
    try {
      const existingJobs = await this.messageQueue.getJobs(['delayed', 'waiting'], 0, -1);
      
      for (const job of existingJobs) {
        if (job.id === jobId) {
          await job.remove();
          console.log('🔄 Job anterior cancelado:', jobId);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao cancelar job existente:', error);
    }
  }

  /**
   * Processa todas as mensagens do buffer após o debounce
   */
  async processBufferedMessages(job: Job): Promise<void> {
    const { contactId, ownerId, bufferKey } = job.data;
    
    try {
      console.log(`🔄 Processando buffer para ${contactId}...`);
      
      // Recuperar todas as mensagens do buffer
      const rawMessages = await this.redis.lrange(bufferKey, 0, -1);
      
      if (rawMessages.length === 0) {
        console.log('⚠️ Buffer vazio, pulando processamento');
        return;
      }

      // Parse das mensagens
      const messages: BufferedMessage[] = rawMessages
        .map(msg => JSON.parse(msg))
        .sort((a, b) => a.timestamp - b.timestamp);

      console.log(`📦 ${messages.length} mensagens encontradas no buffer`);

      // Combinar todas as mensagens em um contexto único
      const combinedContext = this.combineMessages(messages);
      
      // Processar com AI Agent
      const aiResponse = await this.processWithAIAgent(combinedContext, contactId, ownerId);
      
      if (!aiResponse) {
        console.log('⚠️ Resposta do AI Agent vazia');
        return;
      }
      
      // Chunkar a resposta
      const chunkedResponse = this.chunkResponse(aiResponse);
      
      // Enviar chunks via WhatsApp
      await this.sendChunkedResponse(chunkedResponse, messages[0]);
      
      // Limpar buffer
      await this.redis.del(bufferKey);
      console.log('🧹 Buffer limpo');
      
    } catch (error) {
      console.error('❌ Erro ao processar mensagens do buffer:', error);
      throw error;
    }
  }

  /**
   * Combina mensagens em um contexto único
   */
  private combineMessages(messages: BufferedMessage[]): string {
    const contextParts: string[] = [];
    
    for (const message of messages) {
      let messageText = '';
      
      switch (message.messageType) {
        case 'AUDIO':
          messageText = `[Áudio]: ${message.text}`;
          break;
        case 'IMAGEM':
          messageText = `[Imagem]${message.caption ? ': ' + message.caption : ''}`;
          break;
        case 'TEXTO':
        default:
          messageText = message.text;
          break;
      }
      
      if (messageText.trim()) {
        contextParts.push(messageText);
      }
    }
    
    return contextParts.join(' ');
  }

  /**
   * Processa texto com AI Agent
   */
  private async processWithAIAgent(text: string, contactId: string, ownerId: string): Promise<string | null> {
    try {
      console.log('🤖 Enviando para AI Agent...');
      
      // Carregar configuração do agente
      const { loadAgentConfig } = require('../ai/loadAgentConfig');
      const { buildSystemMessage } = require('../ai/buildPrompt');
      const { infer } = require('../ai/infer');
      
      const agentConfig = await loadAgentConfig(ownerId);
      
      if (!agentConfig || !agentConfig.openaiApiKey) {
        console.log('❌ Configuração do AI Agent não encontrada');
        return null;
      }
      
      // Construir prompt para o agente
      const systemMessage = buildSystemMessage(agentConfig);
      const userMessage = {
        role: 'user',
        content: text
      };
      
      // Chamar o agente
      const aiResponse = await infer.generateResponse(
        [systemMessage, userMessage],
        agentConfig
      );
      
      if (!aiResponse || !aiResponse.content) {
        console.log('⚠️ Resposta do AI Agent vazia');
        return null;
      }
      
      console.log('✅ Resposta do AI Agent recebida');
      return aiResponse.content;
      
    } catch (error) {
      console.error('❌ Erro ao processar com AI Agent:', error);
      return null;
    }
  }

  /**
   * Chunkar resposta em pedaços de 300 caracteres
   */
  private chunkResponse(response: string): ProcessedResponse {
    const chunks: string[] = [];
    let currentChunk = '';
    
    const words = response.split(' ');
    
    for (const word of words) {
      const testChunk = currentChunk + (currentChunk ? ' ' : '') + word;
      
      if (testChunk.length <= this.MAX_CHUNK_SIZE) {
        currentChunk = testChunk;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = word;
        } else {
          // Palavra muito longa - forçar chunk
          chunks.push(word.substring(0, this.MAX_CHUNK_SIZE));
          currentChunk = word.substring(this.MAX_CHUNK_SIZE);
        }
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return {
      chunks,
      totalLength: response.length,
      processedAt: Date.now()
    };
  }

  /**
   * Enviar resposta chunkada via WhatsApp
   */
  private async sendChunkedResponse(response: ProcessedResponse, originalMessage: BufferedMessage): Promise<void> {
    try {
      console.log(`📤 Enviando ${response.chunks.length} chunks...`);
      
      const { sendMessage } = require('../wa/sendMessage');
      const { supabase } = require('../supabaseClient');
      
      for (let i = 0; i < response.chunks.length; i++) {
        const chunk = response.chunks[i];
        
        console.log(`📤 Enviando chunk ${i + 1}/${response.chunks.length}...`);
        
        // Enviar via WhatsApp
        const sendResult = await sendMessage({
          connectionId: originalMessage.connectionId,
          chatId: originalMessage.chatId,
          text: chunk
        });
        
        if (sendResult.success) {
          console.log(`✅ Chunk ${i + 1} enviado com sucesso`);
          
          // Salvar no banco de dados
          await supabase
            .from('whatsapp_mensagens')
            .insert([{
              owner_id: originalMessage.ownerId,
              chat_id: originalMessage.chatId,
              connection_id: originalMessage.connectionId,
              message_type: 'TEXTO',
              remetente: 'AI',
              conteudo: chunk,
              status: 'AI',
              lida: true,
              timestamp: new Date().toISOString(),
              message_id: `ai_chunk_${Date.now()}_${i + 1}`,
              atendimento_id: `ai_${Date.now()}`,
              wa_msg_id: sendResult.messageId,
              chunk_sequence: i + 1,
              chunk_total: response.chunks.length
            }]);
          
        } else {
          console.error(`❌ Erro ao enviar chunk ${i + 1}:`, sendResult.error);
        }
        
        // Delay de 3 segundos entre chunks (exceto no último)
        if (i < response.chunks.length - 1) {
          console.log('⏳ Aguardando 3 segundos antes do próximo chunk...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      console.log('🎉 Todos os chunks enviados com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao enviar chunks:', error);
      throw error;
    }
  }

  /**
   * Verificar se há mensagens pendentes para um contato
   */
  async hasPendingMessages(contactId: string, ownerId: string): Promise<boolean> {
    const key = `message_buffer:${contactId}:${ownerId}`;
    const count = await this.redis.llen(key);
    return count > 0;
  }

  /**
   * Limpar buffer de mensagens para um contato
   */
  async clearBuffer(contactId: string, ownerId: string): Promise<void> {
    const key = `message_buffer:${contactId}:${ownerId}`;
    await this.redis.del(key);
    
    // Cancelar job pendente
    const jobId = `buffer_${contactId}_${ownerId}`;
    await this.cancelExistingJob(jobId);
  }

  /**
   * Obter instância da queue para o worker
   */
  getQueue(): Queue {
    return this.messageQueue;
  }

  /**
   * Fechar conexões
   */
  async disconnect(): Promise<void> {
    await this.redis.disconnect();
    await this.messageQueue.close();
  }
}

export default MessageBufferService;
