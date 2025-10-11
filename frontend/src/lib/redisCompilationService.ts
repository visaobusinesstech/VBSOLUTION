// Serviço de compilação Redis com delay de 15 segundos
import { conversationMemoryService } from './conversationMemoryService'

export interface RedisCompilationConfig {
  compilationDelay?: number // Delay para compilar mensagens (padrão: 15000ms = 15s)
  maxMessages?: number // Máximo de mensagens para compilar
  conversationId?: string
  onCompilationStart?: () => void
  onCompilationComplete?: (compiledMessage: string) => void
  onError?: (error: Error) => void
}

export class RedisCompilationService {
  private static instance: RedisCompilationService
  private compilationQueue: Map<string, {
    messages: string[]
    timeout: NodeJS.Timeout
    config: RedisCompilationConfig
  }> = new Map()

  static getInstance(): RedisCompilationService {
    if (!RedisCompilationService.instance) {
      RedisCompilationService.instance = new RedisCompilationService()
    }
    return RedisCompilationService.instance
  }

  /**
   * Adiciona uma mensagem à fila de compilação
   */
  async addMessageToCompilationQueue(
    message: string,
    config: RedisCompilationConfig = {}
  ): Promise<void> {
    const {
      compilationDelay = 15000, // 15 segundos por padrão
      maxMessages = 10,
      conversationId = 'default',
      onCompilationStart,
      onCompilationComplete,
      onError
    } = config

    try {
      console.log('📝 [RedisCompilation] Adicionando mensagem à fila de compilação')

      // Verificar se já existe uma fila para esta conversa
      let queue = this.compilationQueue.get(conversationId)
      
      if (!queue) {
        // Criar nova fila
        queue = {
          messages: [],
          timeout: null as any,
          config
        }
        this.compilationQueue.set(conversationId, queue)
      }

      // Adicionar mensagem à fila
      queue.messages.push(message)
      console.log(`📝 [RedisCompilation] Fila agora tem ${queue.messages.length} mensagens`)

      // Se atingiu o máximo de mensagens, compilar imediatamente
      if (queue.messages.length >= maxMessages) {
        console.log('📝 [RedisCompilation] Máximo de mensagens atingido, compilando imediatamente')
        await this.compileMessages(conversationId)
        return
      }

      // Cancelar timeout anterior se existir
      if (queue.timeout) {
        clearTimeout(queue.timeout)
      }

      // Configurar novo timeout para compilação
      queue.timeout = setTimeout(async () => {
        console.log('⏰ [RedisCompilation] Timeout atingido, compilando mensagens')
        await this.compileMessages(conversationId)
      }, compilationDelay)

      console.log(`⏰ [RedisCompilation] Timeout configurado para ${compilationDelay}ms`)

    } catch (error) {
      console.error('❌ [RedisCompilation] Erro ao adicionar mensagem à fila:', error)
      if (config.onError) {
        config.onError(error as Error)
      }
    }
  }

  /**
   * Compila todas as mensagens da fila
   */
  private async compileMessages(conversationId: string): Promise<void> {
    const queue = this.compilationQueue.get(conversationId)
    if (!queue || queue.messages.length === 0) {
      return
    }

    try {
      console.log(`🔄 [RedisCompilation] Compilando ${queue.messages.length} mensagens...`)
      
      if (queue.config.onCompilationStart) {
        queue.config.onCompilationStart()
      }

      // Compilar mensagens em uma única mensagem
      const compiledMessage = this.compileMessagesIntoOne(queue.messages)
      
      console.log(`✅ [RedisCompilation] Mensagem compilada: ${compiledMessage.length} caracteres`)

      // Salvar no banco de dados
      if (conversationId !== 'default') {
        await conversationMemoryService.addMessage(conversationId, {
          conversationId,
          role: 'assistant',
          content: compiledMessage,
          metadata: {
            compiledFrom: queue.messages.length,
            compilationType: 'redis_compilation',
            timestamp: new Date().toISOString()
          }
        })
      }

      // Callback de conclusão
      if (queue.config.onCompilationComplete) {
        queue.config.onCompilationComplete(compiledMessage)
      }

      // Limpar fila
      this.clearQueue(conversationId)

    } catch (error) {
      console.error('❌ [RedisCompilation] Erro ao compilar mensagens:', error)
      if (queue.config.onError) {
        queue.config.onError(error as Error)
      }
    }
  }

  /**
   * Compila múltiplas mensagens em uma única mensagem
   */
  private compileMessagesIntoOne(messages: string[]): string {
    if (messages.length === 1) {
      return messages[0]
    }

    // Estratégias de compilação
    const compiled = messages
      .filter(msg => msg.trim().length > 0) // Remover mensagens vazias
      .map((msg, index) => {
        // Adicionar numeração se houver múltiplas mensagens
        if (messages.length > 1) {
          return `${index + 1}. ${msg.trim()}`
        }
        return msg.trim()
      })
      .join('\n\n') // Separar com quebras de linha duplas

    return compiled
  }

  /**
   * Limpa a fila de uma conversa específica
   */
  clearQueue(conversationId: string): void {
    const queue = this.compilationQueue.get(conversationId)
    if (queue) {
      if (queue.timeout) {
        clearTimeout(queue.timeout)
      }
      this.compilationQueue.delete(conversationId)
      console.log(`🧹 [RedisCompilation] Fila limpa para conversa: ${conversationId}`)
    }
  }

  /**
   * Limpa todas as filas
   */
  clearAllQueues(): void {
    console.log('🧹 [RedisCompilation] Limpando todas as filas')
    this.compilationQueue.forEach(queue => {
      if (queue.timeout) {
        clearTimeout(queue.timeout)
      }
    })
    this.compilationQueue.clear()
  }

  /**
   * Força a compilação imediata de uma conversa
   */
  async forceCompilation(conversationId: string): Promise<void> {
    console.log(`⚡ [RedisCompilation] Forçando compilação para: ${conversationId}`)
    await this.compileMessages(conversationId)
  }

  /**
   * Retorna estatísticas das filas
   */
  getQueueStats(): { conversationId: string, messageCount: number, hasTimeout: boolean }[] {
    return Array.from(this.compilationQueue.entries()).map(([conversationId, queue]) => ({
      conversationId,
      messageCount: queue.messages.length,
      hasTimeout: !!queue.timeout
    }))
  }

  /**
   * Retorna as mensagens de uma fila específica
   */
  getQueueMessages(conversationId: string): string[] {
    const queue = this.compilationQueue.get(conversationId)
    return queue ? queue.messages : []
  }
}

export const redisCompilationService = RedisCompilationService.getInstance()
