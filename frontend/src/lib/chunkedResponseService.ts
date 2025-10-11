// Serviço de respostas em chunks com delay configurável
import { chunkMessage, SmartChunk } from './smartChunking'
import { conversationMemoryService } from './conversationMemoryService'

export interface ChunkedResponseConfig {
  chunkDelay?: number // Delay entre chunks em ms (padrão: 5000ms = 5s)
  maxChars?: number // Tamanho máximo por chunk
  conversationId?: string
  onChunk?: (chunk: SmartChunk) => void
  onComplete?: () => void
  onError?: (error: Error) => void
}

export class ChunkedResponseService {
  private static instance: ChunkedResponseService
  private activeChunks: Map<string, NodeJS.Timeout[]> = new Map()

  static getInstance(): ChunkedResponseService {
    if (!ChunkedResponseService.instance) {
      ChunkedResponseService.instance = new ChunkedResponseService()
    }
    return ChunkedResponseService.instance
  }

  /**
   * Processa uma mensagem longa e envia em chunks com delay
   */
  async processChunkedResponse(
    message: string,
    config: ChunkedResponseConfig = {}
  ): Promise<void> {
    const {
      chunkDelay = 5000, // 5 segundos por padrão
      maxChars = 150,
      conversationId,
      onChunk,
      onComplete,
      onError
    } = config

    try {
      console.log('🔄 [ChunkedResponse] Iniciando processamento de chunks...')
      
      // Dividir mensagem em chunks
      const chunks = chunkMessage(message, { maxChars })
      
      if (chunks.length === 1) {
        // Se é apenas um chunk, enviar imediatamente
        if (onChunk) {
          onChunk(chunks[0])
        }
        if (onComplete) {
          onComplete()
        }
        return
      }

      console.log(`📦 [ChunkedResponse] Mensagem dividida em ${chunks.length} chunks`)

      // Processar cada chunk com delay
      const timeouts: NodeJS.Timeout[] = []
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        const delay = i * chunkDelay // Delay progressivo
        
        const timeout = setTimeout(async () => {
          try {
            console.log(`📤 [ChunkedResponse] Enviando chunk ${i + 1}/${chunks.length}`)
            
            // Salvar no banco de dados se tiver conversationId
            if (conversationId) {
              await conversationMemoryService.addMessage(conversationId, {
                conversationId,
                role: 'assistant',
                content: chunk.content,
                metadata: {
                  chunkIndex: chunk.index,
                  totalChunks: chunk.totalChunks,
                  isLastChunk: chunk.isLastChunk
                }
              })
            }
            
            // Callback para o chunk
            if (onChunk) {
              onChunk(chunk)
            }
            
            // Se é o último chunk, chamar onComplete
            if (chunk.isLastChunk && onComplete) {
              console.log('✅ [ChunkedResponse] Todos os chunks enviados')
              onComplete()
            }
            
          } catch (error) {
            console.error('❌ [ChunkedResponse] Erro ao processar chunk:', error)
            if (onError) {
              onError(error as Error)
            }
          }
        }, delay)
        
        timeouts.push(timeout)
      }

      // Armazenar timeouts para possível cancelamento
      if (conversationId) {
        this.activeChunks.set(conversationId, timeouts)
      }

    } catch (error) {
      console.error('❌ [ChunkedResponse] Erro ao processar mensagem:', error)
      if (onError) {
        onError(error as Error)
      }
    }
  }

  /**
   * Cancela todos os chunks pendentes de uma conversa
   */
  cancelChunks(conversationId: string): void {
    const timeouts = this.activeChunks.get(conversationId)
    if (timeouts) {
      console.log(`🛑 [ChunkedResponse] Cancelando ${timeouts.length} chunks pendentes`)
      timeouts.forEach(timeout => clearTimeout(timeout))
      this.activeChunks.delete(conversationId)
    }
  }

  /**
   * Limpa todos os chunks ativos
   */
  clearAllChunks(): void {
    console.log('🧹 [ChunkedResponse] Limpando todos os chunks ativos')
    this.activeChunks.forEach(timeouts => {
      timeouts.forEach(timeout => clearTimeout(timeout))
    })
    this.activeChunks.clear()
  }

  /**
   * Retorna estatísticas dos chunks ativos
   */
  getActiveChunksStats(): { conversationId: string, pendingChunks: number }[] {
    return Array.from(this.activeChunks.entries()).map(([conversationId, timeouts]) => ({
      conversationId,
      pendingChunks: timeouts.length
    }))
  }
}

export const chunkedResponseService = ChunkedResponseService.getInstance()
