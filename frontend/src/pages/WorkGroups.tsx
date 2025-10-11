import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkGroup } from '@/contexts/WorkGroupContext';
import { useVB } from '@/contexts/VBContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { toast } from '@/hooks/use-toast';
import { useFilters } from '@/hooks/useFilters';
import FilterBar from '@/components/FilterBar';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WorkGroupCreateModal from '@/components/WorkGroupCreateModal';
import WorkGroupDetailModal from '@/components/WorkGroupDetailModal';

import { 
  Plus,
  Users,
  List,
  User,
  BarChart3,
  Kanban,
  Zap,
  Edit,
  Trash2,
  AlignJustify,
  Calendar
} from 'lucide-react';

const WorkGroups = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useVB();
  const { companies, employees } = state;
  const { workGroups, addWorkGroup, updateWorkGroup, deleteWorkGroup } = useWorkGroup();
  
  // Debug: verificar grupos recebidos
  console.log('WorkGroups na página:', workGroups);
  console.log('Quantidade de grupos na página:', workGroups?.length || 0);

  // Monitorar mudanças no estado de grupos
  useEffect(() => {
    console.log('🔄 [EFFECT] Estado de grupos mudou:', workGroups.length, 'grupos');
    workGroups.forEach((group, index) => {
      console.log(`📋 [EFFECT] Grupo ${index}:`, group.name, group.id);
    });
  }, [workGroups]);
  const { topBarColor } = useTheme();
  const { sidebarExpanded, expandSidebarFromMenu } = useSidebar();
  
  // Estados para controle da interface
  const [viewMode, setViewMode] = useState<'board' | 'lista' | 'dashboard'>('board');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedWorkGroup, setSelectedWorkGroup] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  
  // Estados para filtros
  const {
    filters,
    updateFilter,
    clearFilters,
    applyFilters
  } = useFilters({
    search: '',
    sector: '',
    status: '',
    member: ''
  });

  // Detectar estado do sidebar
  useEffect(() => {
    const handleSidebarChange = () => {
      const sidebar = document.querySelector('[data-expanded]');
      if (sidebar) {
        setIsSidebarExpanded(sidebar.getAttribute('data-expanded') === 'true');
      }
    };

    // Observer para mudanças no sidebar
    const observer = new MutationObserver(handleSidebarChange);
    const sidebarElement = document.querySelector('.fixed.left-0.top-\\[38px\\]');
    
    if (sidebarElement) {
      observer.observe(sidebarElement, { attributes: true, attributeFilter: ['class'] });
      // Check inicial
      setIsSidebarExpanded(sidebarElement.classList.contains('w-\\[240px\\]') || !sidebarElement.classList.contains('w-\\[64px\\]'));
    }

    return () => observer.disconnect();
  }, []);

  // Função para formatar data
  const formatDate = (date: string | Date) => {
    if (!date) return 'Data não disponível';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Funções de controle
  const handleCreateWorkGroup = async (workGroupData: any) => {
    console.log('🚀 [CREATE] handleCreateWorkGroup chamado com dados:', workGroupData);
    console.log('📊 [CREATE] Grupos antes da criação:', workGroups.length);
    
    try {
      // Validação básica
      if (!workGroupData.name || !workGroupData.name.trim()) {
        console.error('❌ [CREATE] Nome do grupo é obrigatório');
        toast({
          title: "Erro",
          description: "Nome do grupo é obrigatório",
          variant: "destructive"
        });
        return;
      }

      const newWorkGroup = {
        name: workGroupData.name.trim(),
        description: workGroupData.description || '',
        color: workGroupData.color || '#3B82F6',
        photo: workGroupData.photo || '',
        sector: workGroupData.department || 'Não definido',
        members: [], // Sem membros por enquanto
        status: 'active',
        createdAt: new Date().toISOString()
      };

      console.log('📋 [CREATE] Dados do grupo preparados:', newWorkGroup);

      await addWorkGroup(newWorkGroup);
      
      console.log('✅ [CREATE] Grupo criado com sucesso, mostrando toast');
      
      toast({
        title: "Grupo criado",
        description: `Grupo "${workGroupData.name}" foi criado com sucesso`
      });
    } catch (error) {
      console.error('❌ [CREATE] Erro ao criar grupo:', error);
      console.error('❌ [CREATE] Stack trace:', error.stack);
      toast({
        title: "Erro",
        description: `Erro ao criar grupo de trabalho: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleWorkGroupClick = (workGroup: any) => {
    setSelectedWorkGroup(workGroup);
    setIsDetailModalOpen(true);
  };

  const handleDeleteWorkGroup = (workGroupId: string) => {
    if (!confirm('Tem certeza que deseja excluir este grupo de trabalho?')) return;
    
    deleteWorkGroup(workGroupId);
    toast({
      title: "Grupo excluído",
      description: "Grupo foi excluído com sucesso"
    });
  };

  const handleUpdateWorkGroup = async (workGroupId: string, updates: any) => {
    try {
      await updateWorkGroup(workGroupId, updates);
      // O toast já é mostrado no modal, não precisa duplicar aqui
    } catch (error) {
      console.error('Erro ao atualizar grupo:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar grupo de trabalho",
        variant: "destructive"
      });
    }
  };

  const handleFilterApply = () => {
    // Aplicar filtros
    applyFilters();
    toast({
      title: "Filtros aplicados",
      description: "Os filtros foram aplicados com sucesso"
    });
  };

  const handleViewModeChange = (mode: 'board' | 'lista' | 'dashboard') => {
    setViewMode(mode);
  };

  // Filtrar grupos de trabalho baseado nos filtros ativos
  const filteredWorkGroups = workGroups.filter(workGroup => {
    if (filters.search && !workGroup.name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !workGroup.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.sector && workGroup.sector !== filters.sector) {
      return false;
    }
    if (filters.status && workGroup.status !== filters.status) {
      return false;
    }
    if (filters.member && !workGroup.members.some((member: any) => 
        member.name.toLowerCase().includes(filters.member.toLowerCase()))) {
      return false;
    }
    return true;
  });

  // Log para debug
  console.log('📊 [PAGE] Total de grupos:', workGroups.length);
  console.log('📊 [PAGE] Grupos filtrados:', filteredWorkGroups.length);
  console.log('📊 [PAGE] Filtros ativos:', filters);

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
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      active: viewMode === 'dashboard'
    }
  ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Carregando grupos de trabalho...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Faixa branca contínua com botões de navegação e filtros */}
      <div className="bg-white -mt-6 -mx-6">
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
          employees={employees}
          departments={state.settings?.departments || []}
          searchPlaceholder="Filtrar por nome do grupo..."
          customFilters={[
            {
              key: 'sector',
              label: 'Setor',
              type: 'select',
              options: [...new Set(workGroups.map(wg => wg.sector))].map(sector => ({
                value: sector,
                label: sector
              }))
            },
            {
              key: 'status',
              label: 'Status',
              type: 'select',
              options: [
                { value: 'active', label: 'Ativo' },
                { value: 'inactive', label: 'Inativo' }
              ]
            }
          ]}
        />
      </div>

      {/* Container principal com altura total */}
      <div className={`pt-2 h-full ${isSidebarExpanded ? 'px-1' : 'px-2'}`}
           style={{height: 'calc(100vh - 72px)'}}>

        {/* Conteúdo baseado na visualização selecionada */}
        {viewMode === 'board' && (
          <div className="w-full p-6 pl-2">
            {/* Grid moderno de grupos de trabalho */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredWorkGroups.map(workGroup => (
                <Card 
                  key={workGroup.id} 
                  className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer bg-white relative overflow-hidden aspect-square flex flex-col shadow-lg"
                  style={{
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                  }}
                  onClick={() => handleWorkGroupClick(workGroup)}
                >
                  
                  {/* Botões de ação no canto inferior direito */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWorkGroup(workGroup);
                        setIsDetailModalOpen(true);
                      }}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200"
                      title="Editar grupo"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWorkGroup(workGroup.id);
                      }}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200"
                      title="Excluir grupo"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <CardContent className="p-3 flex-1 flex flex-col">
                    {/* Header sem ícone */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm text-gray-900 truncate mb-1 break-words">{workGroup.name}</h3>
                        <p className="text-xs text-gray-500 truncate break-words">{workGroup.sector}</p>
                      </div>
                      <Badge 
                        variant={workGroup.status === 'active' ? 'default' : 'secondary'}
                        className={`text-xs px-1.5 py-0.5 ${
                          workGroup.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                      >
                        {workGroup.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>

                    {/* Descrição */}
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2 leading-relaxed break-words flex-1">
                      {workGroup.description}
                    </p>

                    {/* Estatísticas minimalistas */}
                    <div className="space-y-1.5 mt-auto">
                      {/* Membros */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Users className="h-3 w-3 text-gray-400" />
                        <span>{workGroup.members?.length || 0} membros</span>
                      </div>

                      {/* Data de criação */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-1 border-t border-gray-100">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span>Criado em {formatDate(workGroup.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}


        {viewMode === 'lista' && (
          <div className="p-6 space-y-4">
            {filteredWorkGroups.map((workGroup) => (
            <Card 
              key={workGroup.id}
              className="hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => handleWorkGroupClick(workGroup)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg text-gray-900 truncate mb-1 break-words">{workGroup.name}</h3>
                      <p className="text-gray-600 mb-1 line-clamp-1 break-words text-sm">{workGroup.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{workGroup.sector}</span>
                        <span>•</span>
                        <span>{workGroup.members?.length || 0} membros</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(workGroup.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge 
                      variant={workGroup.status === 'active' ? 'default' : 'secondary'}
                      className={`text-xs px-1.5 py-0.5 ${
                        workGroup.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {workGroup.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                    {/* Botões de ação para lista */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 ml-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWorkGroup(workGroup);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWorkGroup(workGroup.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

        {viewMode === 'dashboard' && (
          <div className="space-y-6">
            {/* Cards de estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Grupos</p>
                    <p className="text-2xl font-bold text-gray-900">{workGroups.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Grupos Ativos</p>
                    <p className="text-2xl font-bold text-gray-900">{workGroups.filter(g => g.status === 'active').length}</p>
                  </div>
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 bg-green-600 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Membros</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {workGroups.reduce((sum, group) => sum + (group.members?.length || 0), 0)}
                    </p>
                  </div>
                  <User className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              
            </div>

            {/* Gráficos e análises */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Novo grupo criado</span>
                    <span className="text-xs text-gray-500 ml-auto">2h atrás</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Membro adicionado</span>
                    <span className="text-xs text-gray-500 ml-auto">5h atrás</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Grupo atualizado</span>
                    <span className="text-xs text-gray-500 ml-auto">1d atrás</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Empty State */}
        {filteredWorkGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {workGroups.length === 0 ? 'Nenhum grupo de trabalho' : 'Nenhum resultado encontrado'}
            </h3>
            <p className="text-gray-600 mb-6">
              {workGroups.length === 0 
                ? 'Comece criando seu primeiro grupo de trabalho para organizar sua equipe.'
                : 'Tente ajustar os filtros para encontrar os grupos que procura.'
              }
            </p>
        </div>
      )}
      </div>

      {/* Botão flutuante para criar novo grupo */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 group"
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
        title="Criar novo grupo"
      >
        <Plus className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-200" />
      </button>

      {/* Modals */}
      <WorkGroupCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateWorkGroup}
      />
      
      <WorkGroupDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        workGroup={selectedWorkGroup}
        onDelete={handleDeleteWorkGroup}
        onUpdate={handleUpdateWorkGroup}
      />
    </div>
  );
};

export default WorkGroups;
