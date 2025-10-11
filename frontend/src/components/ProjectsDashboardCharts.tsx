import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart,
  Legend,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Target,
  Zap,
  BarChart3,
  DollarSign,
  FolderOpen,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProjectsDashboardChartsProps {
  projects: any[];
  filters: {
    dateRange: string;
    status: string;
    priority: string;
    responsible: string;
    budget: string;
  };
}

interface ProjectMetrics {
  total: number;
  active: number;
  completed: number;
  planning: number;
  onHold: number;
  cancelled: number;
  completionRate: number;
  averageBudget: number;
  totalBudget: number;
  overdueProjects: number;
  averageProgress: number;
  highPriorityProjects: number;
}

const ProjectsDashboardCharts: React.FC<ProjectsDashboardChartsProps> = ({ projects, filters }) => {
  const [hoveredChart, setHoveredChart] = useState<string | null>(null);

  // Filtrar projetos baseado nos filtros
  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    // Filtro por data
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      filtered = filtered.filter(project => 
        new Date(project.created_at) >= startDate
      );
    }

    // Filtro por status
    if (filters.status !== 'all') {
      filtered = filtered.filter(project => project.status === filters.status);
    }

    // Filtro por prioridade
    if (filters.priority !== 'all') {
      filtered = filtered.filter(project => project.priority === filters.priority);
    }

    // Filtro por responsável
    if (filters.responsible !== 'all') {
      filtered = filtered.filter(project => project.responsible_id === filters.responsible);
    }

    // Filtro por orçamento
    if (filters.budget !== 'all') {
      filtered = filtered.filter(project => {
        if (!project.budget) return false;
        const budget = project.budget;
        switch (filters.budget) {
          case 'low': return budget < 10000;
          case 'medium': return budget >= 10000 && budget < 50000;
          case 'high': return budget >= 50000 && budget < 100000;
          case 'very_high': return budget >= 100000;
          default: return true;
        }
      });
    }

    return filtered;
  }, [projects, filters]);

  // Calcular métricas principais
  const metrics: ProjectMetrics = useMemo(() => {
    const total = filteredProjects.length;
    const active = filteredProjects.filter(p => p.status === 'active').length;
    const completed = filteredProjects.filter(p => p.status === 'completed').length;
    const planning = filteredProjects.filter(p => p.status === 'planning').length;
    const onHold = filteredProjects.filter(p => p.status === 'on_hold').length;
    const cancelled = filteredProjects.filter(p => p.status === 'cancelled').length;
    
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    
    const projectsWithBudget = filteredProjects.filter(p => p.budget && p.budget > 0);
    const averageBudget = projectsWithBudget.length > 0 
      ? projectsWithBudget.reduce((acc, project) => acc + project.budget, 0) / projectsWithBudget.length
      : 0;
    
    const totalBudget = projectsWithBudget.reduce((acc, project) => acc + project.budget, 0);
    
    const overdueProjects = filteredProjects.filter(p => {
      if (!p.due_date) return false;
      return new Date(p.due_date) < new Date() && p.status !== 'completed';
    }).length;
    
    const projectsWithProgress = filteredProjects.filter(p => p.progress !== undefined);
    const averageProgress = projectsWithProgress.length > 0
      ? projectsWithProgress.reduce((acc, project) => acc + (project.progress || 0), 0) / projectsWithProgress.length
      : 0;
    
    const highPriorityProjects = filteredProjects.filter(p => 
      p.priority === 'high' || p.priority === 'urgent'
    ).length;

    return {
      total,
      active,
      completed,
      planning,
      onHold,
      cancelled,
      completionRate,
      averageBudget,
      totalBudget,
      overdueProjects,
      averageProgress,
      highPriorityProjects
    };
  }, [filteredProjects]);

  // Dados para gráfico de barras - Status
  const statusData = useMemo(() => {
    const statusCounts = filteredProjects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status === 'completed' ? 'Concluídos' : 
            status === 'active' ? 'Ativos' :
            status === 'planning' ? 'Planejamento' :
            status === 'on_hold' ? 'Pausados' : 
            status === 'cancelled' ? 'Cancelados' : status,
      value: count,
      originalStatus: status
    }));
  }, [filteredProjects]);

  // Dados para gráfico de pizza - Prioridades
  const priorityData = useMemo(() => {
    const priorityCounts = filteredProjects.reduce((acc, project) => {
      acc[project.priority] = (acc[project.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(priorityCounts).map(([priority, count]) => ({
      name: priority === 'urgent' ? 'Urgente' :
            priority === 'high' ? 'Alta' :
            priority === 'medium' ? 'Média' :
            priority === 'low' ? 'Baixa' : priority,
      value: count,
      originalPriority: priority
    }));
  }, [filteredProjects]);

  // Dados para gráfico de linha - Tendência temporal
  const timelineData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date;
    });

    return last30Days.map(date => {
      const dayProjects = filteredProjects.filter(project => {
        const projectDate = new Date(project.created_at);
        return projectDate.toDateString() === date.toDateString();
      });

      return {
        date: date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
        criados: dayProjects.length,
        concluidos: dayProjects.filter(p => p.status === 'completed').length
      };
    });
  }, [filteredProjects]);

  // Dados para gráfico de área - Orçamento por Status
  const budgetData = useMemo(() => {
    const budgetByStatus = filteredProjects.reduce((acc, project) => {
      if (!project.budget || project.budget <= 0) return acc;
      
      if (!acc[project.status]) {
        acc[project.status] = 0;
      }
      acc[project.status] += project.budget;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(budgetByStatus).map(([status, budget]) => ({
      name: status === 'completed' ? 'Concluídos' : 
            status === 'active' ? 'Ativos' :
            status === 'planning' ? 'Planejamento' :
            status === 'on_hold' ? 'Pausados' : status,
      orcamento: budget,
      originalStatus: status
    }));
  }, [filteredProjects]);

  // Dados para gráfico radial - Progresso Médio
  const progressData = useMemo(() => {
    const progressByStatus = filteredProjects.reduce((acc, project) => {
      if (!acc[project.status]) {
        acc[project.status] = { total: 0, sum: 0 };
      }
      acc[project.status].total++;
      acc[project.status].sum += project.progress || 0;
      return acc;
    }, {} as Record<string, { total: number; sum: number }>);

    return Object.entries(progressByStatus).map(([status, data]) => ({
      name: status === 'completed' ? 'Concluídos' : 
            status === 'active' ? 'Ativos' :
            status === 'planning' ? 'Planejamento' :
            status === 'on_hold' ? 'Pausados' : status,
      progress: data.total > 0 ? data.sum / data.total : 0,
      originalStatus: status
    }));
  }, [filteredProjects]);

  // Dados para gráfico de barras compostas - Análise Geral
  const analysisData = useMemo(() => {
    return [
      {
        name: 'Total',
        projetos: metrics.total,
        concluidos: metrics.completed,
        orcamento: metrics.totalBudget / 1000 // em milhares
      },
      {
        name: 'Ativos',
        projetos: metrics.active,
        concluidos: 0,
        orcamento: filteredProjects.filter(p => p.status === 'active' && p.budget).reduce((acc, p) => acc + p.budget, 0) / 1000
      },
      {
        name: 'Alta Prioridade',
        projetos: metrics.highPriorityProjects,
        concluidos: 0,
        orcamento: filteredProjects.filter(p => (p.priority === 'high' || p.priority === 'urgent') && p.budget).reduce((acc, p) => acc + p.budget, 0) / 1000
      }
    ];
  }, [metrics, filteredProjects]);

  // Cores para os gráficos
  const COLORS = {
    completed: '#10B981',
    active: '#3B82F6',
    planning: '#F59E0B',
    on_hold: '#6B7280',
    cancelled: '#EF4444',
    urgent: '#DC2626',
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return COLORS.completed;
      case 'active': return COLORS.active;
      case 'planning': return COLORS.planning;
      case 'on_hold': return COLORS.on_hold;
      case 'cancelled': return COLORS.cancelled;
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return COLORS.urgent;
      case 'high': return COLORS.high;
      case 'medium': return COLORS.medium;
      case 'low': return COLORS.low;
      default: return '#6B7280';
    }
  };

  const chartVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { scale: 1.02, transition: { duration: 0.2 } }
  };

  return (
    <div className="space-y-6" style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
        >
          <Card className="relative overflow-hidden bg-transparent border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Projetos</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FolderOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">
                  {metrics.completionRate.toFixed(1)}% concluídos
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
          whileHover="hover"
        >
          <Card className="relative overflow-hidden bg-transparent border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Projetos Ativos</p>
                  <p className="text-2xl font-bold text-blue-600">{metrics.active}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-500">
                  {metrics.total > 0 ? ((metrics.active / metrics.total) * 100).toFixed(1) : 0}% do total
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          whileHover="hover"
        >
          <Card className="relative overflow-hidden bg-transparent border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Orçamento Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {metrics.totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-500">
                  Média: R$ {metrics.averageBudget.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
          whileHover="hover"
        >
          <Card className="relative overflow-hidden bg-transparent border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Progresso Médio</p>
                  <p className="text-2xl font-bold text-purple-600">{metrics.averageProgress.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                {metrics.overdueProjects > 0 ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-red-600 font-medium">{metrics.overdueProjects} atrasados</span>
                  </>
                ) : (
                  <span className="text-green-600 font-medium">Em dia!</span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 6 Gráficos organizados em 2 por linha */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Linha 1 - Gráfico 1: Status */}
        <motion.div
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
          whileHover="hover"
        >
          <Card className="bg-transparent border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-5 w-5" />
                Distribuição por Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-transparent p-3 border-none rounded-lg">
                            <p className="font-medium">{label}</p>
                            <p className="text-sm text-gray-600">
                              {payload[0].value} projetos
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Linha 1 - Gráfico 2: Prioridades */}
        <motion.div
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5 }}
          whileHover="hover"
        >
          <Card className="bg-transparent border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="h-5 w-5" />
                Distribuição por Prioridade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getPriorityColor(entry.originalPriority)} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Linha 2 - Gráfico 3: Tendência Temporal */}
        <motion.div
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.6 }}
          whileHover="hover"
        >
          <Card className="bg-transparent border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-5 w-5" />
                Tendência dos Últimos 30 Dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="criados" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Criados"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="concluidos" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Concluídos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Linha 2 - Gráfico 4: Orçamento por Status */}
        <motion.div
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.7 }}
          whileHover="hover"
        >
          <Card className="bg-transparent border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <DollarSign className="h-5 w-5" />
                Orçamento por Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={budgetData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Orçamento']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="orcamento" 
                    stroke="#10B981" 
                    fill="#10B981"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Linha 3 - Gráfico 5: Progresso Médio */}
        <motion.div
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.8 }}
          whileHover="hover"
        >
          <Card className="bg-transparent border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-5 w-5" />
                Progresso Médio por Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={progressData}>
                  <RadialBar dataKey="progress" fill="#8B5CF6" />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Progresso']}
                  />
                  <Legend />
                </RadialBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Linha 3 - Gráfico 6: Análise Geral */}
        <motion.div
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.9 }}
          whileHover="hover"
        >
          <Card className="bg-transparent border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-5 w-5" />
                Análise Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={analysisData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="projetos" fill="#3B82F6" name="Projetos" />
                  <Bar yAxisId="left" dataKey="concluidos" fill="#10B981" name="Concluídos" />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="orcamento" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    name="Orçamento (K)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ProjectsDashboardCharts;
