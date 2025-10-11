import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Target,
  DollarSign, 
  TrendingUp,
  Clock,
  Users,
  Activity,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Star,
  Calendar,
  Building,
  Mail,
  Phone,
  Globe,
  Award
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  FunnelChart,
  Funnel as RechartsFunnel,
  LabelList
} from 'recharts';
import { Lead } from '@/hooks/useLeads-fixed';
import { FunnelStage } from '@/hooks/useFunnelStages';

interface LeadsSalesDashboardProps {
  leads: Lead[];
  stages: FunnelStage[];
  filters: any;
}

const LeadsSalesDashboard: React.FC<LeadsSalesDashboardProps> = ({ leads, stages, filters }) => {
  
  // Função helper para formatar valores monetários
  const formatCurrency = (value: number): string => {
    try {
      if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
        return 'R$ 0';
      }
      const numValue = Number(value);
      if (isNaN(numValue) || !isFinite(numValue)) {
        return 'R$ 0';
      }
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numValue);
    } catch (err) {
      return 'R$ 0';
    }
  };

  // Função para calcular tendência
  const calculateTrend = (current: number, previous: number): { value: string, icon: React.ReactNode, color: string } => {
    if (previous === 0) return { value: '0%', icon: <Minus className="h-3 w-3" />, color: 'text-gray-400' };
    
    const change = ((current - previous) / previous) * 100;
    const absChange = Math.abs(change);
    
    if (change > 0) {
      return { 
        value: `+${absChange.toFixed(1)}%`, 
        icon: <ArrowUpRight className="h-3 w-3" />, 
        color: 'text-green-500' 
      };
    } else if (change < 0) {
      return { 
        value: `-${absChange.toFixed(1)}%`, 
        icon: <ArrowDownRight className="h-3 w-3" />, 
        color: 'text-red-500' 
      };
    } else {
      return {
        value: '0%', 
        icon: <Minus className="h-3 w-3" />, 
        color: 'text-gray-400' 
      };
    }
  };

  // Função para determinar status do KPI
  const getKPIStatus = (current: number, target: number, type: 'higher' | 'lower' = 'higher') => {
    if (type === 'higher') {
      return current >= target ? 'success' : current >= target * 0.8 ? 'warning' : 'danger';
    } else {
      return current <= target ? 'success' : current <= target * 1.2 ? 'warning' : 'danger';
    }
  };

  // Cálculo dos 22 KPIs com dados reais
  const kpis = useMemo(() => {
    const totalLeads = leads.length;
    const wonLeads = leads.filter(lead => lead.status === 'won');
    const lostLeads = leads.filter(lead => lead.status === 'lost');
    const hotLeads = leads.filter(lead => lead.status === 'hot');
    const coldLeads = leads.filter(lead => lead.status === 'cold');
    const activeLeads = leads.filter(lead => ['hot', 'cold'].includes(lead.status));

    // 1. Taxa de Conversão Geral
    const conversionRate = totalLeads > 0 ? (wonLeads.length / totalLeads) * 100 : 0;
    
    // 2. Taxa de Conversão por Fonte (Website como exemplo)
    const websiteLeads = leads.filter(lead => 
      lead.tags?.some(tag => tag.toLowerCase().includes('website')) || 
      lead.company?.toLowerCase().includes('site') || 
      lead.company?.toLowerCase().includes('web')
    );
    const websiteWon = websiteLeads.filter(lead => lead.status === 'won');
    const websiteConversionRate = websiteLeads.length > 0 ? (websiteWon.length / websiteLeads.length) * 100 : 0;
    
    // 3. Taxa de Conversão por Prioridade (Urgente como exemplo)
    const urgentLeads = leads.filter(lead => lead.priority === 'urgent');
    const urgentWon = urgentLeads.filter(lead => lead.status === 'won');
    const urgentConversionRate = urgentLeads.length > 0 ? (urgentWon.length / urgentLeads.length) * 100 : 0;
    
    // 4. Ticket Médio
    const totalWonValue = wonLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
    const averageTicket = wonLeads.length > 0 ? totalWonValue / wonLeads.length : 0;
    
    // 5. Pipeline Value
    const pipelineValue = activeLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
    
    // 6. Revenue por Fonte (WhatsApp como exemplo)
    const whatsappLeads = leads.filter(lead => 
      lead.tags?.some(tag => tag.toLowerCase().includes('whatsapp')) || 
      lead.company?.toLowerCase().includes('whatsapp')
    );
    const whatsappRevenue = whatsappLeads.filter(lead => lead.status === 'won')
      .reduce((sum, lead) => sum + (lead.value || 0), 0);
    
    // 7. Valor por Responsável (simulado)
    const responsibleValue = wonLeads.length > 0 ? totalWonValue / Math.max(1, new Set(wonLeads.map(l => l.responsible_id)).size) : 0;
    
    // 8. Tempo Médio de Conversão (simulado baseado em days_in_funnel)
    const avgConversionTime = wonLeads.length > 0 ? 
      wonLeads.reduce((sum, lead) => sum + (lead.days_in_funnel || 25), 0) / wonLeads.length : 25;
    
    // 9. Velocidade por Etapa (simulado)
    const stageSpeed = 5; // dias médios
    
    // 10. Taxa de Aquecimento
    const warmingRate = coldLeads.length > 0 ? (hotLeads.length / coldLeads.length) * 100 : 0;
    
    // 11. Lead Quality Score
    const completeLeads = leads.filter(lead => lead.email && lead.phone && lead.company);
    const qualityScore = totalLeads > 0 ? (completeLeads.length / totalLeads) * 100 : 0;
    
    // 12. Taxa de Leads Completos
    const completeRate = qualityScore; // Mesma métrica
    
    // 13. Performance por Tags (VIP como exemplo)
    const vipLeads = leads.filter(lead => lead.tags?.some(tag => tag.toLowerCase().includes('vip')));
    const vipWon = vipLeads.filter(lead => lead.status === 'won');
    const vipPerformance = vipLeads.length > 0 ? (vipWon.length / vipLeads.length) * 100 : 0;
    
    // 14. Novos Leads por Dia (simulado)
    const newLeadsPerDay = 15; // simulado
    
    // 15. Crescimento Mensal (simulado)
    const monthlyGrowth = 12; // simulado
    
    // 16. Taxa de Retenção
    const retentionRate = totalLeads > 0 ? ((totalLeads - lostLeads.length) / totalLeads) * 100 : 0;
    
    // 17. Performance Individual (simulado)
    const individualPerformance = 1.2; // simulado
    
    // 18. Distribuição de Carga (simulado)
    const loadDistribution = 85; // simulado
    
    // 19. Taxa de Conversão Individual (simulado)
    const individualConversion = 47; // simulado
    
    // 20. Leads Estagnados
    const stagnantLeads = leads.filter(lead => 
      lead.days_in_funnel && lead.days_in_funnel > 30
    ).length;
    const stagnantRate = totalLeads > 0 ? (stagnantLeads / totalLeads) * 100 : 0;
    
    // 21. Taxa de Follow-up (simulado)
    const followUpRate = 82; // simulado
    
    // 22. Eficiência por Fonte (simulado)
    const sourceEfficiency = 65; // simulado

    return [
      // KPIs de Conversão
      {
        id: 1,
        title: "Taxa de Conversão Geral",
        value: `${conversionRate.toFixed(1)}%`,
        target: "40%",
        status: getKPIStatus(conversionRate, 40),
        trend: calculateTrend(conversionRate, 38),
        icon: Target,
        category: "conversion"
      },
      {
        id: 2,
        title: "Conversão Website",
        value: `${websiteConversionRate.toFixed(1)}%`,
        target: "45%",
        status: getKPIStatus(websiteConversionRate, 45),
        trend: calculateTrend(websiteConversionRate, 42),
        icon: Globe,
        category: "conversion"
      },
      {
        id: 3,
        title: "Conversão Urgente",
        value: `${urgentConversionRate.toFixed(1)}%`,
        target: "80%",
        status: getKPIStatus(urgentConversionRate, 80),
        trend: calculateTrend(urgentConversionRate, 75),
        icon: Zap,
        category: "conversion"
      },
      
      // KPIs de Valor
      {
        id: 4,
        title: "Ticket Médio",
        value: formatCurrency(averageTicket),
        target: "R$ 4.000",
        status: getKPIStatus(averageTicket, 4000),
        trend: calculateTrend(averageTicket, 3800),
        icon: DollarSign,
        category: "value"
      },
      {
        id: 5,
        title: "Pipeline Value",
        value: formatCurrency(pipelineValue),
        target: "R$ 500.000",
        status: getKPIStatus(pipelineValue, 500000),
        trend: calculateTrend(pipelineValue, 480000),
        icon: TrendingUp,
        category: "value"
      },
      {
        id: 6,
        title: "Revenue WhatsApp",
        value: formatCurrency(whatsappRevenue),
        target: "R$ 150.000",
        status: getKPIStatus(whatsappRevenue, 150000),
        trend: calculateTrend(whatsappRevenue, 140000),
        icon: Phone,
        category: "value"
      },
      {
        id: 7,
        title: "Valor por Responsável",
        value: formatCurrency(responsibleValue),
        target: "R$ 200.000",
        status: getKPIStatus(responsibleValue, 200000),
        trend: calculateTrend(responsibleValue, 180000),
        icon: Users,
        category: "value"
      },
      
      // KPIs de Velocidade
      {
        id: 8,
        title: "Tempo de Conversão",
        value: `${avgConversionTime.toFixed(0)} dias`,
        target: "25 dias",
        status: getKPIStatus(avgConversionTime, 25, 'lower'),
        trend: calculateTrend(avgConversionTime, 28),
        icon: Clock,
        category: "speed"
      },
      {
        id: 9,
        title: "Velocidade por Etapa",
        value: `${stageSpeed} dias`,
        target: "5 dias",
        status: getKPIStatus(stageSpeed, 5, 'lower'),
        trend: calculateTrend(stageSpeed, 6),
        icon: Activity,
        category: "speed"
      },
      {
        id: 10,
        title: "Taxa de Aquecimento",
        value: `${warmingRate.toFixed(1)}%`,
        target: "30%",
        status: getKPIStatus(warmingRate, 30),
        trend: calculateTrend(warmingRate, 28),
        icon: TrendingUp,
        category: "speed"
      },
      
      // KPIs de Qualidade
      {
        id: 11,
        title: "Lead Quality Score",
        value: `${qualityScore.toFixed(1)}%`,
        target: "70%",
        status: getKPIStatus(qualityScore, 70),
        trend: calculateTrend(qualityScore, 65),
        icon: Star,
        category: "quality"
      },
      {
        id: 12,
        title: "Leads Completos",
        value: `${completeRate.toFixed(1)}%`,
        target: "60%",
        status: getKPIStatus(completeRate, 60),
        trend: calculateTrend(completeRate, 55),
        icon: CheckCircle,
        category: "quality"
      },
      {
        id: 13,
        title: "Performance VIP",
        value: `${vipPerformance.toFixed(1)}%`,
        target: "80%",
        status: getKPIStatus(vipPerformance, 80),
        trend: calculateTrend(vipPerformance, 75),
        icon: Award,
        category: "quality"
      },
      
      // KPIs de Crescimento
      {
        id: 14,
        title: "Novos Leads/Dia",
        value: `${newLeadsPerDay}`,
        target: "15",
        status: getKPIStatus(newLeadsPerDay, 15),
        trend: calculateTrend(newLeadsPerDay, 13),
        icon: Calendar,
        category: "growth"
      },
      {
        id: 15,
        title: "Crescimento Mensal",
        value: `${monthlyGrowth}%`,
        target: "10%",
        status: getKPIStatus(monthlyGrowth, 10),
        trend: calculateTrend(monthlyGrowth, 8),
        icon: BarChart3,
        category: "growth"
      },
      {
        id: 16,
        title: "Taxa de Retenção",
        value: `${retentionRate.toFixed(1)}%`,
        target: "75%",
        status: getKPIStatus(retentionRate, 75),
        trend: calculateTrend(retentionRate, 72),
        icon: PieChart,
        category: "growth"
      },
      
      // KPIs de Equipe
      {
        id: 17,
        title: "Performance Individual",
        value: `${individualPerformance.toFixed(1)}x`,
        target: "1.5x",
        status: getKPIStatus(individualPerformance, 1.5),
        trend: calculateTrend(individualPerformance, 1.3),
        icon: Users,
        category: "team"
      },
      {
        id: 18,
        title: "Distribuição de Carga",
        value: `${loadDistribution}%`,
        target: "80%",
        status: getKPIStatus(loadDistribution, 80),
        trend: calculateTrend(loadDistribution, 75),
        icon: Activity,
        category: "team"
      },
      {
        id: 19,
        title: "Conversão Individual",
        value: `${individualConversion}%`,
        target: "45%",
        status: getKPIStatus(individualConversion, 45),
        trend: calculateTrend(individualConversion, 42),
        icon: Target,
        category: "team"
      },
      
      // KPIs de Operação
      {
        id: 20,
        title: "Leads Estagnados",
        value: `${stagnantRate.toFixed(1)}%`,
        target: "10%",
        status: getKPIStatus(stagnantRate, 10, 'lower'),
        trend: calculateTrend(stagnantRate, 12),
        icon: AlertTriangle,
        category: "operation"
      },
      {
        id: 21,
        title: "Taxa de Follow-up",
        value: `${followUpRate}%`,
        target: "80%",
        status: getKPIStatus(followUpRate, 80),
        trend: calculateTrend(followUpRate, 78),
        icon: Mail,
        category: "operation"
      },
      {
        id: 22,
        title: "Eficiência por Fonte",
        value: `${sourceEfficiency}%`,
        target: "70%",
        status: getKPIStatus(sourceEfficiency, 70),
        trend: calculateTrend(sourceEfficiency, 65),
        icon: Building,
        category: "operation"
      }
    ];
  }, [leads]);

  // Dados REAIS para gráficos tecnológicos
  const chartData = useMemo(() => {
    const totalLeads = leads.length;
    const wonLeads = leads.filter(lead => lead.status === 'won');
    const lostLeads = leads.filter(lead => lead.status === 'lost');
    const hotLeads = leads.filter(lead => lead.status === 'hot');
    const coldLeads = leads.filter(lead => lead.status === 'cold');
    
    // DADOS REAIS: Conversão por fonte
    const sourceMap: Record<string, { won: number, total: number }> = {};
    leads.forEach(lead => {
      let source = 'Outros';
      
      if (lead.tags?.some(tag => tag.toLowerCase().includes('website')) || 
          lead.company?.toLowerCase().includes('site')) {
        source = 'Website';
      } else if (lead.tags?.some(tag => tag.toLowerCase().includes('whatsapp')) || 
                 lead.company?.toLowerCase().includes('whatsapp')) {
        source = 'WhatsApp';
      } else if (lead.tags?.some(tag => tag.toLowerCase().includes('instagram'))) {
        source = 'Instagram';
      } else if (lead.tags?.some(tag => tag.toLowerCase().includes('facebook'))) {
        source = 'Facebook';
      } else if (lead.tags?.some(tag => tag.toLowerCase().includes('email'))) {
        source = 'Email';
      }
      
      if (!sourceMap[source]) sourceMap[source] = { won: 0, total: 0 };
      sourceMap[source].total += 1;
      if (lead.status === 'won') sourceMap[source].won += 1;
    });

    const sourceData = Object.keys(sourceMap)
      .map(name => ({
        name,
        conversion: sourceMap[name].total > 0 ? (sourceMap[name].won / sourceMap[name].total) * 100 : 0,
        leads: sourceMap[name].total,
        color: name === 'Website' ? '#021529' : 
               name === 'WhatsApp' ? '#1e40af' : 
               name === 'Instagram' ? '#3b82f6' : 
               name === 'Facebook' ? '#60a5fa' : '#93c5fd'
      }))
      .sort((a, b) => b.conversion - a.conversion)
      .slice(0, 5);

    // DADOS REAIS: Valor por mês
    const monthlyMap: Record<string, { value: number, count: number }> = {};
    wonLeads.forEach(lead => {
      if (lead.created_at) {
        const date = new Date(lead.created_at);
        const monthKey = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(2)}`;
        if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { value: 0, count: 0 };
        monthlyMap[monthKey].value += lead.value || 0;
        monthlyMap[monthKey].count += 1;
      }
    });

    const monthlyValueData = Object.keys(monthlyMap)
      .sort()
      .slice(-6)
      .map(month => ({
        month,
        value: monthlyMap[month].value,
        target: 50000
      }));

    // DADOS REAIS: Funil por etapas
    const stageMap: Record<string, number> = {};
    leads.forEach(lead => {
      const stageName = stages.find(s => s.id === lead.stage_id)?.name || 'Outros';
      stageMap[stageName] = (stageMap[stageName] || 0) + 1;
    });

    const funnelData = stages
      .map(stage => ({
        stage: stage.name.length > 15 ? stage.name.substring(0, 15) + '...' : stage.name,
        leads: stageMap[stage.name] || 0,
        conversion: totalLeads > 0 ? ((stageMap[stage.name] || 0) / totalLeads) * 100 : 0
      }))
      .filter(item => item.leads > 0);

    // DADOS REAIS: Qualidade dos leads
    const completeLeads = leads.filter(lead => lead.email && lead.phone && lead.company).length;
    const emailLeads = leads.filter(lead => lead.email).length;
    const phoneLeads = leads.filter(lead => lead.phone).length;
    const companyLeads = leads.filter(lead => lead.company).length;
    const tagsLeads = leads.filter(lead => lead.tags && lead.tags.length > 0).length;

    const qualityRadarData = [
      { metric: 'Completo', value: totalLeads > 0 ? (completeLeads / totalLeads) * 100 : 0 },
      { metric: 'Email', value: totalLeads > 0 ? (emailLeads / totalLeads) * 100 : 0 },
      { metric: 'Telefone', value: totalLeads > 0 ? (phoneLeads / totalLeads) * 100 : 0 },
      { metric: 'Empresa', value: totalLeads > 0 ? (companyLeads / totalLeads) * 100 : 0 },
      { metric: 'Tags', value: totalLeads > 0 ? (tagsLeads / totalLeads) * 100 : 0 }
    ];

    // DADOS REAIS: Crescimento por período
    const quarterMap: Record<string, number> = {};
    leads.forEach(lead => {
      if (lead.created_at) {
        const date = new Date(lead.created_at);
        const quarter = `Q${Math.floor(date.getMonth() / 3) + 1}`;
        quarterMap[quarter] = (quarterMap[quarter] || 0) + 1;
      }
    });

    const growthData = ['Q1', 'Q2', 'Q3', 'Q4']
      .map(period => ({
        period,
        leads: quarterMap[period] || 0
      }))
      .filter(item => item.leads > 0);

    // DADOS REAIS: Performance por responsável
    const responsibleMap: Record<string, { won: number, total: number }> = {};
    leads.forEach(lead => {
      const responsibleId = lead.responsible_id || 'Sem responsável';
      if (!responsibleMap[responsibleId]) responsibleMap[responsibleId] = { won: 0, total: 0 };
      responsibleMap[responsibleId].total += 1;
      if (lead.status === 'won') responsibleMap[responsibleId].won += 1;
    });

    const teamData = Object.keys(responsibleMap)
      .map(id => ({
        name: id.substring(0, 20),
        leads: responsibleMap[id].total,
        conversion: responsibleMap[id].total > 0 ? (responsibleMap[id].won / responsibleMap[id].total) * 100 : 0,
        performance: responsibleMap[id].total > 0 ? (responsibleMap[id].won / responsibleMap[id].total) : 0
      }))
      .sort((a, b) => b.conversion - a.conversion)
      .slice(0, 5);

    // DADOS REAIS: Status distribution
    const statusData = [
      { name: 'Ganhos', value: wonLeads.length, color: '#10b981' },
      { name: 'Perdidos', value: lostLeads.length, color: '#ef4444' },
      { name: 'Quentes', value: hotLeads.length, color: '#f59e0b' },
      { name: 'Frios', value: coldLeads.length, color: '#6b7280' }
    ].filter(item => item.value > 0);

    // DADOS REAIS: Prioridade distribution
    const priorityMap: Record<string, number> = {};
    leads.forEach(lead => {
      const priority = lead.priority || 'none';
      priorityMap[priority] = (priorityMap[priority] || 0) + 1;
    });

    const priorityData = Object.keys(priorityMap)
      .map(priority => ({
        name: priority === 'urgent' ? 'Urgente' : 
              priority === 'high' ? 'Alta' : 
              priority === 'medium' ? 'Média' : 
              priority === 'low' ? 'Baixa' : 'Sem prioridade',
        value: priorityMap[priority]
      }))
      .filter(item => item.value > 0);

    return {
      sourceData,
      monthlyValueData,
      funnelData,
      qualityRadarData,
      growthData,
      teamData,
      statusData,
      priorityData
    };
  }, [leads, stages]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'border-green-500 bg-green-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'danger': return 'border-red-500 bg-red-50';
      default: return 'border-gray-200 bg-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'danger': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  // Calcular métricas principais
  const mainMetrics = useMemo(() => {
    const totalLeads = leads.length;
    const wonLeads = leads.filter(lead => lead.status === 'won');
    const lostLeads = leads.filter(lead => lead.status === 'lost');
    const activeLeads = leads.filter(lead => ['hot', 'cold'].includes(lead.status));
    
    const totalValue = wonLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
    const conversionRate = totalLeads > 0 ? (wonLeads.length / totalLeads) * 100 : 0;
    const averageTicket = wonLeads.length > 0 ? totalValue / wonLeads.length : 0;
    const pipelineValue = activeLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);

    return {
      totalValue,
      conversionRate,
      averageTicket,
      pipelineValue,
      totalLeads,
      wonCount: wonLeads.length,
      lostCount: lostLeads.length,
      activeCount: activeLeads.length
    };
  }, [leads]);

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Dashboard de Análises</h1>
        <p className="text-sm text-gray-600">Monitoramento em tempo real dos principais indicadores</p>
      </div>

      {/* 4 KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total de Vendas */}
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold">{formatCurrency(mainMetrics.totalValue)}</div>
            <div className="text-xs opacity-90 mt-1">{mainMetrics.wonCount} vendas realizadas</div>
          </CardContent>
        </Card>

        {/* KPI 2: Taxa de Conversão */}
        <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Taxa de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold">{mainMetrics.conversionRate.toFixed(1)}%</div>
            <div className="text-xs opacity-90 mt-1">{mainMetrics.wonCount} de {mainMetrics.totalLeads} leads</div>
          </CardContent>
        </Card>

        {/* KPI 3: Ticket Médio */}
        <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold">{formatCurrency(mainMetrics.averageTicket)}</div>
            <div className="text-xs opacity-90 mt-1">Valor médio por venda</div>
          </CardContent>
        </Card>

        {/* KPI 4: Pipeline Value */}
        <Card className="bg-gradient-to-br from-orange-600 to-orange-700 text-white border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Pipeline Value
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold">{formatCurrency(mainMetrics.pipelineValue)}</div>
            <div className="text-xs opacity-90 mt-1">{mainMetrics.activeCount} leads ativos</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Modernos e Funcionais */}
      <div className="space-y-4 mt-4">
        <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          Análises Detalhadas
        </h2>
        
        {/* Grid de 3 Gráficos por Linha */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Gráfico 1: Conversão por Fonte */}
          <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-600" />
                Conversão por Fonte
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData.sourceData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280" 
                    style={{ fontSize: '11px' }}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    style={{ fontSize: '11px' }}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                      padding: '8px 12px'
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Conversão']}
                  />
                  <Bar 
                    dataKey="conversion" 
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico 2: Funil de Etapas */}
          <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                Funil de Etapas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData.funnelData} layout="horizontal" margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    type="number" 
                    stroke="#6b7280" 
                    style={{ fontSize: '11px' }}
                    tickLine={false}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="stage" 
                    stroke="#6b7280" 
                    style={{ fontSize: '10px' }}
                    tickLine={false}
                    width={70}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                      padding: '8px 12px'
                    }}
                  />
                  <Bar 
                    dataKey="leads" 
                    fill="#021529"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico 3: Valor Mensal */}
          <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Valor Mensal
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={chartData.monthlyValueData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6b7280" 
                    style={{ fontSize: '11px' }}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    style={{ fontSize: '11px' }}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                      padding: '8px 12px'
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Valor']}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#021529"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#3b82f6', r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico 4: Status dos Leads */}
          <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <PieChart className="h-4 w-4 text-blue-600" />
                Status dos Leads
              </CardTitle>
        </CardHeader>
            <CardContent className="pt-0 flex justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={chartData.statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                      padding: '8px 12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico 5: Qualidade dos Leads */}
          <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Star className="h-4 w-4 text-blue-600" />
                Qualidade dos Leads
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={chartData.qualityRadarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis 
                    dataKey="metric" 
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                  />
                  <Radar 
                    name="Qualidade" 
                    dataKey="value" 
                    stroke="#021529" 
                    fill="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={0.4}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                      padding: '8px 12px'
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Score']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico 6: Performance da Equipe */}
          <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Performance da Equipe
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData.teamData} margin={{ top: 5, right: 5, left: -20, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280" 
                    style={{ fontSize: '9px' }}
                    tickLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    style={{ fontSize: '11px' }}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                      padding: '8px 12px'
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Conversão']}
                  />
                  <Bar 
                    dataKey="conversion" 
                    fill="#021529"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
};

export default LeadsSalesDashboard;