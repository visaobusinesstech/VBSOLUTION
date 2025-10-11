import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  CheckCircle, 
  X, 
  MoreHorizontal,
  Building2,
  User,
  Edit,
  Trash2,
  Mail,
  Plus,
  Tag
} from 'lucide-react';
import { Lead, useLeads } from '@/hooks/useLeads-fixed';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import LeadWonModal from './LeadWonModal';
import LeadLostModal from './LeadLostModal';
import EditLeadModal from './EditLeadModal';
import LeadDetailModalEnhanced from './LeadDetailModalEnhanced';

interface LeadKanbanCardProps {
  lead: Lead;
  onEdit?: (lead: Lead) => void;
  onDelete?: (leadId: string) => void;
}

// Ícone do WhatsApp (SVG)
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    className={className}
    fill="currentColor"
  >
    <path d="M20.52 3.48A11.77 11.77 0 0 0 12.04 0C5.45 0 .11 5.34.11 11.93c0 2.1.55 4.07 1.52 5.8L0 24l6.44-1.68a11.86 11.86 0 0 0 5.6 1.43h.01c6.59 0 11.93-5.34 11.93-11.93 0-3.19-1.24-6.19-3.46-8.34Zm-8.47 18.2h-.01a9.8 9.8 0 0 1-4.99-1.36l-.36-.21-3.82.99 1.02-3.72-.24-.38a9.83 9.83 0 1 1 18.39-5.07 9.82 9.82 0 0 1-9.99 9.75ZM17.4 14.3c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.18.2-.35.22-.65.08-.3-.15-1.24-.46-2.36-1.47-.87-.78-1.46-1.74-1.63-2.04-.17-.3-.02-.47.13-.62.13-.13.3-.35.44-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.48 0 1.46 1.08 2.87 1.24 3.07.15.2 2.12 3.23 5.15 4.52.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.12-.27-.2-.57-.35Z"/>
  </svg>
);

