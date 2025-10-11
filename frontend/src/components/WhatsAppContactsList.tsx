import React, { useState, useMemo } from 'react';
import { useWhatsAppContacts } from '@/hooks/useWhatsAppContacts';
import { WhatsAppProfilePicture } from './WhatsAppProfilePicture';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  RefreshCw, 
  Users, 
  Wifi, 
  Bot, 
  MessageCircle, 
  Phone, 
  Mail,
  Calendar,
  Filter,
  MoreVertical,
  Building,
  Globe,
  CheckCircle,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppContactsListProps {
  onContactSelect?: (contact: any) => void;
  showFilters?: boolean;
  className?: string;
}

export const WhatsAppContactsList: React.FC<WhatsAppContactsListProps> = ({
  onContactSelect,
  showFilters = true,
  className = ''
}) => {
  const {
    contacts,
    loading,
    error,
    loadContacts,
    syncContacts,
    searchContacts,
    getOnlineContacts,
    getAIContacts,
    totalContacts,
    onlineContacts,
    aiContacts
  } = useWhatsAppContacts();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'lastMessage' | 'messageCount'>('lastMessage');

  // Filtrar e ordenar contatos
  const filteredContacts = useMemo(() => {
    let filtered = contacts;

    // Aplicar filtro de busca
    if (searchQuery.trim()) {
      filtered = searchContacts(searchQuery);
    }

    // Aplicar filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(contact => contact.status === statusFilter);
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.whatsapp_name || a.name || '').localeCompare(b.whatsapp_name || b.name || '');
        case 'lastMessage':
          return new Date(b.whatsapp_last_message_at || 0).getTime() - new Date(a.whatsapp_last_message_at || 0).getTime();
        case 'messageCount':
          return (b.whatsapp_message_count || 0) - (a.whatsapp_message_count || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [contacts, searchQuery, statusFilter, sortBy, searchContacts]);

  const handleSyncContacts = async () => {
    try {
      await syncContacts();
      toast.success('Contatos sincronizados com sucesso!');
    } catch (error: any) {
      toast.error(`Erro ao sincronizar contatos: ${error.message}`);
    }
  };

  const handleContactClick = (contact: any) => {
    if (onContactSelect) {
      onContactSelect(contact);
    }
  };

  const formatLastMessageTime = (timestamp?: string) => {
    if (!timestamp) return 'Nunca';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Agora';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h atrás`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (error) {
    return (
      <div className={className}>
        <div className="flex flex-col items-center justify-center h-64 bg-red-50 rounded-lg border-2 border-dashed border-red-200">
          <div className="p-4 bg-red-100 rounded-full mb-4">
            <Users className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar contatos</h3>
          <p className="text-red-600 text-center mb-4">{error}</p>
          <Button onClick={loadContacts} variant="outline" className="h-8 px-3 text-xs">
            <RefreshCw className="w-3 h-3 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header com estatísticas */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Contatos WhatsApp</h2>
              <p className="text-sm text-gray-500">Gerencie seus contatos do WhatsApp</p>
            </div>
          </div>
          <Button
            onClick={handleSyncContacts}
            disabled={loading}
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs"
          >
            <RefreshCw className={`w-3 h-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
        </div>

        {/* Estatísticas modernas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-md">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-blue-900">{totalContacts}</div>
                <div className="text-xs text-blue-600 font-medium">Total</div>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 rounded-md">
                <Wifi className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-green-900">{onlineContacts}</div>
                <div className="text-xs text-green-600 font-medium">Online</div>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 rounded-md">
                <Bot className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-purple-900">{aiContacts}</div>
                <div className="text-xs text-purple-600 font-medium">Com IA</div>
              </div>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mt-6 space-y-4">
            {/* Busca moderna */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar contatos do WhatsApp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Filtros modernos */}
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
                <option value="blocked">Bloqueados</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
              >
                <option value="lastMessage">Última mensagem</option>
                <option value="name">Nome</option>
                <option value="messageCount">Mensagens</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Lista de contatos */}
      <div className="space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
              <p className="text-gray-500">Carregando contatos...</p>
            </div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <div className="p-4 bg-gray-100 rounded-full mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contato encontrado</h3>
            <p className="text-gray-500 text-center mb-4">
              {searchQuery ? 'Tente ajustar os filtros de busca' : 'Sincronize seus contatos do WhatsApp para começar'}
            </p>
            {searchQuery && (
              <Button
                onClick={() => setSearchQuery('')}
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
              >
                Limpar busca
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => handleContactClick(contact)}
                className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all duration-200 group"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar com indicadores */}
                  <div className="relative flex-shrink-0">
                    <WhatsAppProfilePicture
                      jid={contact.whatsapp_jid || ''}
                      name={contact.whatsapp_name || contact.name}
                      size="md"
                      showPresence={true}
                    />
                    {contact.whatsapp_is_online && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" title="Online" />
                    )}
                  </div>

                  {/* Informações do contato */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {contact.whatsapp_name || contact.name || 'Contato sem nome'}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs px-2 py-0.5 ${getStatusColor(contact.status)}`}
                          >
                            {contact.status}
                          </Badge>
                          {contact.ai_enabled && (
                            <div className="flex items-center gap-1 text-xs text-purple-600">
                              <Bot className="w-3 h-3" />
                              <span>IA</span>
                            </div>
                          )}
                          {contact.whatsapp_verified && (
                            <div className="flex items-center gap-1 text-xs text-blue-600">
                              <CheckCircle className="w-3 h-3" />
                              <span>Verificado</span>
                            </div>
                          )}
                          {contact.whatsapp_business_name && (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <Building className="w-3 h-3" />
                              <span>Negócio</span>
                            </div>
                          )}
                          {contact.whatsapp_is_group && (
                            <div className="flex items-center gap-1 text-xs text-orange-600">
                              <Users className="w-3 h-3" />
                              <span>Grupo</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <MoreVertical className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>

                    {/* Informações de contato */}
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-gray-100 rounded">
                          <Phone className="w-3 h-3 text-gray-500" />
                        </div>
                        <span className="font-medium">{contact.phone}</span>
                      </div>
                      
                      {contact.whatsapp_message_count && contact.whatsapp_message_count > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-blue-100 rounded">
                            <MessageCircle className="w-3 h-3 text-blue-500" />
                          </div>
                          <span className="font-medium">{contact.whatsapp_message_count} mensagens</span>
                        </div>
                      )}

                      {contact.whatsapp_last_message_at && (
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-green-100 rounded">
                            <Calendar className="w-3 h-3 text-green-500" />
                          </div>
                          <span className="font-medium">{formatLastMessageTime(contact.whatsapp_last_message_at)}</span>
                        </div>
                      )}
                    </div>

                    {/* Informações de negócio */}
                    {contact.whatsapp_business_name && (
                      <div className="bg-green-50 rounded-lg p-3 mb-3 border border-green-100">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1 bg-green-100 rounded">
                            <Building className="w-3 h-3 text-green-600" />
                          </div>
                          <span className="font-semibold text-green-900">{contact.whatsapp_business_name}</span>
                          {contact.whatsapp_business_category && (
                            <Badge variant="outline" className="text-xs bg-white text-green-700 border-green-200">
                              {contact.whatsapp_business_category}
                            </Badge>
                          )}
                        </div>
                        {contact.whatsapp_business_description && (
                          <p className="text-sm text-green-700 mb-2">
                            {contact.whatsapp_business_description}
                          </p>
                        )}
                        {contact.whatsapp_business_website && (
                          <div className="flex items-center gap-2">
                            <Globe className="w-3 h-3 text-green-600" />
                            <a 
                              href={contact.whatsapp_business_website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-green-600 hover:underline truncate"
                            >
                              {contact.whatsapp_business_website}
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Informações de grupo */}
                    {contact.whatsapp_is_group && (
                      <div className="bg-orange-50 rounded-lg p-3 mb-3 border border-orange-100">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-orange-100 rounded">
                            <Users className="w-3 h-3 text-orange-600" />
                          </div>
                          <span className="font-semibold text-orange-900">{contact.whatsapp_group_subject || 'Grupo sem nome'}</span>
                          {contact.whatsapp_group_participants && (
                            <Badge variant="outline" className="text-xs bg-white text-orange-700 border-orange-200">
                              {JSON.parse(contact.whatsapp_group_participants).length} participantes
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Última mensagem */}
                    {contact.whatsapp_last_message_content && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageCircle className="w-3 h-3 text-gray-500" />
                          <span className="text-xs font-medium text-gray-500">Última mensagem</span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {contact.whatsapp_last_message_content}
                        </p>
                      </div>
                    )}

                    {/* Indicador de digitação */}
                    {contact.whatsapp_is_typing && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-xs text-blue-600 font-medium">Digitando...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
