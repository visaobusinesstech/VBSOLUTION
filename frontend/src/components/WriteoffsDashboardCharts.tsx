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
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Calendar,
  DollarSign,
  Package,
  FileText,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WriteoffsDashboardChartsProps {
  writeoffs: any[];
  filters: {
    dateRange: string;
    status: string;
    reason: string;
    value: string;
  };
}

interface WriteoffMetrics {
  total: number;
  completed: number;
  pending: number;
  draft: number;
  cancelled: number;
  totalValue: number;
  averageValue: number;
  totalItems: number;
  averageItems: number;
  damageCount: number;
  expiredCount: number;
  theftCount: number;
  lossCount: number;
  otherCount: number;
}

const WriteoffsDashboardCharts: React.FC<WriteoffsDashboardChartsProps> = ({ writeoffs, filters }) => {
  const [hoveredChart, setHoveredChart] = useState<string | null>(null);

  // Filtrar baixas baseado nos filtros
  const filteredWriteoffs = useMemo(() => {
    let filtered = [...writeoffs];

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
      
      filtered = filtered.filter(writeoff => 
        new Date(writeoff.createdAt) >= startDate
      );
    }

    // Filtro por status
    if (filters.status !== 'all') {
      filtered = filtered.filter(writeoff => writeoff.status === filters.status);
    }

    // Filtro por motivo
    if (filters.reason !== 'all') {
      filtered = filtered.filter(writeoff => writeoff.reason === filters.reason);
    }

    // Filtro por valor
    if (filters.value !== 'all') {
      filtered = filtered.filter(writeoff => {
        const value = writeoff.totalValue || 0;
        switch (filters.value) {
          case 'low': return value < 100;
          case 'medium': return value >= 100 && value < 500;
          case 'high': return value >= 500 && value < 1000;
          case 'very_high': return value >= 1000;
          default: return true;
        }
      });
    }

    return filtered;
  }, [writeoffs, filters]);

  // Calcular métricas principais
  const metrics: WriteoffMetrics = useMemo(() => {
    const total = filteredWriteoffs.length;
    const completed = filteredWriteoffs.filter(w => w.status === 'completed').length;
    const pending = filteredWriteoffs.filter(w => w.status === 'pending').length;
    const draft = filteredWriteoffs.filter(w => w.status === 'draft').length;
    const cancelled = filteredWriteoffs.filter(w => w.status === 'cancelled').length;
    
    const totalValue = filteredWriteoffs.reduce((sum, w) => sum + (w.totalValue || 0), 0);
    const averageValue = total > 0 ? totalValue / total : 0;
    
    const totalItems = filteredWriteoffs.reduce((sum, w) => sum + (w.items || 0), 0);
    const averageItems = total > 0 ? totalItems / total : 0;
    
    const damageCount = filteredWriteoffs.filter(w => w.reason === 'damage').length;
    const expiredCount = filteredWriteoffs.filter(w => w.reason === 'expired').length;
    const theftCount = filteredWriteoffs.filter(w => w.reason === 'theft').length;
    const lossCount = filteredWriteoffs.filter(w => w.reason === 'loss').length;
    const otherCount = filteredWriteoffs.filter(w => w.reason === 'other').length;

    return {
      total,
      completed,
      pending,
      draft,
      cancelled,
      totalValue,
      averageValue,
      totalItems,
      averageItems,
      damageCount,
      expiredCount,
      theftCount,
      lossCount,
      otherCount
    };
  }, [filteredWriteoffs]);

  // Dados para gráfico de barras - Status
  const statusData = useMemo(() => {
    const statusCounts = filteredWriteoffs.reduce((acc, writeoff) => {
      acc[writeoff.status] = (acc[writeoff.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status === 'completed' ? 'Concluídas' : 
            status === 'pending' ? 'Pendentes' :
            status === 'draft' ? 'Rascunho' : 
            status === 'cancelled' ? 'Canceladas' : status,
      value: count,
      originalStatus: status
    }));
  }, [filteredWriteoffs]);

  // Dados para gráfico de pizza - Motivos
  const reasonData = useMemo(() => {
    const reasonCounts = filteredWriteoffs.reduce((acc, writeoff) => {
      acc[writeoff.reason] = (acc[writeoff.reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(reasonCounts).map(([reason, count]) => ({
      name: reason === 'damage' ? 'Danos' :
            reason === 'expired' ? 'Vencimento' :
            reason === 'theft' ? 'Roubo' :
            reason === 'loss' ? 'Perda' :
            reason === 'other' ? 'Outros' : reason,
      value: count,
      originalReason: reason
    }));
  }, [filteredWriteoffs]);

  // Dados para gráfico de linha - Tendência temporal
  const timelineData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date;
    });

    return last30Days.map(date => {
      const dayWriteoffs = filteredWriteoffs.filter(writeoff => {
        const writeoffDate = new Date(writeoff.createdAt);
        return writeoffDate.toDateString() === date.toDateString();
      });

      return {
        date: date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
        criadas: dayWriteoffs.length,
        concluidas: dayWriteoffs.filter(w => w.status === 'completed').length
      };
    });
  }, [filteredWriteoffs]);

  // Dados para gráfico de área - Valor por Status
  const valueData = useMemo(() => {
    const valueByStatus = filteredWriteoffs.reduce((acc, writeoff) => {
      if (!writeoff.totalValue || writeoff.totalValue <= 0) return acc;
      
      if (!acc[writeoff.status]) {
        acc[writeoff.status] = 0;
      }
      acc[writeoff.status] += writeoff.totalValue;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(valueByStatus).map(([status, value]) => ({
      name: status === 'completed' ? 'Concluídas' : 
            status === 'pending' ? 'Pendentes' :
            status === 'draft' ? 'Rascunho' : status,
      valor: value,
      originalStatus: status
    }));
  }, [filteredWriteoffs]);

  // Dados para gráfico de barras compostas - Análise Geral
  const analysisData = useMemo(() => {
    return [
      {
        name: 'Total',
        baixas: metrics.total,
        concluidas: metrics.completed,
        valor: metrics.totalValue / 100 // em centenas
      },
      {
        name: 'Danos',
        baixas: metrics.damageCount,
        concluidas: filteredWriteoffs.filter(w => w.reason === 'damage' && w.status === 'completed').length,
        valor: filteredWriteoffs.filter(w => w.reason === 'damage').reduce((acc, w) => acc + (w.totalValue || 0), 0) / 100
      },
      {
        name: 'Vencimento',
        baixas: metrics.expiredCount,
        concluidas: filteredWriteoffs.filter(w => w.reason === 'expired' && w.status === 'completed').length,
        valor: filteredWriteoffs.filter(w => w.reason === 'expired').reduce((acc, w) => acc + (w.totalValue || 0), 0) / 100
      }
    ];
  }, [metrics, filteredWriteoffs]);

  // Cores para os gráficos
  const COLORS = {
    completed: '#10B981',
    pending: '#F59E0B',
    draft: '#6B7280',
    cancelled: '#EF4444',
    damage: '#DC2626',
    expired: '#F59E0B',
    theft: '#7C3AED',
    loss: '#EF4444',
    other: '#6B7280'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return COLORS.completed;
      case 'pending': return COLORS.pending;
      case 'draft': return COLORS.draft;
      case 'cancelled': return COLORS.cancelled;
      default: return '#6B7280';
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'damage': return COLORS.damage;
      case 'expired': return COLORS.expired;
      case 'theft': return COLORS.theft;
      case 'loss': return COLORS.loss;
      case 'other': return COLORS.other;
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
                  <p className="text-sm font-medium text-gray-600">Total de Baixas</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.total}</p>
                </div>
                <div className="p-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">
                  {metrics.total > 0 ? ((metrics.completed / metrics.total) * 100).toFixed(1) : 0}% concluídas
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
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {metrics.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-500">
                  Média: R$ {metrics.averageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  <p className="text-sm font-medium text-gray-600">Itens Baixados</p>
                  <p className="text-2xl font-bold text-purple-600">{metrics.totalItems}</p>
                </div>
                <div className="p-3">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-500">
                  Média: {metrics.averageItems.toFixed(1)} itens/baixa
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
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-orange-600">{metrics.pending}</p>
                </div>
                <div className="p-3">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                {metrics.pending > 0 ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-orange-500 mr-1" />
                    <span className="text-orange-600 font-medium">Atenção necessária</span>
                  </>
                ) : (
                  <span className="text-green-600 font-medium">Tudo em dia!</span>
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
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
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
                              {payload[0].value} baixas
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

        {/* Linha 1 - Gráfico 2: Motivos */}
        <motion.div
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5 }}
          whileHover="hover"
        >
          <Card className="bg-transparent border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Distribuição por Motivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reasonData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reasonData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getReasonColor(entry.originalReason)} 
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
              <CardTitle className="flex items-center gap-2">
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
            </CardContent>
          </Card>
        </motion.div>

        {/* Linha 2 - Gráfico 4: Valor por Status */}
        <motion.div
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.7 }}
          whileHover="hover"
        >
          <Card className="bg-transparent border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Valor por Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={valueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="valor" 
                    stroke="#10B981" 
                    fill="#10B981"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Linha 3 - Gráfico 5: Análise de Motivos */}
        <motion.div
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.8 }}
          whileHover="hover"
        >
          <Card className="bg-transparent border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Análise de Motivos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={reasonData}>
                  <RadialBar dataKey="value" fill="#8B5CF6" />
                  <Tooltip 
                    formatter={(value: number) => [`${value}`, 'Quantidade']}
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
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
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
                  <Bar yAxisId="left" dataKey="baixas" fill="#3B82F6" name="Baixas" />
                  <Bar yAxisId="left" dataKey="concluidas" fill="#10B981" name="Concluídas" />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="valor" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    name="Valor (C)"
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

export default WriteoffsDashboardCharts;