const LeadKanbanCard: React.FC<LeadKanbanCardProps> = ({ 
  lead, 
  onEdit, 
  onDelete 
}) => {
  console.log('🔍 LeadKanbanCard renderizado para lead:', lead.name, 'onDelete:', !!onDelete);
  const navigate = useNavigate();
  const { updateLead } = useLeads();
  const [isHovered, setIsHovered] = useState(false);
  const [isWonModalOpen, setIsWonModalOpen] = useState(false);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<string[]>(lead.tags || []);
  const [isSavingTags, setIsSavingTags] = useState(false);

  // Atualizar tags quando o lead mudar
  useEffect(() => {
    setTags(lead.tags || []);
  }, [lead.tags]);

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

  const formatDaysInFunnel = (days: number) => {
    if (days === 0) return 'Hoje';
    if (days === 1) return '1 dia';
    return `${days} dias`;
  };

  const formatValue = (value?: number, currency: string = 'BRL') => {
    if (!value) return 'R$ 0,00';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
  };

  const handleWonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsWonModalOpen(true);
  };

  const handleLostClick = () => {
    // Abrir modal de lead perdido
    setIsLostModalOpen(true);
  };

  const handleEditClick = () => {
    setIsEditModalOpen(true);
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

  const handleAddTag = async () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const newTags = [...tags, newTag.trim()];
      setTags(newTags);
      setNewTag('');
      setIsAddingTag(false);
      
      // Salvar no banco
      setIsSavingTags(true);
      try {
        const success = await updateLead(lead.id, { tags: newTags });
        if (success) {
          // Atualizar o lead local para refletir as mudanças
          const updatedLead = { ...lead, tags: newTags };
          // Forçar re-render do componente pai se necessário
          if (onEdit) {
            onEdit(updatedLead);
          }
          
          toast({
            title: "Tag adicionada",
            description: "Tag adicionada com sucesso.",
          });
        } else {
          toast({
            title: "Erro",
            description: "Erro ao salvar tag. Tente novamente.",
            variant: "destructive",
          });
          // Reverter mudança local
          setTags(tags);
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao salvar tag. Tente novamente.",
          variant: "destructive",
        });
        // Reverter mudança local
        setTags(tags);
      } finally {
        setIsSavingTags(false);
      }
    } else {
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    
    // Salvar no banco
    setIsSavingTags(true);
    try {
      const success = await updateLead(lead.id, { tags: newTags });
      if (success) {
        // Atualizar o lead local para refletir as mudanças
        const updatedLead = { ...lead, tags: newTags };
        // Forçar re-render do componente pai se necessário
        if (onEdit) {
          onEdit(updatedLead);
        }
        
        toast({
          title: "Tag removida",
          description: "Tag removida com sucesso.",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao remover tag. Tente novamente.",
          variant: "destructive",
        });
        // Reverter mudança local
        setTags(tags);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover tag. Tente novamente.",
        variant: "destructive",
      });
      // Reverter mudança local
      setTags(tags);
    } finally {
      setIsSavingTags(false);
    }
  };

  const getResponsibleName = () => {
    // Aqui você pode implementar a lógica para buscar o nome do responsável
    // Por enquanto, retornando um valor padrão
    return lead.responsible_id || 'Sem responsável';
  };

  const getWaitingTime = () => {
    // Calcular tempo de espera baseado na última interação
    // Por enquanto, retornando um valor exemplo
    const lastContact = lead.updated_at || lead.created_at;
    if (!lastContact) return 'Sem contato';
    
    const now = new Date();
    const lastContactDate = new Date(lastContact);
    const diffInHours = Math.floor((now.getTime() - lastContactDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  return (
    <>
      <div
        className="group bg-white/95 backdrop-blur-sm border border-gray-100 rounded-lg shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          // Evitar abrir modal se clicou em botões
          if ((e.target as HTMLElement).closest('button')) {
            return;
          }
          setIsDetailModalOpen(true);
        }}
      >
        <div className="p-3 pb-2">
          {/* Header compacto com foto e título */}
          <div className="flex items-center gap-2 mb-2">
            {/* Foto do contato WhatsApp */}
            <div className="relative">
              {lead.profile_image_url ? (
                <img
                  className="h-8 w-8 rounded-full object-cover"
                  src={lead.profile_image_url}
                  alt={lead.name}
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              )}
              {/* Indicador de status do WhatsApp */}
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-medium text-gray-900 leading-tight truncate">
                {lead.name}
              </h4>
              {lead.company && (
                <p className="text-[11px] text-gray-500 truncate">{lead.company}</p>
              )}
            </div>
            
            {/* Ações visíveis no hover */}
            <div className={`flex items-center gap-1.5 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick();
                  }}
                  className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                  title="Editar lead"
                >
                  <Edit size={12} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log('🗑️ Botão de excluir clicado para lead:', lead.id);
                    try {
                      await onDelete(lead.id);
                      console.log('✅ Lead excluído com sucesso');
                    } catch (error) {
                      console.error('❌ Erro ao excluir lead:', error);
                    }
                  }}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                  title="Excluir lead"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Informações compactas */}
          <div className="space-y-1.5 mb-2">
            {lead.phone && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                <WhatsAppIcon className="h-3 w-3 text-green-600" />
                <span className="truncate">{lead.phone}</span>
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                <Mail className="h-3 w-3" />
                <span className="truncate">{lead.email}</span>
              </div>
            )}
            {/* Valor do lead (se existir) - movido para ficar abaixo do e-mail */}
            {lead.value && (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-green-600">
                <span>{formatValue(lead.value, lead.currency)}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-[10px] px-1.5 py-0.5">
                {tag}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTag(tag);
                  }}
                  className="ml-1 hover:text-red-500"
                  disabled={isSavingTags}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsAddingTag(true);
              }}
              className="text-[10px] text-blue-500 hover:text-blue-700 flex items-center gap-1"
              disabled={isSavingTags}
            >
              <Plus className="h-3 w-3" />
              <Tag className="h-3 w-3" />
            </button>
            {isSavingTags && (
              <div className="text-[10px] text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3 animate-spin" />
                Salvando...
              </div>
            )}
          </div>

          {/* Input para nova tag */}
          {isAddingTag && (
            <div className="mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleAddTag();
                  if (e.key === 'Escape') {
                    setIsAddingTag(false);
                    setNewTag('');
                  }
                }}
                onBlur={handleAddTag}
                placeholder="Nova tag"
                className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
          )}

          {/* Footer compacto com responsável e tempo de espera */}
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1 text-gray-600">
              <User className="h-3 w-3" />
              <span className="truncate max-w-24">{getResponsibleName()}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="h-3 w-3" />
              <span>{getWaitingTime()}</span>
            </div>
          </div>

          {/* Ações compactas */}
          <div className="flex items-center justify-between mt-2 pt-1">
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleWhatsAppClick}
                className="h-6 w-6 p-0"
                title={lead.phone ? 'Abrir WhatsApp' : 'Número não definido'}
              >
                <WhatsAppIcon className="h-3.5 w-3.5 text-green-600" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEmailClick}
                className="h-6 w-6 p-0"
                title={lead.email ? 'Enviar E-mail' : 'E-mail não definido'}
              >
                <Mail className="h-3.5 w-3.5 text-blue-600" />
              </Button>
            </div>
            
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleWonClick}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                title="Marcar como Ganho"
              >
                <CheckCircle className="h-3.5 w-3.5" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLostClick}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                title="Marcar como Perdido"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modais */}
      <LeadWonModal
        isOpen={isWonModalOpen}
        onClose={() => setIsWonModalOpen(false)}
        lead={lead}
        onConfirm={async (leadId: string) => { return true; }} // Implementar se necessário
      />

      <LeadLostModal
        isOpen={isLostModalOpen}
        onClose={() => setIsLostModalOpen(false)}
        lead={lead}
        onConfirm={async (leadId: string, deleteContact: boolean) => {
          if (onDelete) {
            try {
              await onDelete(leadId);
              return true;
            } catch (error) {
              console.error('❌ Erro ao excluir lead:', error);
              return false;
            }
          }
          return false;
        }}
      />

      <EditLeadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        lead={lead}
      />

      <LeadDetailModalEnhanced
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        lead={lead}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
};

export default LeadKanbanCard;

