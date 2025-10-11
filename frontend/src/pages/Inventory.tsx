import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Package, 
  Search, 
  Plus, 
  ChevronDown, 
  Filter, 
  Download, 
  Upload,
  Settings,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Eye,
  Edit,
  Trash2,
  Box,
  ShoppingCart,
  BarChart3,
  MoreHorizontal,
  List,
  Grid3X3,
  Zap,
  X,
  GripVertical,
  Palette,
  AlignJustify,
  Calendar
} from 'lucide-react';
import { UploadButton } from '@/components/UploadButton';
import { InventoryAdjustmentModal } from '@/components/InventoryAdjustmentModal';
import { InventoryViewModal } from '@/components/InventoryViewModal';
import { InventoryEditModal } from '@/components/InventoryEditModal';
import CreateInventoryItemModal from '@/components/inventory/CreateInventoryItemModal';
import { FileUploadModal } from '@/components/FileUploadModal';
import { CustomFieldsModal } from '@/components/CustomFieldsModal';
import { toast } from 'sonner';
import { AdvancedFilters } from '@/components/ui/advanced-filters';
import { ButtonGroup } from '@/components/ui/button-group';
import InventoryFilterBar from '@/components/InventoryFilterBar';
import { useInventoryFilters } from '@/hooks/useInventoryFilters';
import { useInventory } from '@/hooks/useInventory';


