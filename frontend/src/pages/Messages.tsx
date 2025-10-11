import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Send, 
  MoreVertical, 
  Phone, 
  Video, 
  Paperclip,
  Smile,
  Send as SendIcon,
  MessageSquareText
} from 'lucide-react';

interface Message {
  id: string;
  sender: {
    name: string;
    avatar?: string;
    online: boolean;
  };
  content: string;
  timestamp: string;
  unread: boolean;
  lastMessage: string;
}

const mockMessages: Message[] = [
  {
    id: '1',
    sender: {
      name: 'João Silva',
      avatar: '/avatars/joao.jpg',
      online: true
    },
    content: 'Olá! Como está o projeto?',
    timestamp: '10:30',
    unread: true,
    lastMessage: 'Olá! Como está o projeto?'
  },
  {
    id: '2',
    sender: {
      name: 'Maria Santos',
      avatar: '/avatars/maria.jpg',
      online: false
    },
    content: 'Preciso de uma reunião amanhã',
    timestamp: '09:15',
    unread: false,
    lastMessage: 'Preciso de uma reunião amanhã'
  },
  {
    id: '3',
    sender: {
      name: 'Carlos Oliveira',
      avatar: '/avatars/carlos.jpg',
      online: true
    },
    content: 'Documentos enviados com sucesso',
    timestamp: '08:45',
    unread: true,
    lastMessage: 'Documentos enviados com sucesso'
  },
  {
    id: '4',
    sender: {
      name: 'Ana Costa',
      avatar: '/avatars/ana.jpg',
      online: false
    },
    content: 'Relatório finalizado',
    timestamp: 'Ontem',
    unread: false,
    lastMessage: 'Relatório finalizado'
  }
];

export default function Messages() {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const filteredMessages = mockMessages.filter(message =>
    message.sender.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedMessage) {
      // Aqui você implementaria a lógica para enviar a mensagem
      console.log('Enviando mensagem:', newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Lista de Conversas */}
      <div className="w-1/3 border-r bg-white">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Mensagens</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="overflow-y-auto h-[calc(100vh-200px)]">
          {filteredMessages.map((message) => (
            <div
              key={message.id}
              onClick={() => setSelectedMessage(message)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedMessage?.id === message.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={message.sender.avatar} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {message.sender.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {message.sender.online && (
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {message.sender.name}
                    </h3>
                    <span className="text-xs text-gray-500">{message.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {message.lastMessage}
                  </p>
                  {message.unread && (
                    <Badge className="mt-1 bg-blue-500 text-white text-xs">
                      Nova
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Área de Chat */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedMessage ? (
          <>
            {/* Header do Chat */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedMessage.sender.avatar} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {selectedMessage.sender.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedMessage.sender.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedMessage.sender.online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex justify-end">
                <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-xs">
                  <p className="text-sm">Olá! Como posso ajudar?</p>
                  <p className="text-xs text-blue-100 mt-1">10:30</p>
                </div>
              </div>
              
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-2 max-w-xs">
                  <p className="text-sm">{selectedMessage.content}</p>
                  <p className="text-xs text-gray-500 mt-1">{selectedMessage.timestamp}</p>
                </div>
              </div>
            </div>

            {/* Input de Mensagem */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Smile className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} size="sm">
                  <SendIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquareText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-gray-500">
                Escolha uma conversa para começar a enviar mensagens
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
