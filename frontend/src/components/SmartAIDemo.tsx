// Componente de demonstração do sistema Smart AI com chunking e Redis
import React, { useState } from 'react'
import { useSmartAIResponse } from '@/hooks/useSmartAIResponse'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

export function SmartAIDemo() {
  const [message, setMessage] = useState('')
  const [conversationId, setConversationId] = useState('demo-conversation')
  const [messages, setMessages] = useState<Array<{
    id: string
    content: string
    type: 'user' | 'assistant' | 'chunk' | 'compiled'
    timestamp: Date
    metadata?: any
  }>>([])

  const {
    isProcessing,
    isCompiling,
    currentChunk,
    totalChunks,
    sendMessage,
    sendChunkedMessage,
    addToCompilationQueue,
    cancelProcessing,
    getStats
  } = useSmartAIResponse({
    conversationId,
    chunkDelay: 5000, // 5 segundos
    compilationDelay: 15000, // 15 segundos
    enableChunking: true,
    enableCompilation: true
  })

  const handleSendMessage = async () => {
    if (!message.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      content: message,
      type: 'user' as const,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setMessage('')

    // Enviar mensagem normal
    await sendMessage(message)
  }

  const handleSendChunked = async () => {
    if (!message.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      content: message,
      type: 'user' as const,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setMessage('')

    // Enviar mensagem em chunks
    await sendChunkedMessage(message)
  }

  const handleAddToQueue = async () => {
    if (!message.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      content: message,
      type: 'user' as const,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setMessage('')

    // Adicionar à fila de compilação
    await addToCompilationQueue(message)
  }

  const stats = getStats()

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🤖 Smart AI Demo - Chunking + Redis</CardTitle>
          <CardDescription>
            Sistema de respostas inteligentes com chunking de 5s e compilação Redis de 15s
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controles */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
              />
              <Input
                value={conversationId}
                onChange={(e) => setConversationId(e.target.value)}
                placeholder="ID da conversa"
                className="w-48"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleSendMessage}
                disabled={isProcessing || isCompiling}
                variant="default"
              >
                📤 Enviar Normal
              </Button>
              
              <Button 
                onClick={handleSendChunked}
                disabled={isProcessing || isCompiling}
                variant="secondary"
              >
                📦 Enviar em Chunks (5s)
              </Button>
              
              <Button 
                onClick={handleAddToQueue}
                disabled={isProcessing || isCompiling}
                variant="outline"
              >
                🔄 Adicionar à Fila Redis (15s)
              </Button>
              
              <Button 
                onClick={cancelProcessing}
                disabled={!isProcessing && !isCompiling}
                variant="destructive"
              >
                🛑 Cancelar
              </Button>
            </div>
          </div>

          {/* Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.activeChunks}</div>
              <div className="text-sm text-gray-600">Chunks Ativos</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.queueMessages}</div>
              <div className="text-sm text-gray-600">Mensagens na Fila</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {isProcessing ? 'Sim' : 'Não'}
              </div>
              <div className="text-sm text-gray-600">Processando</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {isCompiling ? 'Sim' : 'Não'}
              </div>
              <div className="text-sm text-gray-600">Compilando</div>
            </div>
          </div>

          {/* Progresso do Chunking */}
          {isProcessing && totalChunks > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Chunking em progresso...</span>
                <span>{currentChunk}/{totalChunks}</span>
              </div>
              <Progress 
                value={(currentChunk / totalChunks) * 100} 
                className="w-full"
              />
            </div>
          )}

          {/* Status de Compilação */}
          {isCompiling && (
            <div className="flex items-center gap-2 text-orange-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
              <span>Compilando mensagens na fila Redis...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mensagens */}
      <Card>
        <CardHeader>
          <CardTitle>💬 Mensagens</CardTitle>
          <CardDescription>
            Histórico de mensagens da conversa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Nenhuma mensagem ainda. Envie uma mensagem para começar!
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg ${
                    msg.type === 'user'
                      ? 'bg-blue-50 border-l-4 border-blue-500 ml-8'
                      : msg.type === 'chunk'
                      ? 'bg-green-50 border-l-4 border-green-500 mr-8'
                      : msg.type === 'compiled'
                      ? 'bg-purple-50 border-l-4 border-purple-500 mr-8'
                      : 'bg-gray-50 border-l-4 border-gray-500 mr-8'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={
                      msg.type === 'user' ? 'default' :
                      msg.type === 'chunk' ? 'secondary' :
                      msg.type === 'compiled' ? 'outline' : 'secondary'
                    }>
                      {msg.type === 'user' ? '👤 Usuário' :
                       msg.type === 'chunk' ? '📦 Chunk' :
                       msg.type === 'compiled' ? '🔄 Compilado' : '🤖 Assistente'}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                  {msg.metadata && (
                    <div className="text-xs text-gray-400 mt-1">
                      {JSON.stringify(msg.metadata, null, 2)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Como Usar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <strong>📤 Enviar Normal:</strong> Envia a mensagem imediatamente sem chunking
          </div>
          <div>
            <strong>📦 Enviar em Chunks (5s):</strong> Divide a mensagem em pedaços menores e envia com delay de 5 segundos entre cada chunk
          </div>
          <div>
            <strong>🔄 Adicionar à Fila Redis (15s):</strong> Adiciona a mensagem à fila de compilação que aguarda 15 segundos para compilar todas as mensagens em uma única resposta
          </div>
          <div>
            <strong>🛑 Cancelar:</strong> Cancela qualquer processamento em andamento
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
