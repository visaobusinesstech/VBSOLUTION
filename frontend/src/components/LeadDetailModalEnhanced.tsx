import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  RightDrawerModal,
  ModalSection,
  InfoField
} from '@/components/ui/right-drawer-modal';
import { 
  X, 
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
  MapPin,
  Globe,
  FileText,
  TrendingUp,
  Users,
  Star,
  AlertCircle,
  Package,
  BarChart3,
  Target,
  Activity,
  Zap,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Timer,
  Award,
  TrendingDown
} from 'lucide-react';
import { useLeads, Lead } from '@/hooks/useLeads-fixed';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import EditLeadModal from './EditLeadModal';
import LeadWonModal from './LeadWonModal';
import LeadLostModal from './LeadLostModal';
import { useProducts } from '@/hooks/useProducts';
import { useContacts } from '@/hooks/useContacts';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useFunnelStages } from '@/hooks/useFunnelStages';

interface LeadDetailModalEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onEdit?: (lead: Lead) => void;
  onDelete?: (leadId: string) => void;
}

interface LeadKPIs {
  conversionProbability: number;
  timeInStage: number;
  stageProgress: number;
  valuePerDay: number;
  engagementScore: number;
  priorityScore: number;
  nextActionDays: number;
  riskLevel: 'low' | 'medium' | 'high';
}

