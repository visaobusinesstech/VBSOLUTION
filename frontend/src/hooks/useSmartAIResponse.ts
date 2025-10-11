// Hook para respostas inteligentes com chunking e compilação Redis
import { useState, useCallback, useRef, useEffect } from 'react'
import { chunkedResponseService, ChunkedResponseConfig } from '@/lib/chunkedResponseService'
import { redisCompilationService, RedisCompilationConfig } from '@/lib/redisCompilationService'
import { conversationMemoryService } from '@/lib/conversationMemoryService'

export interface SmartAIResponseConfig {
  // Configurações de chunking
  chunkDelay?: number // Delay entre chunks (padrão: 5000ms = 5s)
  maxChars?: number // Tamanho máximo por chunk
  
  // Configurações de compilação Redis
  compilationDelay?: number // Delay para compilar (padrão: 15000ms = 15s)
  maxMessages?: number // Máximo de mensagens para compilar
  
  // Configurações gerais
  conversationId?: string
  enableChunking?: boolean
  enableCompilation?: boolean
}

export interface SmartAIResponseReturn {
  // Estados
  isProcessing: boolean
  isCompiling: boolean
  currentChunk: number
  totalChunks: number
  
  // Métodos
  sendMessage: (message: string) => Promise<void>
  sendChunkedMessage: (message: string) => Promise<void>
  addToCompilationQueue: (message: string) => Promise<void>
  cancelProcessing: () => void
  
  // Estatísticas
  getStats: () => {
    activeChunks: number
    queueMessages: number
    isProcessing: boolean
    isCompiling: boolean
  }
}

export function useSmartAIResponse(config: SmartAIResponseConfig = {}): SmartAIResponseReturn {
  const {
    chunkDelay = 5000, // 5 segundos
    maxChars = 150,
    compilationDelay = 15000, // 15 segundos
    maxMessages = 10,
    conversationId = 'default',
    enableChunking = true,
    enableCompilation = true
  } = config

  // Estados
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCompiling, setIsCompiling] = useState(false)
  const [currentChunk, setCurrentChunk] = useState(0)
  const [totalChunks, setTotalChunks] = useState(0)
  
  // Refs para controle
  const processingRef = useRef(false)
  const compilationRef = useRef(false)

  // Callback para chunk
  const handleChunk = useCallback((chunk: any) => {
    console.log(`📤 [SmartAI] Chunk recebido: ${chunk.index + 1}/${chunk.totalChunks}`)
    setCurrentChunk(chunk.index + 1)
    setTotalChunks(chunk.totalChunks)
  }, [])

  // Callback para conclusão de chunking
  const handleChunkComplete = useCallback(() => {
    console.log('✅ [SmartAI] Chunking completo')
    setIsProcessing(false)
    processingRef.current = false
    setCurrentChunk(0)
    setTotalChunks(0)
  }, [])

  // Callback para início de compilação
  const handleCompilationStart = useCallback(() => {
    console.log('🔄 [SmartAI] Iniciando compilação Redis')
    setIsCompiling(true)
    compilationRef.current = true
  }, [])

  // Callback para conclusão de compilação
  const handleCompilationComplete = useCallback((compiledMessage: string) => {
    console.log('✅ [SmartAI] Compilação Redis completa')
    setIsCompiling(false)
    compilationRef.current = false
  }, [])

  // Callback para erro
  const handleError = useCallback((error: Error) => {
    console.error('❌ [SmartAI] Erro:', error)
    setIsProcessing(false)
    setIsCompiling(false)
    processingRef.current = false
    compilationRef.current = false
  }, [])

  // Método para enviar mensagem normal
  const sendMessage = useCallback(async (message: string) => {
    if (processingRef.current) {
      console.warn('⚠️ [SmartAI] Já processando uma mensagem')
      return
    }

    try {
      setIsProcessing(true)
      processingRef.current = true
      
      console.log('📤 [SmartAI] Enviando mensagem normal')
      
      // Salvar no banco de dados
      if (conversationId !== 'default') {
        await conversationMemoryService.addMessage(conversationId, {
          conversationId,
          role: 'assistant',
          content: message,
          metadata: {
            messageType: 'normal',
            timestamp: new Date().toISOString()
          }
        })
      }
      
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('✅ [SmartAI] Mensagem enviada com sucesso')
      
    } catch (error) {
      handleError(error as Error)
    } finally {
      setIsProcessing(false)
      processingRef.current = false
    }
  }, [conversationId, handleError])

  // Método para enviar mensagem em chunks
  const sendChunkedMessage = useCallback(async (message: string) => {
    if (processingRef.current) {
      console.warn('⚠️ [SmartAI] Já processando uma mensagem')
      return
    }

    try {
      setIsProcessing(true)
      processingRef.current = true
      
      console.log('📤 [SmartAI] Enviando mensagem em chunks')
      
      await chunkedResponseService.processChunkedResponse(message, {
        chunkDelay,
        maxChars,
        conversationId,
        onChunk: handleChunk,
        onComplete: handleChunkComplete,
        onError: handleError
      })
      
    } catch (error) {
      handleError(error as Error)
    }
  }, [chunkDelay, maxChars, conversationId, handleChunk, handleChunkComplete, handleError])

  // Método para adicionar à fila de compilação
  const addToCompilationQueue = useCallback(async (message: string) => {
    try {
      console.log('📝 [SmartAI] Adicionando à fila de compilação Redis')
      
      await redisCompilationService.addMessageToCompilationQueue(message, {
        compilationDelay,
        maxMessages,
        conversationId,
        onCompilationStart: handleCompilationStart,
        onCompilationComplete: handleCompilationComplete,
        onError: handleError
      })
      
    } catch (error) {
      handleError(error as Error)
    }
  }, [compilationDelay, maxMessages, conversationId, handleCompilationStart, handleCompilationComplete, handleError])

  // Método para cancelar processamento
  const cancelProcessing = useCallback(() => {
    console.log('🛑 [SmartAI] Cancelando processamento')
    
    // Cancelar chunks
    if (conversationId) {
      chunkedResponseService.cancelChunks(conversationId)
    }
    
    // Limpar filas
    redisCompilationService.clearAllQueues()
    
    // Resetar estados
    setIsProcessing(false)
    setIsCompiling(false)
    setCurrentChunk(0)
    setTotalChunks(0)
    processingRef.current = false
    compilationRef.current = false
  }, [conversationId])

  // Método para obter estatísticas
  const getStats = useCallback(() => {
    const chunkStats = chunkedResponseService.getActiveChunksStats()
    const queueStats = redisCompilationService.getQueueStats()
    
    const activeChunks = chunkStats.reduce((total, stat) => total + stat.pendingChunks, 0)
    const queueMessages = queueStats.reduce((total, stat) => total + stat.messageCount, 0)
    
    return {
      activeChunks,
      queueMessages,
      isProcessing: processingRef.current,
      isCompiling: compilationRef.current
    }
  }, [])

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      cancelProcessing()
    }
  }, [cancelProcessing])

  return {
    // Estados
    isProcessing,
    isCompiling,
    currentChunk,
    totalChunks,
    
    // Métodos
    sendMessage,
    sendChunkedMessage,
    addToCompilationQueue,
    cancelProcessing,
    
    // Estatísticas
    getStats
  }
}
