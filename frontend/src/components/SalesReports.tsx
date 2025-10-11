
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, DollarSign, TrendingUp, MapPin, Activity, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface SalesReportsProps {
  companies: any[];
  totalRevenue: number;
  newCompaniesThisMonth: number;
}

const SalesReports = ({ companies, totalRevenue, newCompaniesThisMonth }: SalesReportsProps) => {
  // Mock data para demonstração
  const monthlyData = [
    { month: 'Jan', revenue: 45000, companies: 12 },
    { month: 'Fev', revenue: 52000, companies: 15 },
    { month: 'Mar', revenue: 48000, companies: 13 },
    { month: 'Abr', revenue: 61000, companies: 18 },
    { month: 'Mai', revenue: 55000, companies: 16 },
    { month: 'Jun', revenue: 67000, companies: 20 },
  ];

  const regionData = [
    { region: 'São Paulo', companies: 45, revenue: 180000, color: '#3b82f6' },
    { region: 'Rio de Janeiro', companies: 28, revenue: 120000, color: '#10b981' },
    { region: 'Minas Gerais', companies: 22, revenue: 95000, color: '#f59e0b' },
    { region: 'Paraná', companies: 18, revenue: 78000, color: '#ef4444' },
    { region: 'Outros', companies: 35, revenue: 142000, color: '#8b5cf6' },
  ];

  // Simulação de atividades
  const mockActivities = [
    { status: 'completed', count: 45 },
    { status: 'in-progress', count: 23 },
    { status: 'overdue', count: 8 },
  ];

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="vb-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantidade de Clientes</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
            <p className="text-xs text-muted-foreground">
              +{newCompaniesThisMonth} este mês
            </p>
          </CardContent>
        </Card>

        <Card className="vb-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalRevenue.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="vb-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novas Empresas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newCompaniesThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card className="vb-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {companies.length ? Math.round(totalRevenue / companies.length).toLocaleString('pt-BR') : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Por cliente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Blocos de Informações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bloco Faturamento/Ganhos */}
        <Card className="vb-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Faturamento por Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {companies.slice(0, 10).map((company) => {
                const revenue = Math.random() * 50000 + 10000; // Mock revenue
                return (
                  <div key={company.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium truncate flex-1">{company.fantasyName}</span>
                    <span className="text-sm font-bold text-green-600 ml-2">
                      R$ {revenue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Bloco Atividades */}
        <Card className="vb-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Status das Atividades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Concluídas</span>
                </div>
                <span className="text-lg font-bold text-green-600">45</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Em Andamento</span>
                </div>
                <span className="text-lg font-bold text-blue-600">23</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Atrasadas</span>
                </div>
                <span className="text-lg font-bold text-red-600">8</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bloco Novas Empresas */}
        <Card className="vb-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              Novas Empresas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {companies
                .filter(company => {
                  const oneMonthAgo = new Date();
                  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                  return new Date(company.createdAt) > oneMonthAgo;
                })
                .slice(0, 8)
                .map((company) => (
                  <div key={company.id} className="flex items-center justify-between p-2 bg-purple-50 rounded">
                    <div className="flex-1">
                      <span className="text-sm font-medium block truncate">{company.fantasyName}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(company.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {company.city && (
                      <span className="text-xs text-purple-600 ml-2">{company.city}</span>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="vb-card">
          <CardHeader>
            <CardTitle>Faturamento Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Faturamento']} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="vb-card">
          <CardHeader>
            <CardTitle>Clientes por Região</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={regionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ region, percent }) => `${region} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="companies"
                >
                  {regionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Mapa de Clientes */}
      <Card className="vb-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-600" />
            Região dos Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {regionData.map((region) => (
              <div key={region.region} className="p-4 bg-gray-50 rounded-lg text-center">
                <h4 className="font-medium text-sm mb-2">{region.region}</h4>
                <div className="text-2xl font-bold text-gray-900 mb-1">{region.companies}</div>
                <div className="text-xs text-gray-600">empresas</div>
                <div className="text-sm font-medium text-green-600 mt-1">
                  R$ {region.revenue.toLocaleString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 text-center">
              📍 Mapa interativo com localização dos clientes em desenvolvimento
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesReports;
