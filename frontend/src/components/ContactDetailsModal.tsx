import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  User, 
  Phone, 
  Mail, 
  Building, 
  Calendar,
  MessageSquare,
  X,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  Clock,
  Tag,
  ChevronDown,
  Copy,
  Check,
  MessageCircle
} from 'lucide-react';

interface Contact {
  id: string;
  owner_id: string;
  atendimento_id?: string;
  chat_id?: string;
  business_id?: string;
  name_wpp?: string;
  name: string;
  full_name?: string;
  phone: string;
  email?: string;
  created_at: string;
  updated_at: string;
  // Campos adicionais que podem ser adicionados
  company?: string;
  gender?: string;
  status?: 'active' | 'inactive' | 'lead';
  pipeline?: string;
  tags?: string[];
  whatsapp_opted?: boolean;
  profile_image_url?: string;
  last_contact_at?: string;
}

interface ContactDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
  onEditContact?: (contact: Contact) => void;
  onDeleteContact?: (contact: Contact) => void;
}

const ContactDetailsModal: React.FC<ContactDetailsModalProps> = ({
  isOpen,
  onClose,
  contact,
  onEditContact,
  onDeleteContact
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'lead': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'lead': return 'Lead';
      case 'inactive': return 'Inativo';
      default: return 'Desconhecido';
    }
  };

  const handleOpenWhatsApp = () => {
    // Redirecionar para página WhatsApp com o contato selecionado
    window.location.href = `/whatsapp?contact=${contact.id}`;
  };

  const handleStartConversation = () => {
    // Redirecionar para WhatsApp com o contato selecionado
    window.location.href = `/whatsapp?contact=${contact.id}&phone=${contact.phone}`;
  };

  const handleEditContact = () => {
    if (onEditContact) {
      onEditContact(contact);
    }
  };

  const handleDeleteContact = () => {
    if (onDeleteContact) {
      onDeleteContact(contact);
    }
  };

  const handleConvertToLead = async () => {
    try {
      // Implementar conversão para lead
      console.log('Convertendo contato para lead:', contact.id);
      
      // Aqui você pode implementar a lógica para:
      // 1. Criar um lead na tabela leads
      // 2. Atualizar o status do contato para 'lead'
      // 3. Criar um ticket/atendimento_id
      // 4. Atualizar a interface
      
      // Por enquanto, apenas log
      console.log('Lead criado com sucesso!');
    } catch (error) {
      console.error('Erro ao converter contato em lead:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {contact.name}
                </DialogTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Detalhes do contato
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleEditContact}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Card - Modern Style */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-200/50 shadow-lg shadow-blue-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
            
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                {/* Left Side - Contact Info */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {contact.profileImage ? (
                      <img
                        className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
                        src={contact.profileImage}
                        alt={contact.name}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center border-4 border-white shadow-lg">
                        <User className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                    {contact.whatsapp_opted && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                        <MessageCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{contact.name}</h2>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(contact.status)}>
                        {getStatusText(contact.status)}
                      </Badge>
                      {contact.pipeline && (
                        <Badge variant="outline" className="text-blue-700 border-blue-300">
                          {contact.pipeline}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Right Side - Actions */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleStartConversation}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Iniciar Conversa
                  </Button>
                  {contact.status !== 'lead' && (
                    <Button
                      onClick={handleConvertToLead}
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Transformar em Lead
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Informações Básicas */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg shadow-gray-500/5 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 px-6 py-4 border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Informações Básicas</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Nome */}
              <div className="group">
                <label className="text-sm font-semibold text-gray-700 mb-3 block">Nome Completo</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200/60 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-200">
                      <span className="text-gray-800 font-medium text-sm">{contact.name}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(contact.name, 'name')}
                    className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    {copiedField === 'name' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Telefone */}
              <div className="group">
                <label className="text-sm font-semibold text-gray-700 mb-3 block">Telefone</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/60 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-200">
                      <span className="text-green-800 font-mono text-sm font-medium">{contact.phone}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(contact.phone, 'phone')}
                    className="p-3 hover:bg-green-100 rounded-xl transition-colors"
                  >
                    {copiedField === 'phone' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-green-500" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-green-600 mt-2 font-medium">Número do WhatsApp</p>
              </div>

              {/* Email */}
              {contact.email && (
                <div className="group">
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Email</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-200">
                        <span className="text-blue-800 font-medium text-sm">{contact.email}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(contact.email!, 'email')}
                      className="p-3 hover:bg-blue-100 rounded-xl transition-colors"
                    >
                      {copiedField === 'email' ? (
                        <Check className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-blue-500" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Empresa */}
              {contact.company && (
                <div className="group">
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Empresa</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200/60 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-200">
                        <span className="text-purple-800 font-medium text-sm">{contact.company}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(contact.company!, 'company')}
                      className="p-3 hover:bg-purple-100 rounded-xl transition-colors"
                    >
                      {copiedField === 'company' ? (
                        <Check className="w-4 h-4 text-purple-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-purple-500" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Informações do Sistema */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg shadow-gray-500/5 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 px-6 py-4 border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Informações do Sistema</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Data de Criação */}
                <div className="group">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/60 shadow-sm group-hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-700">Criado em</p>
                        <p className="text-sm text-blue-900 font-medium">{formatDate(contact.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Último Contato */}
                <div className="group">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/60 shadow-sm group-hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-700">Último Contato</p>
                        <p className="text-sm text-green-900 font-medium">{formatDate(contact.last_contact_at || contact.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-xl">
                    <Tag className="w-5 h-5 text-purple-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Tags do Contato</h4>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {contact.tags?.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-purple-700 border-purple-300">
                      {tag}
                    </Badge>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Tag
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center justify-between pt-6">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-8 py-3 rounded-xl border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Fechar
            </Button>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleEditContact}
                className="px-6 py-3 rounded-xl border-blue-300 text-blue-700 hover:bg-blue-50 transition-all duration-200"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteContact}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25 transition-all duration-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Contato
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactDetailsModal;
