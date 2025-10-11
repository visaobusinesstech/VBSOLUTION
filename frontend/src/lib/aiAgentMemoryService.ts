// Serviço de memória do AI Agent com 50 mensagens
import { supabase } from '@/integrations/supabase/client'

export interface AIMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface AIMemory {
  conversationId: string
  messages: AIMessage[]
  context: Record<string, any>
  lastUpdated: Date
  maxMessages: number
}

export class AIAgentMemoryService {
  private static instance: AIAgentMemoryService
  private memoryCache: Map<string, AIMemory> = new Map()
  private readonly MAX_MESSAGES = 50 // Memória de 50 mensagens
  private readonly CACHE_TTL = 30 * 60 * 1000 // 30 minutos

  static getInstance(): AIAgentMemoryService {
    if (!AIAgentMemoryService.instance) {
      AIAgentMemoryService.instance = new AIAgentMemoryService()
    }
    return AIAgentMemoryService.instance
  }

  /**
   * Adiciona uma mensagem à memória do AI Agent
   */
  async addMessage(
    conversationId: string,
    message: Omit<AIMessage, 'id' | 'timestamp'>
  ): Promise<void> {
    try {
      console.log(`🤖 [AI Memory] Adicionando mensagem à memória: ${conversationId}`)
      
      // Criar mensagem com ID e timestamp
      const fullMessage: AIMessage = {
        ...message,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      }

      // Salvar no banco de dados
      const { error } = await supabase
        .from('ai_agent_messages')
        .insert({
          conversation_id: conversationId,
          role: message.role,
          content: message.content,
          metadata: message.metadata || {}
        })

      if (error) {
        console.error('❌ [AI Memory] Erro ao salvar mensagem no banco:', error)
      }

      // Atualizar cache
      await this.updateMemoryCache(conversationId, fullMessage)
      
      console.log('✅ [AI Memory] Mensagem adicionada à memória com sucesso')
    } catch (error) {
      console.error('❌ [AI Memory] Erro ao adicionar mensagem à memória:', error)
    }
  }

  /**
   * Obtém as últimas 50 mensagens da conversa
   */
  async getConversationMemory(conversationId: string): Promise<AIMessage[]> {
    try {
      console.log(`🤖 [AI Memory] Carregando memória da conversa: ${conversationId}`)
      
      // Verificar cache primeiro
      const cached = this.memoryCache.get(conversationId)
      if (cached && this.isCacheValid(cached)) {
        console.log('✅ [AI Memory] Memória encontrada no cache')
        return cached.messages
      }

      // Carregar do banco de dados (últimas 50 mensagens)
      const { data: messages, error } = await supabase
        .from('ai_agent_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(this.MAX_MESSAGES)

      if (error) {
        console.error('❌ [AI Memory] Erro ao carregar mensagens do banco:', error)
        return []
      }

      // Converter para formato da interface e reverter ordem (mais antigas primeiro)
      const conversationMessages: AIMessage[] = messages
        .reverse()
        .map(msg => ({
          id: msg.id.toString(),
          conversationId: msg.conversation_id.toString(),
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
          timestamp: new Date(msg.created_at),
          metadata: msg.metadata
        }))

      // Atualizar cache
      this.updateMemoryCache(conversationId, conversationMessages)

      console.log(`✅ [AI Memory] Memória carregada: ${conversationMessages.length} mensagens`)
      return conversationMessages
    } catch (error) {
      console.error('❌ [AI Memory] Erro ao carregar memória da conversa:', error)
      return []
    }
  }

  /**
   * Obtém o contexto da conversa para o AI Agent
   */
  async getConversationContext(conversationId: string): Promise<Record<string, any>> {
    try {
      const messages = await this.getConversationMemory(conversationId)
      
      // Extrair contexto das mensagens
      const context: Record<string, any> = {
        messageCount: messages.length,
        lastMessage: messages[messages.length - 1]?.content || '',
        conversationHistory: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        }))
      }
      
      // Detectar padrões na conversa
      messages.forEach(message => {
        if (message.role === 'user') {
          // Detectar sentimentos
          if (message.content.toLowerCase().includes('obrigado') || 
              message.content.toLowerCase().includes('obrigada')) {
            context.sentiment = 'positive'
          } else if (message.content.toLowerCase().includes('problema') || 
                     message.content.toLowerCase().includes('erro')) {
            context.sentiment = 'negative'
          }
          
          // Detectar intenções
          if (message.content.toLowerCase().includes('preço') || 
              message.content.toLowerCase().includes('valor')) {
            context.intent = 'pricing'
          } else if (message.content.toLowerCase().includes('suporte') || 
                     message.content.toLowerCase().includes('ajuda')) {
            context.intent = 'support'
          }
        }
      })
      
      return context
    } catch (error) {
      console.error('❌ [AI Memory] Erro ao extrair contexto da conversa:', error)
      return {}
    }
  }

  /**
   * Limpa a memória de uma conversa
   */
  async clearConversationMemory(conversationId: string): Promise<void> {
    try {
      // Limpar do cache
      this.memoryCache.delete(conversationId)
      
      // Limpar do banco de dados
      await supabase
        .from('ai_agent_messages')
        .delete()
        .eq('conversation_id', conversationId)
        
      console.log(`🧹 [AI Memory] Memória da conversa ${conversationId} limpa com sucesso`)
    } catch (error) {
      console.error('❌ [AI Memory] Erro ao limpar memória da conversa:', error)
    }
  }

  /**
   * Atualiza o cache de memória
   */
  private async updateMemoryCache(
    conversationId: string, 
    messagesOrMessage: AIMessage | AIMessage[]
  ): Promise<void> {
    try {
      let currentMemory = this.memoryCache.get(conversationId)
      
      if (!currentMemory) {
        currentMemory = {
          conversationId,
          messages: [],
          context: {},
          lastUpdated: new Date(),
          maxMessages: this.MAX_MESSAGES
        }
      }

      if (Array.isArray(messagesOrMessage)) {
        currentMemory.messages = messagesOrMessage
      } else {
        currentMemory.messages.push(messagesOrMessage)
        
        // Manter apenas as últimas 50 mensagens
        if (currentMemory.messages.length > this.MAX_MESSAGES) {
          currentMemory.messages = currentMemory.messages.slice(-this.MAX_MESSAGES)
        }
      }

      currentMemory.lastUpdated = new Date()
      this.memoryCache.set(conversationId, currentMemory)

    } catch (error) {
      console.error('❌ [AI Memory] Erro ao atualizar cache de memória:', error)
    }
  }

  /**
   * Verifica se o cache é válido
   */
  private isCacheValid(memory: AIMemory): boolean {
    const now = Date.now()
    const lastUpdated = memory.lastUpdated.getTime()
    return (now - lastUpdated) < this.CACHE_TTL
  }

  /**
   * Retorna estatísticas da memória
   */
  getMemoryStats(): { conversationId: string, messageCount: number }[] {
    return Array.from(this.memoryCache.entries()).map(([conversationId, memory]) => ({
      conversationId,
      messageCount: memory.messages.length
    }))
  }
}

export const aiAgentMemoryService = AIAgentMemoryService.getInstance()
