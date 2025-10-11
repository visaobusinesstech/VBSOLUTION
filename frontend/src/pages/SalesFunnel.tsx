import { useState, useEffect } from 'react';
import { Plus, Filter, Settings, Search, Users, Building2, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { QuickDealModal } from '@/components/QuickDealModal';
import KanbanBoard from '@/components/KanbanBoard';
import { useDeals } from '@/hooks/useDeals';

const SalesFunnel = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pipeline");
  const [searchTerm, setSearchTerm] = useState("");
  const { deals, loading } = useDeals();

  const handleCreateDeal = () => {
    setIsCreateModalOpen(true);
  };

  const [stats, setStats] = useState({
    totalDeals: 0,
    totalValue: 0,
    avgTicket: 0,
    conversionRate: 0
  });

  useEffect(() => {
    fetchStats();
  }, [deals]);

  const fetchStats = async () => {
    try {
      if (deals && deals.length > 0) {
        const totalValue = deals.reduce((sum, deal) => sum + Number(deal.value), 0);
        const avgTicket = totalValue / deals.length;
        
        setStats({
          totalDeals: deals.length,
          totalValue,
          avgTicket,
          conversionRate: 0 // Será calculado baseado no funil de vendas
        });
      }
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Funil de Vendas</h1>
            <p className="text-gray-600 mt-2">
              Gerencie seus negócios e acompanhe o progresso das vendas
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button onClick={handleCreateDeal} className="text-white hover:opacity-90" style={{ backgroundColor: '#4A5477' }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Negócio
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Negócios</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalDeals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {stats.totalValue.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {stats.avgTicket.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar negócios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="mt-6">
            <div className="bg-white rounded-lg shadow">
              <KanbanBoard activities={[]} onUpdateStatus={() => {}} onActivityClick={() => {}} />
            </div>
          </TabsContent>

          <TabsContent value="relatorios" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios de Vendas</CardTitle>
                <CardDescription>
                  Análise detalhada do desempenho das vendas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-gray-500">Relatórios em desenvolvimento...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <QuickDealModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
};

export default SalesFunnel;
