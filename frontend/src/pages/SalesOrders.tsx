
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Filter, Download, Eye, Edit, Trash2, MoreHorizontal, Grid, List, ArrowLeft } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import CreateSalesOrderModal from '@/components/sales/CreateSalesOrderModal';
import { toast } from 'sonner';
import { ActivitiesStyleLayout } from '@/components/ActivitiesStyleLayout';
import { DetailedCard } from '@/components/DetailedCard';
import { AdvancedFilters } from '@/components/ui/advanced-filters';
import { ButtonGroup } from '@/components/ui/button-group';

const SalesOrders = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateOrder = () => {
    setIsCreateModalOpen(true);
  };

  const handleOrderCreated = () => {
    // Refresh the orders list here
    toast.success('Pedido criado com sucesso!');
  };

  const handleViewOrder = (id: string) => {
    // Navigate to order detail page
    navigate(`/sales-orders/${id}`);
  };

  const handleEditOrder = (id: string) => {
    // Open edit modal or navigate to edit page
    console.log('Edit order:', id);
  };

  const handleDeleteOrder = (id: string) => {
    // Delete order logic
    console.log('Delete order:', id);
    toast.success('Pedido excluído com sucesso!');
  };

  const handleStatusChange = (id: string, status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'draft' | 'cancelled' | 'in-progress' | 'completed' | 'overdue') => {
    // Update order status
    console.log('Update status:', id, status);
    toast.success('Status atualizado com sucesso!');
  };

  // Dados carregados do Supabase
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Buscar pedidos de vendas do Supabase
      // Por enquanto, array vazio
      setOrders([]);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm || 
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = [
    {
      label: "Total",
      value: orders.length,
      color: "text-blue-600"
    },
    {
      label: "Confirmados",
      value: orders.filter(order => order.status === 'confirmed' || order.status === 'shipped').length,
      color: "text-green-600"
    },
    {
      label: "Pendentes",
      value: orders.filter(order => order.status === 'pending').length,
      color: "text-yellow-600"
    }
  ];

  const filters = [
    {
      label: "Status",
      value: statusFilter,
      options: [
        { value: "all", label: "Todos os Status" },
        { value: "draft", label: "Rascunho" },
        { value: "pending", label: "Pendente" },
        { value: "confirmed", label: "Confirmado" },
        { value: "shipped", label: "Enviado" },
        { value: "delivered", label: "Entregue" },
        { value: "cancelled", label: "Cancelado" }
      ],
      onChange: setStatusFilter
    },
    {
      label: "Prioridade",
      value: priorityFilter,
      options: [
        { value: "all", label: "Todas as Prioridades" },
        { value: "low", label: "Baixa" },
        { value: "medium", label: "Média" },
        { value: "high", label: "Alta" },
        { value: "urgent", label: "Urgente" }
      ],
      onChange: setPriorityFilter
    }
  ];

  const viewModes = [
    {
      value: 'list',
      label: 'Lista',
      icon: <List className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
    },
    {
      value: 'grid',
      label: 'Grade',
      icon: <Grid className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
    }
  ];

  return (
    <>
      <ActivitiesStyleLayout
        title="Pedidos de Venda"
        description="Gerencie todos os seus pedidos de venda"
        onCreateClick={handleCreateOrder}
        createButtonText="Criar Pedido"
        searchPlaceholder="Buscar pedidos..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        stats={stats}
        viewModes={viewModes}
        currentViewMode={viewMode}
        onViewModeChange={(value) => setViewMode(value as 'list' | 'grid')}
      >
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <DetailedCard
                key={order.id}
                id={order.id}
                title={order.id}
                description={order.description}
                status={order.status}
                priority={order.priority}
                date={order.date}
                customer={order.customer}
                total={order.total}
                responsible={{
                  name: order.responsible,
                  avatar: undefined
                }}
                onView={handleViewOrder}
                onEdit={handleEditOrder}
                onDelete={handleDeleteOrder}
                onStatusChange={handleStatusChange}
              />
            ))}
            {filteredOrders.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Plus className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum pedido encontrado
                  </p>
                  <p className="text-gray-500 mb-4">
                    Crie seu primeiro pedido de venda para começar
                  </p>
                  <Button 
                    onClick={handleCreateOrder}
                    className="bg-black hover:bg-gray-800 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Pedido
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="border border-gray-200 shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 bg-gray-50">
                    <TableHead className="w-8 py-4">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </TableHead>
                    <TableHead className="font-semibold text-black py-4">Pedido</TableHead>
                    <TableHead className="font-semibold text-black py-4">Cliente</TableHead>
                    <TableHead className="font-semibold text-black py-4">Status</TableHead>
                    <TableHead className="font-semibold text-black py-4">Prioridade</TableHead>
                    <TableHead className="font-semibold text-black py-4">Total</TableHead>
                    <TableHead className="font-semibold text-black py-4">Data</TableHead>
                    <TableHead className="font-semibold text-black py-4">Responsável</TableHead>
                    <TableHead className="font-semibold text-black py-4 w-16">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const getStatusBadge = (status: string) => {
                      const statusMap = {
                        draft: { label: 'Rascunho', className: 'bg-gray-100 text-gray-800 border-gray-300' },
                        pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
                        confirmed: { label: 'Confirmado', className: 'bg-blue-100 text-blue-800 border-blue-300' },
                        shipped: { label: 'Enviado', className: 'bg-purple-100 text-purple-800 border-purple-300' },
                        delivered: { label: 'Entregue', className: 'bg-green-100 text-green-800 border-green-300' },
                        cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800 border-red-300' }
                      };
                      const config = statusMap[status as keyof typeof statusMap] || statusMap.draft;
                      return <Badge className={`${config.className} font-medium`}>{config.label}</Badge>;
                    };

                    const getPriorityBadge = (priority: string) => {
                      const priorityMap = {
                        low: { label: 'Baixa', className: 'bg-gray-100 text-gray-600' },
                        medium: { label: 'Média', className: 'bg-blue-100 text-blue-600' },
                        high: { label: 'Alta', className: 'bg-orange-100 text-orange-600' },
                        urgent: { label: 'Urgente', className: 'bg-red-100 text-red-600' }
                      };
                      const config = priorityMap[priority as keyof typeof priorityMap] || priorityMap.medium;
                      return <Badge variant="outline" className={`${config.className} text-xs`}>{config.label}</Badge>;
                    };

                    return (
                    <TableRow key={order.id} className="hover:bg-gray-50 border-b border-gray-100">
                      <TableCell className="py-4">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="font-medium text-black">{order.id}</div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="font-medium text-gray-900">{order.customer}</div>
                      </TableCell>
                      <TableCell className="py-4">
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="py-4">
                        {getPriorityBadge(order.priority)}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="font-semibold text-black">
                          R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-gray-600">
                        {new Date(order.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="py-4 text-gray-600">{order.responsible}</TableCell>
                      <TableCell className="py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-2 h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewOrder(order.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditOrder(order.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteOrder(order.id)}
                                className="text-red-600"
                              >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                  {filteredOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Plus className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-lg font-medium text-gray-900 mb-2">
                            Nenhum pedido encontrado
                          </p>
                          <p className="text-gray-500 mb-4">
                            Crie seu primeiro pedido de venda para começar
                          </p>
                          <Button 
                            onClick={handleCreateOrder}
                            className="bg-black hover:bg-gray-800 text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Criar Primeiro Pedido
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </ActivitiesStyleLayout>

      {/* Create Sales Order Modal */}
      <CreateSalesOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onOrderCreated={handleOrderCreated}
      />
    </>
  );
};

export default SalesOrders;
