import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVB } from '@/contexts/VBContext';
import { useProjects } from '@/hooks/useProjects';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { toast } from '@/hooks/use-toast';
import { useFilters } from '@/hooks/useFilters';
import { supabase } from '@/integrations/supabase/client';

import { Button } from '@/components/ui/button';
import ProjectCreateModal from '@/components/ProjectCreateModal';
import ProjectEditForm from '@/components/ProjectEditForm';
import FilterBar from '@/components/FilterBar';
import { ProjectViewModal } from '@/components/ProjectViewModal';
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
  AlignJustify,
  DollarSign,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { UploadButton } from '@/components/UploadButton';
import { Badge } from '@/components/ui/badge';
import ProjectDeadlineView from '@/components/ProjectDeadlineView';
import ClickUpKanban from '@/components/ClickUpKanban';
import ProjectKanbanBoard from '@/components/ProjectKanbanBoard';
import ProjectsDashboardCharts from '@/components/ProjectsDashboardCharts';
import ProjectsDashboardFilters from '@/components/ProjectsDashboardFilters';

const Projects = () => {
  const { state } = useVB();
  const { companies, employees } = state;
  const { projects, loading, error, createProject, updateProject, deleteProject, fetchProjects } = useProjects();
  
  // Garantir que projects seja sempre um array
  const safeProjects = projects || [];
  const { topBarColor } = useTheme();
  const { sidebarExpanded, setSidebarExpanded, showMenuButtons, expandSidebarFromMenu } = useSidebar();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'board' | 'lista' | 'prazo' | 'planejador' | 'calendario' | 'dashboard'>('board');
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [isKanbanEditModalOpen, setIsKanbanEditModalOpen] = useState(false);
  const [isKanbanConfigModalOpen, setIsKanbanConfigModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingProject, setViewingProject] = useState<any>(null);
  const [kanbanColumns, setKanbanColumns] = useState<any[]>([]);
  const [kanbanLoaded, setKanbanLoaded] = useState(false);
  const [profiles, setProfiles] = useState<{[key: string]: string}>({});
  
  // Estados para fullscreen
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenLayout, setFullscreenLayout] = useState<'fit' | 'scroll'>('fit');
  
  // Estados para filtros do Dashboard
  const [dashboardFilters, setDashboardFilters] = useState({
    dateRange: 'all',
    status: 'all',
    priority: 'all',
    responsible: 'all',
    budget: 'all'
  });
  
  // Estados para controle de sprints
  const [sprintsMinimized, setSprintsMinimized] = useState(false);
  const [expandedSprint, setExpandedSprint] = useState<string | null>(null);
  const [sprintsViewMode, setSprintsViewMode] = useState<'compact' | 'expanded'>('compact');

  // Funções para fullscreen
  React.useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const enterFullscreen = async () => {
    try {
      // Aplicar fullscreen apenas quando estiver em visualização de Kanban
      if ((viewMode === 'board' || viewMode === 'prazo' || viewMode === 'planejador') && containerRef.current && !document.fullscreenElement) {
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

  // Handlers
  const handleProjectClick = (projectId: string) => {
    const project = safeProjects.find(p => p.id === projectId);
    if (project) {
      setViewingProject(project);
      setIsViewModalOpen(true);
    }
  };

  const handleViewModalEdit = (project: any) => {
    setEditingProject(project);
    setIsEditModalOpen(true);
  };

  // Função para gerar dados mockados de sprints para projetos
  const getProjectSprintData = useMemo(() => {
    const completedProjects = safeProjects.filter(p => p.status === 'completed').length;
    const activeProjects = safeProjects.filter(p => p.status === 'active').length;
    const planningProjects = safeProjects.filter(p => p.status === 'planning').length;
    
    return [
      {
        id: 'sprint-1',
        name: 'Sprint Q1 - Planejamento Estratégico',
        status: 'completed',
        completed: 3,
        total: 5,
        progress: 100,
        startDate: '01/01/2024',
        endDate: '31/03/2024'
      },
      {
        id: 'sprint-2',
        name: 'Sprint Q2 - Desenvolvimento',
        status: 'in_progress',
        completed: activeProjects,
        total: activeProjects + planningProjects,
        progress: Math.round((activeProjects / Math.max(activeProjects + planningProjects, 1)) * 100),
        startDate: '01/04/2024',
        endDate: '30/06/2024'
      },
      {
        id: 'sprint-3',
        name: 'Sprint Q3 - Implementação',
        status: 'planned',
        completed: 0,
        total: planningProjects,
        progress: 0,
        startDate: '01/07/2024',
        endDate: '30/09/2024'
      },
      {
        id: 'sprint-4',
        name: 'Sprint Q4 - Finalização',
        status: 'planned',
        completed: 0,
        total: 4,
        progress: 0,
        startDate: '01/10/2024',
        endDate: '31/12/2024'
      }
    ];
  }, [safeProjects]);

  // Funções de manipulação de sprints
  const handleToggleSprintsMinimized = () => {
    setSprintsMinimized(!sprintsMinimized);
  };

  const handleToggleSprintExpansion = (sprintId: string) => {
    setExpandedSprint(expandedSprint === sprintId ? null : sprintId);
  };

  const handleFinishSprint = (sprintId: string) => {
    console.log('Finalizando sprint:', sprintId);
    // Aqui você pode implementar a lógica para finalizar o sprint
    // Por enquanto, apenas um log para demonstração
  };

  const handleStartSprint = (sprintId: string) => {
    console.log('Iniciando sprint:', sprintId);
    // Aqui você pode implementar a lógica para iniciar o sprint
    // Por enquanto, apenas um log para demonstração
  };

  // Funções para o ProjectKanbanBoard
  const handleMoveProject = async (projectId: string, newColumn: string, newPosition: number) => {
    try {
      // Mapear as colunas do Kanban para os status dos projetos
      let newStatus = newColumn;
      
      // Verificar se é uma coluna personalizada
      const customColumn = kanbanColumns.find(col => col.id === newColumn);
      if (customColumn && customColumn.status) {
        newStatus = customColumn.status;
      } else {
        // Mapeamento para colunas padrão
        if (newColumn === 'planning') newStatus = 'planning';
        else if (newColumn === 'active') newStatus = 'active';
        else if (newColumn === 'completed') newStatus = 'completed';
        else if (newColumn === 'on_hold') newStatus = 'on_hold';
      }

      const result = await updateProject(projectId, { status: newStatus });
      
      if (result.error) {
        toast({
          title: "Erro ao mover projeto",
          description: result.error,
          variant: "destructive",
        });
        return { data: null, error: result.error };
      }

      toast({
        title: "Projeto movido",
        description: "Projeto movido com sucesso",
      });

      return { data: result.data, error: null };
    } catch (error) {
      console.error('Erro ao mover projeto:', error);
      return { data: null, error: 'Erro ao mover projeto' };
    }
  };

  const handleEditProject = (project: any) => {
    setEditingProject(project);
    setIsEditModalOpen(true);
  };

  const handleUpdateProject = async (formData: any) => {
    try {
      if (!editingProject) return;

      console.log('🔄 [UPDATE] Dados recebidos do formulário:', formData);
      console.log('🔄 [UPDATE] Projeto sendo editado:', editingProject);
      
      // Verificar se há dados problemáticos
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        console.log(`🔍 [UPDATE] Campo ${key}:`, value, typeof value);
      });

      // Usar apenas campos essenciais - mesma lógica que funcionou para atividades
      const updateData: any = {
        name: formData.name?.trim() || editingProject.name,
        description: formData.description?.trim() || null,
        status: formData.status || editingProject.status,
        priority: formData.priority || editingProject.priority
      };

      // Adicionar apenas campos opcionais se válidos
      if (formData.start_date) {
        try {
          updateData.start_date = new Date(formData.start_date).toISOString();
        } catch (error) {
          console.warn('⚠️ [UPDATE] Data de início inválida:', formData.start_date);
        }
      }

      if (formData.due_date) {
        try {
          // Tabela usa end_date; aceitar due_date do formulário e mapear
          updateData.end_date = new Date(formData.due_date).toISOString();
        } catch (error) {
          console.warn('⚠️ [UPDATE] Data de vencimento inválida:', formData.due_date);
        }
      }

      if (formData.budget && !isNaN(parseFloat(formData.budget.toString()))) {
        updateData.budget = parseFloat(formData.budget.toString());
      }

      // Campos progress e notes não existem no schema atual de projects; omitidos

      console.log('🔄 [UPDATE] Dados de atualização preparados:', { 
        id: editingProject.id, 
        updateData
      });

      const result = await updateProject(editingProject.id, updateData);
      
      if (result && !result.error) {
        console.log('✅ [UPDATE] Projeto atualizado com sucesso:', result.data);
        
        toast({
          title: "Projeto atualizado",
          description: "Projeto foi atualizado com sucesso"
        });
        
        setIsEditModalOpen(false);
        setEditingProject(null);
      } else if (result && result.error) {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('❌ [UPDATE] Erro ao atualizar projeto:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar projeto",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const result = await deleteProject(projectId);
      
      if (result.error) {
        toast({
          title: "Erro ao excluir projeto",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Projeto excluído",
        description: "Projeto excluído com sucesso",
      });
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      toast({
        title: "Erro ao excluir projeto",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    }
  };


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
        setKanbanColumns([
          { id: 'planning', name: 'PLANEJAMENTO', color: '#8B7355', status: 'planning' },
          { id: 'active', name: 'EM ANDAMENTO', color: '#6B8E23', status: 'active' },
          { id: 'on_hold', name: 'PAUSADO', color: '#CD853F', status: 'on_hold' },
          { id: 'completed', name: 'CONCLUÍDO', color: '#556B2F', status: 'completed' }
        ]);
        setKanbanLoaded(true);
      }
    } else {
      setKanbanColumns([
        { id: 'planning', name: 'PLANEJAMENTO', color: '#8B7355', status: 'planning' },
        { id: 'active', name: 'EM ANDAMENTO', color: '#6B8E23', status: 'active' },
        { id: 'on_hold', name: 'PAUSADO', color: '#CD853F', status: 'on_hold' },
        { id: 'completed', name: 'CONCLUÍDO', color: '#556B2F', status: 'completed' }
      ]);
      setKanbanLoaded(true);
    }
    
    // Carregar perfis
    loadProfiles();
  }, []);

  // Salvar configurações do Kanban sempre que houver mudanças
  useEffect(() => {
    if (kanbanLoaded && kanbanColumns.length > 0) {
      localStorage.setItem('projectsKanbanColumns', JSON.stringify(kanbanColumns));
    }
  }, [kanbanColumns, kanbanLoaded]);

  // Funções para gerenciar colunas do Kanban
  const handleAddKanbanColumn = () => {
    const newColumn = {
      id: `column_${Date.now()}`,
      name: 'NOVA ETAPA',
      color: '#6B7280',
      status: 'new'
    };
    setKanbanColumns([...kanbanColumns, newColumn]);
  };

  const handleRemoveKanbanColumn = (columnId: string) => {
    if (kanbanColumns.length > 1) {
      const columnToRemove = kanbanColumns.find(col => col.id === columnId);
      setKanbanColumns(kanbanColumns.filter(col => col.id !== columnId));
      
      toast({
        title: "Etapa removida",
        description: `"${columnToRemove?.name}" foi removida do seu Kanban`,
        duration: 3000,
      });
    }
  };

  const handleUpdateKanbanColumn = (columnId: string, fieldOrUpdates: string | any, value?: string) => {
    setKanbanColumns(kanbanColumns.map(col => {
      if (col.id === columnId) {
        if (typeof fieldOrUpdates === 'string' && value !== undefined) {
          // Chamada com field e value: handleUpdateKanbanColumn(id, 'name', 'Novo Nome')
          return { ...col, [fieldOrUpdates]: value };
        } else {
          // Chamada com updates object: handleUpdateKanbanColumn(id, { name: 'Novo Nome' })
          return { ...col, ...fieldOrUpdates };
        }
      }
      return col;
    }));
  };

  // Hook para gerenciar filtros
  const { filters, updateFilter, clearFilters, getFilterParams } = useFilters();
  
  const navigate = useNavigate();

  // Função para aplicar filtros
  const applyFilters = async () => {
    const filterParams = getFilterParams();
    await fetchProjects(filterParams);
  };

  const handleFilterApply = () => {
    applyFilters();
  };

  const handleCreateProject = async (formData: any) => {
    try {
      const projectData = {
        name: formData.name,
        description: formData.description,
        status: formData.status as 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled',
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : undefined,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
        budget: formData.budget || undefined,
        company_id: formData.company_id || undefined,
        manager_id: formData.manager_id || undefined
      };

      const result = await createProject(projectData);
      
      if (result) {
        toast({
          title: "Projeto criado",
          description: "Projeto foi criado com sucesso"
        });
        setIsCreateModalOpen(false);
        fetchProjects();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar projeto",
        variant: "destructive"
      });
    }
  };

  // Função para importação em massa de projetos via Excel
  const handleImportProjects = async (data: any[]) => {
    try {
      console.log('📊 [IMPORT] Iniciando importação de', data.length, 'projetos');

      // Filtrar apenas linhas com dados válidos
      const validData = data.filter(row => {
        return row.name && row.name.trim() !== '' && row.name.trim() !== 'Exemplo';
      });

      console.log(`📊 [IMPORT] Dados válidos: ${validData.length} de ${data.length} total`);

      if (validData.length === 0) {
        throw new Error('Nenhum dado válido encontrado para importar');
      }

      // Processar dados importados
      const projectsData = await Promise.all(validData.map(async (row) => {
        // Buscar empresa pelo nome, se fornecido
        let company_id = undefined;
        if (row.company_name) {
          const company = companies.find(c => 
            c.fantasyName?.toLowerCase().includes(row.company_name.toLowerCase()) ||
            c.legalName?.toLowerCase().includes(row.company_name.toLowerCase())
          );
          if (company) {
            company_id = company.id;
          }
        }

        // Processar status - sempre usar 'planning' para projetos sem status definido
        let processedStatus = 'planning'; // Status padrão que corresponde a "PLANEJAMENTO" no Kanban
        if (row.status && row.status !== 'Exemplo' && row.status.trim() !== '') {
          const statusMap: { [key: string]: string } = {
            'planejamento': 'planning',
            'ativo': 'active',
            'em andamento': 'active',
            'pausado': 'on_hold',
            'concluído': 'completed',
            'cancelado': 'cancelled'
          };
          processedStatus = statusMap[row.status.toLowerCase()] || 'planning';
        }

        // Processar prioridade
        let processedPriority = 'medium';
        if (row.priority && row.priority !== 'Exemplo' && row.priority.trim() !== '') {
          const priorityMap: { [key: string]: string } = {
            'baixa': 'low',
            'média': 'medium', 
            'alta': 'high',
            'urgente': 'urgent'
          };
          processedPriority = priorityMap[row.priority.toLowerCase()] || 'medium';
        }

        const projectData = {
          name: row.name,
          description: row.description || '',
          status: processedStatus as 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled',
          priority: processedPriority as 'low' | 'medium' | 'high' | 'urgent',
          start_date: row.start_date || undefined,
          due_date: row.due_date || undefined,
          budget: row.budget || undefined,
          currency: row.currency || 'BRL',
          progress: row.progress || 0,
          company_id,
          notes: row.notes || ''
        };
        
        console.log('🔍 [IMPORT] Dados do projeto individual:', projectData);
        return projectData;
      }));

      console.log('📤 [IMPORT] Dados preparados para inserção:', projectsData);

      // Inserir todos os projetos no Supabase
      const { data: insertedProjects, error } = await supabase
        .from('projects')
        .insert(projectsData)
        .select();

      if (error) {
        console.error('❌ [IMPORT] Erro no Supabase:', error);
        throw error;
      }

      console.log('✅ [IMPORT] Projetos importados com sucesso:', insertedProjects);

      // Recarregar projetos para atualizar todas as visualizações
      console.log('🔄 [IMPORT] Recarregando projetos...');
      await fetchProjects();
      console.log('✅ [IMPORT] Projetos recarregados');

      toast({
        title: "Importação concluída",
        description: `${insertedProjects?.length || 0} projetos foram importados com sucesso`
      });

    } catch (error) {
      console.error('❌ [IMPORT] Erro ao importar projetos:', error);
      throw error;
    }
  };

  const handleProjectMove = (taskId: string, fromColumn: string, toColumn: string) => {
    console.log(`Projeto ${taskId} movido de ${fromColumn} para ${toColumn}`);
  };

  const handleOpenCreateModal = (columnId?: string) => {
    setIsCreateModalOpen(true);
  };

  const handleOpenKanbanEditModal = () => {
    setIsKanbanEditModalOpen(true);
  };

  const handleCloseKanbanEditModal = () => {
    setIsKanbanEditModalOpen(false);
  };

  // Funções para gerenciar filtros do Dashboard
  const handleDashboardFilterChange = (key: string, value: string) => {
    setDashboardFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClearDashboardFilters = () => {
    setDashboardFilters({
      dateRange: 'all',
      status: 'all',
      priority: 'all',
      responsible: 'all',
      budget: 'all'
    });
  };

  const handleRefreshDashboard = () => {
    fetchProjects();
  };




  const handleViewModeChange = (mode: 'board' | 'lista' | 'prazo' | 'planejador' | 'calendario' | 'dashboard') => {
    setViewMode(mode);
  };

  // Função para carregar perfis
  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name');
      
      if (error) throw error;
      
      const profilesMap: {[key: string]: string} = {};
      data?.forEach(profile => {
        profilesMap[profile.id] = profile.name;
      });
      setProfiles(profilesMap);
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
    }
  };

  // Função para obter nome do perfil
  const getProfileName = (profileId: string) => {
    return profiles[profileId] || profileId;
  };

  // Botões de visualização
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
      <div className="min-h-screen bg-gray-50 dark:bg-black">
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
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Carregando projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50 dark:bg-black">
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
              {/* Botão de Tela Cheia - apenas para visualizações Kanban */}
              {(viewMode === 'board' || viewMode === 'prazo' || viewMode === 'planejador') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors"
                  onClick={toggleFullscreen}
                  title="Tela cheia"
                >
                  <Maximize2 className="h-4 w-4 text-gray-700" />
                </Button>
              )}
              
              {/* Botão de Upload/Importação Excel */}
              <UploadButton
                entityType="projects"
                onImportComplete={handleImportProjects}
                title="Importar planilha Excel de projetos"
              />
              
              {/* Botão de configuração do Kanban - apenas para abas com Kanban */}
              {(viewMode === 'board' || viewMode === 'prazo' || viewMode === 'planejador') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors"
                  onClick={() => setIsKanbanConfigModalOpen(true)}
                  title="Configurar Kanban"
                >
                  <Settings className="h-4 w-4 text-gray-700" />
                </Button>
              )}
              
            </div>
          </div>
        </div>

        {/* Barra de filtros funcionais - não exibir na aba Dashboard */}
        {viewMode !== 'dashboard' && (
          <FilterBar
            filters={filters}
            onFilterChange={updateFilter}
            onApplyFilters={handleFilterApply}
            onClearFilters={clearFilters}
            employees={employees}
            departments={state.settings.departments}
            searchPlaceholder="Filtrar por nome do projeto..."
          />
        )}
      </div>

      {/* Container principal com padding para o header fixo */}
      <div className={`px-2 ${viewMode === 'dashboard' ? 'pt-[60px]' : 'pt-[140px]'}`} style={{minHeight: 'calc(100vh - 38px)'}}>

        {/* Conteúdo baseado na visualização selecionada */}
        {viewMode === 'board' && kanbanLoaded && (
          <div className="w-full">
            
             {/* ProjectKanbanBoard - Kanban para Projetos */}
            <ProjectKanbanBoard
              projects={safeProjects}
               onMoveProject={handleMoveProject}
               onReindexColumn={async () => ({ data: null, error: null })}
               onAddProject={handleOpenCreateModal}
               onEditProject={handleEditProject}
               onDeleteProject={handleDeleteProject}
               onProjectClick={handleProjectClick}
               className="px-3"
               columns={kanbanColumns}
            />
          </div>
        )}

        {/* Visualização em Lista */}
        {viewMode === 'lista' && (
          <div className="w-full">
            {/* Tabela de Projetos */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              {/* Cabeçalho da Tabela */}
              <div className="bg-gray-50 border-b border-gray-200">
                <div className="flex items-center px-3 py-3 gap-2">
                  <div className="flex-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span>Projeto</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-24 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                    <span>Status</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-24 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                    <span>Prazo</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-28 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                    <span>Responsável</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-24 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                    <span>Orçamento</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-24 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                    <span>Prioridade</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-20 flex items-center justify-end gap-2 text-sm font-medium text-gray-700">
                    <span>Ações</span>
                  </div>
                </div>
              </div>

              {/* Linhas da Tabela */}
              <div className="divide-y divide-gray-200">
                {safeProjects.length > 0 ? (
                  safeProjects.map((project) => (
                    <div key={project.id} className="flex items-center px-3 py-3 h-14 hover:bg-gray-50 transition-colors gap-2">
                      <div className="flex-1 flex items-center gap-3 min-w-0">
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm text-gray-900 truncate font-medium">{project.name}</span>
                          <span className="text-xs text-gray-400">
                            {project.description || 'Sem descrição'}
                          </span>
                        </div>
                      </div>
                      <div className="w-24 flex items-center justify-center">
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-1 py-0.5 border font-medium ${
                            project.status === 'planning' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                            project.status === 'active' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                            project.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}
                        >
                            {project.status === 'planning' ? 'Pendente' :
                           project.status === 'active' ? 'Ativo' :
                             project.status === 'completed' ? 'Concluído' : 'Pendente'}
                        </Badge>
                        </div>
                      <div className="w-24 flex items-center justify-center gap-2 text-sm text-gray-600">
                        <span className="text-xs">
                          {project.end_date ? new Date(project.end_date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit'
                          }) : 'Sem prazo'}
                        </span>
                      </div>
                      <div className="w-28 flex items-center justify-center gap-2 text-sm text-gray-600">
                        <span className="truncate max-w-20">
                          {project.responsible_id || 'Não atribuído'}
                        </span>
                      </div>
                      <div className="w-24 flex items-center justify-center gap-2 text-sm text-gray-600">
                        <span className="text-xs">
                          {project.budget ? `R$ ${project.budget.toLocaleString()}` : 'Sem orçamento'}
                        </span>
                      </div>
                      <div className="w-24 flex items-center justify-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-1 py-0.5 border font-medium ${
                          project.priority === 'urgent' ? 'bg-red-100 text-red-800 border-red-200' :
                          project.priority === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                          project.priority === 'medium' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          'bg-green-100 text-green-800 border-green-200'
                          }`}
                        >
                          {project.priority === 'urgent' ? 'Urgente' :
                           project.priority === 'high' ? 'Alta' :
                           project.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                      <div className="w-20 flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                          onClick={() => handleProjectClick(project.id)}
                          className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1 rounded-md transition-all duration-200 h-6 w-6"
                          title="Visualizar projeto"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                            onClick={() => handleEditProject(project)}
                          className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1 rounded-md transition-all duration-200 h-6 w-6"
                          title="Editar projeto"
                          >
                          <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-md transition-all duration-200 h-6 w-6"
                          title="Excluir projeto"
                          >
                          <Trash2 className="h-3 w-3" />
                          </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    Nenhum projeto encontrado
                  </div>
                )}
              </div>
            </div>

            {/* Espaço branco inferior */}
            <div className="h-32 bg-[#F9FAFB]"></div>
          </div>
        )}

        {/* Visualização por Prazo */}
        {viewMode === 'prazo' && (
          <div className="w-full">
            <ProjectDeadlineView 
              projects={safeProjects}
              onProjectClick={handleProjectClick}
              onEditProject={handleEditProject}
              onDeleteProject={handleDeleteProject}
              onCreateProject={handleOpenCreateModal}
            />
          </div>
        )}

        {/* Visualização Planejador */}
        {viewMode === 'planejador' && (
          <div className="planejador-page bg-[#f5f7fb] min-h-screen pl-2 pr-6 py-6">
            {/* Planejamento Kanban */}
            <section className="kanban-section pl-2 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Kanban className="w-5 h-5 text-blue-400" />
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-gray-900/85">Planejamento Kanban</h2>
                    <span className="text-xs text-gray-600/85">{safeProjects.length} projetos</span>
                  </div>
                </div>
              </div>

              {/* ProjectKanbanBoard - mesmo visual da aba Quadro */}
              <ProjectKanbanBoard
                projects={safeProjects}
                onMoveProject={handleMoveProject}
                onReindexColumn={async () => ({ data: null, error: null })}
                onAddProject={handleOpenCreateModal}
                onEditProject={handleEditProject}
                onDeleteProject={handleDeleteProject}
                onProjectClick={handleProjectClick}
                className="px-3"
                columns={kanbanColumns}
              />
            </section>

            {/* Acompanhamento de Sprints */}
            <section className="sprints-section mt-2 mb-8">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900/90">Acompanhamento de Sprints</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {getProjectSprintData.filter(s => s.status === 'completed').length} de {getProjectSprintData.length} sprints finalizados • 
                      Sprint ativa: {getProjectSprintData.find(s => s.status === 'in_progress')?.name || 'Nenhuma'} 
                      ({getProjectSprintData.find(s => s.status === 'in_progress')?.completed || 0}/{getProjectSprintData.find(s => s.status === 'in_progress')?.total || 0} concluídos)
                    </p>
                </div>
                  <div className="flex items-center space-x-3">
                  <Button 
                    variant="ghost"
                    size="sm"
                      onClick={handleToggleSprintsMinimized}
                      className="flex items-center text-xs px-2 py-1 h-6"
                    >
                      {sprintsMinimized ? (
                        <>
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                          Maximizar Visualização
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                          Minimizar Visualização
                        </>
                      )}
                  </Button>
                </div>
              </div>

                {sprintsMinimized ? (
                  // Visualização minimizada - apenas nomes e informações básicas
                  <div className="space-y-2">
                    {getProjectSprintData.map((sprint) => (
                      <div 
                        key={sprint.id} 
                        className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-gray-900 text-sm">{sprint.name}</h3>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${
                              sprint.status === 'completed' ? 'bg-green-100 text-green-800' :
                              sprint.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {sprint.status === 'completed' ? 'Finalizada' :
                             sprint.status === 'in_progress' ? 'Em Andamento' : 'Planejada'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-600">
                          <span>{sprint.completed}/{sprint.total}</span>
                          <span>{Math.round(sprint.progress)}%</span>
                          <span>{sprint.startDate} - {sprint.endDate}</span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                  // Visualização completa
                  <div className={`grid gap-4 ${sprintsViewMode === 'compact' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'}`}>
                    {getProjectSprintData.map((sprint) => (
                      <div 
                        key={sprint.id} 
                        className={`bg-gray-50 border border-gray-200 rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                          expandedSprint === sprint.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-gray-900">{sprint.name}</h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{sprint.completed}/{sprint.total}</span>
                            <button
                              onClick={() => handleToggleSprintExpansion(sprint.id)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                            >
                              <ChevronDown 
                                className={`w-4 h-4 text-gray-500 transition-transform ${
                                  expandedSprint === sprint.id ? 'rotate-180' : ''
                                }`} 
                              />
                            </button>
                          </div>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              sprint.status === 'completed' ? 'bg-green-500' :
                              sprint.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
                            }`}
                            style={{ width: `${Math.min(sprint.progress, 100)}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex items-center text-xs text-gray-500 mb-3">
                          <Clock className="w-3 h-3 mr-1" />
                          {sprint.startDate} - {sprint.endDate}
                        </div>
                        
                              <div className="flex items-center justify-between">
                          <Badge 
                            variant="secondary" 
                            className={`${
                              sprint.status === 'completed' ? 'bg-green-100 text-green-800' :
                              sprint.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {sprint.status === 'completed' ? 'Finalizada' :
                             sprint.status === 'in_progress' ? 'Em Andamento' : 'Planejada'}
                          </Badge>
                          
                          {sprint.status === 'in_progress' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleFinishSprint(sprint.id)}
                            >
                              Finalizar Sprint
                            </Button>
                          )}
                          
                          {sprint.status === 'planned' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleStartSprint(sprint.id)}
                            >
                              Iniciar Sprint
                            </Button>
                                )}
                              </div>

                        {/* Detalhes expandidos */}
                        {expandedSprint === sprint.id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Progresso:</span>
                                <span className="font-medium">{Math.round(sprint.progress)}%</span>
                            </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Projetos Concluídos:</span>
                                <span className="font-medium">{sprint.completed}</span>
                        </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Total de Projetos:</span>
                                <span className="font-medium">{sprint.total}</span>
                      </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Restantes:</span>
                                <span className="font-medium">{sprint.total - sprint.completed}</span>
                              </div>
                            </div>
                </div>
              )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Visualização Calendário */}
        {viewMode === 'calendario' && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Visualização Calendário</h3>
            <p className="text-gray-600">Implementar visualização calendário</p>
          </div>
        )}

        {/* Visualização Dashboard */}
        {viewMode === 'dashboard' && (
          <div className="dashboard-page bg-[#f5f7fb] min-h-screen -mx-6 px-6 -mt-2 pb-6" style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>
            {/* Filtros do Dashboard */}
            <div className="mb-4">
              <ProjectsDashboardFilters
                filters={dashboardFilters}
                onFilterChange={handleDashboardFilterChange}
                projects={safeProjects}
                employees={employees}
              />
            </div>

            {/* Gráficos do Dashboard */}
            <ProjectsDashboardCharts
              projects={safeProjects}
              filters={dashboardFilters}
            />
          </div>
        )}

                </div>

      {/* Botão flutuante de novo projeto */}
      <Button
        onClick={() => setIsCreateModalOpen(true)}
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

      {/* Modais */}
                <ProjectCreateModal
          isOpen={isCreateModalOpen}
                  onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateProject}
          companies={companies}
          employees={employees}
                />

      {/* Modal de Automações */}
      {isAutomationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsAutomationModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
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
            <div className="px-6 py-6">
              <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                <span className="text-gray-500 text-sm">Espaço para futuras automações</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição do Kanban - Layout Moderno e Responsivo */}
      {isKanbanEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseKanbanEditModal}
          />
          
          {/* Modal Content - Design Moderno e Responsivo */}
          <div className="relative w-full max-w-6xl max-h-[95vh] bg-white rounded-2xl shadow-2xl border-0 flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
            {/* Header Minimalista */}
            <div className="flex-shrink-0 px-8 py-6 border-b border-gray-100 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Personalizar Kanban</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Configure suas etapas de trabalho de forma personalizada
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseKanbanEditModal}
                  className="w-10 h-10 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content Area - Layout Otimizado */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Seção de Configurações - Layout Horizontal Compacto */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Etapas do Fluxo</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Personalize nomes, cores e organize suas etapas
                      </p>
                    </div>
                    <Button
                      onClick={handleAddKanbanColumn}
                      className="text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-900 hover:to-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Etapa
                    </Button>
                  </div>

                  {/* Grid de Colunas - Layout Responsivo e Compacto */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {kanbanColumns.map((column, index) => (
                      <div key={column.id} className="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200 hover:border-gray-300">
                        <div className="flex items-start gap-4">
                          {/* Drag Handle */}
                          <div className="cursor-move text-gray-300 hover:text-gray-500 mt-2 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                          </div>

                          <div className="flex-1 space-y-4">
                            {/* Nome da Etapa */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Etapa</label>
                              <input
                                type="text"
                                value={column.name}
                                onChange={(e) => handleUpdateKanbanColumn(column.id, { name: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                                placeholder="Nome da etapa"
                              />
                            </div>

                            {/* Seletor de Cores e Contador - Layout Horizontal */}
                            <div className="flex items-center justify-between">
                              {/* Seletor de Cores */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
                                <div className="flex gap-2">
                                  {['gray', 'blue', 'green', 'orange', 'red', 'purple'].map((color) => (
                                    <button
                                      key={color}
                                      onClick={() => handleUpdateKanbanColumn(column.id, { color })}
                                      className={`w-7 h-7 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                                        column.color === color 
                                          ? 'border-gray-800 ring-2 ring-offset-2 ring-gray-300' 
                                          : 'border-gray-200 hover:border-gray-400'
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

                              {/* Contador e Remove Button */}
                              <div className="flex items-center gap-3">
                                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                                  <span className="font-medium">
                                    {safeProjects.filter(project => {
                                      if (column.status === 'planning') return project.status === 'planning';
                                      if (column.status === 'active') return project.status === 'active';
                                      if (column.status === 'on_hold') return project.status === 'on_hold';
                                      if (column.status === 'completed') return project.status === 'completed';
                                      return project.status === column.status;
                                    }).length}
                                  </span> projetos
                                </div>
                                
                                {/* Remove Button */}
                                {kanbanColumns.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveKanbanColumn(column.id)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview Section - Layout Horizontal Compacto */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview do Kanban</h3>
                  <div className="bg-white rounded-lg p-4 shadow-inner border border-gray-100">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {kanbanColumns.map((column) => {
                        const columnStyle = {
                          gray: 'bg-gray-100 border-gray-200 text-gray-700',
                          blue: 'bg-blue-100 border-blue-200 text-blue-700',
                          green: 'bg-green-100 border-green-200 text-green-700',
                          orange: 'bg-orange-100 border-orange-200 text-orange-700',
                          red: 'bg-red-100 border-red-200 text-red-700',
                          purple: 'bg-purple-100 border-purple-200 text-purple-700'
                        }[column.color] || 'bg-gray-100 border-gray-200 text-gray-700';

                        return (
                          <div key={column.id} className={`p-3 rounded-lg border ${columnStyle} transition-all duration-200`}>
                            <div className="text-xs font-semibold mb-1 truncate">{column.name}</div>
                            <div className="text-xs opacity-75">
                              {safeProjects.filter(project => {
                                if (column.status === 'planning') return project.status === 'planning';
                                if (column.status === 'active') return project.status === 'active';
                                if (column.status === 'on_hold') return project.status === 'on_hold';
                                if (column.status === 'completed') return project.status === 'completed';
                                return project.status === column.status;
                              }).length} projetos
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Minimalista */}
            <div className="flex-shrink-0 px-8 py-6 border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Salvamento automático ativo
                </div>
                <Button
                  onClick={handleCloseKanbanEditModal}
                  className="text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-8 bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-900 hover:to-blue-700"
                >
                  Concluído
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuração do Kanban */}
      {isKanbanConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsKanbanConfigModalOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Settings className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Configurar Kanban</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Personalize as etapas do seu fluxo de trabalho
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsKanbanConfigModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Instruções */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-blue-100 rounded">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-blue-900">Como personalizar</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Edite os nomes das etapas, escolha cores e reorganize a ordem. Você pode adicionar novas etapas ou remover as existentes.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Configuração das Colunas */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium text-gray-900">Etapas do Kanban</h3>
                    <Button
                      onClick={handleAddKanbanColumn}
                      size="sm"
                      className="text-white hover:opacity-90 bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-900 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Etapa
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {kanbanColumns.map((column, index) => (
                      <div key={column.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                        {/* Drag Handle */}
                        <div className="text-gray-400 cursor-move">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                          </svg>
                        </div>

                        {/* Nome da Coluna */}
                        <div className="flex-1">
                          <input
                            type="text"
                            value={column.name}
                            onChange={(e) => handleUpdateKanbanColumn(column.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-medium"
                          />
                        </div>

                        {/* Seletor de Cor */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">Cor:</label>
                          <div className="flex gap-1">
                            {[
                              { name: 'Cinza', value: '#6B7280' },
                              { name: 'Azul', value: '#3B82F6' },
                              { name: 'Verde', value: '#10B981' },
                              { name: 'Laranja', value: '#F59E0B' },
                              { name: 'Vermelho', value: '#EF4444' },
                              { name: 'Roxo', value: '#8B5CF6' },
                              { name: 'Rosa', value: '#EC4899' },
                              { name: 'Ciano', value: '#06B6D4' }
                            ].map((color) => (
                              <button
                                key={color.value}
                                onClick={() => handleUpdateKanbanColumn(column.id, 'color', color.value)}
                                className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                                  column.color === color.value 
                                    ? 'border-gray-400 scale-110' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Contador de Projetos */}
                        <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                          {projects.filter(project => {
                            // Mapear status do projeto para coluna
                            const statusMap = {
                              'planning': 'planning',
                              'active': 'active', 
                              'on_hold': 'on_hold',
                              'completed': 'completed'
                            };
                            return statusMap[project.status] === column.status;
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

                {/* Preview */}
                <div className="space-y-4">
                  <h3 className="text-base font-medium text-gray-900">Preview</h3>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex gap-2">
                      {kanbanColumns.map((column) => {
                        // Usar a cor diretamente do column.color (que já é um hex)
                        const columnStyle = `border-2`;

                        return (
                          <div 
                            key={column.id} 
                            className={`flex-1 p-3 rounded ${columnStyle}`}
                            style={{ 
                              backgroundColor: column.color + '40', // 40 = 25% opacity
                              borderColor: column.color 
                            }}
                          >
                            <div className="text-xs font-medium text-gray-700 mb-2">{column.name}</div>
                            <div className="text-xs text-gray-500">
                              {projects.filter(project => {
                                // Mapear status do projeto para coluna
                                const statusMap = {
                                  'planning': 'planning',
                                  'active': 'active', 
                                  'on_hold': 'on_hold',
                                  'completed': 'completed'
                                };
                                return statusMap[project.status] === column.status;
                              }).length} projetos
                            </div>
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
                    onClick={() => setIsKanbanConfigModalOpen(false)}
                    className="text-white hover:opacity-90 bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-900 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição de projeto */}
      {isEditModalOpen && editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setIsEditModalOpen(false);
              setEditingProject(null);
            }}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Editar Projeto</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Edite os dados do projeto selecionado
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingProject(null);
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="px-6 py-4">
                <ProjectEditForm
                  project={editingProject}
                  companies={companies}
                  employees={employees}
                  onSubmit={handleUpdateProject}
                  onCancel={() => {
                    setIsEditModalOpen(false);
                    setEditingProject(null);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botão para sair da tela cheia */}
      {isFullscreen && (viewMode === 'board' || viewMode === 'prazo' || viewMode === 'planejador') && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 rounded-full transition-colors bg-white hover:bg-gray-100 shadow-md"
            onClick={toggleFullscreenLayout}
            title={fullscreenLayout === 'fit' ? 'Ativar rolagem horizontal' : 'Ajustar colunas na tela'}
          >
            {fullscreenLayout === 'fit' ? 'Rolagem' : 'Ajustar'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors bg-white shadow-md"
            onClick={toggleFullscreen}
            title="Sair da tela cheia"
          >
            <Minimize2 className="h-4 w-4 text-gray-700" />
          </Button>
        </div>
      )}

      {/* Modal de Visualização de Projeto */}
      <ProjectViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingProject(null);
        }}
        project={viewingProject}
        onEdit={handleViewModalEdit}
        onDelete={deleteProject}
        employees={employees}
        companies={companies}
      />
    </div>
  );
};

export default Projects;