const Inventory = () => {
  const { topBarColor } = useTheme();
  const { showMenuButtons, sidebarExpanded, expandSidebarFromMenu } = useSidebar();
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'dashboard'>('list');
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCustomFieldsModal, setShowCustomFieldsModal] = useState(false);
  const [showKanbanConfigModal, setShowKanbanConfigModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [customFields, setCustomFields] = useState<{name: string; type: string}[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para configuração do Kanban
  const [kanbanStages, setKanbanStages] = useState([
    { id: 'in_stock', name: 'EM ESTOQUE', color: '#10B981', order: 1 },
    { id: 'low_stock', name: 'ESTOQUE BAIXO', color: '#F59E0B', order: 2 },
    { id: 'out_of_stock', name: 'SEM ESTOQUE', color: '#EF4444', order: 3 },
    { id: 'pending_restock', name: 'PENDENTE REPOSIÇÃO', color: '#8B5CF6', order: 4 }
  ]);
  
  // Hook para gerenciar inventário no Supabase
  const { 
    inventoryItems, 
    loading, 
    error, 
    createInventoryItem, 
    updateInventoryItem, 
    deleteInventoryItem 
  } = useInventory();

  // Hook para gerenciar filtros
  const { filters, updateFilter, clearFilters, getFilterParams } = useInventoryFilters();
  
  // Dados para os filtros
  const categories = ['Eletrônicos', 'Roupas', 'Casa e Jardim', 'Livros', 'Esportes', 'Outros'];
  const suppliers = ['Fornecedor A', 'Fornecedor B', 'Fornecedor C', 'Fornecedor D'];



  // Função para aplicar filtros
  const applyFilters = async () => {
    const filterParams = getFilterParams();
    // Os filtros são aplicados automaticamente via useMemo
    console.log('Aplicando filtros:', filterParams);
  };

  // Aplicar filtros automaticamente
  const handleFilterApply = () => {
    applyFilters();
  };

  // Função para focar no campo de busca
  const handleSearchIconClick = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const navigate = useNavigate();

  const getStatusBadge = (status: string, quantity: number, minStock: number) => {
    switch (status) {
      case 'out_of_stock':
        return <Badge className="bg-red-100 text-red-800 border-red-300 text-xs">Sem estoque</Badge>;
      case 'low_stock':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">Estoque baixo</Badge>;
      case 'in_stock':
        return <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">Em estoque</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300 text-xs">Desconhecido</Badge>;
    }
  };

  const handleView = (item: any) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDelete = async (item: any) => {
    if (window.confirm(`Tem certeza que deseja excluir o item "${item.name}"?`)) {
      try {
        await deleteInventoryItem(item.id);
      toast.success(`Item "${item.name}" excluído com sucesso!`);
      } catch (error) {
        console.error('Erro ao excluir item:', error);
        toast.error('Erro ao excluir item. Tente novamente.');
      }
    }
  };

  const handleSaveEdit = async (updatedItem: any) => {
    try {
      await updateInventoryItem(updatedItem.id, {
        name: updatedItem.name,
        category: updatedItem.category,
        price: updatedItem.price,
        quantity: updatedItem.quantity,
        min_stock: updatedItem.minStock,
        supplier: updatedItem.supplier,
        description: updatedItem.description,
        image_url: updatedItem.image_url
      });
      toast.success(`Item "${updatedItem.name}" atualizado com sucesso!`);
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      toast.error('Erro ao atualizar item. Tente novamente.');
    }
  };

  const handleCreateItem = async (newItemData: any) => {
    try {
      await createInventoryItem({
      name: newItemData.name,
      category: newItemData.category || 'Outros',
        price: newItemData.price || 0,
      quantity: newItemData.stock || 0,
        min_stock: newItemData.minStock || 0,
      supplier: newItemData.supplier || '',
        description: newItemData.description || '',
      image_url: newItemData.image_url || null
      });
      
      toast.success(`Item "${newItemData.name}" criado com sucesso!`);
    } catch (error) {
      console.error('Erro ao criar item:', error);
      toast.error('Erro ao criar item. Tente novamente.');
    }
  };

  // Função para importação em massa de itens de estoque via Excel
  const handleImportInventory = async (data: any[]) => {
    try {
      console.log('📊 [IMPORT] Iniciando importação de', data.length, 'itens de estoque');

      // Filtrar apenas linhas com dados válidos
      const validData = data.filter(row => {
        return row.name && row.name.trim() !== '' && row.name.trim() !== 'Exemplo';
      });

      console.log(`📊 [IMPORT] Dados válidos: ${validData.length} de ${data.length} total`);

      if (validData.length === 0) {
        throw new Error('Nenhum dado válido encontrado para importar');
      }

      // Processar dados importados
      const inventoryData = await Promise.all(validData.map(async (row) => {
        // Buscar fornecedor pelo nome, se fornecido
        let supplier_id = undefined;
        if (row.supplier_name) {
          const { data: supplierData } = await supabase
            .from('suppliers')
            .select('id')
            .ilike('fantasy_name', `%${row.supplier_name}%`)
            .limit(1)
            .single();
          
          if (supplierData) {
            supplier_id = supplierData.id;
          }
        }

        // Processar status - sempre usar 'active' para itens sem status definido
        let processedStatus = 'active'; // Status padrão
        if (row.status && row.status !== 'Exemplo' && row.status.trim() !== '') {
          const statusMap: { [key: string]: string } = {
            'ativo': 'active',
            'inativo': 'inactive',
            'descontinuado': 'discontinued'
          };
          processedStatus = statusMap[row.status.toLowerCase()] || 'active';
        }

        const inventoryItemData = {
          name: row.name,
          sku: row.sku || null,
          description: row.description || '',
          category: row.category || 'Outros',
          quantity: row.quantity || 0,
          unit: row.unit || 'un',
          cost_price: row.cost_price || 0,
          sale_price: row.sale_price || 0,
          min_stock: row.min_stock || 0,
          max_stock: row.max_stock || null,
          location: row.location || null,
          supplier_id,
          status: processedStatus as 'active' | 'inactive' | 'discontinued',
          barcode: row.barcode || null,
          notes: row.notes || null
        };
        
        console.log('🔍 [IMPORT] Dados do item individual:', inventoryItemData);
        return inventoryItemData;
      }));

      console.log('📤 [IMPORT] Dados preparados para inserção:', inventoryData);

      // Inserir todos os itens no Supabase
      const { data: insertedItems, error } = await supabase
        .from('inventory')
        .insert(inventoryData)
        .select();

      if (error) {
        console.error('❌ [IMPORT] Erro no Supabase:', error);
        throw error;
      }

      console.log('✅ [IMPORT] Itens importados com sucesso:', insertedItems);

      // Recarregar inventário para atualizar todas as visualizações
      console.log('🔄 [IMPORT] Recarregando inventário...');
      refetch();
      console.log('✅ [IMPORT] Inventário recarregado');

      toast.success(`${insertedItems?.length || 0} itens foram importados com sucesso!`);

    } catch (error) {
      console.error('❌ [IMPORT] Erro ao importar itens:', error);
      throw error;
    }
  };

  const handleAddCustomField = (field: {name: string; type: string}) => {
    setCustomFields(prev => [...prev, field]);
    toast.success(`Campo personalizado "${field.name}" adicionado com sucesso!`);
  };

  // Funções para gerenciar etapas do Kanban
  const handleAddKanbanStage = () => {
    const newStage = {
      id: `stage_${Date.now()}`,
      name: 'Nova Etapa',
      color: '#6B7280',
      order: kanbanStages.length + 1
    };
    setKanbanStages(prev => [...prev, newStage]);
    toast.success('Nova etapa adicionada!');
  };

  const handleUpdateKanbanStage = (id: string, updates: { name?: string; color?: string }) => {
    setKanbanStages(prev => 
      prev.map(stage => 
        stage.id === id ? { ...stage, ...updates } : stage
      )
    );
    toast.success('Etapa atualizada!');
  };

  const handleDeleteKanbanStage = (id: string) => {
    if (kanbanStages.length <= 1) {
      toast.error('Deve haver pelo menos uma etapa no Kanban');
      return;
    }
    
    setKanbanStages(prev => prev.filter(stage => stage.id !== id));
    toast.success('Etapa removida!');
  };

  const handleReorderKanbanStages = (newStages: typeof kanbanStages) => {
    setKanbanStages(newStages);
    toast.success('Ordem das etapas atualizada!');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const filteredItems = inventoryItems.filter(item => {
    // Filtro de busca
    const matchesSearch = !filters.search || 
      item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.sku.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.category.toLowerCase().includes(filters.search.toLowerCase());
    
    // Filtro de categoria
    const matchesCategory = filters.category === 'all' || item.category === filters.category;
    
    // Filtro de status
    let matchesStatus = true;
    if (filters.status !== 'all') {
      if (filters.status === 'in_stock') {
        matchesStatus = item.status === 'in_stock';
      } else if (filters.status === 'low_stock') {
        matchesStatus = item.status === 'low_stock';
      } else if (filters.status === 'out_of_stock') {
        matchesStatus = item.status === 'out_of_stock';
      }
    }
    
    // Filtro de fornecedor
    const matchesSupplier = filters.supplier === 'all' || item.supplier === filters.supplier;
    
    // Filtro de data (baseado na data de criação/atualização do item)
    let matchesDate = true;
    if (filters.dateRange !== 'all' && item.created_at) {
      const itemDate = new Date(item.created_at);
      const now = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          matchesDate = itemDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
          const weekEnd = new Date(now.setDate(now.getDate() + 6));
          matchesDate = itemDate >= weekStart && itemDate <= weekEnd;
          break;
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          matchesDate = itemDate >= monthStart && itemDate <= monthEnd;
          break;
        case 'overdue':
          // Para inventário, "atrasados" pode ser itens com estoque baixo há mais de 7 dias
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = itemDate < sevenDaysAgo && item.quantity <= item.min_stock;
          break;
      }
    }
    
    return matchesSearch && matchesCategory && matchesStatus && matchesSupplier && matchesDate;
  });

  // Botões de visualização igual à página Activities
  const viewButtons = [
    { 
      id: 'list', 
      label: 'Lista',
      icon: List,
      active: viewMode === 'list'
    },
    {
      id: 'kanban', 
      label: 'Quadro',
      icon: BarChart3,
      active: viewMode === 'kanban'
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      active: viewMode === 'dashboard'
    }
  ];

  const handleViewModeChange = (mode: 'list' | 'kanban' | 'dashboard') => {
    setViewMode(mode);
  };

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Faixa branca contínua com botões de navegação e filtros - alinhada perfeitamente */}
      <div className="bg-white -mt-6 -mx-6">
        {/* Botões de visualização */}
        <div className="px-3 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Botão das 3 setinhas para exibir BitrixSidebar */}
              {showMenuButtons && !sidebarExpanded && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 text-gray-600 hover:bg-gray-100 rounded transition-all duration-200 flex-shrink-0"
                  onClick={expandSidebarFromMenu}
                  title="Expandir barra lateral"
                >
                  <AlignJustify size={16} />
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
              {/* Botão de Upload */}
              <UploadButton
                entityType="inventory"
                onImportComplete={handleImportInventory}
                title="Importar planilha Excel de estoque"
              />
              
              {/* Botão de configuração do Kanban */}
              {viewMode === 'kanban' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors"
                  onClick={() => setShowKanbanConfigModal(true)}
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
        <InventoryFilterBar
          filters={filters}
          onFilterChange={updateFilter}
          onApplyFilters={handleFilterApply}
          searchInputRef={searchInputRef}
          onClearFilters={clearFilters}
          categories={categories}
          suppliers={suppliers}
          searchPlaceholder="Filtrar por nome do item, SKU ou categoria..."
        />
      </div>

      {/* Container principal com padding otimizado */}
      <div className="px-2 pt-3">

        {/* Conteúdo baseado na visualização selecionada */}
        <>
            {/* Cards de estatísticas - só mostrar na visualização de lista e kanban */}
            {(viewMode === 'list' || viewMode === 'kanban') && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <Card className="bg-white border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Box className="h-4 w-4" />
                    Total de Itens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{inventoryItems.length}</div>
                  <p className="text-xs text-gray-500">produtos cadastrados</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Estoque Baixo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {inventoryItems.filter(item => item.status === 'low_stock').length}
                  </div>
                  <p className="text-xs text-gray-500">Requer atenção</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Valor Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(inventoryItems.reduce((sum, item) => sum + item.total_value, 0))}
                  </div>
                  <p className="text-xs text-gray-500">valor do estoque</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Itens em Falta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {inventoryItems.filter(item => item.status === 'out_of_stock').length}
                  </div>
                  <p className="text-xs text-gray-500">Necessita reposição</p>
                </CardContent>
              </Card>
            </div>
            )}

            {viewMode === 'kanban' && (
              /* Kanban Board - Layout responsivo com CSS Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 w-full auto-rows-min -ml-2">
                {kanbanStages.map((stage) => {
                  // Filtrar itens baseado no status da etapa
                  const stageItems = filteredItems.filter(item => {
                    if (stage.id === 'in_stock') return item.status === 'in_stock';
                    if (stage.id === 'low_stock') return item.status === 'low_stock';
                    if (stage.id === 'out_of_stock') return item.status === 'out_of_stock';
                    if (stage.id === 'pending_restock') return item.status === 'low_stock' || item.status === 'out_of_stock';
                    return false;
                  });

                  return (
                    <div key={stage.id} className="bg-white border border-[#E5E7EB] rounded-lg min-h-fit flex flex-col">
                      <div 
                        className="p-4 border-b border-[#E5E7EB] border-t-2 hover:shadow-md hover:scale-[1.01] transition-all duration-200"
                        style={{ borderTopColor: stage.color }}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-inter text-[12px] text-[#374151]">{stage.name}</h3>
                          <span className="font-inter text-[11px] text-[#6B7280]">
                            {stageItems.length}
                          </span>
                        </div>
                      </div>
                  
                      <div className="flex-1 p-3 space-y-3">
                        {stageItems.map(item => (
                        <div 
                          key={item.id}
                          className="group relative bg-white border border-[#E5E7EB] rounded-lg p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                        >
                          <h4 className="font-inter text-[14px] text-[#111827] mb-2 pr-8">{item.name}</h4>
                          <p className="font-inter text-[12px] text-[#6B7280] mb-3">
                            {item.sku} • {item.category}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] px-1.5 py-1 rounded bg-[#D1FAE5] text-[#059669]">
                              {item.quantity} unidades
                            </span>
                            <div className="flex items-center text-[12px] text-[#6B7280]">
                              <span className="font-inter">
                                {formatCurrency(item.total_value)}
                              </span>
                            </div>
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleView(item)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleEdit(item)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                      </div>
                      </div>
                        </div>
                      ))}
                    
                        {stageItems.length === 0 && (
                          <div className="text-center py-8 text-gray-400">
                            <Package className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">Nenhum item nesta etapa</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {viewMode === 'list' && (
              <Card className="bg-white border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-6 py-2">
                        <input type="checkbox" className="rounded" />
                      </TableHead>
                      <TableHead className="font-medium text-gray-900 py-2 text-xs">Imagem</TableHead>
                      <TableHead className="font-medium text-gray-900 py-2 text-xs">Nome</TableHead>
                      <TableHead className="font-medium text-gray-900 py-2 text-xs">SKU</TableHead>
                      <TableHead className="font-medium text-gray-900 py-2 text-xs">Categoria</TableHead>
                      <TableHead className="font-medium text-gray-900 py-2 text-xs">Quantidade</TableHead>
                      <TableHead className="font-medium text-gray-900 py-2 text-xs">Status</TableHead>
                      <TableHead className="font-medium text-gray-900 py-2 text-xs">Preço</TableHead>
                      <TableHead className="font-medium text-gray-900 py-2 text-xs">Fornecedor</TableHead>
                      <TableHead className="font-medium text-gray-900 py-2 text-xs">Total</TableHead>
                      {customFields.map((field) => (
                        <TableHead key={field.name} className="font-medium text-gray-900 py-2 text-xs">
                          {field.name}
                        </TableHead>
                      ))}
                      <TableHead className="font-medium text-gray-900 py-2 text-xs">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-gray-50">
                        <TableCell className="py-2">
                          <input type="checkbox" className="rounded" />
                        </TableCell>
                        <TableCell className="py-2">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-8 h-8 object-cover rounded border border-gray-200"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                              <Package className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="font-mono text-xs text-gray-600">{item.sku}</div>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge variant="outline" className="text-xs bg-gray-100 text-gray-800 border-gray-300">
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="text-gray-900 text-sm">{item.quantity}</div>
                        </TableCell>
                        <TableCell className="py-2">
                          {getStatusBadge(item.status, item.quantity, item.min_stock)}
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="text-gray-600 text-sm">{formatCurrency(item.price)}</div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="text-gray-600 text-sm">{item.supplier}</div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="text-gray-600 text-sm">{formatCurrency(item.total_value)}</div>
                        </TableCell>
                        {customFields.map((field) => (
                          <TableCell key={field.name} className="py-2">
                            <div className="text-gray-600 text-sm">-</div>
                          </TableCell>
                        ))}
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleView(item)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(item)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            {viewMode === 'dashboard' && (
              <div className="space-y-6">
                {/* Cards de estatísticas do Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-white border border-gray-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Box className="h-4 w-4" />
                        Total de Itens
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">{inventoryItems.length}</div>
                      <p className="text-xs text-gray-500">produtos cadastrados</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border border-gray-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Estoque Baixo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">
                        {inventoryItems.filter(item => item.status === 'low_stock').length}
                      </div>
                      <p className="text-xs text-gray-500">Requer atenção</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border border-gray-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Valor Total
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(inventoryItems.reduce((sum, item) => sum + item.total_value, 0))}
                      </div>
                      <p className="text-xs text-gray-500">valor do estoque</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border border-gray-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Itens em Falta
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">
                        {inventoryItems.filter(item => item.status === 'out_of_stock').length}
                      </div>
                      <p className="text-xs text-gray-500">Necessita reposição</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Gráficos e análises */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-white border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Itens por Categoria</h3>
                    <div className="space-y-3">
                      {categories.map((category, index) => {
                        const count = inventoryItems.filter(item => item.category === category).length;
                        const percentage = inventoryItems.length > 0 ? Math.round((count / inventoryItems.length) * 100) : 0;
                        return (
                          <div key={category}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">{category}</span>
                              <span className="text-sm font-medium text-gray-900">{percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full" 
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]
                                }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  <Card className="bg-white border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Status do Estoque</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Em Estoque</span>
                        <span className="text-sm font-medium text-gray-900">
                          {inventoryItems.filter(item => item.status === 'in_stock').length}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ 
                            width: `${inventoryItems.length > 0 ? Math.round((inventoryItems.filter(item => item.status === 'in_stock').length / inventoryItems.length) * 100) : 0}%` 
                          }}
                        ></div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Estoque Baixo</span>
                        <span className="text-sm font-medium text-gray-900">
                          {inventoryItems.filter(item => item.status === 'low_stock').length}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-600 h-2 rounded-full" 
                          style={{ 
                            width: `${inventoryItems.length > 0 ? Math.round((inventoryItems.filter(item => item.status === 'low_stock').length / inventoryItems.length) * 100) : 0}%` 
                          }}
                        ></div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Sem Estoque</span>
                        <span className="text-sm font-medium text-gray-900">
                          {inventoryItems.filter(item => item.status === 'out_of_stock').length}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-600 h-2 rounded-full" 
                          style={{ 
                            width: `${inventoryItems.length > 0 ? Math.round((inventoryItems.filter(item => item.status === 'out_of_stock').length / inventoryItems.length) * 100) : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}
        </>
      </div>

      {/* Botão flutuante de novo item com posição exata da referência */}
      <Button
        onClick={handleOpenCreateModal}
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

      <InventoryAdjustmentModal
        isOpen={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
      />

      <CreateInventoryItemModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateItem}
      />
      
      <InventoryViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        item={selectedItem}
      />

      <InventoryEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        item={selectedItem}
        onSave={handleSaveEdit}
      />
      
      <FileUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />

      <CustomFieldsModal
        isOpen={showCustomFieldsModal}
        onClose={() => setShowCustomFieldsModal(false)}
        onAddField={handleAddCustomField}
      />

      {/* Modal de configuração do Kanban */}
      {showKanbanConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowKanbanConfigModal(false)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Configurar Kanban</h2>
                <button
                  onClick={() => setShowKanbanConfigModal(false)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Personalize as etapas do seu quadro Kanban
              </p>
            </div>

            {/* Content */}
            <div className="px-6 py-6 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {kanbanStages.map((stage, index) => (
                  <div
                    key={stage.id}
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    {/* Drag handle */}
                    <div className="cursor-move text-gray-400 hover:text-gray-600">
                      <GripVertical className="h-5 w-5" />
                    </div>

                    {/* Color picker */}
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-gray-300 cursor-pointer"
                        style={{ backgroundColor: stage.color }}
                        onClick={() => {
                          const colors = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6', '#EC4899', '#6B7280'];
                          const currentIndex = colors.indexOf(stage.color);
                          const nextColor = colors[(currentIndex + 1) % colors.length];
                          handleUpdateKanbanStage(stage.id, { color: nextColor });
                        }}
                      />
                      <Palette className="h-4 w-4 text-gray-500" />
                    </div>

                    {/* Stage name input */}
                    <input
                      type="text"
                      value={stage.name}
                      onChange={(e) => handleUpdateKanbanStage(stage.id, { name: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome da etapa"
                    />

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteKanbanStage(stage.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Remover etapa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new stage button */}
              <button
                onClick={handleAddKanbanStage}
                className="w-full mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Adicionar Nova Etapa
              </button>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {kanbanStages.length} etapa{kanbanStages.length !== 1 ? 's' : ''} configurada{kanbanStages.length !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowKanbanConfigModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => setShowKanbanConfigModal(false)}
                    className="text-white hover:opacity-90"
                    style={{ backgroundColor: '#4A5477', borderColor: '#4A5477' }}
                  >
                    Salvar Configurações
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

export default Inventory;
