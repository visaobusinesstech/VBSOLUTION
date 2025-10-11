
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
import { useSidebar } from '@/contexts/SidebarContext';
import { 
  Plus, 
  Search, 
  FileText,
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
  DollarSign,
  Package,
  AlignJustify,
  CheckCircle,
  XCircle,
  ChevronDown,
  Zap
} from 'lucide-react';
import CreateWriteoffModal from '@/components/writeoffs/CreateWriteoffModal';
import { ViewWriteoffModal } from '@/components/writeoffs/ViewWriteoffModal';
import { EditWriteoffModal } from '@/components/writeoffs/EditWriteoffModal';
import WriteoffsDashboardFilters from '@/components/WriteoffsDashboardFilters';
import WriteoffsDashboardCharts from '@/components/WriteoffsDashboardCharts';
import { useWriteoffs } from '@/hooks/useWriteoffs';
import { toast } from 'sonner';

const Writeoffs = () => {
  const { sidebarExpanded, expandSidebarFromMenu } = useSidebar();
  const { writeoffs, loading, fetchWriteoffs, updateWriteoff, deleteWriteoff } = useWriteoffs();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInputRef, setSearchInputRef] = useState<HTMLInputElement | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWriteoff, setSelectedWriteoff] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'dashboard' | 'lista'>('lista');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  
  // Estados para filtros do Dashboard
  const [dashboardFilters, setDashboardFilters] = useState({
    dateRange: 'all',
    status: 'all',
    reason: 'all',
    value: 'all'
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      approved: { label: 'Aprovada', className: 'bg-green-100 text-green-800 border-green-300' },
      rejected: { label: 'Rejeitada', className: 'bg-red-100 text-red-800 border-red-300' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge className={`${config.className} text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const getReasonLabel = (reason: string) => {
    const reasons: { [key: string]: string } = {
      damage: 'Produto Danificado',
      expiry: 'Produto Vencido',
      loss: 'Perda/Roubo',
      return: 'Devolução',
      quality: 'Problema de Qualidade',
      other: 'Outros'
    };
    return reasons[reason] || reason;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleCreateWriteoff = () => {
    // Recarregar a lista de writeoffs
    fetchWriteoffs();
    toast.success('Nova baixa criada com sucesso!');
  };

  const handleSearchIconClick = () => {
    if (searchInputRef) {
      searchInputRef.focus();
    }
  };

  const handleDelete = async (writeoff: any) => {
    const writeoffName = writeoff.name || `Baixa #${writeoff.id.slice(0, 8)}`;
    if (window.confirm(`Tem certeza que deseja excluir "${writeoffName}"?`)) {
      const success = await deleteWriteoff(writeoff.id);
      if (success) {
        toast.success('Baixa excluída com sucesso!');
      } else {
        toast.error('Erro ao excluir baixa');
      }
    }
  };

  const handleView = (writeoff: any) => {
    setSelectedWriteoff(writeoff);
    setShowViewModal(true);
  };

  const handleEdit = (writeoff: any) => {
    setSelectedWriteoff(writeoff);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (id: string, data: any) => {
    try {
      const success = await updateWriteoff(id, data);
      if (success) {
        toast.success('Baixa atualizada com sucesso!');
        return true;
      } else {
        toast.error('Erro ao atualizar baixa');
        return false;
      }
    } catch (error) {
      toast.error('Erro ao atualizar baixa');
      return false;
    }
  };

  const handleViewModeChange = (mode: 'dashboard' | 'lista') => {
    setViewMode(mode);
  };

  // Funções para gerenciar filtros do Dashboard
  const handleDashboardFilterChange = (key: string, value: string) => {
    setDashboardFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const filteredWriteoffs = writeoffs.filter(writeoff => {
    const matchesSearch = searchTerm === '' || 
      (writeoff.name && writeoff.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (writeoff.reason && getReasonLabel(writeoff.reason).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (writeoff.approved_by && writeoff.approved_by.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || writeoff.status === statusFilter;
    const matchesReason = reasonFilter === 'all' || writeoff.reason === reasonFilter;
    
    return matchesSearch && matchesStatus && matchesReason;
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
    { id: 'all', label: 'Todos', icon: Package },
    { id: 'draft', label: 'Rascunho', icon: FileText },
    { id: 'pending', label: 'Pendente', icon: Clock },
    { id: 'completed', label: 'Concluída', icon: CheckCircle },
    { id: 'cancelled', label: 'Cancelada', icon: XCircle }
  ];

  const reasonFilters = [
    { id: 'all', label: 'Todos os Motivos', icon: Filter },
    { id: 'damage', label: 'Danos', icon: AlertTriangle },
    { id: 'expired', label: 'Vencimento', icon: Calendar },
    { id: 'theft', label: 'Roubo', icon: Building2 },
    { id: 'loss', label: 'Perda', icon: XCircle },
    { id: 'other', label: 'Outros', icon: Package }
  ];

  const totalItems = writeoffs.reduce((sum, writeoff) => sum + (writeoff.quantity || 0), 0);
  const totalValue = writeoffs.reduce((sum, writeoff) => sum + (writeoff.quantity || 0), 0);
  const pendingWriteoffs = writeoffs.filter(w => w.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Faixa branca contínua com botões de navegação e filtros - alinhada perfeitamente */}
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

        {/* Barra de filtros funcionais - não exibir na aba Dashboard */}
        {viewMode !== 'dashboard' && (
          <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {/* Campo de busca */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <Input
                  ref={setSearchInputRef}
                  placeholder="Pesquisar baixas..."
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
                    <Package className="h-3 w-3 mr-1" />
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

              {/* Filtro de Motivo */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-medium shadow-none border-0 bg-transparent text-gray-900 hover:bg-blue-50 focus:bg-blue-50">
                    <Filter className="h-3 w-3 mr-1" />
                    {reasonFilters.find(f => f.id === reasonFilter)?.label || 'Motivo'}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg z-50">
                  {reasonFilters.map((filter) => {
                    const Icon = filter.icon;
                    return (
                      <DropdownMenuItem
                        key={filter.id}
                        onClick={() => setReasonFilter(filter.id)}
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
        )}

        {/* Container principal com padding otimizado */}
        <div className={`px-6 ${viewMode === 'dashboard' ? 'pt-3' : 'pt-3'}`}>

        {/* Conteúdo baseado na visualização selecionada */}
        {viewMode === 'dashboard' && (
          <div className="dashboard-page bg-transparent min-h-screen -mx-6 px-6 -mt-2 pb-6 ml-2" style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>
            {/* Filtros do Dashboard */}
            <div className="mb-4">
              <WriteoffsDashboardFilters
                filters={dashboardFilters}
                onFilterChange={handleDashboardFilterChange}
                writeoffs={writeoffs}
              />
            </div>

            {/* Gráficos do Dashboard */}
            <WriteoffsDashboardCharts
              writeoffs={writeoffs}
              filters={dashboardFilters}
            />
          </div>
        )}

        {viewMode === 'lista' && (
          <div className="w-full overflow-hidden ml-2">
            {/* Lista View - Tabela de baixas */}
            {/* Writeoffs Table */}
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg w-full">
              <div className="overflow-x-auto">
                <Table className="w-full table-auto">
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 border-b border-gray-200">
                      <TableHead className="font-semibold text-gray-900 py-3 px-3 whitespace-nowrap">Nome</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-3 whitespace-nowrap">Motivo</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-3 whitespace-nowrap">Status</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-3 whitespace-nowrap">Itens</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-3 whitespace-nowrap">Valor Total</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-3 whitespace-nowrap">Data</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-3 whitespace-nowrap">Criado Por</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-3 text-right whitespace-nowrap">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWriteoffs.map((writeoff) => (
                      <TableRow key={writeoff.id} className="hover:bg-gray-50/50 border-b border-gray-100 transition-colors">
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <div className="font-medium text-gray-900 text-sm">{writeoff.name || `Baixa #${writeoff.id.slice(0, 8)}`}</div>
                          <div className="text-xs text-gray-500 mt-1">Quantidade: {writeoff.quantity}</div>
                        </TableCell>
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <div className="text-gray-900 text-sm">{getReasonLabel(writeoff.reason)}</div>
                        </TableCell>
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          {getStatusBadge(writeoff.status)}
                        </TableCell>
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <div className="text-gray-900 font-medium text-sm">{writeoff.quantity}</div>
                        </TableCell>
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <div className="text-gray-900 font-semibold text-sm">-</div>
                        </TableCell>
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{new Date(writeoff.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <User className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate max-w-[120px]">{writeoff.approved_by || 'Pendente'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-gray-100 rounded-lg"
                              onClick={() => handleView(writeoff)}
                            >
                              <Eye className="h-3 w-3 text-gray-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-gray-100 rounded-lg"
                              onClick={() => handleEdit(writeoff)}
                            >
                              <Edit className="h-3 w-3 text-gray-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-red-50 rounded-lg"
                              onClick={() => handleDelete(writeoff)}
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

        {filteredWriteoffs.length === 0 && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma baixa encontrada
              </h2>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? `Não foram encontradas baixas para "${searchTerm}"`
                  : 'Você ainda não possui baixas de inventário cadastradas.'
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Baixa
                </Button>
              )}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Botão flutuante de Nova Baixa */}
      <Button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full text-white shadow-lg hover:shadow-xl transition-all duration-200 z-50 flex items-center justify-center"
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

      <CreateWriteoffModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onWriteoffCreated={handleCreateWriteoff}
      />

      {/* Modal de visualizar baixa */}
      <ViewWriteoffModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedWriteoff(null);
        }}
        writeoff={selectedWriteoff}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Modal de editar baixa */}
      <EditWriteoffModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedWriteoff(null);
        }}
        writeoff={selectedWriteoff}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default Writeoffs;
