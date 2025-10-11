import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RightDrawerModal,
  ModalSection,
  PersonalDetailSection,
  InfoField,
  TagList
} from '@/components/ui/right-drawer-modal';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Building2, 
  User, 
  DollarSign, 
  Clock, 
  Calendar,
  Edit,
  Trash2,
  CheckCircle,
  Tag,
  Plus,
  AlertCircle
} from 'lucide-react';
import { Lead } from '@/hooks/useLeads-fixed';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import EditLeadModal from './EditLeadModal';
import LeadWonModal from './LeadWonModal';
import LeadLostModal from './LeadLostModal';

interface LeadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onEdit?: (lead: Lead) => void;
  onDelete?: (leadId: string) => void;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  lead, 
  onEdit, 
  onDelete 
}) => {
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWonModalOpen, setIsWonModalOpen] = useState(false);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<string[]>(lead.tags || []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cold':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'won':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'lost':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'hot':
        return 'Quente';
      case 'cold':
        return 'Frio';
      case 'won':
        return 'Ganho';
      case 'lost':
        return 'Perdido';
      default:
        return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Urgente';
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      case 'low':
        return 'Baixa';
      default:
        return priority;
    }
  };

  const formatValue = (value?: number, currency: string = 'BRL') => {
    if (!value) return 'R$ 0,00';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleWhatsAppClick = () => {
    if (!lead.phone) {
      toast({
        title: "Número não encontrado",
        description: "Este lead não possui número de WhatsApp definido.",
        variant: "destructive",
      });
      return;
    }

    navigate(`/whatsapp?contact=${lead.phone}`);
    onClose();
  };

  const handleEmailClick = () => {
    if (!lead.email) {
      toast({
        title: "E-mail não encontrado",
        description: "Este lead não possui e-mail definido.",
        variant: "destructive",
      });
      return;
    }
    window.open(`mailto:${lead.email}`, '_blank');
  };

  const handlePhoneClick = () => {
    if (!lead.phone) {
      toast({
        title: "Número não encontrado",
        description: "Este lead não possui número de telefone definido.",
        variant: "destructive",
      });
      return;
    }
    window.open(`tel:${lead.phone}`, '_blank');
  };

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleWonClick = () => {
    setIsWonModalOpen(true);
  };

  const handleLostClick = () => {
    setIsLostModalOpen(true);
  };

  const handleDeleteClick = () => {
    if (onDelete && window.confirm('Tem certeza que deseja excluir este lead?')) {
      onDelete(lead.id);
      onClose();
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const getResponsibleName = () => {
    return lead.responsible_id || 'Sem responsável';
  };

  const getWaitingTime = () => {
    const lastContact = lead.updated_at || lead.created_at;
    if (!lastContact) return 'Sem contato';
    
    const now = new Date();
    const lastContactDate = new Date(lastContact);
    const diffInHours = Math.floor((now.getTime() - lastContactDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  const getDaysInFunnel = () => {
    const created = new Date(lead.created_at);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays;
  };

  const avatarElement = lead.profile_image_url ? (
    <img
      className="h-12 w-12 rounded-full object-cover border border-gray-200"
                      src={lead.profile_image_url}
                      alt={lead.name}
                    />
                  ) : (
    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center border border-gray-200">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
  );

  return (
    <>
      <RightDrawerModal
        open={isOpen}
        onClose={onClose}
        title="Detalhes do Lead"
        id={`ID #${lead.id.slice(-6)}`}
        actions={[
          {
            label: "Editar",
            variant: "outline",
            onClick: handleEditClick,
            icon: <Edit className="h-4 w-4" />
          },
          {
            label: "Aprovar",
            variant: "primary",
            onClick: handleWonClick,
            icon: <CheckCircle className="h-4 w-4" />
          }
        ]}
      >
        {/* Personal Detail Section */}
        <ModalSection title="Personal Detail">
          <PersonalDetailSection
            avatar={avatarElement}
            name={lead.name}
            contact={{
              phone: lead.phone,
              email: lead.email
            }}
          />
          <div className="mt-4 flex items-center gap-3">
            <Badge className={`px-2.5 py-0.5 text-xs font-medium ${getStatusColor(lead.status)}`}>
              {getStatusLabel(lead.status)}
            </Badge>
                    {lead.priority && (
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <span className={`w-2 h-2 rounded-full ${getPriorityColor(lead.priority)}`}></span>
                        {getPriorityLabel(lead.priority)}
                      </span>
                    )}
                  </div>
        </ModalSection>

        {/* Reason Section */}
        <ModalSection title="Reason">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-700">
                          {lead.description || 'Sem observações registradas.'}
                        </p>
                      </div>
        </ModalSection>

        {/* Diagnose Section */}
        <ModalSection title="Diagnose">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              Lead qualificado, potencial de conversão identificado
            </p>
                    </div>
          
          {/* Tags Section */}
          <div className="mt-4">
            <TagList 
              tags={tags} 
              onRemove={handleRemoveTag}
              onAdd={() => setIsAddingTag(true)}
            />
                        {isAddingTag && (
                          <div className="mt-3 flex gap-2">
                            <input
                              type="text"
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') handleAddTag();
                                if (e.key === 'Escape') { setIsAddingTag(false); setNewTag(''); }
                              }}
                              placeholder="Nova tag"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <Button onClick={handleAddTag} size="sm">Adicionar</Button>
                          </div>
                        )}
                      </div>
        </ModalSection>

        {/* Booking Information Section */}
        <ModalSection title="Booking Information">
          <InfoField
            label="Data de Criação"
            value={formatDateTime(lead.created_at)}
            icon={<Calendar className="h-4 w-4 text-gray-500" />}
          />
          <InfoField
            label="Tipo de Lead"
            value="Qualificado"
            icon={<Tag className="h-4 w-4 text-gray-500" />}
          />
          {lead.company && (
            <InfoField
              label="Empresa"
              value={lead.company}
              icon={<Building2 className="h-4 w-4 text-gray-500" />}
            />
          )}
        </ModalSection>

        {/* Commercial Information */}
        <ModalSection title="Commercial Information">
          <div className="grid grid-cols-1 gap-4">
                    {lead.value && (
                      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                        <DollarSign className="h-6 w-6 text-green-600" />
                        <div>
                          <p className="text-xs text-green-700">Valor do Lead</p>
                          <p className="text-lg font-semibold text-green-800">{formatValue(lead.value, lead.currency)}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <Clock className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="text-xs text-blue-700">Tempo no Funil</p>
                        <p className="text-lg font-semibold text-blue-800">{getDaysInFunnel()} dias</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-100">
                      <AlertCircle className="h-6 w-6 text-orange-600" />
                      <div>
                        <p className="text-xs text-orange-700">Última Interação</p>
                        <p className="text-lg font-semibold text-orange-800">{getWaitingTime()}</p>
                      </div>
                    </div>
                  </div>
        </ModalSection>

        {/* Quick Actions */}
        <ModalSection title="Quick Actions">
          <div className="space-y-3">
                    <Button onClick={handleWhatsAppClick} className="w-full justify-start gap-3 bg-green-600 hover:bg-green-700 text-white" disabled={!lead.phone}>
                      <MessageSquare className="h-5 w-5" /> WhatsApp
                    </Button>
                    <Button onClick={handleEmailClick} variant="outline" className="w-full justify-start gap-3" disabled={!lead.email}>
                      <Mail className="h-5 w-5" /> Enviar E-mail
                    </Button>
                    <Button onClick={handlePhoneClick} variant="outline" className="w-full justify-start gap-3" disabled={!lead.phone}>
                      <Phone className="h-5 w-5" /> Ligar
                    </Button>
                    {onDelete && (
                      <Button onClick={handleDeleteClick} variant="outline" className="w-full justify-start gap-3 text-red-600 border-red-300 hover:bg-red-50">
                        <Trash2 className="h-5 w-5" /> Excluir Lead
                      </Button>
                    )}
                  </div>
        </ModalSection>
      </RightDrawerModal>

      {/* Modais */}
      <EditLeadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        lead={lead}
      />

      <LeadWonModal
        isOpen={isWonModalOpen}
        onClose={() => setIsWonModalOpen(false)}
        lead={lead}
        onConfirm={async (leadId: string) => { 
          onClose();
          return true; 
        }}
      />

      <LeadLostModal
        isOpen={isLostModalOpen}
        onClose={() => setIsLostModalOpen(false)}
        lead={lead}
        onConfirm={async (leadId: string, deleteContact: boolean) => { 
          onClose();
          return true; 
        }}
      />
    </>
  );
};

export default LeadDetailModal;
