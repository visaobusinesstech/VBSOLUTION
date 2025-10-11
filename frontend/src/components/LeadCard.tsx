import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  X, 
  MoreHorizontal,
  Building2,
  User,
  Mail,
  Tag,
  Trash2
} from 'lucide-react';
import { useLeads, Lead } from '@/hooks/useLeads-fixed';
import { FunnelStage } from '@/hooks/useFunnelStages';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import LeadWonModal from './LeadWonModal';
import LeadLostModal from './LeadLostModal';
import EditLeadModal from './EditLeadModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeadCardProps {
  lead: Lead;
  viewMode?: 'kanban' | 'list';
  onMove: (newStageId: string) => void;
  availableStages: FunnelStage[];
  onDelete?: (leadId: string) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ 
  lead, 
  viewMode = 'kanban', 
  onMove, 
  availableStages,
  onDelete
}) => {
  const navigate = useNavigate();
  const { markLeadAsWon, markLeadAsLost } = useLeads();
  const [isWonModalOpen, setIsWonModalOpen] = useState(false);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleWhatsAppClick = () => {
    if (!lead.phone) {
      toast({
        title: "Número não encontrado",
        description: "Este lead não possui número de WhatsApp definido.",
        variant: "destructive",
      });
      return;
    }

    // Navegar para WhatsApp com o lead específico
    navigate(`/whatsapp?contact=${lead.phone}`);
  };

  const handleWonClick = () => {
    setIsWonModalOpen(true);
  };

  const handleLostClick = () => {
    setIsLostModalOpen(true);
  };

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

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
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  if (viewMode === 'list') {
    return (
      <>
        <div className="flex items-center px-3 py-3 h-14 hover:bg-gray-50 transition-colors gap-2">
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <div className="flex flex-col min-w-0">
              <span className="text-sm text-gray-900 truncate font-medium">{lead.name}</span>
              <span className="text-xs text-gray-400">
                {lead.email || lead.phone || 'Sem contato'}
              </span>
            </div>
          </div>
          <div className="w-20 flex items-center justify-center">
            <Badge className={`text-xs ${getStatusColor(lead.status)}`}>
              {lead.status === 'hot' ? 'Quente' : lead.status === 'cold' ? 'Frio' : lead.status}
            </Badge>
          </div>
          <div className="w-24 flex items-center justify-center gap-2 text-sm text-gray-600">
            <span className="truncate max-w-20">
              {lead.company || 'Sem empresa'}
            </span>
          </div>
          <div className="w-24 flex items-center justify-center gap-2 text-sm text-gray-600">
            <span className="truncate max-w-20">
              {lead.phone || lead.email || 'Sem contato'}
            </span>
          </div>
          <div className="w-20 flex items-center justify-center gap-2 text-sm text-gray-600">
            <span className="truncate">
              {lead.value ? formatValue(lead.value, lead.currency) : 'Sem valor'}
            </span>
          </div>
          <div className="w-20 flex items-center justify-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4 text-gray-400" />
            <span className="truncate">
              {lead.stage?.name || 'Sem etapa'}
            </span>
          </div>
          <div className="w-24 flex items-center justify-center gap-1 text-sm text-gray-600">
            {lead.tags && lead.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {lead.tags.slice(0, 1).map((tag, index) => (
                  <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    <Tag className="h-2 w-2" />
                    {tag}
                  </span>
                ))}
                {lead.tags.length > 1 && (
                  <span className="text-xs text-gray-500">+{lead.tags.length - 1}</span>
                )}
              </div>
            ) : (
              <span className="text-gray-400">Sem tags</span>
            )}
          </div>
          <div className="w-16 flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleWhatsAppClick}
              className="h-6 w-6 p-0 hover:bg-gray-200"
              title={lead.phone ? 'Abrir WhatsApp' : 'Número não definido'}
            >
              <svg className="h-3 w-3 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
              className="h-6 w-6 p-0 hover:bg-gray-200"
              title={lead.email ? 'Enviar E-mail' : 'E-mail não definido'}
              disabled={!lead.email}
            >
              <Mail className="h-3 w-3 text-blue-600" />
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(lead.id);
                }}
                className="h-6 w-6 p-0 hover:bg-red-50 text-red-500 hover:text-red-700"
                title="Excluir lead"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Modais */}
        <LeadWonModal
          isOpen={isWonModalOpen}
          onClose={() => setIsWonModalOpen(false)}
          lead={lead}
          onConfirm={markLeadAsWon}
        />

        <LeadLostModal
          isOpen={isLostModalOpen}
          onClose={() => setIsLostModalOpen(false)}
          lead={lead}
          onConfirm={markLeadAsLost}
        />

        <EditLeadModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          lead={lead}
        />
      </>
    );
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          {/* Header do card */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              {lead.company && (
                <div className="text-xs text-gray-600 mb-1">{lead.company}</div>
              )}
              <h3 className="font-medium text-blue-600 text-sm">{lead.name}</h3>
            </div>
            <Badge className={`text-xs ${getStatusColor(lead.status)}`}>
              {lead.status === 'hot' ? 'Quente' : lead.status === 'cold' ? 'Frio' : lead.status}
            </Badge>
          </div>

          {/* Informações do lead */}
          <div className="space-y-2 mb-3">
            {lead.phone && (
              <div className="text-xs text-gray-600">
                📞 {lead.phone}
              </div>
            )}
            {lead.email && (
              <div className="text-xs text-gray-600">
                ✉️ {lead.email}
              </div>
            )}
          </div>

          {/* Footer do card */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Valor */}
              {lead.value && (
                <div className="text-xs font-medium text-gray-700">
                  {formatValue(lead.value, lead.currency)}
                </div>
              )}
              
              {/* Tempo no funil */}
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{formatDaysInFunnel(lead.days_in_funnel || 0)}</span>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleWhatsAppClick}
                className="h-6 w-6 p-0"
                title={lead.phone ? 'Abrir WhatsApp' : 'Número não definido'}
              >
                <MessageSquare className="h-3 w-3 text-green-600" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleWonClick}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                title="Marcar como Ganho"
              >
                <CheckCircle className="h-3 w-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLostClick}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                title="Marcar como Perdido"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modais */}
      <LeadWonModal
        isOpen={isWonModalOpen}
        onClose={() => setIsWonModalOpen(false)}
        lead={lead}
        onConfirm={markLeadAsWon}
      />

      <LeadLostModal
        isOpen={isLostModalOpen}
        onClose={() => setIsLostModalOpen(false)}
        lead={lead}
        onConfirm={markLeadAsLost}
      />

      <EditLeadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        lead={lead}
      />
    </>
  );
};

export default LeadCard;

