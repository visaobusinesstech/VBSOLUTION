import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Image, FileText, Video, Music } from 'lucide-react';
import { AtendimentoWithMessages, WhatsAppMessage, WhatsAppStatus } from '@/types';
import { apiClient } from '@/lib/api';
import { useChatStore } from '@/store/useChatStore';

interface ChatWindowProps {
  atendimento: AtendimentoWithMessages;
  whatsappStatus: WhatsAppStatus;
}

export default function ChatWindow({ atendimento, whatsappStatus }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { addMensagem, mensagens } = useChatStore();
  
  const currentMessages = mensagens[atendimento.id] || [];

  // Scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // Simular digitação
  useEffect(() => {
    if (message) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSendMessage = async () => {
    if (!message.trim() || !whatsappStatus.connected) return;

    try {
      setIsSending(true);
      
      const response = await apiClient.respondToAtendimento(atendimento.id, {
        atendimentoId: atendimento.id,
        conteudo: message.trim(),
        tipo: 'TEXTO',
      });

      if (response.success && response.data) {
        // Adicionar mensagem ao store
        addMensagem(atendimento.id, response.data);
        setMessage('');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageIcon = (tipo: string) => {
    switch (tipo) {
      case 'IMAGEM':
        return <Image className="h-4 w-4" />;
      case 'VIDEO':
        return <Video className="h-4 w-4" />;
      case 'AUDIO':
        return <Music className="h-4 w-4" />;
      case 'DOCUMENTO':
        return <FileText className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (timestamp: Date) => {
    const today = new Date();
    const messageDate = new Date(timestamp);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Hoje';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }
    
    return messageDate.toLocaleDateString('pt-BR');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header do Chat */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {atendimento.nomeCliente?.[0] || atendimento.numeroCliente[0]}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {atendimento.nomeCliente || 'Cliente'}
              </h3>
              <p className="text-sm text-gray-600">
                {atendimento.numeroCliente}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 text-xs rounded-full ${
              atendimento.status === 'ATIVO' 
                ? 'bg-green-100 text-green-800' 
                : atendimento.status === 'FINALIZADO'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {atendimento.status === 'ATIVO' ? 'Ativo' : 
               atendimento.status === 'FINALIZADO' ? 'Finalizado' : 'Cancelado'}
            </span>
          </div>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {currentMessages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhuma mensagem ainda</p>
            <p className="text-sm">Inicie a conversa enviando uma mensagem</p>
          </div>
        ) : (
          currentMessages.map((msg, index) => {
            const showDate = index === 0 || 
              formatDate(currentMessages[index - 1].timestamp) !== formatDate(msg.timestamp);
            
            return (
              <div key={msg.id}>
                {/* Separador de Data */}
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 border">
                      {formatDate(msg.timestamp)}
                    </span>
                  </div>
                )}
                
                {/* Mensagem */}
                <div className={`flex ${msg.remetente === 'ATENDENTE' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl ${
                    msg.remetente === 'ATENDENTE'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-200'
                      : msg.remetente === 'SISTEMA'
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-blue-200'
                      : 'bg-gray-100 text-gray-900 border border-gray-200'
                  }`}>
                    {/* Conteúdo da Mensagem */}
                    <div className="flex items-start space-x-2">
                      {getMessageIcon(msg.tipo)}
                      <div className="flex-1">
                        {msg.tipo === 'TEXTO' ? (
                          <p className="text-sm whitespace-pre-wrap">{msg.conteudo}</p>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm">{msg.conteudo}</p>
                            {msg.mediaUrl && (
                              <div className="bg-black bg-opacity-20 rounded p-2">
                                <p className="text-xs opacity-75">
                                  {msg.tipo} - {msg.mediaSize ? `${(msg.mediaSize / 1024).toFixed(1)}KB` : 'Arquivo'}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Timestamp */}
                    <div className={`text-xs mt-1 ${
                      msg.remetente === 'ATENDENTE' || msg.remetente === 'SISTEMA'
                        ? 'text-green-100'
                        : 'text-gray-500'
                    }`}>
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* Indicador de Digitação */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Mensagem */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end space-x-3">
          {/* Botões de Anexo */}
          <div className="flex space-x-1">
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Paperclip className="h-4 w-4" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Image className="h-4 w-4" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Mic className="h-4 w-4" />
            </button>
          </div>

          {/* Campo de Texto */}
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              rows={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus:border-gray-300 focus-visible:border-gray-300 focus-visible:outline-none focus:shadow-none focus-visible:shadow-none"
              disabled={!whatsappStatus.connected}
            />
          </div>

          {/* Botão de Enviar */}
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || !whatsappStatus.connected || isSending}
            className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Status da Conexão */}
        {!whatsappStatus.connected && (
          <div className="mt-2 text-center">
            <p className="text-xs text-red-600">
              WhatsApp desconectado. Conecte para enviar mensagens.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
