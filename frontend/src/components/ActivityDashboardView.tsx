
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Activity,
  CheckCircle,
  Clock,
  Play,
  TrendingUp,
  User,
  Award,
  Calendar,
  Target,
  AlertCircle,
  Users,
  Zap
} from 'lucide-react';

interface ActivityDashboardViewProps {
  activities: any[];
  companies: any[];
  employees: any[];
  onActivityClick: (activityId: string) => void;
}

const ActivityDashboardView = ({
  activities,
  companies,
  employees,
  onActivityClick
}: ActivityDashboardViewProps) => {
  // Calculate metrics
  const totalActivities = activities.length;
  const completedActivities = activities.filter(a => a.status === 'completed').length;
  const inProgressActivities = activities.filter(a => a.status === 'in-progress').length;
  const pendingActivities = activities.filter(a => a.status === 'pending').length;
  const overdueActivities = activities.filter(a => a.status === 'overdue').length;
  const efficiencyRate = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;
  const averageCompletionTime = 2.5; // Mock data
  const teamProductivity = 87; // Mock data

  // Enhanced chart data
  const activityData = [
    { month: 'Jan', activities: 24, completed: 18, pending: 6 },
    { month: 'Fev', activities: 32, completed: 28, pending: 4 },
    { month: 'Mar', activities: 28, completed: 22, pending: 6 },
    { month: 'Abr', activities: 45, completed: 38, pending: 7 },
    { month: 'Mai', activities: 38, completed: 32, pending: 6 },
    { month: 'Jun', activities: 42, completed: 35, pending: 7 },
  ];

  const productivityData = [
    { day: 'Seg', productivity: 85, tasks: 12 },
    { day: 'Ter', productivity: 92, tasks: 15 },
    { day: 'Qua', productivity: 78, tasks: 10 },
    { day: 'Qui', productivity: 95, tasks: 18 },
    { day: 'Sex', productivity: 88, tasks: 14 },
    { day: 'Sáb', productivity: 65, tasks: 8 },
    { day: 'Dom', productivity: 45, tasks: 5 },
  ];

  const priorityData = [
    { name: 'Alta', value: activities.filter(a => a.priority === 'high').length, color: '#ef4444' },
    { name: 'Média', value: activities.filter(a => a.priority === 'medium').length, color: '#f59e0b' },
    { name: 'Baixa', value: activities.filter(a => a.priority === 'low').length, color: '#10b981' },
  ];

  const typeData = [
    { name: 'Tarefas', value: activities.filter(a => a.type === 'task').length, color: '#3b82f6' },
    { name: 'Reuniões', value: activities.filter(a => a.type === 'meeting').length, color: '#8b5cf6' },
    { name: 'Ligações', value: activities.filter(a => a.type === 'call').length, color: '#06b6d4' },
    { name: 'Outros', value: activities.filter(a => a.type === 'other').length, color: '#6b7280' },
  ];

  // Team ranking with real data
  const teamRanking = employees.map(employee => {
    const employeeActivities = activities.filter(a => a.responsibleId === employee.id);
    const completed = employeeActivities.filter(a => a.status === 'completed').length;
    const inProgress = employeeActivities.filter(a => a.status === 'in-progress').length;
    const total = employeeActivities.length;
    const efficiency = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      name: employee.name,
      completed,
      inProgress,
      total,
      efficiency,
      avatar: employee.name.split(' ').map(n => n[0]).join('').toUpperCase()
    };
  }).sort((a, b) => b.efficiency - a.efficiency).slice(0, 5);

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.name || 'Funcionário não encontrado';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'in-progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'overdue': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="vb-card p-6 hover-lift">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg">
              <Activity className="h-6 w-6" />
              </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{totalActivities}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-600 font-medium">+12%</span>
            <span className="text-gray-500">vs mês anterior</span>
          </div>
              </div>

        <div className="vb-card p-6 hover-lift">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white shadow-lg">
              <CheckCircle className="h-6 w-6" />
              </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{completedActivities}</div>
              <div className="text-sm text-gray-600">Concluídas</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-600 font-medium">{efficiencyRate}%</span>
            <span className="text-gray-500">Taxa de conclusão</span>
          </div>
              </div>

        <div className="vb-card p-6 hover-lift">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white shadow-lg">
              <TrendingUp className="h-6 w-6" />
              </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{teamProductivity}%</div>
              <div className="text-sm text-gray-600">Produtividade</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-600 font-medium">+8%</span>
            <span className="text-gray-500">vs semana passada</span>
          </div>
              </div>

        <div className="vb-card p-6 hover-lift">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white shadow-lg">
              <Clock className="h-6 w-6" />
              </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{averageCompletionTime}d</div>
              <div className="text-sm text-gray-600">Tempo médio</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-600 font-medium">-15%</span>
            <span className="text-gray-500">vs mês anterior</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Trends Chart */}
        <div className="vb-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Tendência de Atividades</h3>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
              Últimos 6 meses
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
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
                dataKey="completed" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorCompleted)"
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="pending" 
                stroke="#f59e0b" 
                fillOpacity={1} 
                fill="url(#colorPending)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Productivity Chart */}
        <div className="vb-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Produtividade Semanal</h3>
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
              Esta semana
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar 
                dataKey="productivity" 
                fill="url(#productivityGradient)" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <defs>
            <linearGradient id="productivityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
                </div>
              </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <div className="vb-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Distribuição por Prioridade</h3>
            <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
              {totalActivities} atividades
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4">
            {priorityData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Type Distribution */}
        <div className="vb-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Distribuição por Tipo</h3>
            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200">
              {totalActivities} atividades
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4">
            {typeData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities and Team Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="vb-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Atividades Recentes</h3>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
              Últimas 10
            </Badge>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {activities.slice(0, 10).map((activity, index) => (
              <div 
                key={activity.id} 
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onActivityClick(activity.id)}
              >
                <div className={`w-3 h-3 rounded-full ${
                  activity.status === 'completed' ? 'bg-green-500' :
                  activity.status === 'in-progress' ? 'bg-blue-500' :
                  activity.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{getEmployeeName(activity.responsibleId)}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(activity.status)}`}>
                      {activity.status === 'completed' ? 'Concluída' :
                       activity.status === 'in-progress' ? 'Em Andamento' :
                       activity.status === 'pending' ? 'Pendente' : 'Atrasada'}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(activity.priority)}`}>
                      {activity.priority === 'high' ? 'Alta' : activity.priority === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
      </div>
      </div>

      {/* Team Ranking */}
        <div className="vb-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Ranking da Equipe</h3>
            <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Top 5
            </Badge>
          </div>
          <div className="space-y-3">
            {teamRanking.map((member, index) => (
              <div 
                key={member.name} 
                className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                    index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600 text-white' :
                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                    'bg-gradient-to-br from-blue-400 to-blue-600 text-white'
                  }`}>
                    {member.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.total} atividades</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    member.efficiency >= 90 ? 'text-green-600' : 
                    member.efficiency >= 80 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {member.efficiency}%
                  </div>
                  <div className="text-xs text-gray-500">Eficiência</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityDashboardView;
