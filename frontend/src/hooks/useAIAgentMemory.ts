import { useState, useCallback, useEffect } from 'react'
import { aiAgentMemoryService, AIMessage } from '@/lib/aiAgentMemoryService'

export interface UseAIAgentMemoryReturn {
  messages: AIMessage[]
  addMessage: (message: Omit<AIMessage, 'id' | 'timestamp'>) => Promise<void>
  getConversationMemory: (conversationId: string) => Promise<AIMessage[]>
  getConversationContext: (conversationId: string) => Promise<Record<string, any>>
  clearMemory: (conversationId: string) => Promise<void>
  isLoading: boolean
  error: string | null
  memoryStats: { conversationId: string, messageCount: number }[]
}

export function useAIAgentMemory(): UseAIAgentMemoryReturn {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addMessage = useCallback(async (message: Omit<AIMessage, 'id' | 'timestamp'>) => {
    try {
      setIsLoading(true)
      setError(null)
      
      await aiAgentMemoryService.addMessage(message.conversationId, message)
      
      // Atualizar estado local
      const newMessage: AIMessage = {
        ...message,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, newMessage])
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar mensagem'
      setError(errorMessage)
      console.error('❌ [useAIAgentMemory] Erro ao adicionar mensagem:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getConversationMemory = useCallback(async (conversationId: string): Promise<AIMessage[]> => {
    try {
      setIsLoading(true)
      setError(null)
      
      const memory = await aiAgentMemoryService.getConversationMemory(conversationId)
      setMessages(memory)
      
      return memory
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar memória'
      setError(errorMessage)
      console.error('❌ [useAIAgentMemory] Erro ao carregar memória:', err)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getConversationContext = useCallback(async (conversationId: string): Promise<Record<string, any>> => {
    try {
      setError(null)
      return await aiAgentMemoryService.getConversationContext(conversationId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao extrair contexto'
      setError(errorMessage)
      console.error('❌ [useAIAgentMemory] Erro ao extrair contexto:', err)
      return {}
    }
  }, [])

  const clearMemory = useCallback(async (conversationId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      await aiAgentMemoryService.clearConversationMemory(conversationId)
      setMessages([])
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao limpar memória'
      setError(errorMessage)
      console.error('❌ [useAIAgentMemory] Erro ao limpar memória:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const memoryStats = aiAgentMemoryService.getMemoryStats()

  return {
    messages,
    addMessage,
    getConversationMemory,
    getConversationContext,
    clearMemory,
    isLoading,
    error,
    memoryStats
  }
}
