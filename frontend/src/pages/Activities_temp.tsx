import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVB } from '@/contexts/VBContext';
import { useActivities } from '@/hooks/useActivities';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { toast } from '@/hooks/use-toast';
import { useFilters } from '@/hooks/useFilters';
import KanbanBoard from '@/components/KanbanBoard';
import ClickUpKanban from '@/components/ClickUpKanban';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import BitrixActivityForm from '@/components/BitrixActivityForm';
import FilterBar from '@/components/FilterBar';
import { 
  Search,
  Plus,
  Eye,
  User,
  Share,
  ChevronDown,
  MoreHorizontal,
  Kanban,
  List,
  Clock,
  Calendar,
  BarChart3,
  X,
  Zap,
  ArrowUpDown,
  Building2,
  Edit,
  Trash2,
  AlignJustify
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Activities = () => {
  const { state } = useVB();
  const { companies, employees } = state;
  const { activities, loading, error, createActivity, updateActivity, deleteActivity, refetch, fetchActivities } = useActivities();
  const { topBarColor } = useTheme();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'board' | 'lista' | 'prazo' | 'planejador' | 'calendario' | 'dashboard'>('board');
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [prazoViewMode, setPrazoViewMode] = useState<'kanban' | 'lista'>('kanban');
  const [expandedSprint, setExpandedSprint] = useState<number | null>(null);
  const [sprintsViewMode, setSprintsViewMode] = useState<'compact' | 'expanded'>('compact');
  const [sprintsMinimized, setSprintsMinimized] = useState(false);
  const [isKanbanEditModalOpen, setIsKanbanEditModalOpen] = useState(false);
  // Estado inicial vazio - será preenchido pelo useEffect
  const [kanbanColumns, setKanbanColumns] = useState<any[]>([]);
  const [kanbanLoaded, setKanbanLoaded] = useState(false);
  
  // Estados para controle
  const [forceLoading, setForceLoading] = useState(false);
  
  // Usar contexto do sidebar
  const { sidebarExpanded, setSidebarExpanded, showMenuButtons, expandSidebarFromMenu } = useSidebar();

  // Carregar configurações do Kanban salvas
  useEffect(() => {
    const savedKanbanConfig = localStorage.getItem('kanbanColumns');
    if (savedKanbanConfig) {
      try {
        const parsedConfig = JSON.parse(savedKanbanConfig);
        setKanbanColumns(parsedConfig);
        setKanbanLoaded(true);
      } catch (error) {
        console.error('Erro ao carregar configurações do Kanban:', error);
        // Se houver erro, usar configuração padrão
        setKanbanColumns([
          { id: 'pending', name: 'PENDENTE', color: 'gray', status: 'pending' },
          { id: 'in_progress', name: 'EM PROGRESSO', color: 'orange', status: 'in_progress' },
          { id: 'completed', name: 'CONCLUÍDA', color: 'green', status: 'completed' },
          { id: 'archived', name: 'ARQUIVADA', color: 'gray', status: 'archived' }
        ]);
        setKanbanLoaded(true);
      }
    } else {
      // Se não houver configuração salva, usar configuração padrão das Activities
      setKanbanColumns([
        { id: 'open', name: 'ABERTO', color: 'gray', status: 'open' },
        { id: 'pending', name: 'PENDENTE', color: 'yellow', status: 'pending' },
        { id: 'in_progress', name: 'EM PROGRESSO', color: 'blue', status: 'in_progress' },
        { id: 'review', name: 'REVISÃO', color: 'pink', status: 'review' },
        { id: 'completed', name: 'CONCLUÍDO', color: 'green', status: 'completed' }
      ]);
      setKanbanLoaded(true);
    }
  }, []);

  // Salvar configurações do Kanban sempre que houver mudanças (apenas após carregar)
  useEffect(() => {
    if (kanbanLoaded && kanbanColumns.length > 0) {
      localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    }
  }, [kanbanColumns, kanbanLoaded]);

  // useEffects de detecção removidos - usando contexto do sidebar

  // Timeout para evitar loading infinito
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setForceLoading(true);
      }, 5000); // 5 segundos

      return () => clearTimeout(timeout);
    } else {
      setForceLoading(false);
    }
  }, [loading]);

  // Calcular largura dos blocos para ocupar toda a tela sem scroll horizontal
  const getBlockWidth = () => {
    const sidebarWidth = sidebarExpanded ? 240 : 64;
    const containerPadding = 24; // Padding do container principal
    const screenWidth = window.innerWidth;
    const availableWidth = screenWidth - sidebarWidth - containerPadding;
    
    // Usar o número real de colunas configuradas
    const numberOfColumns = kanbanColumns.length || 5;
    const gapSize = 8; // Gap entre colunas
    const totalGaps = Math.max(numberOfColumns - 1, 0) * gapSize;
    const blockWidth = (availableWidth - totalGaps) / numberOfColumns;
    
    // Garantir largura mínima para usabilidade
    const minWidth = 200;
    const calculatedWidth = Math.max(Math.floor(blockWidth), minWidth);
    
    return `${calculatedWidth}px`;
  };

  // Container deve ocupar toda a largura disponível sem scroll horizontal
  const getContainerWidth = () => {
    const sidebarWidth = sidebarExpanded ? 240 : 64;
    return `calc(100vw - ${sidebarWidth}px - 24px)`; // Largura total menos sidebar e padding
  };
  
  // Estilo do container Kanban para eliminar scroll horizontal
  const getKanbanContainerStyle = () => {
    const numberOfColumns = kanbanColumns.length || 5;
    return {
      display: 'flex',
      gap: '8px',
      width: '100%',
      maxWidth: getContainerWidth(),
      overflow: 'hidden', // Eliminar scroll horizontal
      justifyContent: 'space-between'
    };
  };
  
  // Hook para gerenciar filtros
  const { filters, updateFilter, clearFilters, getFilterParams } = useFilters();
  
  const navigate = useNavigate();
  const location = useLocation();

  // Função para aplicar filtros
  const applyFilters = async () => {
    const filterParams = getFilterParams();
    await fetchActivities(filterParams);
  };

  // Aplicar filtros automaticamente
  const handleFilterApply = () => {
    applyFilters();
  };

  // Mapeamento de cores para as bordas superiores das colunas
  const getColumnBorderColor = (status: string) => {
    const colorMap = {
      'open': '#D1D5DB',      // Cinza
      'pending': '#FACC15',   // Amarelo
      'in_progress': '#3B82F6', // Azul
      'review': '#EC4899',    // Rosa
      'completed': '#10B981'  // Verde
    };
    return colorMap[status as keyof typeof colorMap] || '#D1D5DB';
  };

  // Função para obter o nome de exibição do status
  const getStatusDisplayName = (status: string) => {
    const nameMap = {
      'open': 'ABERTO',
      'pending': 'PENDENTE', 
      'in_progress': 'EM PROGRESSO',
      'review': 'REVISÃO',
      'completed': 'CONCLUÍDO'
    };
    return nameMap[status as keyof typeof nameMap] || status.toUpperCase();
  };

  // Funções para gerenciar sprints
  const getSprintData = () => {
    const totalActivities = activities.length;
    const completedActivities = activities.filter(a => a.status === 'completed').length;
    const inProgressActivities = activities.filter(a => a.status === 'in_progress').length;
    const pendingActivities = activities.filter(a => a.status === 'pending' || a.status === 'open').length;
    
    // Simular sprints baseados nas atividades reais
    const sprints = [
      {
        id: 1,
        name: 'Sprint 1',
        completed: Math.min(completedActivities, Math.floor(totalActivities * 0.3)),
        total: Math.floor(totalActivities * 0.3),
        startDate: '01/01',
        endDate: '15/01',
        status: 'completed',
        progress: Math.min(completedActivities, Math.floor(totalActivities * 0.3)) / Math.floor(totalActivities * 0.3) * 100
      },
      {
        id: 2,
        name: 'Sprint 2',
        completed: Math.min(completedActivities - Math.floor(totalActivities * 0.3), Math.floor(totalActivities * 0.4)),
        total: Math.floor(totalActivities * 0.4),
        startDate: '16/01',
        endDate: '31/01',
        status: 'completed',
        progress: Math.min(completedActivities - Math.floor(totalActivities * 0.3), Math.floor(totalActivities * 0.4)) / Math.floor(totalActivities * 0.4) * 100
      },
      {
        id: 3,
        name: 'Sprint 3',
        completed: inProgressActivities,
        total: inProgressActivities + Math.floor(pendingActivities * 0.5),
        startDate: '01/02',
        endDate: '15/02',
        status: 'in_progress',
        progress: inProgressActivities / (inProgressActivities + Math.floor(pendingActivities * 0.5)) * 100
      },
      {
        id: 4,
        name: 'Sprint 4',
        completed: 0,
        total: Math.max(pendingActivities - Math.floor(pendingActivities * 0.5), 1),
        startDate: '16/02',
        endDate: '28/02',
        status: 'planned',
        progress: 0
      }
    ];

    return sprints;
  };

  const handleToggleSprintExpansion = (sprintId: number) => {
    setExpandedSprint(expandedSprint === sprintId ? null : sprintId);
  };

  const handleToggleSprintsView = () => {
    setSprintsViewMode(sprintsViewMode === 'compact' ? 'expanded' : 'compact');
  };

  const handleToggleSprintsMinimized = () => {
    setSprintsMinimized(prev => !prev);
  };

  const handleOpenKanbanEditModal = () => {
    setIsKanbanEditModalOpen(true);
  };

  const handleCloseKanbanEditModal = () => {
    setIsKanbanEditModalOpen(false);
  };

  const handleUpdateKanbanColumn = (columnId: string, updates: any) => {
    setKanbanColumns(prev => 
      prev.map(col => 
        col.id === columnId ? { ...col, ...updates } : col
      )
    );
    
    // Feedback visual para mudanças
    if (updates.name) {
      toast({
        title: "Nome atualizado",
        description: `Etapa renomeada para "${updates.name}"`,
        duration: 2000,
      });
    }
  };

  const handleAddKanbanColumn = () => {
    const newId = `column_${Date.now()}`;
    const newColumn = {
      id: newId,
      name: 'NOVA ETAPA',
      color: 'blue',
      status: newId
    };
    setKanbanColumns(prev => [...prev, newColumn]);
    
    toast({
      title: "Nova etapa adicionada",
      description: "Você pode personalizar o nome e cor da nova etapa",
      duration: 3000,
    });
  };

  const handleRemoveKanbanColumn = (columnId: string) => {
    if (kanbanColumns.length > 1) {
      const columnToRemove = kanbanColumns.find(col => col.id === columnId);
      setKanbanColumns(prev => prev.filter(col => col.id !== columnId));
      
      toast({
        title: "Etapa removida",
        description: `"${columnToRemove?.name}" foi removida do seu Kanban`,
        duration: 3000,
      });
    }
  };

  const handleReorderKanbanColumns = (startIndex: number, endIndex: number) => {
    const result = Array.from(kanbanColumns);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setKanbanColumns(result);
  };

  const handleStartSprint = (sprintId: number) => {
    toast({
      title: "Sprint iniciada",
      description: `Sprint ${sprintId} foi iniciada com sucesso`
    });
  };

  const handleFinishSprint = (sprintId: number) => {
    toast({
      title: "Sprint finalizada",
      description: `Sprint ${sprintId} foi finalizada com sucesso`
    });
  };

  const handleActivityClick = (activityId: string) => {
    navigate(`/activities/${activityId}`);
  };

  const handleCreateActivity = async (formData: any) => {
    try {
      const activityData = {
        title: formData.title,
        description: formData.description,
        type: formData.type as 'task' | 'meeting' | 'call' | 'email' | 'other',
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        status: 'pending' as const,
        due_date: formData.date ? new Date(formData.date).toISOString() : undefined,
        responsible_id: formData.responsibleId || undefined
      };

      const result = await createActivity(activityData);
      
      if (result) {
        toast({
          title: "Tarefa criada",
          description: "Nova tarefa foi criada com sucesso"
        });
        setIsCreateModalOpen(false);
        refetch();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar tarefa",
        variant: "destructive"
      });
    }
  };

  const handleEditActivity = (activity: any) => {
    setEditingActivity(activity);
    setIsEditModalOpen(true);
  };

  const handleUpdateActivity = async (formData: any) => {
    try {
      if (!editingActivity) return;

      const updateData = {
        title: formData.title,
        description: formData.description,
        type: formData.type as 'task' | 'meeting' | 'call' | 'email' | 'other',
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        status: formData.status as 'open' | 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled',
        due_date: formData.date ? new Date(formData.date).toISOString() : undefined,
        responsible_id: formData.responsibleId || undefined
      };

      const result = await updateActivity(editingActivity.id, updateData);
      
      if (result) {
        toast({
          title: "Tarefa atualizada",
          description: "Tarefa foi atualizada com sucesso"
        });
        setIsEditModalOpen(false);
        setEditingActivity(null);
        refetch();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar tarefa",
        variant: "destructive"
      });
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

    try {
      const result = await deleteActivity(activityId);
      
      if (result && !result.error) {
        toast({
          title: "Tarefa excluída",
          description: "Tarefa foi excluída com sucesso"
        });
        // Não precisa chamar refetch() pois o estado local já foi atualizado
      } else if (result && result.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir tarefa",
        variant: "destructive"
      });
    }
  };

  const handleTaskMove = async (taskId: string, fromColumn: string, toColumn: string) => {
    try {
      // Encontrar a atividade
      const activity = activities.find(a => a.id === taskId);
      if (!activity) return;

      // Atualizar o status da atividade
      const updateData = {
        ...activity,
        status: toColumn as 'open' | 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled'
      };

      const result = await updateActivity(taskId, updateData);
      
      if (result) {
        toast({
          title: "Tarefa movida",
          description: `Tarefa movida para ${toColumn}`
        });
        refetch();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao mover tarefa",
        variant: "destructive"
      });
    }
  };

  // Função para lidar com drag and drop
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Se não há destino, não faz nada
    if (!destination) return;

    // Se o item foi solto na mesma posição, não faz nada
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    try {
      // Atualizar o status da atividade
      const newStatus = destination.droppableId;
      const result = await updateActivity(draggableId, { status: newStatus });
      
      if (result) {
        toast({
          title: "Status atualizado",
          description: "Tarefa movida com sucesso"
        });
        refetch();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao mover tarefa",
        variant: "destructive"
      });
    }
  };

  // Funções de scroll removidas - layout agora se ajusta sem scroll horizontal

  const handleCreateQuickTask = async (title: string, status: string) => {
    try {
      const activityData = {
        title,
        description: '',
        type: 'task' as const,
        priority: 'medium' as const,
        status: status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
        responsible_id: employees.length > 0 ? employees[0].id : undefined
      };

      const result = await createActivity(activityData);
      
      if (result) {
        toast({
          title: "Tarefa rápida criada",
          description: "Nova tarefa foi criada com sucesso"
        });
        refetch();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar tarefa rápida",
        variant: "destructive"
      });
    }
  };

  const handleOpenCreateModal = (columnId?: string) => {
    setIsCreateModalOpen(true);
    // Aqui poderia definir o status inicial baseado na coluna
    // Por enquanto, apenas abre o modal
  };

  const handleViewModeChange = (mode: 'board' | 'lista' | 'prazo' | 'planejador' | 'calendario' | 'dashboard') => {
    setViewMode(mode);
  };

  // Função para renderizar os botões de ação de cada atividade
  const renderActivityActions = (activity: any) => (
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleEditActivity(activity);
        }}
        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
        title="Editar tarefa"
      >
        <Edit className="h-3 w-3" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteActivity(activity.id);
        }}
        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
        title="Excluir tarefa"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );

  // Botões de visualização exatos da imagem
  const viewButtons = [
    { 
      id: 'board', 
      label: 'Quadro',
      icon: Kanban,
      active: viewMode === 'board'
    },
    {
      id: 'lista', 
      label: 'Lista',
      icon: List,
      active: viewMode === 'lista'
    },
    {
      id: 'prazo', 
      label: 'Prazo',
      icon: Clock,
      active: viewMode === 'prazo'
    },
    {
      id: 'planejador', 
      label: 'Planejador',
      icon: Kanban,
      active: viewMode === 'planejador'
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

  // Tratamento de erro
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar atividades</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refetch} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && !forceLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Carregando suas tarefas...</p>
        </div>
      </div>
    );
  }

  return (
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
              {/* Botão fixo de toggle da sidebar */}
              {showMenuButtons && !sidebarExpanded && (
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
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors"
                title="Buscar"
              >
                <Search className="h-4 w-4 text-gray-700" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setIsAutomationModalOpen(true)}
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
          employees={employees}
          departments={state.settings.departments}
          searchPlaceholder="Filtrar por nome da tarefa..."
        />
      </div>

      {/* Container principal com padding para o header fixo */}
      <div className="pt-[140px] px-6" style={{minHeight: 'calc(100vh - 38px)'}}>

        {/* Conteúdo baseado na visualização selecionada */}
        {viewMode === 'board' && (
          <div className="w-full">
            {/* Cabeçalho do Kanban Board */}
            <div className="flex items-center justify-end mb-4 mt-2">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenKanbanEditModal}
                  className="flex items-center text-sm px-3 py-2 h-8 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
            
            {/* ClickUpKanban - Design igual ao ClickUp */}
            <ClickUpKanban
              columns={kanbanColumns}
              tasks={activities}
              onTaskMove={handleTaskMove}
              onAddTask={handleOpenCreateModal}
              onTaskClick={handleActivityClick}
              onEditTask={handleEditActivity}
              onDeleteTask={handleDeleteActivity}
              className="px-3"
            />
          </div>
        )}

        {/* Visualização em Lista */}
        {viewMode === 'lista' && (
          <div className="w-full -ml-2">
            {/* Tabela de Atividades */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Cabeçalho da Tabela */}
              <div className="bg-gray-50 border-b border-gray-200">
                <div className="flex items-center px-6 py-4 gap-4">
                  <div className="w-12 flex items-center">
                    <Checkbox className="h-4 w-4" />
                  </div>
                  <div className="flex-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span>Nome</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-32 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                    <span>Atividade</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-32 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                    <span>Prazo Final</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-32 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                    <span>Criado Por</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-40 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                    <span>Responsável</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-32 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                    <span>Projeto</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-24 flex items-center justify-end gap-2 text-sm font-medium text-gray-700">
                    <span>Marcadores</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Linhas da Tabela */}
              <div className="divide-y divide-gray-200">
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex items-center px-6 py-4 h-16 hover:bg-gray-50 transition-colors gap-4">
                  <div className="w-12 flex items-center">
                    <Checkbox className="h-4 w-4" />
                  </div>
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-white font-medium">
                            {activity.title ? activity.title.charAt(0).toUpperCase() : 'A'}
                          </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                          <span className="text-sm text-gray-900 truncate">{activity.title}</span>
                          <span className="text-xs text-gray-400">
                            {activity.description || 'Sem descrição'}
                          </span>
                    </div>
                  </div>
                  <div className="w-32 flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs text-white font-medium">
                              {activity.type ? activity.type.charAt(0).toUpperCase() : 'O'}
                            </span>
                          </div>
                          <span className="text-sm text-gray-900">
                            {activity.type === 'task' ? 'Tarefa' :
                             activity.type === 'meeting' ? 'Reunião' :
                             activity.type === 'call' ? 'Chamada' :
                             activity.type === 'email' ? 'Email' : 'Outro'}
                          </span>
                        </div>
                  </div>
                  <div className="w-32 flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-gray-400" />
                        <span>
                          {activity.due_date ? new Date(activity.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                        </span>
                  </div>
                  <div className="w-32 flex items-center justify-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-white font-medium">
                            {activity.created_by ? activity.created_by.charAt(0).toUpperCase() : 'A'}
                          </span>
                    </div>
                        <span className="text-sm text-gray-900">
                          {activity.created_by || 'Admin'}
                        </span>
                  </div>
                  <div className="w-40 flex items-center justify-center gap-3">
                    <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-white font-medium">
                            {activity.responsible_id ? activity.responsible_id.charAt(0).toUpperCase() : 'F'}
                          </span>
                    </div>
                        <span className="text-sm text-gray-900">
                          {activity.responsible_id || 'Não atribuído'}
                        </span>
                  </div>
                  <div className="w-32 flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4 text-gray-400" />
                        <span>
                          {activity.project_id || 'Sem projeto'}
                        </span>
                  </div>
                  <div className="w-24 flex items-center justify-end">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          activity.priority === 'urgent' ? 'bg-red-100 text-red-800 border-red-200' :
                          activity.priority === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                          activity.priority === 'medium' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          'bg-green-100 text-green-800 border-green-200'
                        }`}>
                          {activity.priority === 'urgent' ? 'Urgente' :
                           activity.priority === 'high' ? 'Alta' :
                           activity.priority === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    Nenhuma atividade encontrada
                  </div>
                )}
              </div>
            </div>

            {/* Espaço branco inferior */}
            <div className="h-32 bg-[#F9FAFB]"></div>
          </div>
        )}

        {viewMode === 'prazo' && (
          <div className="w-full -ml-2">
            {/* Cartões de Resumo das Atividades */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {/* Cartão Vencidas */}
              <div className="bg-white/80 border border-gray-100 rounded-lg p-4 relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    {activities.filter(a => {
                      if (!a.due_date) return false;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const dueDate = new Date(a.due_date);
                      dueDate.setHours(0, 0, 0, 0);
                      return dueDate < today;
                    }).length}
                  </span>
                </div>
                <div className="flex flex-col items-start text-left">
                  <div className="w-12 h-12 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Vencidas</h3>
                  <p className="text-xs text-gray-600">Tarefas com prazo vencido</p>
                </div>
              </div>

              {/* Cartão Para Hoje */}
              <div className="bg-white/80 border border-gray-100 rounded-lg p-4 relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    {activities.filter(a => {
                      if (!a.due_date) return false;
                      const today = new Date();
                      const dueDate = new Date(a.due_date);
                      return dueDate.toDateString() === today.toDateString();
                    }).length}
                  </span>
                </div>
                <div className="flex flex-col items-start text-left">
                  <div className="w-12 h-12 flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Para Hoje</h3>
                  <p className="text-xs text-gray-600">Tarefas para hoje</p>
                </div>
              </div>

              {/* Cartão Para Amanhã */}
              <div className="bg-white/80 border border-gray-100 rounded-lg p-4 relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    {activities.filter(a => {
                      if (!a.due_date) return false;
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      const dueDate = new Date(a.due_date);
                      return dueDate.toDateString() === tomorrow.toDateString();
                    }).length}
                  </span>
                </div>
                <div className="flex flex-col items-start text-left">
                  <div className="w-12 h-12 flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Para Amanhã</h3>
                  <p className="text-xs text-gray-600">Tarefas para amanhã</p>
                </div>
              </div>

              {/* Cartão Esta Semana */}
              <div className="bg-white/80 border border-gray-100 rounded-lg p-4 relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    {activities.filter(a => {
                      if (!a.due_date) return false;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const tomorrow = new Date(today);
                      tomorrow.setDate(today.getDate() + 1);
                      const endOfWeek = new Date(today);
                      endOfWeek.setDate(today.getDate() + 7);
                      const dueDate = new Date(a.due_date);
                      dueDate.setHours(0, 0, 0, 0);
                      return dueDate >= tomorrow && dueDate <= endOfWeek;
                    }).length}
                  </span>
                </div>
                <div className="flex flex-col items-start text-left">
                  <div className="w-12 h-12 flex items-center justify-center mb-3">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Esta Semana</h3>
                  <p className="text-xs text-gray-600">Tarefas desta semana</p>
                </div>
              </div>

              {/* Cartão Mais Tarde */}
              <div className="bg-white/80 border border-gray-100 rounded-lg p-4 relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    {activities.filter(a => {
                      if (!a.due_date) return false;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const endOfWeek = new Date(today);
                      endOfWeek.setDate(today.getDate() + 7);
                      const dueDate = new Date(a.due_date);
                      dueDate.setHours(0, 0, 0, 0);
                      return dueDate > endOfWeek;
                    }).length}
                  </span>
                </div>
                <div className="flex flex-col items-start text-left">
                  <div className="w-12 h-12 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Mais Tarde</h3>
                  <p className="text-xs text-gray-600">Tarefas futuras</p>
                </div>
              </div>
            </div>

            {/* Visualização Principal por Prazo */}
            <div className="p-3">
              {/* Cabeçalho da Visualização */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-pink-500" />
                  <h3 className="text-base font-semibold text-gray-900/85">
                    Visualização por Prazo
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={prazoViewMode === 'lista' ? 'default' : 'outline'}
                    size="sm"
                    className="h-6 px-2 text-xs font-medium"
                    onClick={() => setPrazoViewMode('lista')}
                    style={prazoViewMode === 'lista' ? {
                      backgroundColor: topBarColor,
                      borderColor: topBarColor,
                      color: 'white'
                    } : {}}
                  >
                    Lista
                  </Button>
                  <Button
                    variant={prazoViewMode === 'kanban' ? 'default' : 'outline'}
                    size="sm"
                    className="h-6 px-2 text-xs font-medium"
                    onClick={() => setPrazoViewMode('kanban')}
                    style={prazoViewMode === 'kanban' ? {
                      backgroundColor: topBarColor,
                      borderColor: topBarColor,
                      color: 'white'
                    } : {}}
                  >
                    Kanban
                  </Button>

                </div>
              </div>

              {/* Conteúdo baseado no modo de visualização selecionado */}
              {prazoViewMode === 'kanban' ? (
                /* ClickUpKanban - Design igual ao ClickUp para visualização por prazo */
                <ClickUpKanban
                  columns={[
                    {
                      id: 'vencidas',
                      name: 'VENCIDAS',
                      status: 'vencidas',
                      tasks: [],
                      color: '#ef4444'
                    },
                    {
                      id: 'hoje',
                      name: 'PARA HOJE',
                      status: 'hoje',
                      tasks: [],
                      color: '#f59e0b'
                    },
                    {
                      id: 'amanha',
                      name: 'PARA AMANHÃ',
                      status: 'amanha',
                      tasks: [],
                      color: '#3b82f6'
                    },
                    {
                      id: 'esta_semana',
                      name: 'ESTA SEMANA',
                      status: 'esta_semana',
                      tasks: [],
                      color: '#10b981'
                    },
                    {
                      id: 'mais_tarde',
                      name: 'MAIS TARDE',
                      status: 'mais_tarde',
                      tasks: [],
                      color: '#8b5cf6'
                    }
                  ]}
                  tasks={activities.map(activity => {
                    // Classificar atividade por prazo
                    let status = 'mais_tarde';
                    if (activity.due_date) {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const dueDate = new Date(activity.due_date);
                              dueDate.setHours(0, 0, 0, 0);
                              const tomorrow = new Date(today);
                      tomorrow.setDate(today.getDate() + 1);
                              const endOfWeek = new Date(today);
                              endOfWeek.setDate(today.getDate() + 7);

                      if (dueDate < today) {
                        status = 'vencidas';
                      } else if (dueDate.toDateString() === today.toDateString()) {
                        status = 'hoje';
                      } else if (dueDate.toDateString() === tomorrow.toDateString()) {
                        status = 'amanha';
                      } else if (dueDate >= tomorrow && dueDate <= endOfWeek) {
                        status = 'esta_semana';
                      } else {
                        status = 'mais_tarde';
                      }
                    }

                    return {
                      ...activity,
                      status: status
                    };
                  })}
                  onTaskMove={handleTaskMove}
                  onAddTask={handleOpenCreateModal}
                  onTaskClick={handleActivityClick}
                  onEditTask={handleEditActivity}
                  onDeleteTask={handleDeleteActivity}
                  className="px-3"
                />
              ) : (
                /* Visualização em Lista */
                <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <div className="min-w-full">
                      {/* Cabeçalho da tabela */}
                      <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-3">
                    <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-600 uppercase tracking-wider">
                          <div className="col-span-4">Atividade</div>
                      <div className="col-span-2">Prioridade</div>
                      <div className="col-span-2">Prazo</div>
                      <div className="col-span-2">Responsável</div>
                      <div className="col-span-2">Ações</div>
                    </div>
                  </div>

                      {/* Lista de atividades */}
                      {activities.filter(activity => activity.due_date).map((activity) => {
                        const dueDate = new Date(activity.due_date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                            dueDate.setHours(0, 0, 0, 0);
                        const isOverdue = dueDate < today;
                        
                        return (
                          <div
                            key={activity.id}
                            className="border-b border-gray-50 px-6 py-4 hover:bg-gray-50/30 transition-colors cursor-pointer"
                            onClick={() => handleActivityClick(activity.id)}
                          >
                            <div className="grid grid-cols-12 gap-4 items-center">
                              {/* Título e descrição */}
                              <div className="col-span-4">
                                <div className="flex items-start gap-3">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-gray-900 truncate mb-1">
                                      {activity.title}
                                    </h4>
                                    <p className="text-xs text-gray-600 line-clamp-2">
                                      {activity.description || 'Sem descrição'}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Prioridade */}
                              <div className="col-span-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  activity.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                  activity.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                  activity.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {activity.priority === 'urgent' ? 'Urgente' :
                                   activity.priority === 'high' ? 'Alta' :
                                   activity.priority === 'medium' ? 'Média' : 'Baixa'}
                                </span>
                              </div>

                              {/* Prazo */}
                              <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                                    {dueDate.toLocaleDateString('pt-BR')}
                                  </span>
                                  {isOverdue && (
                                    <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                      Vencida
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Responsável */}
                              <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-900">
                                    {activity.responsible_id || 'Não atribuído'}
                                  </span>
                                </div>
                              </div>

                              {/* Ações */}
                              <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-gray-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditActivity(activity);
                                  }}
                                  >
                                    <Edit className="h-4 w-4 text-gray-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-gray-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                      handleActivityClick(activity.id);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 text-gray-600" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    
                    {activities.filter(activity => activity.due_date).length === 0 && (
                      <div className="px-6 py-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma atividade encontrada</h3>
                        <p className="text-gray-600">Não há atividades com prazo definido no momento.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
