import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  CheckCircle,
  Calendar,
  MapPin,
  Target,
  Activity,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { useLeads } from '@/hooks/useLeads-fixed';
import { useCompanies } from '@/hooks/useCompanies';
import { useFunnelStages } from '@/hooks/useFunnelStages';

interface KPIData {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: React.ReactNode;
  color: string;
}

const ModernDashboard: React.FC = () => {
  const { leads, loading: leadsLoading } = useLeads();
  const { companies, loading: companiesLoading } = useCompanies();
  const { stages, loading: stagesLoading } = useFunnelStages();

  // Dados dos KPIs principais
  const kpiData: KPIData[] = [
    {
      title: "Total Revenue",
      value: `R$ ${calculateTotalRevenue().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: "+5%",
      changeType: "positive",
      icon: <DollarSign className="h-5 w-5" />,
      color: "text-blue-600"
    },
    {
      title: "New Orders",
      value: calculateNewOrders().toString(),
      change: "-2%",
      changeType: "negative",
      icon: <ShoppingCart className="h-5 w-5" />,
      color: "text-purple-600"
    },
    {
      title: "Completed Orders",
      value: calculateCompletedOrders().toString(),
      change: "+18%",
      changeType: "positive",
      icon: <CheckCircle className="h-5 w-5" />,
      color: "text-green-600"
    },
    {
      title: "Spending",
      value: `R$ ${calculateSpending().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: "-17%",
      changeType: "negative",
      icon: <TrendingDown className="h-5 w-5" />,
      color: "text-red-600"
    }
  ];

  // Funções de cálculo baseadas nos dados reais
  function calculateTotalRevenue(): number {
    return leads
      .filter(lead => lead.status === 'won')
      .reduce((sum, lead) => sum + (lead.value || 0), 0);
  }

  function calculateNewOrders(): number {
    return leads.filter(lead => {
      const createdDate = new Date(lead.created_at);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return createdDate >= oneWeekAgo;
    }).length;
  }

  function calculateCompletedOrders(): number {
    return leads.filter(lead => lead.status === 'won').length;
  }

  function calculateSpending(): number {
    // Simulação de gastos baseado em 80% da receita
    return calculateTotalRevenue() * 0.8;
  }

  // Dados para gráfico de receita
  const revenueData = [
    { month: 'Jan', income: 8200, spending: 6500 },
    { month: 'Feb', income: 9100, spending: 7200 },
    { month: 'Mar', income: 8800, spending: 6800 },
    { month: 'Apr', income: 10500, spending: 8200 },
    { month: 'May', income: 11200, spending: 8900 },
    { month: 'Jun', income: 10843, spending: 9100 },
    { month: 'Jul', income: 10200, spending: 8500 },
    { month: 'Aug', income: 9800, spending: 7800 },
    { month: 'Sep', income: 9200, spending: 7400 },
    { month: 'Oct', income: 11535, spending: 9800 },
    { month: 'Nov', income: 12100, spending: 10200 },
    { month: 'Dec', income: 12278, spending: 10365 }
  ];

  // Dados para transações de clientes
  const customerTransactions = [
    {
      customer: "Emma Johnson",
      project: "Dashboard",
      date: "26 Aug",
      status: "Done",
      payment: "R$ 1.200",
      avatar: "EJ"
    },
    {
      customer: "Benjamin Martinez",
      project: "Web site",
      date: "19 Aug",
      status: "Done",
      payment: "R$ 1.550",
      avatar: "BM"
    },
    {
      customer: "Olivia Thompson",
      project: "Landing",
      date: "5 Aug",
      status: "In process",
      payment: "R$ 600",
      avatar: "OT"
    },
    {
      customer: "Ethan Davis",
      project: "Tilda",
      date: "4 Aug",
      status: "Canceled",
      payment: "R$ 500",
      avatar: "ED"
    },
    {
      customer: "Sophia Anderson",
      project: "Web site",
      date: "31 Jul",
      status: "Done",
      payment: "R$ 2.000",
      avatar: "SA"
    }
  ];

  // Dados para gráfico de clientes (donut)
  const customerData = [
    { name: "Weblancer", value: 280, color: "#10b981" },
    { name: "UpWork", value: 200, color: "#3b82f6" },
    { name: "Behance", value: 171, color: "#8b5cf6" }
  ];

  // Dados para gráfico de região (barras horizontais)
  const regionData = [
    { name: "Israel", orders: 256, color: "#10b981" },
    { name: "USA", orders: 148, color: "#3b82f6" },
    { name: "Canada", orders: 98, color: "#ef4444" },
    { name: "Australia", orders: 122, color: "#8b5cf6" }
  ];

  // Dados para gráfico de atendimento
  const attendanceData = [
    { day: "Sun", youtube: 165000, instagram: 182000, facebook: 170000 },
    { day: "Mon", youtube: 172000, instagram: 188000, facebook: 175000 },
    { day: "Tue", youtube: 168000, instagram: 185000, facebook: 172000 },
    { day: "Wed", youtube: 175000, instagram: 190000, facebook: 178000 },
    { day: "Thu", youtube: 170000, instagram: 187000, facebook: 174000 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Done":
        return "bg-green-100 text-green-800";
      case "In process":
        return "bg-purple-100 text-purple-800";
      case "Canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{kpi.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mb-2">{kpi.value}</p>
                  <div className="flex items-center gap-2">
                    {kpi.changeType === 'positive' ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      kpi.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {kpi.change}
                    </span>
                    <span className="text-xs text-gray-500">From last week</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${kpi.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                  <div className={kpi.color}>
                    {kpi.icon}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart and Customer Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Revenue</CardTitle>
                <div className="flex items-center gap-3">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-1" />
                    Add item
                  </Button>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>22 Jan 2023 - 29 Dec 2023</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span className="text-sm text-gray-600">Income</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                  <span className="text-sm text-gray-600">Spending</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#incomeGradient)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="spending"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#spendingGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Customer Transactions */}
        <div>
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Customer transaction</CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>25 Jul - 29 Aug</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-3">
                {customerTransactions.map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">{transaction.avatar}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{transaction.customer}</p>
                        <p className="text-xs text-gray-500">{transaction.project}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`text-xs ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </Badge>
                        <span className="text-xs text-gray-500">{transaction.date}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{transaction.payment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Customers */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Customers</CardTitle>
              <span className="text-sm text-gray-500">Last week</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-24 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={customerData}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={40}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {customerData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-900">651</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {customerData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Region */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Region</CardTitle>
              <span className="text-sm text-gray-500">Last week</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {regionData.map((region, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{region.name}</span>
                    <span className="text-sm text-gray-600">{region.orders} order</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        backgroundColor: region.color,
                        width: `${(region.orders / Math.max(...regionData.map(r => r.orders))) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-12 mb-4">
                <svg viewBox="0 0 100 50" className="w-full h-full">
                  <path
                    d="M 10 40 A 40 40 0 0 1 90 40"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <path
                    d="M 10 40 A 40 40 0 0 1 90 40"
                    stroke="#8b5cf6"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray="251.2"
                    strokeDashoffset="50.24"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">80%</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">Overall order fulfillment performance</p>
            </div>
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Attendance</CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>22 Aug - 29 Aug</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="youtube" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 1, r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="instagram" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 1, r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="facebook" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', strokeWidth: 1, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-xs text-gray-600">YouTube</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-xs text-gray-600">Instagram</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <span className="text-xs text-gray-600">Facebook</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModernDashboard;
