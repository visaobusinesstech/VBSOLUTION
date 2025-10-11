import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useSequentialData } from '@/hooks/useSequentialData';
import { useLeads, Lead } from '@/hooks/useLeads-fixed';
import { FunnelStage } from '@/hooks/useFunnelStages';
import { usePipeline } from '@/hooks/usePipeline';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { 
  Plus, 
  Settings, 
  List, 
  Kanban,
  Calendar,
  BarChart3,
  AlignJustify,
  Zap,
  GripVertical,
  Maximize2,
  Minimize2,
  ArrowUpDown
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { toast } from '@/hooks/use-toast';
import LeadCard from './LeadCard';
import LeadKanbanCard from './LeadKanbanCard';
import CreateLeadModal from './CreateLeadModal';
import PipelineEditorModal from './PipelineEditorModal';
import LeadDetailModal from './LeadDetailModal';
import FilterBar from './FilterBar';
import LeadsSalesDashboard from './dashboard/LeadsSalesDashboard';
import { cn } from '@/lib/utils';

interface LeadsKanbanProps {
  className?: string;
}

// Componente de coluna do Kanban - EXATO DA PÁGINA ACTIVITIES
const LeadsKanbanColumn: React.FC<{
  column: FunnelStage;
  leads: Lead[];
  onAddLead?: (stageId: string) => void;
  onEditLead?: (lead: Lead) => void;
  onDeleteLead?: (leadId: string) => void;
  isFullscreen?: boolean;
}> = ({ column, leads, onAddLead, onEditLead, onDeleteLead, isFullscreen }) => {
  // Calcular valor total da etapa
  const totalValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0);
  
  const formatValue = (value: number) => {
    if (value === 0) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className={cn(isFullscreen ? 'w-full' : 'w-48')}>
      {/* Header da coluna - EXATO DA PÁGINA ACTIVITIES */}
      <div className="mb-6">
        {/* Nome da etapa e quantidade */}
        <div className="flex items-center gap-4 justify-between mb-2">
          <div className="flex items-center gap-4">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: column.color }}
            />
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide flex-shrink-0 truncate">
              {column.name}
            </h3>
          </div>
          {/* Quantidade */}
          <span 
            className="text-xs font-medium px-2 py-1 rounded-full flex-shrink-0"
            style={{ 
              backgroundColor: column.color + '20',
              color: column.color
            }}
          >
            {leads.length}
          </span>
        </div>
        {/* Valor negociado abaixo */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
            <span className="text-xs font-medium text-black">
              {formatValue(totalValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Lista de leads */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "space-y-3 min-h-[200px] p-2 rounded-lg transition-colors",
              isFullscreen ? 'w-full' : 'w-48',
              snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''
            )}
          >
            {(leads || []).filter(lead => lead && lead.id).map((lead, index) => (
              <Draggable
                key={`draggable-${lead.id}`}
                draggableId={lead.id}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={cn(
                      snapshot.isDragging ? 'opacity-50 scale-95 shadow-xl' : ''
                    )}
                  >
                    <LeadKanbanCard
                      lead={lead}
                      onEdit={onEditLead}
                      onDelete={onDeleteLead}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {/* Botão adicionar lead */}
            {onAddLead && (
              <Button 
                variant="ghost"
                className="w-full h-10 text-left text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-dashed border-gray-300 hover:border-gray-400 rounded-lg"
                onClick={() => {
                  onAddLead(column.id);
                }}
              >
                <Plus size={16} className="mr-2" />
                Adicionar Lead
              </Button>
            )}

            {/* Estado vazio */}
            {leads.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <div className="text-sm">Nenhum lead</div>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

const LeadsKanban: React.FC<LeadsKanbanProps> = ({ className }) => {
  const { topBarColor } = useTheme();
  const { sidebarExpanded, expandSidebarFromMenu } = useSidebar();
  const { leads, stages, loading, error, refetch } = useSequentialData();
  const { pipelines } = usePipeline();
  
  // Importar funções individuais do useLeads
  const { moveLeadToStage, deleteLead } = useLeads();
  
  
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenLayout, setFullscreenLayout] = useState<'fit' | 'scroll'>('fit');

  React.useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const enterFullscreen = async () => {
    try {
      if (containerRef.current && !document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      }
    } catch (e) {
      console.error('Falha ao entrar em tela cheia', e);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.error('Falha ao sair de tela cheia', e);
    }
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };

  const toggleFullscreenLayout = () => {
    setFullscreenLayout(prev => (prev === 'fit' ? 'scroll' : 'fit'));
  };

  const [viewMode, setViewMode] = useState<'kanban' | 'lista' | 'calendario' | 'dashboard'>('kanban');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [isLeadDetailModalOpen, setIsLeadDetailModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    dateRange: 'all' as 'all' | 'today' | 'week' | 'month' | 'overdue',
    responsibleId: 'all',
    archived: false,
    workGroup: 'all',
    pipelineId: 'all',
    dateFrom: '',
    dateTo: ''
  });

  // Filtrar leads baseado nos filtros aplicados
  const filteredLeads = leads.filter(lead => {
    // Debug temporário
    if (filters.search && !lead.name?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !lead.company?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.responsibleId !== 'all' && lead.responsible_id !== filters.responsibleId) {
      return false;
    }
    if (filters.archived && lead.status !== 'lost') {
      return false;
    }
    // Filtro por pipeline - filtrar etapas que pertencem à pipeline selecionada
    if (filters.pipelineId !== 'all') {
      const leadStage = stages.find(stage => stage.id === lead.stage_id);
      if (!leadStage || leadStage.pipeline_id !== filters.pipelineId) {
        return false;
      }
    }
    return true;
  });
  

  // Botões de visualização exatos da página Activities
  const viewButtons = [
    { 
      id: 'kanban', 
      label: 'Quadro',
      icon: Kanban,
      active: viewMode === 'kanban'
    },
    {
      id: 'lista', 
      label: 'Lista',
      icon: List,
      active: viewMode === 'lista'
    },
    {
      id: 'calendario', 
      label: 'Calendário',
      icon: Calendar,
      active: viewMode === 'calendario'
    },
    {
      id: 'dashboard', 
      label: 'Dashboard',
      icon: BarChart3,
      active: viewMode === 'dashboard'
    }
  ];

  // Função para mudar modo de visualização
  const handleViewModeChange = (mode: 'kanban' | 'lista' | 'calendario' | 'dashboard') => {
    setViewMode(mode);
  };

  // Função para atualizar filtros
  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Função para aplicar filtros
  const handleFilterApply = () => {
    // Filtros são aplicados automaticamente via filteredLeads
  };

  // Função para limpar filtros
  const clearFilters = () => {
    setFilters({
      search: '',
      dateRange: 'all',
      responsibleId: 'all',
      archived: false,
      workGroup: 'all',
      pipelineId: 'all',
      dateFrom: '',
      dateTo: ''
    });
  };

  // Agrupar leads por etapa - EXATO DA PÁGINA ACTIVITIES
  const groupedLeads = React.useMemo(() => {
    
    const grouped: Record<string, Lead[]> = {};
    
    // Validar stages antes de processar
    const validStages = (stages || []).filter(stage => {
      if (!stage || !stage.id) {
        console.warn('⚠️ Stage inválido encontrado:', stage);
        return false;
      }
      return true;
    });
    
    validStages.forEach(stage => {
      // Validar leads antes de filtrar
      const validLeads = (filteredLeads || []).filter(lead => {
        if (!lead || !lead.id) {
          console.warn('⚠️ Lead inválido encontrado:', lead);
          return false;
        }
        return true;
      });
      
      const leadsInStage = validLeads
        .filter(lead => lead.stage_id === stage.id)
        .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
      
      grouped[stage.id] = leadsInStage;
    });
    
    return grouped;
  }, [filteredLeads, stages]);

  // Função para drag and drop - EXATO DA PÁGINA ACTIVITIES
  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    // Se não há destino, cancelar
    if (!destination) {
      return;
    }
    
    const sourceColumn = source.droppableId;
    const destinationColumn = destination.droppableId;
    
    // Se não mudou de coluna, cancelar
    if (sourceColumn === destinationColumn) {
      return;
    }
    
    try {
      // Mover lead para nova etapa
      const success = await moveLeadToStage(draggableId, destinationColumn);
      
      if (success) {
        toast({
          title: "Lead movido",
          description: "Lead movido para nova etapa com sucesso.",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao mover lead. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ [KANBAN] Erro ao mover lead:', error);
      toast({
        title: "Erro",
        description: "Erro ao mover lead. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [moveLeadToStage]);

  const handleCreateLead = (stageId?: string) => {
    setSelectedStageId(stageId || null);
    setIsCreateModalOpen(true);
  };

  const handleMoveLead = async (leadId: string, newStageId: string) => {
    try {
      const success = await moveLeadToStage(leadId, newStageId);
      if (success) {
        toast({
          title: "Lead movido",
          description: "Lead movido para nova etapa com sucesso.",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao mover lead. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Erro ao mover lead:', error);
      toast({
        title: "Erro",
        description: "Erro ao mover lead. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleEditLead = useCallback((lead: Lead) => {
    // Implementar modal de edição se necessário
    console.log('Editar lead:', lead);
  }, []);

  const handleLeadClick = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setIsLeadDetailModalOpen(true);
  }, []);

  const handleDeleteLead = useCallback(async (leadId: string) => {
    console.log('🗑️ Excluindo lead:', leadId);

    try {
      const success = await deleteLead(leadId);
      
      if (success) {
        toast({
          title: "Lead excluído",
          description: "Lead removido com sucesso.",
        });
      }
    } catch (error) {
      console.error('❌ Erro ao excluir lead:', error);
      toast({
        title: "Lead excluído",
        description: "Lead removido da tela.",
      });
    }
  }, [deleteLead]);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <div className="text-red-600 mb-2">
            <svg className="h-8 w-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium mb-2">Erro ao carregar dados</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <Button onClick={refetch} variant="outline" size="sm">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className="min-h-screen bg-gray-50">
        {/* Header fixo responsivo ao sidebar - ocultar quando em tela cheia */}
        {!isFullscreen && (
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
                
                {viewButtons.map((button) => {
                  const Icon = button.icon;
                  return (
                  <Button
                      key={button.id}
                      variant="ghost"
                    size="sm"
                      onClick={() => handleViewModeChange(button.id as any)}
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
                  </Button>
                  );
                })}
              </div>
              
              {/* Botões de ação na extrema direita */}
              <div className="flex items-center gap-2">
                {/* Tela cheia */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors"
                  onClick={toggleFullscreen}
                  title="Tela cheia"
                >
                  <Maximize2 className="h-4 w-4 text-gray-700" />
                </Button>
                {/* Botão de configuração do Kanban - apenas para abas com Kanban */}
                {viewMode === 'kanban' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors"
                    onClick={() => setIsPipelineModalOpen(true)}
                    title="Configurar Kanban"
                  >
                    <Settings className="h-4 w-4 text-gray-700" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors"
                  title="Automações"
                >
                  <Zap className="h-4 w-4 text-gray-700" />
                </Button>
              </div>
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
            pipelines={pipelines}
            searchPlaceholder="Filtrar por nome do lead, empresa..."
          />
        </div>
        )}

        {/* Container principal - ajustar quando em tela cheia */}
        <div className={`${isFullscreen ? 'pt-0' : 'pt-[100px]'}`} style={{minHeight: isFullscreen ? '100vh' : 'calc(100vh - 38px)'}}>
          {/* Container principal com padding otimizado para sidebar expandida */}
          <div className="px-1 pt-4">

          {/* Conteúdo baseado na visualização selecionada */}
          {viewMode === 'kanban' && (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className={cn('w-full pl-2 pr-6', isFullscreen ? 'pt-4' : '')}>
                {/* Layout responsivo baseado no número de etapas e estado da sidebar */}
                <div className={cn(
                  'flex gap-3 justify-start -ml-4 overflow-x-auto',
                  // Para 5 etapas ou menos: preencher largura com espaço
                  (stages?.length || 0) <= 5 && !sidebarExpanded && 'justify-between',
                  (stages?.length || 0) <= 5 && sidebarExpanded && 'justify-between',
                  // Para 6+ etapas: diminuir largura para caber na tela
                  (stages?.length || 0) >= 6 && 'justify-start',
                  // Ajuste quando sidebar está maximizada
                  sidebarExpanded && 'gap-2'
                )}>
                  {(stages || []).filter(stage => stage && stage.id).map((stage) => {
                    const stageLeads = groupedLeads[stage.id] || [];
                    return (
                    <div key={`stage-${stage.id}`} className={cn(
                      'flex-shrink-0',
                      // Largura baseada no número de etapas e estado da sidebar
                      (stages?.length || 0) <= 5 && !sidebarExpanded && 'w-56', // 5 etapas, sidebar colapsada
                      (stages?.length || 0) <= 5 && sidebarExpanded && 'w-48', // 5 etapas, sidebar expandida
                      (stages?.length || 0) >= 6 && !sidebarExpanded && 'w-44', // 6+ etapas, sidebar colapsada
                      (stages?.length || 0) >= 6 && sidebarExpanded && 'w-40', // 6+ etapas, sidebar expandida
                      // Fallback para fullscreen
                      isFullscreen && fullscreenLayout === 'fit' && 'w-full',
                      isFullscreen && fullscreenLayout === 'scroll' && 'w-48'
                    )}>
                      <LeadsKanbanColumn
                        column={stage}
                        leads={stageLeads}
                        onAddLead={handleCreateLead}
                        onEditLead={handleEditLead}
                        onDeleteLead={handleDeleteLead}
                        isFullscreen={isFullscreen && fullscreenLayout === 'fit'}
                      />
                    </div>
                    );
                  })}
                </div>
              </div>
            </DragDropContext>
          )}

          {viewMode === 'lista' && (
            <div className="w-full max-w-full overflow-x-auto mt-4">
              <div 
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                style={{ 
                  minWidth: sidebarExpanded ? '600px' : '700px',
                  maxWidth: sidebarExpanded ? 'calc(100vw - 240px)' : 'calc(100vw - 64px)'
                }}
              >
                {/* Cabeçalho da Tabela */}
                <div className="bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center px-3 py-3 gap-2">
                    <div className="flex-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                      <span>Nome</span>
                      <ArrowUpDown className="h-3 w-3 text-gray-400" />
                    </div>
                    <div className="w-20 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                      <span>Status</span>
                      <ArrowUpDown className="h-3 w-3 text-gray-400" />
                    </div>
                    <div className="w-24 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                      <span>Empresa</span>
                      <ArrowUpDown className="h-3 w-3 text-gray-400" />
                    </div>
                    <div className="w-24 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                      <span>Contato</span>
                      <ArrowUpDown className="h-3 w-3 text-gray-400" />
                    </div>
                    <div className="w-20 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                      <span>Valor</span>
                      <ArrowUpDown className="h-3 w-3 text-gray-400" />
                    </div>
                    <div className="w-20 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                      <span>Etapa</span>
                      <ArrowUpDown className="h-3 w-3 text-gray-400" />
                    </div>
                    <div className="w-24 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                      <span>Tags</span>
                      <ArrowUpDown className="h-3 w-3 text-gray-400" />
                    </div>
                    <div className="w-16 flex items-center justify-end gap-2 text-sm font-medium text-gray-700">
                      <span>Ações</span>
                    </div>
                  </div>
                </div>

                {/* Linhas da Tabela */}
                <div className="divide-y divide-gray-200">
                {(filteredLeads || []).filter(lead => lead && lead.id).map((lead) => (
                  <div 
                    key={`lead-${lead.id}`}
                    onClick={() => handleLeadClick(lead)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <LeadCard
                    lead={lead}
                    viewMode="list"
                    onMove={(newStageId) => handleMoveLead(lead.id, newStageId)}
                    availableStages={stages}
                      onDelete={handleDeleteLead}
                  />
                  </div>
                ))}
                  {(filteredLeads || []).filter(lead => lead && lead.id).length === 0 && (
                    <div className="px-6 py-8 text-center text-gray-500">
                      Nenhum lead encontrado
                    </div>
                  )}
                </div>
              </div>

              {/* Espaço branco inferior */}
              <div className="h-32 bg-[#F9FAFB]"></div>
            </div>
          )}

          {/* Calendário - placeholder */}
          {viewMode === 'calendario' && (
            <div className="px-6">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-gray-600 mb-2">
                    Visualização Calendário
                  </div>
                  <p className="text-gray-500">
                    Esta visualização está em desenvolvimento.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard */}
          {viewMode === 'dashboard' && (
            <div className="px-6">
              <LeadsSalesDashboard leads={filteredLeads} stages={stages} filters={filters} />
            </div>
          )}

          </div>
        </div>

        {/* Botão flutuante - ocultar em tela cheia */}
        {!isFullscreen && (
        <Button
          onClick={() => handleCreateLead()}
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
        )}

        {/* Botão para sair da tela cheia */}
        {isFullscreen && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 rounded-full transition-colors"
              onClick={toggleFullscreenLayout}
              title={fullscreenLayout === 'fit' ? 'Ativar rolagem horizontal' : 'Ajustar colunas na tela'}
            >
              {fullscreenLayout === 'fit' ? 'Rolagem' : 'Ajustar'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors"
              onClick={toggleFullscreen}
              title="Sair da tela cheia"
            >
              <Minimize2 className="h-4 w-4 text-gray-700" />
            </Button>
          </div>
        )}
      </div>

      {/* Modais */}
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          console.log('🚪 Fechando modal de criação de lead...');
          setIsCreateModalOpen(false);
          setSelectedStageId(null);
        }}
        onLeadCreated={() => {
          console.log('✅ Lead criado, atualizando lista...');
          console.log('🔄 Forçando atualização da lista de leads...');
          // Forçar atualização da lista
          refetch();
          console.log('✅ Lista de leads atualizada');
        }}
        defaultStageId={selectedStageId}
      />

      <PipelineEditorModal
        isOpen={isPipelineModalOpen}
        onClose={() => setIsPipelineModalOpen(false)}
      />

      {selectedLead && (
        <LeadDetailModal
          isOpen={isLeadDetailModalOpen}
          onClose={() => {
            setIsLeadDetailModalOpen(false);
            setSelectedLead(null);
          }}
          lead={selectedLead}
          onEdit={handleEditLead}
          onDelete={handleDeleteLead}
        />
      )}
    </>
  );
};

export default LeadsKanban;
