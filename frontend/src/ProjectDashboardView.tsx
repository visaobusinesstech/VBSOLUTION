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
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Calendar,
  Activity
} from 'lucide-react';

interface ProjectDashboardViewProps {
  projects: any[];
}

const ProjectDashboardView = ({ projects }: ProjectDashboardViewProps) => {
  // Calculate metrics
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === 'Concluído').length;
  const inProgressProjects = projects.filter(p => p.status === 'Em Andamento').length;
  const plannedProjects = projects.filter(p => p.status === 'Planejado').length;
  const pausedProjects = projects.filter(p => p.status === 'Pausado').length;
  
  const efficiencyRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;
  
  // Projects by status - updated to grayscale
  const statusData = [
    { name: 'Concluído', value: completedProjects, color: '#000000' },
    { name: 'Em Andamento', value: inProgressProjects, color: '#4B5563' },
    { name: 'Planejado', value: plannedProjects, color: '#9CA3AF' },
    { name: 'Pausado', value: pausedProjects, color: '#D1D5DB' }
  ];

  // Projects by department
  const departmentStats = projects.reduce((acc: any, project) => {
    if (project.department) {
      acc[project.department] = (acc[project.department] || 0) + 1;
    }
    return acc;
  }, {});

  const departmentData = Object.entries(departmentStats).map(([dept, count]) => ({
    department: dept,
    projects: count,
    completed: projects.filter(p => p.department === dept && p.status === 'Concluído').length
  }));

  // Projects by work group
  const workGroupStats = projects.reduce((acc: any, project) => {
    if (project.workGroup) {
      acc[project.workGroup] = (acc[project.workGroup] || 0) + 1;
    }
    return acc;
  }, {});

  const workGroupData = Object.entries(workGroupStats).map(([group, count]) => ({
    workGroup: group,
    projects: count,
    efficiency: projects.filter(p => p.workGroup === group).length > 0 
      ? Math.round((projects.filter(p => p.workGroup === group && p.status === 'Concluído').length / 
          projects.filter(p => p.workGroup === group).length) * 100)
      : 0
  }));

  // Timeline data (mock for demonstration)
  const timelineData = [
    { month: 'Jan', created: 4, completed: 2 },
    { month: 'Fev', created: 6, completed: 4 },
    { month: 'Mar', created: 3, completed: 5 },
    { month: 'Abr', created: 8, completed: 3 },
    { month: 'Mai', created: 5, completed: 6 },
    { month: 'Jun', created: 7, completed: 4 },
  ];

  // Deadline analysis
  const currentDate = new Date();
  const overdueProjects = projects.filter(p => 
    p.dueDate && new Date(p.dueDate) < currentDate && p.status !== 'Concluído'
  ).length;
  
  const dueSoonProjects = projects.filter(p => {
    if (!p.dueDate || p.status === 'Concluído') return false;
    const dueDate = new Date(p.dueDate);
    const daysUntilDue = Math.ceil((dueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 7 && daysUntilDue >= 0;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-black">Dashboard de Projetos</h2>
        <p className="text-gray-600 mt-1">Análise completa de desempenho e métricas dos projetos</p>
      </div>

      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-2 border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Total de Projetos</p>
                <p className="text-3xl font-bold text-black">{totalProjects}</p>
                <p className="text-xs text-gray-600 mt-1">Todos os projetos</p>
              </div>
              <div className="p-3 bg-gray-200 rounded-lg">
                <Target className="h-6 w-6 text-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Projetos Concluídos</p>
                <p className="text-3xl font-bold text-black">{completedProjects}</p>
                <p className="text-xs text-gray-600 mt-1">Finalizados com sucesso</p>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Taxa de Eficiência</p>
                <p className="text-3xl font-bold text-black">{efficiencyRate}%</p>
                <p className="text-xs text-gray-600 mt-1">Projetos concluídos</p>
              </div>
              <div className="p-3 bg-gray-600 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Projetos Atrasados</p>
                <p className="text-3xl font-bold text-black">{overdueProjects}</p>
                <p className="text-xs text-gray-600 mt-1">{dueSoonProjects} vencem em 7 dias</p>
              </div>
              <div className="p-3 bg-gray-400 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="bg-white border-2 border-gray-200">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-gray-600" />
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  dataKey="value"
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
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

        {/* Timeline Chart */}
        <Card className="bg-white border-2 border-gray-200">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              Timeline de Projetos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="created" 
                  stackId="1"
                  stroke="#4B5563" 
                  fill="#4B5563"
                  fillOpacity={0.3}
                  name="Criados"
                />
                <Area 
                  type="monotone" 
                  dataKey="completed" 
                  stackId="2"
                  stroke="#000000" 
                  fill="#000000"
                  fillOpacity={0.3}
                  name="Concluídos"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Analysis */}
        <Card className="bg-white border-2 border-gray-200">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-600" />
              Análise por Setor
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="projects" fill="#6B7280" name="Total de Projetos" />
                <Bar dataKey="completed" fill="#000000" name="Concluídos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Work Group Efficiency */}
        <Card className="bg-white border-2 border-gray-200">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-600" />
              Eficiência por Grupo de Trabalho
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workGroupData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="workGroup" />
                <YAxis />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="efficiency" fill="#374151" name="Eficiência %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <Card className="bg-white border-2 border-gray-200">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              Projetos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-64 overflow-y-auto">
            {projects.slice(0, 5).map((project, index) => (
              <div 
                key={project.id} 
                className={`flex items-center gap-3 p-3 hover:bg-gray-50 ${
                  index !== Math.min(4, projects.length - 1) ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="w-2 h-2 bg-gray-500 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">{project.name}</p>
                  <p className="text-xs text-gray-500">{project.responsible}</p>
                </div>
                <Badge className={`text-xs ${getStatusColor(project.status)}`}>
                  {project.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Completed Projects */}
        <Card className="bg-white border-2 border-gray-200">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-gray-500" />
              Projetos Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-64 overflow-y-auto">
            {projects.filter(p => p.status === 'Concluído').slice(0, 5).map((project, index, arr) => (
              <div 
                key={project.id} 
                className={`flex items-center gap-3 p-3 hover:bg-gray-50 ${
                  index !== Math.min(4, arr.length - 1) ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="w-2 h-2 bg-black rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">{project.name}</p>
                  <p className="text-xs text-gray-600">{project.responsible}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Overdue/Due Soon */}
        <Card className="bg-white border-2 border-gray-200">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-gray-500" />
              Atenção Requerida
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-64 overflow-y-auto">
            {projects.filter(p => {
              if (!p.dueDate || p.status === 'Concluído') return false;
              const dueDate = new Date(p.dueDate);
              const daysUntilDue = Math.ceil((dueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
              return daysUntilDue <= 7;
            }).slice(0, 5).map((project, index, arr) => (
              <div 
                key={project.id} 
                className={`flex items-center gap-3 p-3 hover:bg-gray-50 ${
                  index !== Math.min(4, arr.length - 1) ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="w-2 h-2 bg-gray-600 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">{project.name}</p>
                  <p className="text-xs text-gray-600">
                    Prazo: {new Date(project.dueDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  function getStatusColor(status: string): string {
    switch (status) {
      case 'Em Andamento': return 'bg-gray-200 text-gray-800 border-gray-300';
      case 'Concluído': return 'bg-black text-white border-gray-900';
      case 'Pausado': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Planejado': return 'bg-white text-gray-900 border-gray-400';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }
};

export default ProjectDashboardView;
