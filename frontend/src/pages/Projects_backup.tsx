import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVB } from '@/contexts/VBContext';
import { useProjects } from '@/hooks/useProjects';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { toast } from '@/hooks/use-toast';
import { useFilters } from '@/hooks/useFilters';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import ProjectCreateModal from '@/components/ProjectCreateModal';
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
  Trash2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ProjectDeadlineView from '@/components/ProjectDeadlineView';
import BoardKanban from '@/components/BoardKanban';

const Projects = () => {
  const { state } = useVB();
  const { companies, employees } = state;
  const { projects, loading, error, createProject, fetchProjects } = useProjects();
  const { topBarColor } = useTheme();
  const { sidebarExpanded } = useSidebar();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'lista' | 'prazo' | 'planejador' | 'calendario' | 'dashboard'>('board');
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  const [phasesViewMode, setPhasesViewMode] = useState<'compact' | 'expanded'>('compact');
  const [isKanbanEditModalOpen, setIsKanbanEditModalOpen] = useState(false);
  // Estado inicial vazio - será preenchido pelo useEffect
  const [kanbanColumns, setKanbanColumns] = useState<any[]>([]);
  const [kanbanLoaded, setKanbanLoaded] = useState(false);
  
  // Hook para gerenciar filtros
  const { filters, updateFilter, clearFilters, getFilterParams } = useFilters();
  
  const navigate = useNavigate();
  const location = useLocation();

  // Carregar configurações do Kanban salvas
  useEffect(() => {
    const savedKanbanConfig = localStorage.getItem('projectsKanbanColumns');
    if (savedKanbanConfig) {
      try {
        const parsedConfig = JSON.parse(savedKanbanConfig);
        setKanbanColumns(parsedConfig);
        setKanbanLoaded(true);
      } catch (error) {
        console.error('Erro ao carregar configurações do Kanban:', error);
        // Se houver erro, usar configuração padrão
        setKanbanColumns([
          { id: 'planning', name: 'PLANEJAMENTO', color: 'gray', status: 'planning' },
          { id: 'active', name: 'EM ANDAMENTO', color: 'orange', status: 'active' },
          { id: 'on_hold', name: 'PAUSADO', color: 'yellow', status: 'on_hold' },
          { id: 'completed', name: 'CONCLUÍDO', color: 'green', status: 'completed' }
        ]);
        setKanbanLoaded(true);
      }
    } else {
      // Se não houver configuração salva, usar padrão
      setKanbanColumns([
        { id: 'planning', name: 'PLANEJAMENTO', color: 'gray', status: 'planning' },
        { id: 'active', name: 'EM ANDAMENTO', color: 'orange', status: 'active' },
        { id: 'on_hold', name: 'PAUSADO', color: 'yellow', status: 'on_hold' },
        { id: 'completed', name: 'CONCLUÍDO', color: 'green', status: 'completed' }
      ]);
      setKanbanLoaded(true);
    }
  }, []);

  // Salvar configurações do Kanban sempre que houver mudanças (apenas após carregar)
  useEffect(() => {
    if (kanbanLoaded && kanbanColumns.length > 0) {
      localStorage.setItem('projectsKanbanColumns', JSON.stringify(kanbanColumns));
    }
  }, [kanbanColumns, kanbanLoaded]);

  // Função para aplicar filtros
  const applyFilters = async () => {
    const filterParams = getFilterParams();
    await fetchProjects(filterParams);
  };

  // Aplicar filtros automaticamente
  const handleFilterApply = () => {
    applyFilters();
  };

  // Estados para controle da barra de rolagem customizada
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [forceLoading, setForceLoading] = useState(false);

  // Detectar estado do sidebar e calcular tamanhos
  useEffect(() => {
    const updateDimensions = () => {
      setWindowWidth(window.innerWidth);
      
      // Detectar se sidebar está expandido baseado na largura da viewport
      const mainContent = document.querySelector('[data-main-content]');
      if (mainContent) {
        const rect = mainContent.getBoundingClientRect();
        setIsSidebarExpanded(rect.left > 100); // Se left > 100px, sidebar está expandido
      }
    };

    updateDimensions();
    
    window.addEventListener('resize', updateDimensions);
    
    // Observer para detectar mudanças no layout do sidebar
    const observer = new MutationObserver(updateDimensions);
    observer.observe(document.body, { 
      attributes: true, 
      childList: true, 
      subtree: true 
    });

    return () => {
      window.removeEventListener('resize', updateDimensions);
      observer.disconnect();
    };
  }, []);

  // Calcular largura de cada bloco baseado no estado do sidebar
  const getBlockWidth = () => {
    if (isSidebarExpanded) {
      // Sidebar expandido - largura fixa de 240px para cada bloco
      return '240px';
    } else {
      // Sidebar colapsado - distribuir largura total entre os blocos visíveis
      const availableWidth = windowWidth - 80; // 80px sidebar colapsado
      const blockWidth = (availableWidth - 36) / 4; // 4 blocos visíveis + 3 gaps de 12px
      return `${Math.floor(blockWidth)}px`;
    }
  };

  // Calcular largura total do container para mostrar exatamente 4 blocos visíveis
  const getContainerWidth = () => {
    if (isSidebarExpanded) {
      // 4 blocos de 240px + 3 gaps de 12px = 960px + 36px = 996px
      return '996px';
    } else {
      // Sidebar colapsado - largura total para permitir scroll (5 blocos)
      const availableWidth = windowWidth - 80; // 80px sidebar colapsado
      const blockWidth = (availableWidth - 36) / 4; // Largura de cada bloco visível
      const totalWidth = (blockWidth * 5) + (12 * 4); // 5 blocos + 4 gaps
      return `${Math.floor(totalWidth)}px`;
    }
  };

  // Funções para gerenciar fases de projeto
  const getPhaseData = () => {
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const planningProjects = projects.filter(p => p.status === 'planning').length;
    
    // Simular fases baseadas nos projetos reais
    const phases = [
      {
        id: 1,
        name: 'Planejamento',
        completed: Math.min(planningProjects, Math.floor(totalProjects * 0.2)),
        total: Math.floor(totalProjects * 0.2),
        startDate: '01/01',
        endDate: '15/01',
        status: 'completed',
        progress: Math.min(planningProjects, Math.floor(totalProjects * 0.2)) / Math.floor(totalProjects * 0.2) * 100
      },
      {
        id: 2,
        name: 'Análise',
        completed: Math.min(completedProjects, Math.floor(totalProjects * 0.3)),
        total: Math.floor(totalProjects * 0.3),
        startDate: '16/01',
        endDate: '31/01',
        status: 'completed',
        progress: Math.min(completedProjects, Math.floor(totalProjects * 0.3)) / Math.floor(totalProjects * 0.3) * 100
      },
      {
        id: 3,
        name: 'Desenvolvimento',
        completed: activeProjects,
        total: activeProjects + Math.floor(planningProjects * 0.6),
        startDate: '01/02',
        endDate: '28/02',
        status: 'in_progress',
        progress: activeProjects / (activeProjects + Math.floor(planningProjects * 0.6)) * 100
      },
      {
        id: 4,
        name: 'Testes',
        completed: 0,
        total: Math.max(planningProjects - Math.floor(planningProjects * 0.6), 1),
        startDate: '01/03',
        endDate: '15/03',
        status: 'planned',
        progress: 0
      },
      {
        id: 5,
        name: 'Entrega',
        completed: 0,
        total: Math.max(completedProjects - Math.floor(totalProjects * 0.3), 1),
        startDate: '16/03',
        endDate: '31/03',
        status: 'planned',
        progress: 0
      }
    ];

    return phases;
  };

  const handleTogglePhaseExpansion = (phaseId: number) => {
    setExpandedPhase(expandedPhase === phaseId ? null : phaseId);
  };

  const handleTogglePhasesView = () => {
    setPhasesViewMode(phasesViewMode === 'compact' ? 'expanded' : 'compact');
  };

  const handleStartPhase = (phaseId: number) => {
    toast({
      title: "Fase iniciada",
      description: `Fase ${phaseId} foi iniciada com sucesso`
    });
  };

  const handleFinishPhase = (phaseId: number) => {
    toast({
      title: "Fase finalizada",
      description: `Fase ${phaseId} foi finalizada com sucesso`
    });
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  const handleCreateProject = async (formData: any) => {
    try {
      console.log('Projects: Dados recebidos para criação:', formData);
      
      const projectData = {
        name: formData.name,
        description: formData.description,
        status: formData.status as 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled',
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : undefined,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
        budget: formData.budget || undefined,
        currency: formData.currency || 'BRL'
      };

      console.log('Projects: Dados processados para criação:', projectData);

      const result = await createProject(projectData);
      
      console.log('Projects: Resultado da criação:', result);
      
      if (result) {
        toast({
          title: "Projeto criado",
          description: "Novo projeto foi criado com sucesso"
        });
        setIsCreateModalOpen(false);
        fetchProjects();
      }
    } catch (error) {
      console.error('Projects: Erro ao criar projeto:', error);
      toast({
        title: "Erro",
        description: `Erro ao criar projeto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
      });
    }
  };

  const handleCreateQuickProject = async (name: string, status: string) => {
    try {
      const projectData = {
        name,
        description: '',
        status: status as 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled',
        priority: 'medium' as const,
        responsible_id: employees.length > 0 ? employees[0].id : undefined
      };

      const result = await createProject(projectData);
      
      if (result) {
        toast({
          title: "Projeto rápido criado",
          description: "Novo projeto foi criado com sucesso"
        });
        fetchProjects();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar projeto rápido",
        variant: "destructive"
      });
    }
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleOpenKanbanEditModal = () => {
    setIsKanbanEditModalOpen(true);
  };

  const handleCloseKanbanEditModal = () => {
    setIsKanbanEditModalOpen(false);
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
      title: "Etapa adicionada",
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
        description: "O nome da etapa foi atualizado com sucesso",
        duration: 2000,
      });
    }
    if (updates.color) {
      toast({
        title: "Cor atualizada",
        description: "A cor da etapa foi atualizada com sucesso",
        duration: 2000,
      });
    }
  };

  const handleEditProject = (project: any) => {
    // Implementar edição de projeto
    console.log('Editar projeto:', project);
  };

  const handleDeleteProject = (projectId: string) => {
    // Implementar exclusão de projeto
    console.log('Excluir projeto:', projectId);
    // Aqui você pode adicionar a lógica de exclusão
    // Por exemplo: deleteProject(projectId);
  };

  const handleProjectMove = (taskId: string, fromColumn: string, toColumn: string) => {
    console.log(`Projeto ${taskId} movido de ${fromColumn} para ${toColumn}`);
    // Implementar lógica de movimentação de projeto
  };

  const handleCompleteProject = (projectId: string) => {
    // Implementar conclusão de projeto
    console.log('Completar projeto:', projectId);
    // TODO: Marcar projeto como concluído
  };

  const handleArchiveProject = (projectId: string) => {
    // Implementar arquivamento de projeto
    console.log('Arquivar projeto:', projectId);
    // TODO: Arquivar projeto
  };

  const handleViewModeChange = (mode: 'board' | 'lista' | 'prazo' | 'planejador' | 'calendario' | 'dashboard') => {
    setViewMode(mode);
  };

  // Funções para controle da barra de rolagem customizada
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    
    setScrollPosition(scrollLeft);
    setMaxScroll(scrollWidth - clientWidth);
  };

  const handleCustomScroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('projects-kanban-container');
    if (!container) return;

    const blockWidth = parseInt(getBlockWidth());
    const gap = 12; // 3 * 4px (gap-3)
    const scrollAmount = blockWidth + gap;

    if (direction === 'left') {
      container.scrollLeft = Math.max(0, container.scrollLeft - scrollAmount);
    } else {
      // Para direita, rolar exatamente 1 bloco para mostrar o próximo bloco (incluindo CANCELADO)
      const newScrollLeft = container.scrollLeft + scrollAmount;
      const maxScroll = container.scrollWidth - container.clientWidth;
      container.scrollLeft = Math.min(newScrollLeft, maxScroll);
    }
  };

  const handleScrollBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const scrollBar = e.currentTarget;
    const rect = scrollBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    
    const container = document.getElementById('projects-kanban-container');
    if (container) {
      container.scrollLeft = percentage * maxScroll;
    }
  };

  // Handlers para drag-and-drop
  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    e.dataTransfer.setData('text/plain', projectId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData('text/plain');
    
    if (!projectId) return;

    // Encontrar o projeto e atualizar seu status
    const projectToUpdate = projects.find(p => p.id === projectId);
    if (!projectToUpdate) return;

    // Verificar se o projeto já está na coluna de destino
    if (projectToUpdate.status === newStatus) {
      return;
    }

    // Atualizar o projeto no estado local
    const updatedProjects = projects.map(project => 
      project.id === projectId 
        ? { ...project, status: newStatus as 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled' }
        : project
    );

    // Aqui você pode adicionar uma chamada para atualizar no backend quando necessário
    // Por enquanto, vamos apenas mostrar um toast de sucesso
    const statusLabels = {
      'planning': 'Planejamento',
      'active': 'Ativo',
      'on_hold': 'Em Pausa',
      'completed': 'Concluído',
      'cancelled': 'Cancelado'
    };

    toast({
      title: "Projeto movido",
      description: `${projectToUpdate.name} foi movido para ${statusLabels[newStatus as keyof typeof statusLabels]}`
    });

    // Atualizar o estado local (mock)
    // Em uma implementação real, você chamaria uma função de update do hook useProjects
    console.log('Projeto movido:', { projectId, newStatus, updatedProjects });
  };

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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar projetos</h3>
          <p className="text-gray-600 mb-4">{error}</p>
                     <Button onClick={() => fetchProjects()} variant="outline">
             Tentar novamente
           </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Carregando seus projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full max-w-full overflow-x-hidden" data-main-content>
      {/* Faixa branca contínua com botões de navegação e filtros - estendida até as bordas */}
      <div 
        className="bg-white -mt-6 relative left-[-1.5rem] ml-0"
        style={{
          width: sidebarExpanded ? 'calc(100vw - 240px)' : 'calc(100vw - 60px)'
        }}
      >
        {/* Botões de visualização */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
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
          searchPlaceholder="Filtrar por nome do projeto..."
        />
      </div>

      {/* Container principal com padding otimizado */}
      <div className="px-2 pt-4 w-full max-w-full">

        {/* Conteúdo baseado na visualização selecionada */}
        {viewMode === 'board' && (
          <div className="w-full">
            {/* Cabeçalho do Kanban Board */}
            <div className="flex items-center justify-end mb-4 mt-1">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenKanbanEditModal}
                  className="flex items-center text-sm px-2.5 py-1.5 h-7 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                >
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </Button>
              </div>
            </div>
            
            {/* BoardKanban - Novo design moderno */}
            <BoardKanban
              columns={kanbanColumns}
              tasks={projects.map(project => ({
                ...project,
                title: project.name,
                id: project.id,
                description: project.description,
                priority: project.priority,
                status: project.status,
                due_date: project.due_date,
                dueDate: project.due_date
              }))}
              onTaskMove={handleProjectMove}
              onAddTask={handleOpenCreateModal}
              onTaskClick={handleProjectClick}
              onEditTask={handleEditProject}
              onDeleteTask={handleDeleteProject}
              className="px-3"
            />
          </div>
        )}

        {/* Visualização em Lista */}
        {viewMode === 'lista' && (
          <div className="w-full -ml-2">
            {/* Tabela de Projetos */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Cabeçalho da Tabela */}
              <div className="bg-gray-50 border-b border-gray-200">
                <div className="px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-900">Lista de Projetos</h3>
                  <p className="text-sm text-gray-600">Visualização em lista dos projetos</p>
                </div>
              </div>
              
              {/* Conteúdo da Lista */}
              <div className="p-6">
                <div className="space-y-4">
                  {projects.map(project => (
                    <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <h4 className="font-semibold text-gray-900">{project.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          project.status === 'planning' ? 'bg-gray-100 text-gray-800' :
                          project.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                          project.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          project.priority === 'high' ? 'bg-red-100 text-red-800' :
                          project.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {project.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        )}

        {/* Outras visualizações podem ser adicionadas aqui */}
        
      </div>

      {/* Modais */}
      {isCreateModalOpen && (
        <ProjectCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateProject}
          companies={companies}
          employees={employees}
        />
      )}
    </div>
  );
};

export default Projects;
                  </div>
                </div>
                
                <div className="flex-1 p-3 space-y-3">
                  {/* Renderizar projetos reais */}
                  {projects
                    .filter(project => project.status === 'planning')
                    .map(project => (
                      <div 
                        key={project.id}
                        className="group relative bg-white border border-[#E5E7EB] rounded-lg p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                        onClick={() => handleProjectClick(project.id)}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, project.id)}
                      >
                        {/* Botões de ação - aparecem apenas no hover */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProject(project);
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                            title="Editar projeto"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                            title="Excluir projeto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <h4 className="font-inter text-[14px] text-[#111827] mb-2 pr-8">{project.name}</h4>
                        <p className="font-inter text-[12px] text-[#6B7280] mb-3">
                          {project.description || 'Sem descrição'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`text-[12px] px-1.5 py-1 rounded ${
                            project.priority === 'urgent' ? 'bg-[#FEE2E2] text-[#B91C1C]' :
                            project.priority === 'high' ? 'bg-[#FEF3C7] text-[#D97706]' :
                            project.priority === 'medium' ? 'bg-[#DBEAFE] text-[#1E40AF]' :
                            'bg-[#D1FAE5] text-[#059669]'
                          }`}>
                            {project.priority === 'urgent' ? 'Urgente' :
                             project.priority === 'high' ? 'Alta' :
                             project.priority === 'medium' ? 'Média' : 'Baixa'}
                          </span>
                          <div className="flex items-center text-[12px] text-[#6B7280]">
                            <Calendar className="h-4 w-4 mr-1.5" />
                            <span className="font-inter">
                              {project.due_date ? new Date(project.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {/* Mensagem quando não há projetos */}
                  {projects.filter(p => p.status === 'planning').length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Nenhum projeto em planejamento
                    </div>
                  )}
                </div>
                
                <div className="p-3 border-t border-[#E5E7EB]">
                  <button 
                    className="w-full h-9 font-inter text-[12px] text-[#6B7280] border border-dashed border-[#D1D5DB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
                    onClick={handleOpenCreateModal}
                  >
                    + NOVO PROJETO
                  </button>
                </div>
              </div>

              {/* Coluna ATIVO */}
              <div 
                className={`kanban-column bg-white border border-[#E5E7EB] rounded-lg min-h-fit flex flex-col flex-shrink-0 ${!isSidebarExpanded ? 'flex-1' : ''}`}
                style={{ 
                  width: getBlockWidth(),
                  minWidth: !isSidebarExpanded ? '0' : '240px'
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'active')}
              >
                <div className="p-4 border-b border-[#E5E7EB] border-t-2 border-t-[#FACC15] hover:shadow-md hover:scale-[1.01] transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-inter text-[12px] text-[#374151]">ATIVO</h3>
                    <span className="font-inter text-[11px] text-[#6B7280]">
                      {projects.filter(p => p.status === 'active').length}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 p-3 space-y-3">
                  {/* Renderizar projetos reais */}
                  {projects
                    .filter(project => project.status === 'active')
                    .map(project => (
                      <div 
                        key={project.id}
                        className="group relative bg-white border border-[#E5E7EB] rounded-lg p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                        onClick={() => handleProjectClick(project.id)}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, project.id)}
                      >
                        {/* Botões de ação - aparecem apenas no hover */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProject(project);
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                            title="Editar projeto"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                            title="Excluir projeto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <h4 className="font-inter text-[14px] text-[#111827] mb-2 pr-8">{project.name}</h4>
                        <p className="font-inter text-[12px] text-[#6B7280] mb-3">
                          {project.description || 'Sem descrição'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`text-[12px] px-1.5 py-1 rounded ${
                            project.priority === 'urgent' ? 'bg-[#FEE2E2] text-[#B91C1C]' :
                            project.priority === 'high' ? 'bg-[#FEF3C7] text-[#D97706]' :
                            project.priority === 'medium' ? 'bg-[#DBEAFE] text-[#1E40AF]' :
                            'bg-[#D1FAE5] text-[#059669]'
                          }`}>
                            {project.priority === 'urgent' ? 'Urgente' :
                             project.priority === 'high' ? 'Alta' :
                             project.priority === 'medium' ? 'Média' : 'Baixa'}
                          </span>
                          <div className="flex items-center text-[12px] text-[#6B7280]">
                            <Calendar className="h-4 w-4 mr-1.5" />
                            <span className="font-inter">
                              {project.due_date ? new Date(project.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {/* Mensagem quando não há projetos */}
                  {projects.filter(p => p.status === 'active').length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Nenhum projeto ativo
                    </div>
                  )}
                </div>
                
                <div className="p-3 border-t border-[#E5E7EB]">
                  <button 
                    className="w-full h-9 font-inter text-[12px] text-[#6B7280] border border-dashed border-[#D1D5DB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
                    onClick={handleOpenCreateModal}
                  >
                    + NOVO PROJETO
                  </button>
                </div>
              </div>

              {/* Coluna EM PAUSA */}
              <div 
                className={`kanban-column bg-white border border-[#E5E7EB] rounded-lg min-h-fit flex flex-col flex-shrink-0 ${!isSidebarExpanded ? 'flex-1' : ''}`}
                style={{ 
                  width: getBlockWidth(),
                  minWidth: !isSidebarExpanded ? '0' : '240px'
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'on_hold')}
              >
                <div className="p-4 border-b border-[#E5E7EB] border-t-2 border-t-[#3B82F6] hover:shadow-md hover:scale-[1.01] transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-inter text-[12px] text-[#374151]">EM PAUSA</h3>
                    <span className="font-inter text-[11px] text-[#6B7280]">
                      {projects.filter(p => p.status === 'on_hold').length}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 p-3 space-y-3">
                  {/* Renderizar projetos reais */}
                  {projects
                    .filter(project => project.status === 'on_hold')
                    .map(project => (
                      <div 
                        key={project.id}
                        className="group relative bg-white border border-[#E5E7EB] rounded-lg p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                        onClick={() => handleProjectClick(project.id)}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, project.id)}
                      >
                        {/* Botões de ação - aparecem apenas no hover */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProject(project);
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                            title="Editar projeto"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                            title="Excluir projeto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <h4 className="font-inter text-[14px] text-[#111827] mb-2 pr-8">{project.name}</h4>
                        <p className="font-inter text-[12px] text-[#6B7280] mb-3">
                          {project.description || 'Sem descrição'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`text-[12px] px-1.5 py-1 rounded ${
                            project.priority === 'urgent' ? 'bg-[#FEE2E2] text-[#B91C1C]' :
                            project.priority === 'high' ? 'bg-[#FEF3C7] text-[#D97706]' :
                            project.priority === 'medium' ? 'bg-[#DBEAFE] text-[#1E40AF]' :
                            'bg-[#D1FAE5] text-[#059669]'
                          }`}>
                            {project.priority === 'urgent' ? 'Urgente' :
                             project.priority === 'high' ? 'Alta' :
                             project.priority === 'medium' ? 'Média' : 'Baixa'}
                          </span>
                          <div className="flex items-center text-[12px] text-[#6B7280]">
                            <Calendar className="h-4 w-4 mr-1.5" />
                            <span className="font-inter">
                              {project.due_date ? new Date(project.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {/* Mensagem quando não há projetos */}
                  {projects.filter(p => p.status === 'on_hold').length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Nenhum projeto em pausa
                    </div>
                  )}
                </div>
                
                <div className="p-3 border-t border-[#E5E7EB]">
                  <button 
                    className="w-full h-9 font-inter text-[12px] text-[#6B7280] border border-dashed border-[#D1D5DB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
                    onClick={handleOpenCreateModal}
                  >
                    + NOVO PROJETO
                  </button>
                </div>
              </div>

              {/* Coluna CONCLUÍDO */}
              <div 
                className={`kanban-column bg-white border border-[#E5E7EB] rounded-lg min-h-fit flex flex-col flex-shrink-0 ${!isSidebarExpanded ? 'flex-1' : ''}`}
                style={{ 
                  width: getBlockWidth(),
                  minWidth: !isSidebarExpanded ? '0' : '240px'
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'completed')}
              >
                <div className="p-4 border-b border-[#E5E7EB] border-t-2 border-t-[#10B981] hover:shadow-md hover:scale-[1.01] transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-inter text-[12px] text-[#374151]">CONCLUÍDO</h3>
                    <span className="font-inter text-[11px] text-[#6B7280]">
                      {projects.filter(p => p.status === 'completed').length}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 p-3 space-y-3">
                  {/* Renderizar projetos reais */}
                  {projects
                    .filter(project => project.status === 'completed')
                    .map(project => (
                      <div 
                        key={project.id}
                        className="group relative bg-white border border-[#E5E7EB] rounded-lg p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                        onClick={() => handleProjectClick(project.id)}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, project.id)}
                      >
                        {/* Botões de ação - aparecem apenas no hover */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProject(project);
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                            title="Editar projeto"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                            title="Excluir projeto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <h4 className="font-inter text-[14px] text-[#111827] mb-2 pr-8">{project.name}</h4>
                        <p className="font-inter text-[12px] text-[#6B7280] mb-3">
                          {project.description || 'Sem descrição'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`text-[12px] px-1.5 py-1 rounded ${
                            project.priority === 'urgent' ? 'bg-[#FEE2E2] text-[#B91C1C]' :
                            project.priority === 'high' ? 'bg-[#FEF3C7] text-[#D97706]' :
                            project.priority === 'medium' ? 'bg-[#DBEAFE] text-[#1E40AF]' :
                            'bg-[#D1FAE5] text-[#059669]'
                          }`}>
                            {project.priority === 'urgent' ? 'Urgente' :
                             project.priority === 'high' ? 'Alta' :
                             project.priority === 'medium' ? 'Média' :
                             'Baixa'}
                          </span>
                          <div className="flex items-center text-[12px] text-[#6B7280]">
                            <Calendar className="h-4 w-4 mr-1.5" />
                            <span className="font-inter">
                              {project.due_date ? new Date(project.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {/* Mensagem quando não há projetos */}
                  {projects.filter(p => p.status === 'completed').length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Nenhum projeto concluído
                    </div>
                  )}
                </div>
                
                <div className="p-3 border-t border-[#E5E7EB]">
                  <button 
                    className="w-full h-9 font-inter text-[12px] text-[#6B7280] border border-dashed border-[#D1D5DB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
                    onClick={handleOpenCreateModal}
                  >
                    + NOVO PROJETO
                  </button>
                </div>
              </div>

              {/* Coluna CANCELADO */}
              <div 
                className={`kanban-column bg-white border border-[#E5E7EB] rounded-lg min-h-fit flex flex-col flex-shrink-0 ${!isSidebarExpanded ? 'flex-1' : ''}`}
                style={{ 
                  width: getBlockWidth(),
                  minWidth: !isSidebarExpanded ? '0' : '240px'
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'cancelled')}
              >
                <div className="p-4 border-b border-[#E5E7EB] border-t-2 border-t-[#EF4444] hover:shadow-md hover:scale-[1.01] transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-inter text-[12px] text-[#374151]">CANCELADO</h3>
                    <span className="text-[11px] text-[#6B7280]">
                      {projects.filter(p => p.status === 'cancelled').length}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 p-3 space-y-3">
                  {/* Renderizar projetos reais */}
                  {projects
                    .filter(project => project.status === 'cancelled')
                    .map(project => (
                      <div 
                        key={project.id}
                        className="group relative bg-white border border-[#E5E7EB] rounded-lg p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                        onClick={() => handleProjectClick(project.id)}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, project.id)}
                      >
                        {/* Botões de ação - aparecem apenas no hover */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProject(project);
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                            title="Editar projeto"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                            title="Excluir projeto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <h4 className="font-inter text-[14px] text-[#111827] mb-2 pr-8">{project.name}</h4>
                        <p className="font-inter text-[12px] text-[#6B7280] mb-3">
                          {project.description || 'Sem descrição'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`text-[12px] px-1.5 py-1 rounded ${
                            project.priority === 'urgent' ? 'bg-[#FEE2E2] text-[#B91C1C]' :
                            project.priority === 'high' ? 'bg-[#FEF3C7] text-[#D97706]' :
                            project.priority === 'medium' ? 'bg-[#DBEAFE] text-[#1E40AF]' :
                            'bg-[#D1FAE5] text-[#059669]'
                          }`}>
                            {project.priority === 'urgent' ? 'Urgente' :
                             project.priority === 'high' ? 'Alta' :
                             project.priority === 'medium' ? 'Média' : 'Baixa'}
                          </span>
                          <div className="flex items-center text-[12px] text-[#6B7280]">
                            <Calendar className="h-4 w-4 mr-1.5" />
                            <span className="font-inter">
                              {project.due_date ? new Date(project.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {/* Mensagem quando não há projetos */}
                  {projects.filter(p => p.status === 'cancelled').length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Nenhum projeto cancelado
                    </div>
                  )}
                </div>
                
                <div className="p-3 border-t border-[#E5E7EB]">
                  <button 
                    className="w-full h-9 font-inter text-[12px] text-[#6B7280] border border-dashed border-[#D1D5DB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
                    onClick={handleOpenCreateModal}
                  >
                    + NOVO PROJETO
                  </button>
                </div>
              </div>
              </div>
              
              {/* Barra de rolagem customizada centralizada embaixo do Kanban */}
              <div className="mt-2 flex justify-center">
                <div className="flex items-center gap-2">
                  {/* Botão esquerda */}
                  <button
                    onClick={() => handleCustomScroll('left')}
                    disabled={scrollPosition <= 0}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  {/* Barra de rolagem customizada */}
                  <div 
                    className="bg-gray-200 rounded-full cursor-pointer relative"
                    style={{ 
                      width: '150px', // Barra menor e centralizada
                      height: '6px' // Altura reduzida
                    }}
                    onClick={handleScrollBarClick}
                  >
                    <div 
                      className="bg-blue-500 rounded-full transition-all duration-200 hover:bg-blue-600"
                      style={{ 
                        width: maxScroll > 0 ? `${(scrollPosition / maxScroll) * 100}%` : '0%',
                        height: '100%'
                      }}
                    />
                  </div>
                  
                  {/* Botão direita */}
                  <button
                    onClick={() => handleCustomScroll('right')}
                    disabled={maxScroll <= 0 || scrollPosition >= maxScroll - 1}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Visualização em Lista */}
        {viewMode === 'lista' && (
          <div className="w-full -ml-2">
            {/* Tabela de Projetos */}
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
                    <span>Status</span>
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
                    <span>Orçamento</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-24 flex items-center justify-end gap-2 text-sm font-medium text-gray-700">
                    <span>Prioridade</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Linhas da Tabela */}
              <div className="divide-y divide-gray-200">
                {projects && projects.length > 0 ? (
                  projects.map((project) => (
                    <div key={project.id} className="flex items-center px-6 py-4 h-16 hover:bg-gray-50 transition-colors gap-4">
                      <div className="w-12 flex items-center">
                        <Checkbox className="h-4 w-4" />
                      </div>
                      <div className="flex-1 flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-white font-medium">{project.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm text-gray-900 truncate">{project.name}</span>
                          <span className="text-xs text-gray-400">{project.description || 'Sem descrição'}</span>
                        </div>
                      </div>
                      <div className="w-32 flex items-center justify-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          project.status === 'active' ? 'bg-green-100 text-green-800 border border-green-200' :
                          project.status === 'completed' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          project.status === 'planning' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                          project.status === 'on_hold' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                          'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {project.status === 'active' ? 'Ativo' :
                           project.status === 'completed' ? 'Concluído' :
                           project.status === 'planning' ? 'Planejamento' :
                           project.status === 'on_hold' ? 'Em Pausa' :
                           'Cancelado'}
                        </span>
                      </div>
                      <div className="w-32 flex items-center justify-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{project.due_date ? new Date(project.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}</span>
                      </div>
                      <div className="w-32 flex items-center justify-center gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-white font-medium">A</span>
                        </div>
                        <span className="text-sm text-gray-900">Admin</span>
                      </div>
                      <div className="w-40 flex items-center justify-center gap-3">
                        <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-white font-medium">R</span>
                        </div>
                        <span className="text-sm text-gray-900">Responsável</span>
                      </div>
                      <div className="w-32 flex items-center justify-center gap-2 text-sm text-gray-600">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span>{project.budget ? `R$ ${project.budget.toLocaleString('pt-BR')}` : 'Sem orçamento'}</span>
                      </div>
                      <div className="w-24 flex items-center justify-end">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          project.priority === 'urgent' ? 'bg-red-100 text-red-800 border border-red-200' :
                          project.priority === 'high' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                          project.priority === 'medium' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          'bg-green-100 text-green-800 border border-green-200'
                        }`}>
                          {project.priority === 'urgent' ? 'Urgente' :
                           project.priority === 'high' ? 'Alta' :
                           project.priority === 'medium' ? 'Média' :
                           'Baixa'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center">
                    <div className="text-gray-400 text-4xl mb-2">📋</div>
                    <p className="text-sm text-gray-500">Nenhum projeto encontrado</p>
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
            {/* Cartões de Resumo dos Projetos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {/* Cartão Vencidos */}
              <div className="bg-white/80 border border-gray-100 rounded-lg p-4 relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {projects.filter(p => {
                      if (!p.due_date) return false;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const dueDate = new Date(p.due_date);
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
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Vencidos</h3>
                  <p className="text-xs text-gray-600">Projetos com prazo vencido</p>
                </div>
              </div>

              {/* Cartão Para Hoje */}
              <div className="bg-white/80 border border-gray-100 rounded-lg p-4 relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {projects.filter(p => {
                      if (!p.due_date) return false;
                      const today = new Date();
                      const dueDate = new Date(p.due_date);
                      return dueDate.toDateString() === today.toDateString();
                    }).length}
                  </span>
                </div>
                <div className="flex flex-col items-start text-left">
                  <div className="w-12 h-12 flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Para Hoje</h3>
                  <p className="text-xs text-gray-600">Projetos para hoje</p>
                </div>
              </div>

              {/* Cartão Para Amanhã */}
              <div className="bg-white/80 border border-gray-100 rounded-lg p-4 relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {projects.filter(p => {
                      if (!p.due_date) return false;
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      const dueDate = new Date(p.due_date);
                      return dueDate.toDateString() === tomorrow.toDateString();
                    }).length}
                  </span>
                </div>
                <div className="flex flex-col items-start text-left">
                  <div className="w-12 h-12 flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Para Amanhã</h3>
                  <p className="text-xs text-gray-600">Projetos para amanhã</p>
                </div>
              </div>

              {/* Cartão Esta Semana */}
              <div className="bg-white/80 border border-gray-100 rounded-lg p-4 relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {projects.filter(p => {
                      if (!p.due_date) return false;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const tomorrow = new Date(today);
                      tomorrow.setDate(today.getDate() + 1);
                      const endOfWeek = new Date(today);
                      endOfWeek.setDate(today.getDate() + 7);
                      const dueDate = new Date(p.due_date);
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
                  <p className="text-xs text-gray-600">Projetos desta semana</p>
                </div>
              </div>

              {/* Cartão Mais Tarde */}
              <div className="bg-white/80 border border-gray-100 rounded-lg p-4 relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {projects.filter(p => {
                      if (!p.due_date) return false;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const endOfWeek = new Date(today);
                      endOfWeek.setDate(today.getDate() + 7);
                      const dueDate = new Date(p.due_date);
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
                  <p className="text-xs text-gray-600">Projetos futuros</p>
                </div>
              </div>
            </div>

            {/* Visualização por Prazo */}
            <div className="p-3">
              <ProjectDeadlineView
                projects={projects}
                onProjectClick={handleProjectClick}
                onCompleteProject={handleCompleteProject}
                onArchiveProject={handleArchiveProject}
                onEditProject={handleEditProject}
                onOpenCreateModal={handleOpenCreateModal}
                searchTerm={filters.search}
                selectedResponsibles={filters.responsibleId !== 'all' ? [filters.responsibleId] : []}
                selectedWorkGroup={filters.workGroup !== 'all' ? [filters.workGroup] : []}
                selectedDepartment={[]}
              />
            </div>
          </div>
        )}

        {viewMode === 'planejador' && (
          <div className="planejador-page bg-[#f5f7fb] min-h-screen pl-2 pr-6 py-6">

            {/* Planejamento Kanban */}
            <section className="kanban-section pl-2 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Kanban className="w-5 h-5 text-blue-400" />
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-gray-900/85">Planejamento Kanban</h2>
                    <span className="text-xs text-gray-600/85">{projects.length} projetos</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                    variant="ghost"
                      size="sm"
                    onClick={handleOpenKanbanEditModal}
                    className="flex items-center text-xs px-2 py-1 h-6 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar
                    </Button>
                  <span className="text-sm text-gray-600">{projects.length} projetos</span>
                  </div>
                </div>

              {/* Kanban por Status - Grid horizontal com largura proporcional */}
              {!kanbanLoaded ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-gray-500">Carregando configurações do Kanban...</div>
                      </div>
              ) : (
                <div className={`grid gap-4 w-full overflow-hidden pb-6 items-start`} style={{ gridTemplateColumns: `repeat(${kanbanColumns.length}, 1fr)` }}>
                  {kanbanColumns.map((column, index) => {
                  const columnProjects = projects.filter(project => {
                    if (column.status === 'planning') return project.status === 'planning';
                    if (column.status === 'active') return project.status === 'active';
                    if (column.status === 'on_hold') return project.status === 'on_hold';
                    if (column.status === 'completed') return project.status === 'completed';
                    return project.status === column.status;
                  });

                  const getColumnStyles = (column: any) => {
                    // Todos os blocos com fundo branco e borda consistente
                    if (column.status === 'planning') {
                      return { bg: 'bg-white', border: 'border-gray-200', line: 'bg-gray-500' };
                    } else if (column.status === 'active') {
                      return { bg: 'bg-white', border: 'border-gray-200', line: 'bg-orange-500' };
                    } else if (column.status === 'on_hold') {
                      return { bg: 'bg-white', border: 'border-gray-200', line: 'bg-yellow-500' };
                    } else if (column.status === 'completed') {
                      return { bg: 'bg-white', border: 'border-gray-200', line: 'bg-green-500' };
                    } else {
                      // Para colunas customizadas, usar fundo branco e borda consistente
                      return { bg: 'bg-white', border: 'border-gray-200', line: 'bg-gray-500' };
                    }
                  };

                  const columnStyle = getColumnStyles(column);

                  return (
                    <div key={column.id} className="w-full flex flex-col">
                      <div className={`${columnStyle.bg} ${columnStyle.border} border rounded-lg p-3 flex flex-col ${
                        columnProjects.length === 0 
                          ? 'min-h-[200px]' 
                          : 'min-h-[150px]'
                      }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                              {column.name}
                        </h3>
                        <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                              {columnProjects.length}
                        </span>
                      </div>
                    </div>
                    
                    {/* Linha colorida discreta abaixo do título */}
                        <div className={`w-full h-0.5 ${columnStyle.line} rounded mb-4`}></div>

                    <div className="space-y-3 flex-1">
                          {columnProjects.map(project => (
                          <div key={project.id} className="bg-white border border-gray-200 rounded-lg p-2 px-3 cursor-pointer hover:shadow-md transition-shadow">
                            <div className="mb-2">
                              <h4 className="text-xs font-normal text-gray-900 mb-1">
                                {project.name}
                              </h4>
                              <p className="text-xs text-gray-600">
                                {project.description || 'Sem descrição'}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                project.priority === 'high' ? 'bg-red-100 text-red-700' :
                                project.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {project.priority === 'high' ? 'Alta' :
                                 project.priority === 'medium' ? 'Média' : 'Baixa'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {project.due_date ? new Date(project.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                            </div>
                          </div>
                        ))}
                      
                          {columnProjects.length === 0 && (
                            <div className="text-center py-4 text-gray-500 text-sm flex items-center justify-center flex-1">
                              Nenhum projeto
                        </div>
                      )}
                    </div>

                    {/* Botão para criar novo projeto */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full mt-3 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 bg-white text-xs py-1 mt-auto"
                      onClick={handleOpenCreateModal}
                    >
                      + NOVO PROJETO
                    </Button>
                  </div>
                </div>
                  );
                })}
                        </div>
                      )}
            </section>

            {/* Acompanhamento de Fases */}
            <section className="sprints-section mb-8">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Acompanhamento de Fases</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {getPhaseData().filter(f => f.status === 'completed').length} de {getPhaseData().length} fases finalizadas • 
                      Fase ativa: {getPhaseData().find(f => f.status === 'in_progress')?.name || 'Nenhuma'} 
                      ({getPhaseData().find(f => f.status === 'in_progress')?.completed || 0}/{getPhaseData().find(f => f.status === 'in_progress')?.total || 0} concluídas)
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleTogglePhasesView}
                      className="flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      {phasesViewMode === 'compact' ? 'Expandir Visualização' : 'Visualização Compacta'}
                    </Button>
                  </div>
                </div>

                <div className={`grid gap-4 ${phasesViewMode === 'compact' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1'}`}>
                  {getPhaseData().map((phase) => (
                    <div 
                      key={phase.id} 
                      className={`bg-white border border-gray-200 rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:border-gray-300 ${
                        expandedPhase === phase.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
                      }`}
                    >
                      {/* Header da fase */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900 text-sm">{phase.name}</h3>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {phase.completed}/{phase.total}
                          </span>
                        </div>
                        <button
                          onClick={() => handleTogglePhaseExpansion(phase.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <ChevronDown 
                            className={`w-4 h-4 text-gray-500 transition-transform ${
                              expandedPhase === phase.id ? 'rotate-180' : ''
                            }`} 
                          />
                        </button>
                      </div>

                      {/* Barra de progresso */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            phase.status === 'completed' ? 'bg-green-500' :
                            phase.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${Math.min(phase.progress, 100)}%` }}
                        ></div>
                      </div>
                        
                      {/* Data da fase */}
                      <div className="flex items-center text-xs text-gray-500 mb-4">
                        <Clock className="w-3 h-3 mr-1.5" />
                        <span>{phase.startDate} - {phase.endDate}</span>
                      </div>
                        
                      {/* Status e ações */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs px-2 py-1 ${
                              phase.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                              phase.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border-blue-200' : 
                              'bg-gray-100 text-gray-800 border-gray-200'
                            }`}
                          >
                            {phase.status === 'completed' ? 'Finalizada' :
                             phase.status === 'in_progress' ? 'Em Andamento' : 'Planejada'}
                          </Badge>
                        </div>
                        
                        {/* Botões de ação */}
                        <div className="flex justify-end">
                          {phase.status === 'in_progress' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs px-3 py-1.5 h-auto border-blue-200 text-blue-700 hover:bg-blue-50"
                              onClick={() => handleFinishPhase(phase.id)}
                            >
                              Finalizar Fase
                            </Button>
                          )}
                          
                          {phase.status === 'planned' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs px-3 py-1.5 h-auto border-gray-200 text-gray-700 hover:bg-gray-50"
                              onClick={() => handleStartPhase(phase.id)}
                            >
                              Iniciar Fase
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Detalhes expandidos */}
                      {expandedPhase === phase.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Progresso:</span>
                              <span className="font-medium text-gray-900">{Math.round(phase.progress)}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Projetos Concluídos:</span>
                              <span className="font-medium text-gray-900">{phase.completed}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Total de Projetos:</span>
                              <span className="font-medium text-gray-900">{phase.total}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Restantes:</span>
                              <span className="font-medium text-gray-900">{phase.total - phase.completed}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            
          </div>
        )}

        {viewMode === 'calendario' && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Visualização Calendário</h3>
            <p className="text-gray-600">Implementar visualização calendário</p>
          </div>
        )}

        {viewMode === 'dashboard' && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Visualização Dashboard</h3>
            <p className="text-gray-600">Implementar visualização dashboard</p>
          </div>
        )}
      </div>

      {/* Botão flutuante de novo projeto com posição exata da referência */}
      <Button
        onClick={handleOpenCreateModal}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50 transition-colors duration-200"
        style={{
          backgroundColor: '#4A5477',
          borderColor: '#4A5477'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#3F30F1';
          e.currentTarget.style.borderColor = '#3F30F1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#4A5477';
          e.currentTarget.style.borderColor = '#4A5477';
        }}
      >
        <Plus className="h-6 w-6 text-white" />
      </Button>

      {/* Modal de criação de projeto */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsCreateModalOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Criar Novo Projeto</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Preencha os dados para criar um novo projeto
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="px-6 py-4">
                <ProjectCreateModal
                  onSubmit={handleCreateProject}
                  onClose={() => setIsCreateModalOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Automações */}
      {isAutomationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsAutomationModalOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Automatize</h2>
                <button
                  onClick={() => setIsAutomationModalOpen(false)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            {/* Body */}
            <div className="px-6 py-6">
              <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                <span className="text-gray-500 text-sm">Espaço para futuras automações</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição do Kanban */}
      {isKanbanEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseKanbanEditModal}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Kanban className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Personalizar Planejamento Kanban</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Configure as etapas do seu fluxo de trabalho
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseKanbanEditModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Configurações */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-2">Como personalizar</h3>
                    <p className="text-sm text-gray-600">
                      Edite os nomes das etapas, escolha cores e reorganize a ordem. Você pode adicionar novas etapas ou remover as existentes. Suas configurações são salvas automaticamente e persistem entre sessões.
                    </p>
                  </div>

                  {/* Lista de Colunas */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium text-gray-900">Etapas do Fluxo</h3>
                      <Button
                        onClick={handleAddKanbanColumn}
                        size="sm"
                        className="flex items-center gap-2 text-white hover:opacity-90"
                        style={{ backgroundColor: '#4A5477' }}
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar Etapa
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {kanbanColumns.map((column, index) => (
                        <div key={column.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white">
                          {/* Drag Handle */}
                          <div className="cursor-move text-gray-400 hover:text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                          </div>

                          {/* Cor da Coluna */}
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-gray-600">Cor:</span>
                            <div className="flex gap-1">
                              {['gray', 'blue', 'green', 'orange', 'red', 'purple'].map((color) => (
                                <button
                                  key={color}
                                  onClick={() => handleUpdateKanbanColumn(column.id, { color })}
                                  className={`w-6 h-6 rounded-full border-2 ${
                                    column.color === color ? 'border-gray-400' : 'border-gray-200'
                                  } ${
                                    color === 'gray' ? 'bg-gray-500' :
                                    color === 'blue' ? 'bg-blue-500' :
                                    color === 'green' ? 'bg-green-500' :
                                    color === 'orange' ? 'bg-orange-500' :
                                    color === 'red' ? 'bg-red-500' :
                                    'bg-purple-500'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Nome da Coluna */}
                          <div className="flex-1">
                            <input
                              type="text"
                              value={column.name}
                              onChange={(e) => handleUpdateKanbanColumn(column.id, { name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Nome da etapa"
                            />
                          </div>

                          {/* Status */}
                          <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                            {projects.filter(project => {
                              if (column.status === 'planning') return project.status === 'planning';
                              if (column.status === 'active') return project.status === 'active';
                              if (column.status === 'on_hold') return project.status === 'on_hold';
                              if (column.status === 'completed') return project.status === 'completed';
                              return project.status === column.status;
                            }).length} projetos
                          </div>

                          {/* Remove Button */}
                          {kanbanColumns.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveKanbanColumn(column.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-4">
                  <h3 className="text-base font-medium text-gray-900">Preview</h3>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex gap-2">
                      {kanbanColumns.map((column) => {
                        const columnStyle = {
                          gray: 'bg-gray-200 border-gray-300',
                          blue: 'bg-blue-200 border-blue-300',
                          green: 'bg-green-200 border-green-300',
                          orange: 'bg-orange-200 border-orange-300',
                          red: 'bg-red-200 border-red-300',
                          purple: 'bg-purple-200 border-purple-300'
                        }[column.color] || 'bg-gray-200 border-gray-300';

                        return (
                          <div key={column.id} className={`flex-1 p-3 rounded border ${columnStyle}`}>
                            <div className="text-xs font-medium text-gray-700 mb-2">{column.name}</div>
                            <div className="text-xs text-gray-500">0 projetos</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Configurações salvas automaticamente
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleCloseKanbanEditModal}
                    className="text-white hover:opacity-90"
                    style={{ backgroundColor: '#4A5477' }}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
