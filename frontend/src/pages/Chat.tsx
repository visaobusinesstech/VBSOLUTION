import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Send, Search, Plus, Paperclip, Image as ImageIcon, Users, Smile, X, MessageCircle, Filter, Download, AlignJustify, List, Grid } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import EmojiPicker from 'emoji-picker-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useFilters } from '@/hooks/useFilters';
import FilterBar from '@/components/FilterBar';

interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface Conversation {
  id: string;
  name: string;
  type: 'direct' | 'group';
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: 'text' | 'image' | 'file';
  created_at: string;
  sender?: Profile;
  attachments?: MessageAttachment[];
}

interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
}

const Chat = () => {
  const { sidebarExpanded, expandSidebarFromMenu } = useSidebar();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isMessageSearchOpen, setIsMessageSearchOpen] = useState(false);
  const [messageSearchTerm, setMessageSearchTerm] = useState('');
  const [foundMessages, setFoundMessages] = useState<Message[]>([]);
  const [currentFoundIndex, setCurrentFoundIndex] = useState(-1);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [conversationType, setConversationType] = useState<'all' | 'direct' | 'group'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Hook para gerenciar filtros
  const { filters, updateFilter, clearFilters, getFilterParams } = useFilters();
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Funções de filtro
  const handleFilterApply = () => {
    // Aplicar filtros se necessário
    console.log('Aplicando filtros:', filters);
  };

  // Load conversations and profiles on mount
  useEffect(() => {
    initializeChatData();
  }, []);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const initializeChatData = async () => {
    try {
      setLoading(true);
      await createSampleData();
      await loadProfiles();
      await loadConversations();
    } catch (error) {
      console.error('Error initializing chat data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do chat.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSampleData = async () => {
    try {
      // Check if sample conversations already exist
      const { data: existingConversations } = await supabase
        .from('conversations')
        .select('id')
        .limit(1);

      if (existingConversations && existingConversations.length > 0) {
        return; // Sample data already exists
      }

      // Create sample conversations
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .insert([
          {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'Equipe Vendas',
            type: 'group',
            created_by: '00000000-0000-0000-0000-000000000001'
          },
          {
            id: '22222222-2222-2222-2222-222222222222',
            name: 'João Silva',
            type: 'direct',
            created_by: '00000000-0000-0000-0000-000000000001'
          },
          {
            id: '33333333-3333-3333-3333-333333333333',
            name: 'Maria Santos',
            type: 'direct',
            created_by: '00000000-0000-0000-0000-000000000001'
          }
        ]);

      if (conversationsError) throw conversationsError;

      // Add participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: '11111111-1111-1111-1111-111111111111', user_id: '00000000-0000-0000-0000-000000000001' },
          { conversation_id: '11111111-1111-1111-1111-111111111111', user_id: '00000000-0000-0000-0000-000000000002' },
          { conversation_id: '11111111-1111-1111-1111-111111111111', user_id: '00000000-0000-0000-0000-000000000003' },
          { conversation_id: '22222222-2222-2222-2222-222222222222', user_id: '00000000-0000-0000-0000-000000000001' },
          { conversation_id: '22222222-2222-2222-2222-222222222222', user_id: '00000000-0000-0000-0000-000000000002' },
          { conversation_id: '33333333-3333-3333-3333-333333333333', user_id: '00000000-0000-0000-0000-000000000001' },
          { conversation_id: '33333333-3333-3333-3333-333333333333', user_id: '00000000-0000-0000-0000-000000000003' }
        ]);

      if (participantsError) throw participantsError;

      // Add sample messages
      const { error: messagesError } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: '11111111-1111-1111-1111-111111111111',
            sender_id: '00000000-0000-0000-0000-000000000002',
            content: 'Vamos revisar os números da semana?',
            message_type: 'text'
          },
          {
            conversation_id: '22222222-2222-2222-2222-222222222222',
            sender_id: '00000000-0000-0000-0000-000000000002',
            content: 'O relatório está pronto',
            message_type: 'text'
          },
          {
            conversation_id: '33333333-3333-3333-3333-333333333333',
            sender_id: '00000000-0000-0000-0000-000000000003',
            content: 'Preciso da sua aprovação',
            message_type: 'text'
          }
        ]);

      if (messagesError) throw messagesError;
    } catch (error) {
      console.error('Error creating sample data:', error);
    }
  };

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os perfis de usuários.",
        variant: "destructive",
      });
    }
  };

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get last message for each conversation
      const conversationsWithMessages = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            type: conv.type as 'direct' | 'group', // Type assertion to fix TypeScript error
            last_message: lastMessage?.content || 'Sem mensagens',
            last_message_time: lastMessage?.created_at || conv.created_at,
            unread_count: 0
          };
        })
      );

      setConversations(conversationsWithMessages);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as conversas.",
        variant: "destructive",
      });
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          attachments:message_attachments(*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Load sender profiles separately to avoid relation errors
      const messagesWithSenders = await Promise.all(
        (data || []).map(async (message) => {
          const { data: senderData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', message.sender_id)
            .single();

          return {
            ...message,
            message_type: message.message_type as 'text' | 'image' | 'file', // Type assertion
            sender: senderData || undefined
          };
        })
      );

      setMessages(messagesWithSenders);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as mensagens.",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: '00000000-0000-0000-0000-000000000001', // Mock user ID
          content: newMessage,
          message_type: 'text'
        })
        .select()
        .single();

      if (error) throw error;

      // Reload messages to get the new message with sender info
      await loadMessages(selectedConversation);
      setNewMessage('');

      // Update conversation's updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversation);

      loadConversations(); // Refresh to update last message

      toast({
        title: "Sucesso",
        description: "Mensagem enviada com sucesso!",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (file: File, messageType: 'image' | 'file') => {
    if (!selectedConversation) return;

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `00000000-0000-0000-0000-000000000001/${fileName}`; // Mock user ID

      const { error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(filePath);

      // Create message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: '00000000-0000-0000-0000-000000000001',
          content: messageType === 'image' ? null : `Arquivo: ${file.name}`,
          message_type: messageType
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Create attachment
      const { error: attachmentError } = await supabase
        .from('message_attachments')
        .insert({
          message_id: messageData.id,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_url: publicUrl
        });

      if (attachmentError) throw attachmentError;

      loadMessages(selectedConversation);
      loadConversations();

      toast({
        title: "Sucesso",
        description: `${messageType === 'image' ? 'Imagem' : 'Arquivo'} enviado com sucesso!`,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erro",
        description: `Não foi possível enviar o ${messageType === 'image' ? 'imagem' : 'arquivo'}.`,
        variant: "destructive",
      });
    }
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedProfiles.length === 0) {
      toast({
        title: "Erro",
        description: "Digite um nome para o grupo e selecione ao menos um colaborador.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create conversation
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          name: groupName,
          type: 'group',
          created_by: '00000000-0000-0000-0000-000000000001'
        })
        .select()
        .single();

      if (conversationError) throw conversationError;

      // Add participants (including creator)
      const participants = [
        { conversation_id: conversationData.id, user_id: '00000000-0000-0000-0000-000000000001' },
        ...selectedProfiles.map(profileId => ({ 
          conversation_id: conversationData.id, 
          user_id: profileId 
        }))
      ];

      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (participantsError) throw participantsError;

      loadConversations();
      setIsGroupDialogOpen(false);
      setGroupName('');
      setSelectedProfiles([]);

      toast({
        title: "Sucesso",
        description: "Grupo criado com sucesso!",
      });
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o grupo.",
        variant: "destructive",
      });
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = conversationType === 'all' || conv.type === conversationType;
    return matchesSearch && matchesType;
  });

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const searchInMessages = () => {
    if (!messageSearchTerm.trim() || !selectedConversation) {
      setFoundMessages([]);
      setCurrentFoundIndex(-1);
      return;
    }

    const filtered = messages.filter(message => 
      message.conversation_id === selectedConversation &&
      message.content?.toLowerCase().includes(messageSearchTerm.toLowerCase())
    );
    
    setFoundMessages(filtered);
    setCurrentFoundIndex(filtered.length > 0 ? 0 : -1);
    
    if (filtered.length > 0) {
      // Scroll to first found message
      const messageElement = document.getElementById(`message-${filtered[0].id}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        messageElement.classList.add('bg-yellow-200');
        setTimeout(() => messageElement.classList.remove('bg-yellow-200'), 2000);
      }
    }
  };

  const navigateFoundMessages = (direction: 'next' | 'prev') => {
    if (foundMessages.length === 0) return;
    
    let newIndex = currentFoundIndex;
    if (direction === 'next') {
      newIndex = (currentFoundIndex + 1) % foundMessages.length;
    } else {
      newIndex = currentFoundIndex === 0 ? foundMessages.length - 1 : currentFoundIndex - 1;
    }
    
    setCurrentFoundIndex(newIndex);
    const messageElement = document.getElementById(`message-${foundMessages[newIndex].id}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('bg-yellow-200');
      setTimeout(() => messageElement.classList.remove('bg-yellow-200'), 2000);
    }
  };

  const onEmojiClick = (emojiData: any) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setIsEmojiPickerOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header fixo responsivo ao sidebar */}
        <div 
          className="fixed top-[38px] right-0 bg-white border-b border-gray-200 z-30 transition-all duration-300"
          style={{
            left: sidebarExpanded ? '240px' : '64px'
          }}
        >
        {/* Botões de visualização */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Botão fixo de toggle da sidebar - SEMPRE VISÍVEL quando colapsada */}
                {!sidebarExpanded && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0 text-gray-600 hover:bg-gray-100 rounded transition-all duration-200 flex-shrink-0"
                    onClick={expandSidebarFromMenu}
                    title="Expandir barra lateral"
                  >
                    <AlignJustify size={14} />
                  </Button>
                )}
                
                {/* Botões de navegação seguindo padrão de Activities */}
                {[
                  { 
                    id: 'all', 
                    label: 'Todas as Conversas',
                    icon: MessageCircle,
                    active: conversationType === 'all',
                    count: conversations.length
                  },
                  {
                    id: 'direct', 
                    label: 'Conversas Diretas',
                    icon: Users,
                    active: conversationType === 'direct',
                    count: conversations.filter(c => c.type === 'direct').length
                  },
                  {
                    id: 'group', 
                    label: 'Grupos',
                    icon: Users,
                    active: conversationType === 'group',
                    count: conversations.filter(c => c.type === 'group').length
                  }
                ].map((button) => {
                  const Icon = button.icon;
                  return (
                    <Button
                      key={button.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => setConversationType(button.id as 'all' | 'direct' | 'group')}
                      className={`
                        h-10 px-4 text-sm font-medium transition-all duration-200 rounded-lg
                        ${button.active 
                          ? 'bg-gray-50 text-slate-900 shadow-inner' 
                          : 'text-slate-700 hover:text-slate-900 hover:bg-gray-25'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {button.label}
                      <Badge variant="secondary" className="ml-2">{button.count}</Badge>
                    </Button>
                  );
                })}
              </div>
              
              {/* Botões de ação na extrema direita */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors"
                  title="Filtros"
                >
                  <Filter className="h-4 w-4 text-gray-700" />
                </Button>
              </div>
            </div>

        {/* Barra de filtros funcionais */}
        <FilterBar
          filters={filters}
          onFilterChange={updateFilter}
          onApplyFilters={handleFilterApply}
          onClearFilters={clearFilters}
          employees={[]}
          departments={[]}
          searchPlaceholder="Filtrar por nome da conversa..."
        />
      </div>

      {/* Container principal colado ao header */}
      <div className="px-6" style={{minHeight: 'calc(100vh - 38px)'}}>
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm min-h-[600px]">
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                {/* Conversations List */}
                <div className="lg:col-span-1">
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Conversas</h3>
            <div className="flex gap-1">
              <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Search className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Buscar Colaborador</DialogTitle>
                    <DialogDescription>
                      Encontre um colaborador para iniciar uma conversa
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Digite o nome do colaborador..."
                      className="w-full"
                    />
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {profiles.map((profile) => (
                          <div key={profile.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={profile.avatar_url || ''} />
                                <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{profile.name}</span>
                            </div>
                            <Button size="sm" variant="outline">
                              Conversar
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
                    </div>
                            </div>
                    
                    <ScrollArea className="flex-1">
                      <div className="space-y-2">
              {filteredConversations.map((conversation) => (
                <div 
                  key={conversation.id}
                            className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors rounded-lg ${
                              selectedConversation === conversation.id ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="bg-blue-100 text-blue-800">
                        {conversation.type === 'group' ? (
                          <Users className="h-4 w-4" />
                        ) : (
                          conversation.name.charAt(0)
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-gray-900 truncate">{conversation.name}</h4>
                          {conversation.type === 'group' && (
                            <Badge variant="secondary" className="text-xs">Grupo</Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.last_message_time || conversation.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{conversation.last_message}</p>
                    </div>
                    {conversation.unread_count && conversation.unread_count > 0 && (
                      <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
                        {conversation.unread_count}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
                  </div>
                </div>

      {/* Chat Window */}
                <div className="lg:col-span-2">
                  <div className="h-full flex flex-col border border-gray-200 rounded-lg">
        {selectedConv ? (
          <>
            {/* Chat Header */}
                        <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-blue-100 text-blue-800">
                      {selectedConv.type === 'group' ? (
                        <Users className="h-4 w-4" />
                      ) : (
                        selectedConv.name.charAt(0)
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{selectedConv.name}</h3>
                      {selectedConv.type === 'group' && (
                        <Badge variant="secondary">Grupo</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {selectedConv.type === 'group' ? 'Conversa em grupo' : 'Conversa direta'}
                    </p>
                  </div>
                </div>
                
                {/* Search in Messages */}
                <div className="flex items-center gap-2">
                  {isMessageSearchOpen ? (
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2">
                      <Input
                        placeholder="Buscar nas mensagens..."
                        value={messageSearchTerm}
                        onChange={(e) => setMessageSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchInMessages()}
                        className="w-48 h-8"
                      />
                      <Button size="sm" variant="ghost" onClick={searchInMessages}>
                        <Search className="h-4 w-4" />
                      </Button>
                      {foundMessages.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => navigateFoundMessages('prev')}>
                            ↑
                          </Button>
                          <span className="text-xs text-gray-600">
                            {currentFoundIndex + 1}/{foundMessages.length}
                          </span>
                          <Button size="sm" variant="ghost" onClick={() => navigateFoundMessages('next')}>
                            ↓
                          </Button>
                        </div>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => {
                          setIsMessageSearchOpen(false);
                          setMessageSearchTerm('');
                          setFoundMessages([]);
                          setCurrentFoundIndex(-1);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => setIsMessageSearchOpen(true)}>
                      <Search className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
                        </div>

            {/* Messages */}
                        <div className="flex-1 p-4 overflow-y-auto">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isFromMe = message.sender_id === '00000000-0000-0000-0000-000000000001';
                    return (
                      <div 
                        key={message.id} 
                        id={`message-${message.id}`}
                        className={`flex ${isFromMe ? 'justify-end' : 'justify-start'} transition-colors duration-500`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl ${
                          isFromMe 
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-200' 
                            : 'bg-gray-100 text-gray-900 border border-gray-200'
                        }`}>
                          {!isFromMe && message.sender && (
                            <p className="text-xs font-medium mb-1 opacity-70">
                              {message.sender.name}
                            </p>
                          )}
                          
                          {message.message_type === 'text' && message.content && (
                            <p className="text-sm">{message.content}</p>
                          )}
                          
                          {message.message_type === 'image' && message.attachments?.[0] && (
                            <div className="space-y-2">
                              <img 
                                src={message.attachments[0].file_url} 
                                alt={message.attachments[0].file_name}
                                className="max-w-full rounded"
                              />
                              <p className="text-xs opacity-70">{message.attachments[0].file_name}</p>
                            </div>
                          )}
                          
                          {message.message_type === 'file' && message.attachments?.[0] && (
                            <div className="flex items-center gap-2 p-2 bg-black/10 rounded">
                              <Paperclip className="h-4 w-4" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{message.attachments[0].file_name}</p>
                                <p className="text-xs opacity-70">{formatFileSize(message.attachments[0].file_size)}</p>
                              </div>
                            </div>
                          )}
                          
                          <p className={`text-xs mt-1 ${
                            isFromMe ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
                        </div>

            {/* Message Input */}
                        <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'file');
                  }}
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'image');
                  }}
                />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>

                <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <EmojiPicker onEmojiClick={onEmojiClick} />
                  </PopoverContent>
                </Popover>

                <Input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage} className="text-white hover:opacity-90" style={{ backgroundColor: '#4A5477' }}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Selecione uma conversa</h3>
              <p className="text-sm text-gray-500">
                Escolha uma conversa para começar a trocar mensagens
              </p>
            </div>
          </div>
        )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botão flutuante seguindo padrão exato de Activities */}
      <Button
        onClick={() => setIsGroupDialogOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50 transition-colors duration-200"
        style={{
          backgroundColor: '#021529',
          borderColor: '#021529'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#001122';
          e.currentTarget.style.borderColor = '#001122';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#021529';
          e.currentTarget.style.borderColor = '#021529';
        }}
      >
        <Plus className="h-6 w-6 text-white" />
      </Button>

      {/* Group Creation Dialog */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Grupo</DialogTitle>
            <DialogDescription>
              Crie um grupo e adicione colaboradores
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Nome do Grupo</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Digite o nome do grupo..."
              />
            </div>
            <div className="space-y-2">
              <Label>Adicionar Colaboradores</Label>
              <ScrollArea className="h-48 border rounded-md p-2">
                <div className="space-y-2">
                  {profiles.map((profile) => (
                    <div key={profile.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={profile.id}
                        checked={selectedProfiles.includes(profile.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProfiles([...selectedProfiles, profile.id]);
                          } else {
                            setSelectedProfiles(selectedProfiles.filter(id => id !== profile.id));
                          }
                        }}
                        className="rounded"
                      />
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={profile.avatar_url || ''} />
                        <AvatarFallback className="text-xs">{profile.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <label htmlFor={profile.id} className="text-sm font-medium cursor-pointer">
                        {profile.name}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createGroup}>
                Criar Grupo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
};

export default Chat;
