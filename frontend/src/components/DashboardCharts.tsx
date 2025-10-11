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
  Legend
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
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DashboardChartsProps {
  activities: any[];
  filters: {
    dateRange: string;
    status: string;
    priority: string;
    responsible: string;
    type: string;
  };
}

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface ActivityMetrics {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  completionRate: number;
  averageCompletionTime: number;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ activities, filters }) => {
  const [hoveredChart, setHoveredChart] = useState<string | null>(null);
  const [selectedDataPoint, setSelectedDataPoint] = useState<any>(null);

  // Filtrar atividades baseado nos filtros
  const filteredActivities = useMemo(() => {
    let filtered = [...activities];
    
    console.log('🔍 DashboardCharts: Filtrando atividades', {
      total: activities.length,
      filtros: filters
    });

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
      
      filtered = filtered.filter(activity => 
        new Date(activity.created_at) >= startDate
      );
    }

    // Filtro por status
    if (filters.status !== 'all') {
      filtered = filtered.filter(activity => activity.status === filters.status);
    }

    // Filtro por prioridade
    if (filters.priority !== 'all') {
      filtered = filtered.filter(activity => activity.priority === filters.priority);
    }

    // Filtro por responsável
    if (filters.responsible !== 'all') {
      filtered = filtered.filter(activity => activity.responsible_id === filters.responsible);
    }

    // Filtro por tipo
    if (filters.type !== 'all') {
      filtered = filtered.filter(activity => activity.type === filters.type);
    }

    console.log('✅ DashboardCharts: Filtros aplicados', {
      original: activities.length,
      filtrado: filtered.length
    });

    return filtered;
  }, [activities, filters]);

  // Calcular métricas principais
  const metrics: ActivityMetrics = useMemo(() => {
    const total = filteredActivities.length;
    const completed = filteredActivities.filter(a => a.status === 'completed').length;
    const inProgress = filteredActivities.filter(a => a.status === 'in_progress').length;
    const pending = filteredActivities.filter(a => a.status === 'pending' || a.status === 'open').length;
    const overdue = filteredActivities.filter(a => {
      if (!a.due_date) return false;
      return new Date(a.due_date) < new Date() && a.status !== 'completed';
    }).length;
    
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    
    // Calcular tempo médio de conclusão (simulado)
    const completedWithDates = filteredActivities.filter(a => 
      a.status === 'completed' && a.start_date && a.end_date
    );
    const averageCompletionTime = completedWithDates.length > 0 
      ? completedWithDates.reduce((acc, activity) => {
          const start = new Date(activity.start_date);
          const end = new Date(activity.end_date);
          return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24); // dias
        }, 0) / completedWithDates.length
      : 0;

    return {
      total,
      completed,
      inProgress,
      pending,
      overdue,
      completionRate,
      averageCompletionTime
    };
  }, [filteredActivities]);

  // Dados para gráfico de barras - Status
  const statusData = useMemo(() => {
    const statusCounts = filteredActivities.reduce((acc, activity) => {
      acc[activity.status] = (acc[activity.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status === 'completed' ? 'Concluídas' : 
            status === 'in_progress' ? 'Em Progresso' :
            status === 'pending' ? 'Pendentes' :
            status === 'open' ? 'Abertas' : 
            status === 'cancelled' ? 'Canceladas' : status,
      value: count,
      originalStatus: status
    }));
  }, [filteredActivities]);

  // Dados para gráfico de pizza - Prioridades
  const priorityData = useMemo(() => {
    const priorityCounts = filteredActivities.reduce((acc, activity) => {
      acc[activity.priority] = (acc[activity.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(priorityCounts).map(([priority, count]) => ({
      name: priority === 'high' ? 'Alta' :
            priority === 'medium' ? 'Média' :
            priority === 'low' ? 'Baixa' : priority,
      value: count,
      originalPriority: priority
    }));
  }, [filteredActivities]);

  // Dados para gráfico de linha - Tendência temporal
  const timelineData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date;
    });

    return last30Days.map(date => {
      const dayActivities = filteredActivities.filter(activity => {
        const activityDate = new Date(activity.created_at);
        return activityDate.toDateString() === date.toDateString();
      });

      return {
        date: date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
        criadas: dayActivities.length,
        concluidas: dayActivities.filter(a => a.status === 'completed').length
      };
    });
  }, [filteredActivities]);

  // Dados para gráfico de área - Performance por tipo
  const typePerformanceData = useMemo(() => {
    const typeGroups = filteredActivities.reduce((acc, activity) => {
      if (!acc[activity.type]) {
        acc[activity.type] = { total: 0, completed: 0 };
      }
      acc[activity.type].total++;
      if (activity.status === 'completed') {
        acc[activity.type].completed++;
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    return Object.entries(typeGroups).map(([type, data]) => ({
      name: type,
      total: data.total,
      completed: data.completed,
      performance: data.total > 0 ? (data.completed / data.total) * 100 : 0
    }));
  }, [filteredActivities]);

  // Dados para gráfico de produtividade por responsável
  const productivityData = useMemo(() => {
    const responsibleGroups = filteredActivities.reduce((acc, activity) => {
      const responsibleId = activity.responsible_id || 'Sem responsável';
      if (!acc[responsibleId]) {
        acc[responsibleId] = { 
          total: 0, 
          completed: 0, 
          inProgress: 0, 
          overdue: 0,
          name: responsibleId === 'Sem responsável' ? 'Sem responsável' : `Usuário ${responsibleId.slice(0, 8)}`
        };
      }
      acc[responsibleId].total++;
      if (activity.status === 'completed') {
        acc[responsibleId].completed++;
      } else if (activity.status === 'in_progress') {
        acc[responsibleId].inProgress++;
      }
      
      // Verificar se está atrasada
      if (activity.due_date && new Date(activity.due_date) < new Date() && activity.status !== 'completed') {
        acc[responsibleId].overdue++;
      }
      
      return acc;
    }, {} as Record<string, { total: number; completed: number; inProgress: number; overdue: number; name: string }>);

    return Object.entries(responsibleGroups).map(([id, data]) => ({
      name: data.name,
      total: data.total,
      completed: data.completed,
      inProgress: data.inProgress,
      overdue: data.overdue,
      productivity: data.total > 0 ? (data.completed / data.total) * 100 : 0
    })).sort((a, b) => b.productivity - a.productivity).slice(0, 6); // Top 6 mais produtivos
  }, [filteredActivities]);

  // Dados para análise de prazos
  const deadlineAnalysisData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date(today);
    nextMonth.setDate(nextMonth.getDate() + 30);

    const analysis = {
      overdue: 0,
      today: 0,
      tomorrow: 0,
      thisWeek: 0,
      thisMonth: 0,
      noDeadline: 0
    };

    filteredActivities.forEach(activity => {
      if (activity.status === 'completed') return; // Não contar concluídas

      if (!activity.due_date) {
        analysis.noDeadline++;
        return;
      }

      const dueDate = new Date(activity.due_date);
      
      if (dueDate < today) {
        analysis.overdue++;
      } else if (dueDate.toDateString() === today.toDateString()) {
        analysis.today++;
      } else if (dueDate.toDateString() === tomorrow.toDateString()) {
        analysis.tomorrow++;
      } else if (dueDate <= nextWeek) {
        analysis.thisWeek++;
      } else if (dueDate <= nextMonth) {
        analysis.thisMonth++;
      }
    });

    return [
      { name: 'Atrasadas', value: analysis.overdue, color: '#EF4444' },
      { name: 'Hoje', value: analysis.today, color: '#F59E0B' },
      { name: 'Amanhã', value: analysis.tomorrow, color: '#3B82F6' },
      { name: 'Esta Semana', value: analysis.thisWeek, color: '#10B981' },
      { name: 'Este Mês', value: analysis.thisMonth, color: '#8B5CF6' },
      { name: 'Sem Prazo', value: analysis.noDeadline, color: '#6B7280' }
    ];
  }, [filteredActivities]);

  // Cores para os gráficos
  const COLORS = {
    completed: '#10B981',
    inProgress: '#F59E0B',
    pending: '#6B7280',
    overdue: '#EF4444',
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return COLORS.completed;
      case 'in_progress': return COLORS.inProgress;
      case 'pending':
      case 'open': return COLORS.pending;
      default: return COLORS.pending;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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
          <Card className="relative overflow-hidden bg-transparent border-0 shadow-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Atividades</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.total}</p>
                </div>
                <div className="p-3">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">
                  {metrics.completionRate.toFixed(1)}% concluídas
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
          <Card className="relative overflow-hidden bg-transparent border-0 shadow-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Concluídas</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.completed}</p>
                </div>
                <div className="p-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-500">
                  {metrics.total > 0 ? ((metrics.completed / metrics.total) * 100).toFixed(1) : 0}% do total
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
          <Card className="relative overflow-hidden bg-transparent border-0 shadow-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Em Progresso</p>
                  <p className="text-2xl font-bold text-yellow-600">{metrics.inProgress}</p>
                </div>
                <div className="p-3">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-500">
                  {metrics.total > 0 ? ((metrics.inProgress / metrics.total) * 100).toFixed(1) : 0}% do total
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
          <Card className="relative overflow-hidden bg-transparent border-0 shadow-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Atrasadas</p>
                  <p className="text-2xl font-bold text-red-600">{metrics.overdue}</p>
                </div>
                <div className="p-3">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                {metrics.overdue > 0 ? (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-red-600 font-medium">Atenção necessária</span>
                  </>
                ) : (
                  <span className="text-green-600 font-medium">Em dia!</span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras - Status */}
        <motion.div
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
          whileHover="hover"
        >
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Distribuição por Status
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border rounded-lg shadow-lg">
                          <p className="font-medium">{label}</p>
                          <p className="text-sm text-gray-600">
                            {payload[0].value} atividades
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
          </div>
        </motion.div>

        {/* Gráfico de Pizza - Prioridades */}
        <motion.div
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5 }}
          whileHover="hover"
        >
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Distribuição por Prioridade
              </h3>
            </div>
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
          </div>
        </motion.div>
      </div>

      {/* Linha 2: Tendência e Performance - Lado a lado em tamanhos menores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Linha - Tendência Temporal */}
        <motion.div
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.6 }}
          whileHover="hover"
        >
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tendência dos Últimos 30 Dias
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="criadas" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Criadas"
                />
                <Line 
                  type="monotone" 
                  dataKey="concluidas" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Concluídas"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gráfico de Área - Performance por Tipo */}
        <motion.div
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.7 }}
          whileHover="hover"
        >
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance por Tipo de Atividade
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={typePerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="total" fill="#3B82F6" name="Total" />
                <Bar yAxisId="left" dataKey="completed" fill="#10B981" name="Concluídas" />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="performance" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  name="Performance %"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Linha 3: Novos Gráficos Estratégicos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Produtividade por Responsável */}
        <motion.div
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.8 }}
          whileHover="hover"
        >
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Produtividade por Responsável
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productivityData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded-lg shadow-lg">
                          <p className="font-medium">{label}</p>
                          <p className="text-sm text-gray-600">
                            Total: {data.total} atividades
                          </p>
                          <p className="text-sm text-green-600">
                            Concluídas: {data.completed}
                          </p>
                          <p className="text-sm text-blue-600">
                            Em Progresso: {data.inProgress}
                          </p>
                          {data.overdue > 0 && (
                            <p className="text-sm text-red-600">
                              Atrasadas: {data.overdue}
                            </p>
                          )}
                          <p className="text-sm font-medium">
                            Produtividade: {data.productivity.toFixed(1)}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="completed" 
                  fill="#10B981"
                  radius={[0, 4, 4, 0]}
                  name="Concluídas"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gráfico de Análise de Prazos */}
        <motion.div
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.9 }}
          whileHover="hover"
        >
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Análise de Prazos
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deadlineAnalysisData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => 
                    value > 0 ? `${name}: ${value}` : ''
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deadlineAnalysisData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded-lg shadow-lg">
                          <p className="font-medium">{data.name}</p>
                          <p className="text-sm text-gray-600">
                            {data.value} atividades
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardCharts;
