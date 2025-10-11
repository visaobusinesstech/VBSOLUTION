
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  Timer,
  Building2,
  TrendingUp,
  Calendar,
  User,
  AlertTriangle
} from 'lucide-react';
import ActivityTable from './ActivityTable';
import ActivityFilters from './ActivityFilters';
import { useState } from 'react';

interface ActivityDashboardProps {
  activities: any[];
  companies: any[];
  employees: any[];
  onActivityClick: (activityId: string) => void;
}

const ActivityDashboard = ({ activities, companies, employees, onActivityClick }: ActivityDashboardProps) => {
  const [filters, setFilters] = useState({
    cargo: '',
    mes: '',
    ano: '',
    semana: '',
    dia: '',
    data: '',
    hora: ''
  });

  const totalActivities = activities.length;
  const completedActivities = activities.filter(a => a.status === 'completed').length;
  const pendingActivities = activities.filter(a => a.status === 'pending' || a.status === 'backlog').length;
  const inProgressActivities = activities.filter(a => a.status === 'in-progress').length;
  const overdueActivities = activities.filter(a => {
    if (a.status === 'completed') return false;
    return new Date(a.date) < new Date();
  }).length;

  // Calcular horas estimadas (placeholder - você pode ajustar conforme necessário)
  const totalHours = activities.length * 2; // 2 horas por atividade como exemplo
  const completedHours = completedActivities * 2;

  const completionRate = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.name || 'Funcionário não encontrado';
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <ActivityFilters filters={filters} onFiltersChange={setFilters} />

      {/* Cards de Estatísticas - Design Quadrado */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-white/90 backdrop-blur-sm border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all duration-200 aspect-square flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-1">
            <div className="space-y-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
              <div className="text-2xl font-bold text-blue-600">{totalActivities}</div>
            </div>
            <CheckSquare className="h-8 w-8 text-blue-600" />
          </CardHeader>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-all duration-200 aspect-square flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-1">
            <div className="space-y-2">
              <CardTitle className="text-sm font-medium text-gray-600">Concluídas</CardTitle>
              <div className="text-2xl font-bold text-green-600">{completedActivities}</div>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </CardHeader>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-l-4 border-l-yellow-500 shadow-sm hover:shadow-md transition-all duration-200 aspect-square flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-1">
            <div className="space-y-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pendentes</CardTitle>
              <div className="text-2xl font-bold text-yellow-600">{pendingActivities}</div>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </CardHeader>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-all duration-200 aspect-square flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-1">
            <div className="space-y-2">
              <CardTitle className="text-sm font-medium text-gray-600">Atrasadas</CardTitle>
              <div className="text-2xl font-bold text-red-600">{overdueActivities}</div>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </CardHeader>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all duration-200 aspect-square flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-1">
            <div className="space-y-2">
              <CardTitle className="text-sm font-medium text-gray-600">Taxa</CardTitle>
              <div className="text-2xl font-bold text-purple-600">{completionRate}%</div>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </CardHeader>
        </Card>
      </div>

      {/* Blocos de Todo List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tarefas Atrasadas */}
        <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm">
          <CardHeader className="border-b border-gray-200/50">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Tarefas Atrasadas
              <Badge className="bg-red-100 text-red-700 ml-auto">{overdueActivities}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              {activities.filter(a => {
                if (a.status === 'completed') return false;
                return new Date(a.date) < new Date();
              }).slice(0, 10).map((activity) => (
                <div 
                  key={activity.id} 
                  className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-red-50/50 transition-colors cursor-pointer"
                  onClick={() => onActivityClick(activity.id)}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-red-600 font-medium">
                          {activity.date.toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-xs text-gray-500">
                          - {getEmployeeName(activity.responsibleId)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {overdueActivities === 0 && (
                <div className="p-6 text-center text-gray-500">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma tarefa atrasada</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tarefas Concluídas */}
        <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm">
          <CardHeader className="border-b border-gray-200/50">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Tarefas Concluídas
              <Badge className="bg-green-100 text-green-700 ml-auto">{completedActivities}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              {activities.filter(a => a.status === 'completed').slice(0, 10).map((activity) => (
                <div 
                  key={activity.id} 
                  className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-green-50/50 transition-colors cursor-pointer"
                  onClick={() => onActivityClick(activity.id)}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-through opacity-75 truncate">
                        {activity.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {activity.date.toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {completedActivities === 0 && (
                <div className="p-6 text-center text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma tarefa concluída ainda</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tarefas Pendentes */}
        <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm">
          <CardHeader className="border-b border-gray-200/50">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Clock className="h-5 w-5 text-yellow-600" />
              Tarefas Pendentes
              <Badge className="bg-yellow-100 text-yellow-700 ml-auto">{pendingActivities}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              {activities.filter(a => a.status === 'pending' || a.status === 'backlog').slice(0, 10).map((activity) => (
                <div 
                  key={activity.id} 
                  className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-yellow-50/50 transition-colors cursor-pointer"
                  onClick={() => onActivityClick(activity.id)}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {activity.date.toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        {activity.priority && (
                          <Badge className={`text-xs px-2 py-0 ${
                            activity.priority === 'high' ? 'bg-red-100 text-red-700' :
                            activity.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {activity.priority === 'high' ? 'Alta' : 
                             activity.priority === 'medium' ? 'Média' : 'Baixa'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {pendingActivities === 0 && (
                <div className="p-6 text-center text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma tarefa pendente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Atividades */}
      <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm">
        <CardHeader className="border-b border-gray-200/50">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Todas as Atividades
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ActivityTable 
            activities={activities}
            companies={companies}
            employees={employees}
            onActivityClick={onActivityClick}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityDashboard;
