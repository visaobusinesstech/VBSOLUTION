import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Target, 
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  ShoppingCart,
  Building2
} from 'lucide-react';
import { useLeads } from '@/hooks/useLeads-fixed';
import { useCompanies } from '@/hooks/useCompanies';
import { useFunnelStages } from '@/hooks/useFunnelStages';

interface SalesMetrics {
  totalLeads: number;
  totalCompanies: number;
  totalRevenue: number;
  conversionRate: number;
  avgDealSize: number;
  pipelineValue: number;
  wonDeals: number;
  lostDeals: number;
  activeDeals: number;
  monthlyGrowth: number;
  quarterlyGrowth: number;
}

interface StageMetrics {
  stage: string;
  count: number;
  value: number;
  conversionRate: number;
}

interface MonthlyData {
  month: string;
  leads: number;
  revenue: number;
  deals: number;
}

export function EnhancedSalesDashboard() {
  const { leads, loading: leadsLoading } = useLeads();
  const { companies, loading: companiesLoading } = useCompanies();
  const { stages, loading: stagesLoading } = useFunnelStages();
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedStage, setSelectedStage] = useState('all');

  const [metrics, setMetrics] = useState<SalesMetrics>({
    totalLeads: 0,
    totalCompanies: 0,
    totalRevenue: 0,
    conversionRate: 0,
    avgDealSize: 0,
    pipelineValue: 0,
    wonDeals: 0,
    lostDeals: 0,
    activeDeals: 0,
    monthlyGrowth: 0,
    quarterlyGrowth: 0
  });

  const [stageMetrics, setStageMetrics] = useState<StageMetrics[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  useEffect(() => {
    if (!leadsLoading && !companiesLoading && !stagesLoading) {
      calculateMetrics();
      calculateStageMetrics();
      generateMonthlyData();
    }
  }, [leads, companies, stages, timeRange]);

  const calculateMetrics = () => {
    const activeLeads = leads.filter(lead => lead.status === 'open');
    const wonLeads = leads.filter(lead => lead.status === 'won');
    const lostLeads = leads.filter(lead => lead.status === 'lost');
    
    const totalRevenue = wonLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
    const pipelineValue = activeLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
    const avgDealSize = wonLeads.length > 0 ? totalRevenue / wonLeads.length : 0;
    const conversionRate = leads.length > 0 ? (wonLeads.length / leads.length) * 100 : 0;

    setMetrics({
      totalLeads: leads.length,
      totalCompanies: companies.length,
      totalRevenue,
      conversionRate,
      avgDealSize,
      pipelineValue,
      wonDeals: wonLeads.length,
      lostDeals: lostLeads.length,
      activeDeals: activeLeads.length,
      monthlyGrowth: 12.5, // Mock data
      quarterlyGrowth: 8.3 // Mock data
    });
  };

  const calculateStageMetrics = () => {
    const stageData = stages.map(stage => {
      const stageLeads = leads.filter(lead => lead.stage_id === stage.id);
      const stageValue = stageLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
      const conversionRate = stageLeads.length > 0 ? 
        (stageLeads.filter(l => l.status === 'won').length / stageLeads.length) * 100 : 0;

      return {
        stage: stage.name,
        count: stageLeads.length,
        value: stageValue,
        conversionRate
      };
    });

    setStageMetrics(stageData);
  };

  const generateMonthlyData = () => {
    // Mock monthly data - in real app, this would come from API
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const data = months.map((month, index) => ({
      month,
      leads: Math.floor(Math.random() * 50) + 20,
      revenue: Math.floor(Math.random() * 100000) + 50000,
      deals: Math.floor(Math.random() * 20) + 5
    }));
    setMonthlyData(data);
  };

  const getGrowthColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getGrowthIcon = (value: number) => {
    return value >= 0 ? ArrowUpRight : ArrowDownRight;
  };

  if (leadsLoading || companiesLoading || stagesLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard de Vendas</h2>
          <p className="text-gray-600">Visão geral do desempenho de vendas</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="1y">1 ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLeads}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{metrics.monthlyGrowth}% este mês
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {metrics.totalRevenue.toLocaleString('pt-BR')}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{metrics.quarterlyGrowth}% este trimestre
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              +2.1% vs mês anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor do Pipeline</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {metrics.pipelineValue.toLocaleString('pt-BR')}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              +15.3% este mês
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Status dos Negócios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Ganhos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{metrics.wonDeals}</span>
                <Badge variant="secondary" className="text-xs">
                  {((metrics.wonDeals / metrics.totalLeads) * 100).toFixed(1)}%
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Ativos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{metrics.activeDeals}</span>
                <Badge variant="secondary" className="text-xs">
                  {((metrics.activeDeals / metrics.totalLeads) * 100).toFixed(1)}%
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">Perdidos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{metrics.lostDeals}</span>
                <Badge variant="secondary" className="text-xs">
                  {((metrics.lostDeals / metrics.totalLeads) * 100).toFixed(1)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stage Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance por Etapa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stageMetrics.slice(0, 5).map((stage, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full`} 
                       style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}></div>
                  <span className="text-sm truncate">{stage.stage}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{stage.count}</span>
                  <Badge variant="secondary" className="text-xs">
                    {stage.conversionRate.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Company Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Insights das Empresas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total de Empresas</span>
              <span className="font-semibold">{metrics.totalCompanies}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Empresas Ativas</span>
              <span className="font-semibold">
                {Math.floor(metrics.totalCompanies * 0.75)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Ticket Médio</span>
              <span className="font-semibold">
                R$ {metrics.avgDealSize.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Leads por Empresa</span>
              <span className="font-semibold">
                {(metrics.totalLeads / metrics.totalCompanies).toFixed(1)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tendências Mensais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-4">
            {monthlyData.map((data, index) => (
              <div key={index} className="text-center">
                <div className="text-sm font-medium text-gray-600">{data.month}</div>
                <div className="text-lg font-bold text-gray-900">{data.leads}</div>
                <div className="text-xs text-gray-500">leads</div>
                <div className="text-sm font-semibold text-green-600">
                  R$ {(data.revenue / 1000).toFixed(0)}k
                </div>
                <div className="text-xs text-gray-500">receita</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Growth Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Crescimento Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-2xl font-bold text-green-600">
                  +{metrics.monthlyGrowth}%
                </div>
                <div className="text-sm text-gray-600">vs mês anterior</div>
              </div>
              <div className="text-4xl text-green-600">
                <TrendingUp />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Objetivos do Trimestre</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Leads</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{metrics.totalLeads}</span>
                  <span className="text-xs text-gray-500">/ 500</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${Math.min((metrics.totalLeads / 500) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Receita</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    R$ {(metrics.totalRevenue / 1000000).toFixed(1)}M
                  </span>
                  <span className="text-xs text-gray-500">/ R$ 2.5M</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${Math.min((metrics.totalRevenue / 2500000) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
