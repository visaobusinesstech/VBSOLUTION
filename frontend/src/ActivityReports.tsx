
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Clock, User, Trophy, TrendingUp, Activity } from 'lucide-react';
import ActivityFilters from './ActivityFilters';
import ActivityTable from './ActivityTable';

interface ActivityReportsProps {
  activities: any[];
  companies: any[];
  employees: any[];
}

const ActivityReports = ({ activities, companies, employees }: ActivityReportsProps) => {
  const [filters, setFilters] = useState({
    cargo: '',
    mes: '',
    ano: '',
    semana: '',
    dia: '',
    data: '',
    hora: ''
  });

  // Dados para gráfico de linha (atividades por mês)
  const monthlyData = [
    { name: 'Jan', atividades: 12, concluidas: 8 },
    { name: 'Fev', atividades: 19, concluidas: 15 },
    { name: 'Mar', atividades: 15, concluidas: 12 },
    { name: 'Abr', atividades: 25, concluidas: 20 },
    { name: 'Mai', atividades: 22, concluidas: 18 },
    { name: 'Jun', atividades: 30, concluidas: 25 }
  ];

  // Dados para gráfico de horas trabalhadas
  const hoursData = [
    { name: 'Seg', horas: 8 },
    { name: 'Ter', horas: 7 },
    { name: 'Qua', horas: 9 },
    { name: 'Qui', horas: 8 },
    { name: 'Sex', horas: 6 },
    { name: 'Sab', horas: 2 },
    { name: 'Dom', horas: 0 }
  ];

  // Dados para gráfico de pizza (status das atividades)
  const statusData = [
    { name: 'Concluídas', value: activities.filter(a => a.status === 'completed').length, color: '#10B981' },
    { name: 'Em Andamento', value: activities.filter(a => a.status === 'in-progress').length, color: '#3B82F6' },
    { name: 'Pendentes', value: activities.filter(a => a.status === 'pending' || a.status === 'backlog').length, color: '#F59E0B' },
    { name: 'Atrasadas', value: activities.filter(a => new Date(a.date) < new Date() && a.status !== 'completed').length, color: '#EF4444' }
  ];

  // Ranking de funcionários
  const employeeRanking = employees.map(employee => {
    const employeeActivities = activities.filter(a => a.responsibleId === employee.id);
    const completedActivities = employeeActivities.filter(a => a.status === 'completed');
    const completionRate = employeeActivities.length > 0 ? Math.round((completedActivities.length / employeeActivities.length) * 100) : 0;
    
    return {
      id: employee.id,
      name: employee.name,
      position: employee.position || 'Desenvolvedor',
      totalActivities: employeeActivities.length,
      completedActivities: completedActivities.length,
      completionRate,
      hoursWorked: employeeActivities.length * 2 // Placeholder
    };
  }).sort((a, b) => b.completionRate - a.completionRate);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <ActivityFilters filters={filters} onFiltersChange={setFilters} />

      {/* Métricas em Cards Minimalistas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/90 backdrop-blur-sm border-l-4 border-l-blue-500 shadow-sm aspect-square flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-1">
            <div className="space-y-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
              <div className="text-3xl font-bold text-blue-600">{activities.length}</div>
              <p className="text-xs text-gray-500">Atividades</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </CardHeader>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-l-4 border-l-green-500 shadow-sm aspect-square flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-1">
            <div className="space-y-2">
              <CardTitle className="text-sm font-medium text-gray-600">Taxa</CardTitle>
              <div className="text-3xl font-bold text-green-600">
                {activities.length > 0 ? Math.round((activities.filter(a => a.status === 'completed').length / activities.length) * 100) : 0}%
              </div>
              <p className="text-xs text-gray-500">Conclusão</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </CardHeader>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-l-4 border-l-purple-500 shadow-sm aspect-square flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-1">
            <div className="space-y-2">
              <CardTitle className="text-sm font-medium text-gray-600">Horas</CardTitle>
              <div className="text-3xl font-bold text-purple-600">{activities.length * 2}h</div>
              <p className="text-xs text-gray-500">Trabalhadas</p>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </CardHeader>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-l-4 border-l-orange-500 shadow-sm aspect-square flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-1">
            <div className="space-y-2">
              <CardTitle className="text-sm font-medium text-gray-600">Equipe</CardTitle>
              <div className="text-3xl font-bold text-orange-600">{employees.length}</div>
              <p className="text-xs text-gray-500">Membros</p>
            </div>
            <User className="h-8 w-8 text-orange-600" />
          </CardHeader>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Linha - Atividades por Mês */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Atividades por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="atividades" stroke="#3B82F6" strokeWidth={3} />
                <Line type="monotone" dataKey="concluidas" stroke="#10B981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Horas Trabalhadas */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              Horas Trabalhadas por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hoursData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="horas" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status das Atividades e Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza - Status das Atividades */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Distribuição de Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ranking de Funcionários */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Ranking de Funcionários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employeeRanking.slice(0, 5).map((employee, index) => (
              <div key={employee.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-gray-200 text-gray-700'
                  }`}>
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{employee.name}</p>
                      <p className="text-xs text-gray-500">{employee.position}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-blue-600">{employee.completionRate}%</p>
                      <p className="text-xs text-gray-500">{employee.completedActivities}/{employee.totalActivities}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Todas as Atividades */}
      <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Relatório Completo de Atividades
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ActivityTable 
            activities={activities}
            companies={companies}
            employees={employees}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityReports;
