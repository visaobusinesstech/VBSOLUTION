import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  Users,
  AlertTriangle,
  Calendar,
  User,
  Eye,
  Edit,
  Trash2,
  Filter,
  BarChart3,
  List,
  Clock,
  Building2,
  CheckCircle,
  XCircle,
  ChevronDown,
  Star
} from 'lucide-react';
import CreateCollaborationModal from '@/components/collaborations/CreateCollaborationModal';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Collaborations = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInputRef, setSearchInputRef] = useState<HTMLInputElement | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [collaborations, setCollaborations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'dashboard' | 'lista'>('lista');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    fetchCollaborations();
  }, []);

  const fetchCollaborations = async () => {
    try {
      setLoading(true);
      
      // Buscar colaborações do Supabase
      const { data, error } = await supabase
        .from('collaborations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar colaborações:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar colaborações. Tente novamente.",
          variant: "destructive",
        });
        setCollaborations([]);
      } else {
        setCollaborations(data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar colaborações:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar colaborações.",
        variant: "destructive",
      });
      setCollaborations([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      planning: { label: 'Planejamento', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      active: { label: 'Em Andamento', className: 'bg-blue-100 text-blue-800 border-blue-300' },
      completed: { label: 'Concluído', className: 'bg-green-100 text-green-800 border-green-300' },
      on_hold: { label: 'Pausado', className: 'bg-gray-100 text-gray-800 border-gray-300' },
      cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800 border-red-300' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.planning;
    return (
      <Badge className={`${config.className} text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const getPriorityLabel = (priority: string) => {
    const priorities: { [key: string]: string } = {
      high: 'Alta',
      medium: 'Média',
      low: 'Baixa'
    };
    return priorities[priority] || priority;
  };

  const getCategoryLabel = (category: string) => {
    if (!category) return '';
    const categories: { [key: string]: string } = {
      development: 'Desenvolvimento',
      marketing: 'Marketing',
      design: 'Design',
      research: 'Pesquisa',
      other: 'Outros'
    };
    return categories[category] || category;
  };

  const handleCreateCollaboration = () => {
    // Recarregar a lista de colaborações após criar uma nova
    fetchCollaborations();
  };

  const handleSearchIconClick = () => {
    if (searchInputRef) {
      searchInputRef.focus();
    }
  };

  const handleDelete = (collaboration: any) => {
    if (window.confirm(`Tem certeza que deseja excluir a colaboração "${collaboration.name}"?`)) {
      setCollaborations(prev => prev.filter(c => c.id !== collaboration.id));
      toast({
        title: "Sucesso",
        description: "Colaboração excluída com sucesso!",
      });
    }
  };

  const handleViewModeChange = (mode: 'dashboard' | 'lista') => {
    setViewMode(mode);
  };

  const filteredCollaborations = (collaborations || []).filter(collaboration => {
    if (!collaboration) return false;
    
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      collaboration.title?.toLowerCase().includes(searchTermLower) ||
      collaboration.partner_company?.toLowerCase().includes(searchTermLower) ||
      getCategoryLabel(collaboration.category)?.toLowerCase().includes(searchTermLower) ||
      collaboration.description?.toLowerCase().includes(searchTermLower);
    
    const matchesStatus = statusFilter === 'all' || collaboration.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || collaboration.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || collaboration.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  // Botões de visualização (Lista primeiro)
  const viewButtons = [
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

  // Botões de filtro estratégicos
  const statusFilters = [
    { id: 'all', label: 'Todos', icon: Users },
    { id: 'planning', label: 'Planejamento', icon: Clock },
    { id: 'active', label: 'Em Andamento', icon: CheckCircle },
    { id: 'completed', label: 'Concluído', icon: CheckCircle },
    { id: 'on_hold', label: 'Pausado', icon: XCircle },
    { id: 'cancelled', label: 'Cancelado', icon: XCircle }
  ];

  const priorityFilters = [
    { id: 'all', label: 'Todas as Prioridades', icon: Filter },
    { id: 'high', label: 'Alta', icon: AlertTriangle },
    { id: 'medium', label: 'Média', icon: Clock },
    { id: 'low', label: 'Baixa', icon: CheckCircle }
  ];

  const categoryFilters = [
    { id: 'all', label: 'Todas as Categorias', icon: Filter },
    { id: 'development', label: 'Desenvolvimento', icon: Building2 },
    { id: 'marketing', label: 'Marketing', icon: Star },
    { id: 'design', label: 'Design', icon: Users },
    { id: 'research', label: 'Pesquisa', icon: Clock },
    { id: 'other', label: 'Outros', icon: Users }
  ];

  const totalCollaborations = collaborations?.length || 0;
  const activeCollaborations = collaborations?.filter(c => c?.status === 'active')?.length || 0;
  const completedCollaborations = collaborations?.filter(c => c?.status === 'completed')?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Faixa branca contínua com botões de navegação e filtros - alinhada perfeitamente */}
      <div className="bg-white -mt-6 -mx-6">
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
            </div>
          </div>
        </div>

        {/* Barra de filtros funcionais */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {/* Campo de busca */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <Input
                  ref={setSearchInputRef}
                  placeholder="Pesquisar colaborações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-8 text-sm border-0 bg-transparent focus:border-0 focus:ring-0 text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Filtros funcionais */}
            <div className="flex items-center gap-2">
              {/* Filtro de Status */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-medium shadow-none border-0 bg-transparent text-gray-900 hover:bg-blue-50 focus:bg-blue-50">
                    <Users className="h-3 w-3 mr-1" />
                    {statusFilters.find(f => f.id === statusFilter)?.label || 'Status'}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg z-50">
                  {statusFilters.map((filter) => {
                    const Icon = filter.icon;
                    return (
                      <DropdownMenuItem
                        key={filter.id}
                        onClick={() => setStatusFilter(filter.id)}
                        className="flex items-center gap-2 hover:bg-gray-100 focus:bg-gray-100 text-xs"
                      >
                        <Icon className="h-3 w-3" />
                        {filter.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Filtro de Prioridade */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-medium shadow-none border-0 bg-transparent text-gray-900 hover:bg-blue-50 focus:bg-blue-50">
                    <Filter className="h-3 w-3 mr-1" />
                    {priorityFilters.find(f => f.id === priorityFilter)?.label || 'Prioridade'}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg z-50">
                  {priorityFilters.map((filter) => {
                    const Icon = filter.icon;
                    return (
                      <DropdownMenuItem
                        key={filter.id}
                        onClick={() => setPriorityFilter(filter.id)}
                        className="flex items-center gap-2 hover:bg-gray-100 focus:bg-gray-100 text-xs"
                      >
                        <Icon className="h-3 w-3" />
                        {filter.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Filtro de Categoria */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-medium shadow-none border-0 bg-transparent text-gray-900 hover:bg-blue-50 focus:bg-blue-50">
                    <Building2 className="h-3 w-3 mr-1" />
                    {categoryFilters.find(f => f.id === categoryFilter)?.label || 'Categoria'}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg z-50">
                  {categoryFilters.map((filter) => {
                    const Icon = filter.icon;
                    return (
                      <DropdownMenuItem
                        key={filter.id}
                        onClick={() => setCategoryFilter(filter.id)}
                        className="flex items-center gap-2 hover:bg-gray-100 focus:bg-gray-100 text-xs"
                      >
                        <Icon className="h-3 w-3" />
                        {filter.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Container principal com padding otimizado */}
      <div className="px-1 pt-3">

        {/* Conteúdo baseado na visualização selecionada */}
        {viewMode === 'dashboard' && (
          <div className="w-full">
            {/* Dashboard View - Cards de estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                Total de Colaborações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalCollaborations}</div>
              <p className="text-xs text-gray-500">colaborações registradas</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                Em Andamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{activeCollaborations}</div>
              <p className="text-xs text-gray-500">colaborações ativas</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                Concluídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{completedCollaborations}</div>
              <p className="text-xs text-gray-500">colaborações finalizadas</p>
            </CardContent>
          </Card>
        </div>
                      </div>
        )}

        {viewMode === 'lista' && (
          <div className="w-full overflow-hidden">
            {/* Lista View - Tabela de colaborações */}
            {/* Collaborations Table */}
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg w-full">
              <div className="overflow-x-auto">
                <Table className="w-full table-auto">
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 border-b border-gray-200">
                      <TableHead className="font-semibold text-gray-900 py-3 px-3 whitespace-nowrap">Nome</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-3 whitespace-nowrap">Categoria</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-3 whitespace-nowrap">Status</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-3 whitespace-nowrap">Prioridade</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-3 whitespace-nowrap">Progresso</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-3 whitespace-nowrap">Prazo</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-3 whitespace-nowrap">Responsável</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-3 text-right whitespace-nowrap">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCollaborations.map((collaboration) => (
                      <TableRow key={collaboration.id} className="hover:bg-gray-50/50 border-b border-gray-100 transition-colors">
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <div className="font-medium text-gray-900 text-sm">{collaboration.name}</div>
                          {collaboration.description && (
                            <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">{collaboration.description}</div>
                          )}
                        </TableCell>
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <div className="text-gray-900 text-sm">{getCategoryLabel(collaboration.category)}</div>
                        </TableCell>
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          {getStatusBadge(collaboration.status)}
                        </TableCell>
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <Badge className={`text-xs ${
                            collaboration.priority === 'high' ? 'bg-red-100 text-red-800 border-red-300' :
                            collaboration.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                            'bg-green-100 text-green-800 border-green-300'
                          }`}>
                            {getPriorityLabel(collaboration.priority)}
                      </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${collaboration.progress || 0}%` }}
                        ></div>
                      </div>
                            <span className="text-xs text-gray-600">{collaboration.progress || 0}%</span>
                    </div>
                        </TableCell>
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{collaboration.deadline ? new Date(collaboration.deadline).toLocaleDateString('pt-BR') : 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <User className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate max-w-[120px]">{collaboration.responsible || 'N/A'}</span>
                      </div>
                        </TableCell>
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-gray-100 rounded-lg"
                              onClick={() => console.log('View collaboration:', collaboration.id)}
                            >
                              <Eye className="h-3 w-3 text-gray-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-gray-100 rounded-lg"
                              onClick={() => console.log('Edit collaboration:', collaboration.id)}
                            >
                              <Edit className="h-3 w-3 text-gray-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-red-50 rounded-lg"
                              onClick={() => handleDelete(collaboration)}
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                    </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                    </div>
                </Card>
            </div>
        )}

            {filteredCollaborations.length === 0 && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Nenhuma colaboração encontrada
              </h2>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? `Não foram encontradas colaborações para "${searchTerm}"`
                  : 'Você ainda não possui colaborações cadastradas.'
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="text-white px-6 py-2 rounded-lg hover:opacity-90"
                  style={{ backgroundColor: '#4A5477' }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Colaboração
                </Button>
              )}
            </div>
          </div>
            )}
      </div>

      {/* Botão flutuante de Nova Colaboração */}
      <Button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full text-white shadow-lg hover:shadow-xl transition-all duration-200 z-50 flex items-center justify-center hover:opacity-90"
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
        size="sm"
      >
        <Plus className="h-5 w-5" />
      </Button>

      <CreateCollaborationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCollaborationCreated={handleCreateCollaboration}
      />
    </div>
  );
};

export default Collaborations;