const LeadDetailModalEnhanced: React.FC<LeadDetailModalEnhancedProps> = ({ 
  isOpen, 
  onClose, 
  lead, 
  onEdit, 
  onDelete 
}) => {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { contacts } = useContacts();
  const { suppliers } = useSuppliers();
  const { stages } = useFunnelStages();
  const { updateLead } = useLeads();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWonModalOpen, setIsWonModalOpen] = useState(false);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<string[]>(lead.tags || []);
  const [showKPIs, setShowKPIs] = useState(false);
  const [isSavingTags, setIsSavingTags] = useState(false);
  const [kpis, setKpis] = useState<LeadKPIs>({
    conversionProbability: 0,
    timeInStage: 0,
    stageProgress: 0,
    valuePerDay: 0,
    engagementScore: 0,
    priorityScore: 0,
    nextActionDays: 0,
    riskLevel: 'low'
  });

  // Buscar dados relacionados
  const relatedProduct = products.find(p => p.id === lead.product_id);
  const relatedContact = contacts.find(c => c.id === lead.contact_id);
  const relatedResponsible = suppliers.find(s => s.id === lead.responsible_id);
  const currentStage = stages.find(s => s.id === lead.stage_id);

  // Calcular KPIs
  useEffect(() => {
    if (lead && stages.length > 0) {
      calculateKPIs();
    }
  }, [lead, stages]);

  const calculateKPIs = () => {
    const now = new Date();
    const createdDate = new Date(lead.created_at);
    const daysSinceCreation = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calcular probabilidade de conversão baseada no estágio
    const stageIndex = stages.findIndex(s => s.id === lead.stage_id);
    const totalStages = stages.length;
    const conversionProbability = stageIndex >= 0 ? ((stageIndex + 1) / totalStages) * 100 : 0;
    
    // Calcular tempo no estágio atual
    const stageStartDate = new Date(lead.updated_at || lead.created_at);
    const timeInStage = Math.floor((now.getTime() - stageStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calcular progresso no funil
    const stageProgress = stageIndex >= 0 ? ((stageIndex + 1) / totalStages) * 100 : 0;
    
    // Calcular valor por dia
    const valuePerDay = daysSinceCreation > 0 ? (lead.value || 0) / daysSinceCreation : 0;
    
    // Calcular score de engajamento (baseado em atividades)
    const engagementScore = Math.min(100, (lead.notes ? 20 : 0) + (lead.phone ? 30 : 0) + (lead.email ? 30 : 0) + (tags.length * 5));
    
    // Calcular score de prioridade
    const priorityScore = lead.priority === 'urgent' ? 100 : lead.priority === 'high' ? 80 : lead.priority === 'medium' ? 60 : 40;
    
    // Calcular dias até próxima ação
    const nextActionDays = Math.max(0, 7 - timeInStage);
    
    // Determinar nível de risco
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (timeInStage > 14 || engagementScore < 30) riskLevel = 'high';
    else if (timeInStage > 7 || engagementScore < 60) riskLevel = 'medium';
    
    setKpis({
      conversionProbability,
      timeInStage,
      stageProgress,
      valuePerDay,
      engagementScore,
      priorityScore,
      nextActionDays,
      riskLevel
    });
  };

  // Atualizar tags quando o lead mudar
  useEffect(() => {
    setTags(lead.tags || []);
  }, [lead.tags]);

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(lead);
    }
    setIsEditModalOpen(true);
  };

  const handleWonClick = () => {
    setIsWonModalOpen(true);
  };

  const handleLostClick = () => {
    setIsLostModalOpen(true);
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

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    
    setIsSavingTags(true);
    try {
      const updatedTags = [...tags, newTag.trim()];
      await updateLead(lead.id, { tags: updatedTags });
      setTags(updatedTags);
      setNewTag('');
      setIsAddingTag(false);
          toast({
            title: "Tag adicionada",
        description: `Tag "${newTag.trim()}" foi adicionada ao lead.`,
      });
      } catch (error) {
        toast({
          title: "Erro",
        description: "Erro ao adicionar tag.",
          variant: "destructive",
        });
      } finally {
        setIsSavingTags(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    setIsSavingTags(true);
    try {
      const updatedTags = tags.filter(tag => tag !== tagToRemove);
      await updateLead(lead.id, { tags: updatedTags });
      setTags(updatedTags);
        toast({
          title: "Tag removida",
        description: `Tag "${tagToRemove}" foi removida do lead.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover tag.",
        variant: "destructive",
      });
    } finally {
      setIsSavingTags(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won': return 'bg-green-500';
      case 'lost': return 'bg-red-500';
      case 'frozen': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatValue = (value?: number, currency: string = 'BRL') => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não definido';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getDaysInFunnel = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <>
      <RightDrawerModal
        open={isOpen}
        onClose={onClose}
        title="Detalhes do Lead"
        id={`ID #${lead.id.slice(-6)}`}
        actions={[
          {
            label: "Fechar",
            variant: "outline",
            onClick: onClose,
            icon: <X className="h-4 w-4" />
          },
          {
            label: "Editar",
            variant: "primary",
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
        <div className="space-y-6">
          {/* Header com Avatar e Informações Básicas */}
          <ModalSection title="Informações do Lead">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="relative">
                  {lead.profile_image_url ? (
                    <img
                      className="h-16 w-16 rounded-full object-cover border-4 border-white shadow-lg"
                      src={lead.profile_image_url}
                      alt={lead.name}
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-4 border-white shadow-lg">
                      <User className="h-8 w-8 text-white" />
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                </div>
              <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-xl font-bold text-gray-900">{lead.name}</h2>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getPriorityColor(lead.priority)} text-white text-xs px-2 py-1`}>
                      {lead.priority?.toUpperCase() || 'MÉDIA'}
                    </Badge>
                    <Badge className={`${getStatusColor(lead.status)} text-white text-xs px-2 py-1`}>
                      {lead.status?.toUpperCase() || 'ATIVO'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  {lead.company && (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      <span>{lead.company}</span>
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      <span>{lead.phone}</span>
                    </div>
                  )}
                  {lead.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      <span>{lead.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ModalSection>

          {/* Informações Principais */}
          <ModalSection title="Detalhes do Lead">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoField
                label="Valor"
                value={formatValue(lead.value, lead.currency)}
                icon={<DollarSign className="h-4 w-4" />}
              />
              <InfoField
                label="Estágio"
                value={currentStage?.name || 'Não definido'}
                icon={<Target className="h-4 w-4" />}
              />
              <InfoField
                label="Data de Criação"
                value={formatDate(lead.created_at)}
                icon={<Calendar className="h-4 w-4" />}
              />
              <InfoField
                label="Dias no Funil"
                value={`${getDaysInFunnel(lead.created_at)} dias`}
                icon={<Clock className="h-4 w-4" />}
              />
            </div>
          </ModalSection>

          {/* KPIs */}
          <ModalSection title="Métricas e KPIs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Conversão</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">{Math.round(kpis.conversionProbability)}%</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">No Estágio</span>
            </div>
                <div className="text-2xl font-bold text-green-900">{kpis.timeInStage}d</div>
          </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Engajamento</span>
                          </div>
                <div className="text-2xl font-bold text-purple-900">{kpis.engagementScore}</div>
                        </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">Valor/Dia</span>
                          </div>
                <div className="text-2xl font-bold text-orange-900">R$ {Math.round(kpis.valuePerDay)}</div>
                          </div>
                        </div>
          </ModalSection>

                    {/* Tags */}
          <ModalSection title="Tags">
            <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {tag}
                              <button 
                                onClick={() => handleRemoveTag(tag)} 
                      className="ml-1 hover:text-red-600"
                                disabled={isSavingTags}
                              >
                                <X className="h-3 w-3" />
                              </button>
                  </Badge>
                ))}
                        </div>
              
              {isAddingTag ? (
                <div className="flex gap-2">
                            <input
                              type="text"
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              placeholder="Nova tag"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button size="sm" onClick={handleAddTag} disabled={isSavingTags}>
                    <Plus className="h-4 w-4" />
                            </Button>
                          </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingTag(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Tag
                </Button>
                        )}
                      </div>
          </ModalSection>

                    {/* Observações */}
                    {lead.notes && (
            <ModalSection title="Observações">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-gray-700">{lead.notes}</p>
              </div>
            </ModalSection>
          )}

          {/* Ações Rápidas */}
          <ModalSection title="Ações">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleWhatsAppClick}
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                WhatsApp
                    </Button>
              <Button
                variant="outline"
                onClick={handleWonClick}
                className="flex items-center gap-2 text-green-600 hover:text-green-700"
              >
                <CheckCircle className="h-4 w-4" />
                Ganhar
                    </Button>
              <Button
                variant="outline"
                onClick={handleLostClick}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <AlertCircle className="h-4 w-4" />
                Perder
                      </Button>
            </div>
          </ModalSection>
          </div>
      </RightDrawerModal>

      {/* Modais auxiliares */}
      <EditLeadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        lead={lead}
      />

      <LeadWonModal
        isOpen={isWonModalOpen}
        onClose={() => setIsWonModalOpen(false)}
        lead={lead}
      />

      <LeadLostModal
        isOpen={isLostModalOpen}
        onClose={() => setIsLostModalOpen(false)}
        lead={lead}
      />
    </>
  );
};

export default LeadDetailModalEnhanced;