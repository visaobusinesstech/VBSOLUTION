// Serviço de memória de conversas para persistência e cache
import { supabase } from '@/integrations/supabase/client'

export interface ConversationMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface ConversationMemory {
  conversationId: string
  messages: ConversationMessage[]
  context: Record<string, any>
  lastUpdated: Date
  ttl: number
}

export class ConversationMemoryService {
  private static instance: ConversationMemoryService
  private memoryCache: Map<string, ConversationMemory> = new Map()
  private readonly CACHE_TTL = 30 * 60 * 1000 // 30 minutos
  private readonly MAX_CACHE_SIZE = 100

  static getInstance(): ConversationMemoryService {
    if (!ConversationMemoryService.instance) {
      ConversationMemoryService.instance = new ConversationMemoryService()
    }
    return ConversationMemoryService.instance
  }

  async addMessage(
    conversationId: string, 
    message: Omit<ConversationMessage, 'id' | 'timestamp'>
  ): Promise<void> {
    try {
      console.log(`ConversationMemoryService: Adicionando mensagem à memória: ${conversationId}`)
      
      // Criar mensagem com ID e timestamp
      const fullMessage: ConversationMessage = {
        ...message,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      }

      // Salvar no banco de dados
      const { error } = await supabase
        .from('whatsapp_mensagens')
        .insert({
          conversation_id: conversationId,
          user_id: message.metadata?.userId || 'system',
          role: message.role,
          content: message.content,
          metadata: message.metadata || {}
        })

      if (error) {
        console.error('Erro ao salvar mensagem no banco:', error)
      }

      // Atualizar cache
      await this.updateMemoryCache(conversationId, fullMessage)
      
      console.log('ConversationMemoryService: Mensagem adicionada à memória com sucesso')
    } catch (error) {
      console.error('Erro ao adicionar mensagem à memória:', error)
    }
  }

  async getConversationMemory(conversationId: string): Promise<ConversationMessage[]> {
    try {
      console.log(`ConversationMemoryService: Carregando memória da conversa: ${conversationId}`)
      
      // Verificar cache primeiro
      const cached = this.memoryCache.get(conversationId)
      if (cached && this.isCacheValid(cached)) {
        console.log('ConversationMemoryService: Memória encontrada no cache')
        return cached.messages
      }

      // Carregar do banco de dados
      const { data: messages, error } = await supabase
        .from('whatsapp_mensagens')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Erro ao carregar mensagens do banco:', error)
        return []
      }

      // Converter para formato da interface
      const conversationMessages: ConversationMessage[] = messages.map(msg => ({
        id: msg.id.toString(),
        conversationId: msg.conversation_id.toString(),
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        metadata: msg.metadata
      }))

      // Atualizar cache
      this.updateMemoryCache(conversationId, conversationMessages)

      console.log('ConversationMemoryService: Memória carregada com sucesso')
      return conversationMessages
    } catch (error) {
      console.error('Erro ao carregar memória da conversa:', error)
      return []
    }
  }

  async clearConversationMemory(conversationId: string): Promise<void> {
    try {
      // Limpar do cache
      this.memoryCache.delete(conversationId)
      
      // Limpar do banco de dados
      await supabase
        .from('whatsapp_mensagens')
        .delete()
        .eq('conversation_id', conversationId)
        
      console.log(`Memória da conversa ${conversationId} limpa com sucesso`)
    } catch (error) {
      console.error('Erro ao limpar memória da conversa:', error)
    }
  }

  async getConversationContext(conversationId: string): Promise<Record<string, any>> {
    try {
      const messages = await this.getConversationMemory(conversationId)
      
      // Extrair contexto das mensagens
      const context: Record<string, any> = {}
      
      // Procurar por informações específicas nas mensagens
      messages.forEach(message => {
        if (message.role === 'user') {
          // Detectar indústria
          if (message.content.toLowerCase().includes('setor')) {
            const match = message.content.match(/setor.*?([^.]+)/i)
            if (match) {
              context.industry = match[1].trim()
            }
          }
          
          // Detectar objetivos
          if (message.content.toLowerCase().includes('objetivo') || 
              message.content.toLowerCase().includes('meta')) {
            context.goals = message.content
          }
          
          // Detectar plataforma
          if (message.content.toLowerCase().includes('instagram')) {
            context.platform = 'instagram'
          } else if (message.content.toLowerCase().includes('facebook')) {
            context.platform = 'facebook'
          } else if (message.content.toLowerCase().includes('linkedin')) {
            context.platform = 'linkedin'
          }
        }
      })
      
      return context
    } catch (error) {
      console.error('Erro ao extrair contexto da conversa:', error)
      return {}
    }
  }

  private async updateMemoryCache(
    conversationId: string, 
    messagesOrMessage: ConversationMessage | ConversationMessage[]
  ): Promise<void> {
    try {
      let currentMemory = this.memoryCache.get(conversationId)
      
      if (!currentMemory) {
        currentMemory = {
          conversationId,
          messages: [],
          context: {},
          lastUpdated: new Date(),
          ttl: this.CACHE_TTL
        }
      }

      if (Array.isArray(messagesOrMessage)) {
        currentMemory.messages = messagesOrMessage
      } else {
        currentMemory.messages.push(messagesOrMessage)
      }

      currentMemory.lastUpdated = new Date()
      this.memoryCache.set(conversationId, currentMemory)

      // Limpar cache se estiver muito grande
      if (this.memoryCache.size > this.MAX_CACHE_SIZE) {
        this.cleanupCache()
      }
    } catch (error) {
      console.error('Erro ao atualizar cache de memória:', error)
    }
  }

  private isCacheValid(memory: ConversationMemory): boolean {
    const now = Date.now()
    const lastUpdated = memory.lastUpdated.getTime()
    return (now - lastUpdated) < memory.ttl
  }

  private cleanupCache(): void {
    const now = Date.now()
    const entries = Array.from(this.memoryCache.entries())
    
    // Remover entradas expiradas
    entries.forEach(([key, memory]) => {
      if (!this.isCacheValid(memory)) {
        this.memoryCache.delete(key)
      }
    })
    
    // Se ainda estiver muito grande, remover as mais antigas
    if (this.memoryCache.size > this.MAX_CACHE_SIZE) {
      const sortedEntries = entries
        .sort((a, b) => a[1].lastUpdated.getTime() - b[1].lastUpdated.getTime())
        .slice(0, this.MAX_CACHE_SIZE - 10) // Manter 10 slots livres
      
      sortedEntries.forEach(([key]) => {
        this.memoryCache.delete(key)
      })
    }
  }

  // Método para debug
  getCacheStats(): { size: number, entries: string[] } {
    return {
      size: this.memoryCache.size,
      entries: Array.from(this.memoryCache.keys())
    }
  }
}

export const conversationMemoryService = ConversationMemoryService.getInstance()
