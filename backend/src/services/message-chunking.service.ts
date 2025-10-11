import Redis from 'ioredis';

interface MessageChunk {
  id: string;
  text: string;
  timestamp: number;
  contactId: string;
  ownerId: string;
}

interface ChunkedResponse {
  chunks: string[];
  totalLength: number;
  processedAt: number;
}

export class MessageChunkingService {
  private redis: Redis;
  private readonly DEBOUNCE_TIME = 30000; // 30 segundos
  private readonly MAX_CHUNK_SIZE = 200; // 200 caracteres máximo por chunk

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });
  }

  /**
   * Adiciona uma mensagem ao buffer de debounce
   */
  async addMessage(message: MessageChunk): Promise<void> {
    const key = `message_buffer:${message.contactId}:${message.ownerId}`;
    
    // Adicionar mensagem ao buffer
    await this.redis.lpush(key, JSON.stringify(message));
    
    // Definir TTL para o buffer (30 segundos + 5 segundos de margem)
    await this.redis.expire(key, 35);
    
    // Agendar processamento se for a primeira mensagem
    const bufferSize = await this.redis.llen(key);
    if (bufferSize === 1) {
      // Primeira mensagem - agendar processamento após debounce
      setTimeout(() => {
        this.processMessages(message.contactId, message.ownerId);
      }, this.DEBOUNCE_TIME);
    }
  }

  /**
   * Processa todas as mensagens do buffer após o debounce
   */
  private async processMessages(contactId: string, ownerId: string): Promise<void> {
    const key = `message_buffer:${contactId}:${ownerId}`;
    
    try {
      // Recuperar todas as mensagens do buffer
      const messages = await this.redis.lrange(key, 0, -1);
      
      if (messages.length === 0) {
        return;
      }

      // Parse das mensagens
      const parsedMessages: MessageChunk[] = messages
        .map(msg => JSON.parse(msg))
        .sort((a, b) => a.timestamp - b.timestamp);

      // Combinar todas as mensagens em um texto único
      const combinedText = parsedMessages
        .map(msg => msg.text)
        .join(' ');

      // Processar com AI Agent
      const response = await this.processWithAIAgent(combinedText, contactId, ownerId);
      
      // Chunkar a resposta
      const chunkedResponse = this.chunkResponse(response);
      
      // Enviar chunks via WhatsApp
      await this.sendChunkedResponse(chunkedResponse, contactId, ownerId);
      
      // Limpar buffer
      await this.redis.del(key);
      
    } catch (error) {
      console.error('Erro ao processar mensagens:', error);
    }
  }

  /**
   * Processa texto com AI Agent
   */
  private async processWithAIAgent(text: string, contactId: string, ownerId: string): Promise<string> {
    // TODO: Integrar com AI Agent real
    // Por enquanto, retorna uma resposta simulada
    return `Processado: ${text.substring(0, 100)}...`;
  }

  /**
   * Chunkar resposta em pedaços de 200 caracteres
   */
  private chunkResponse(response: string): ChunkedResponse {
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
  private async sendChunkedResponse(response: ChunkedResponse, contactId: string, ownerId: string): Promise<void> {
    for (let i = 0; i < response.chunks.length; i++) {
      const chunk = response.chunks[i];
      
      // TODO: Integrar com WhatsApp real
      console.log(`Enviando chunk ${i + 1}/${response.chunks.length}: ${chunk}`);
      
      // Simular delay entre chunks (3 segundos)
      if (i < response.chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
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
  }
}

export default MessageChunkingService;
