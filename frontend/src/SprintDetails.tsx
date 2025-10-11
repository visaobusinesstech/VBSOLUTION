
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  User, 
  Building2, 
  CheckCircle, 
  Clock, 
  Play, 
  Archive,
  X,
  Target,
  BarChart3
} from 'lucide-react';
import { format } from '@/utils/dateUtils';
import { ptBR } from '@/utils/dateUtils';

interface SprintDetailsProps {
  sprint: any;
  activities: any[];
  companies: any[];
  employees: any[];
  onClose: () => void;
  onActivityClick: (activityId: string) => void;
}

const SprintDetails = ({ 
  sprint, 
  activities, 
  companies, 
  employees, 
  onClose, 
  onActivityClick 
}: SprintDetailsProps) => {
  const getCompanyName = (companyId?: string) => {
    if (!companyId) return 'Sem empresa';
    const company = companies.find(c => c.id === companyId);
    return company?.fantasyName || 'Empresa não encontrada';
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.name || 'Funcionário não encontrado';
  };

  const sprintActivities = activities.filter(activity => 
    sprint.activities?.some((sprintActivity: any) => sprintActivity.id === activity.id) ||
    (sprint.status === 'in-progress' && ['in-progress', 'completed'].includes(activity.status))
  );

  const statusCounts = {
    backlog: sprintActivities.filter(a => a.status === 'backlog').length,
    pending: sprintActivities.filter(a => a.status === 'pending').length,
    'in-progress': sprintActivities.filter(a => a.status === 'in-progress').length,
    completed: sprintActivities.filter(a => a.status === 'completed').length,
    overdue: sprintActivities.filter(a => a.status === 'overdue').length
  };

  const totalTasks = sprintActivities.length;
  const completedTasks = statusCounts.completed;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-green-300 text-green-700 bg-green-50';
      case 'in-progress': return 'border-blue-300 text-blue-700 bg-blue-50';
      case 'pending': return 'border-yellow-300 text-yellow-700 bg-yellow-50';
      case 'overdue': return 'border-red-300 text-red-700 bg-red-50';
      default: return 'border-gray-300 text-gray-700 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in-progress': return <Play className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'overdue': return <Archive className="h-4 w-4" />;
      default: return <Archive className="h-4 w-4" />;
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'in-progress': return 'Em Andamento';
      case 'pending': return 'Pendente';
      case 'overdue': return 'Atrasado';
      default: return 'Backlog';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-300 text-red-700 bg-red-50';
      case 'medium': return 'border-yellow-300 text-yellow-700 bg-yellow-50';
      default: return 'border-green-300 text-green-700 bg-green-50';
    }
  };

  const getPriorityName = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      default: return 'Baixa';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Target className="h-6 w-6 text-blue-600" />
              {sprint.name}
            </h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(sprint.startDate, 'dd/MM/yyyy', { locale: ptBR })} - {' '}
                  {format(sprint.endDate, 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
              {sprint.completedAt && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Finalizada em {format(new Date(sprint.completedAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
                </div>
              )}
            </div>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Sprint Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Progress Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  Progresso Geral
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Concluídas</span>
                    <span className="font-medium">{completedTasks}/{totalTasks}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="text-xs text-gray-500">
                    {progressPercentage.toFixed(0)}% completo
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Distribuição por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    count > 0 && (
                      <div key={status} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status)}
                          <span>{getStatusName(status)}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {count}
                        </Badge>
                      </div>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sprint Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Status da Sprint</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge 
                    variant="outline" 
                    className={`${
                      sprint.status === 'completed' ? 'border-green-300 text-green-700 bg-green-50' :
                      sprint.status === 'in-progress' ? 'border-blue-300 text-blue-700 bg-blue-50' :
                      'border-gray-300 text-gray-700 bg-gray-50'
                    }`}
                  >
                    {sprint.status === 'completed' ? 'Finalizada' :
                     sprint.status === 'in-progress' ? 'Em Andamento' : 'Planejada'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activities List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Atividades da Sprint ({sprintActivities.length})
            </h3>

            {sprintActivities.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Archive className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Nenhuma atividade encontrada para esta sprint.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {sprintActivities.map((activity) => (
                  <Card 
                    key={activity.id}
                    className="cursor-pointer hover:shadow-md transition-shadow bg-white border border-gray-200"
                    onClick={() => onActivityClick(activity.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-gray-900 flex-1 line-clamp-2">
                          {activity.title}
                        </h4>
                        <div className="flex items-center gap-2 ml-3">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(activity.priority)}`}
                          >
                            {getPriorityName(activity.priority)}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStatusColor(activity.status)}`}
                          >
                            {getStatusName(activity.status)}
                          </Badge>
                        </div>
                      </div>

                      {activity.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {activity.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(activity.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{getEmployeeName(activity.responsibleId)}</span>
                          </div>
                          {activity.companyId && (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              <span className="truncate max-w-32">{getCompanyName(activity.companyId)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-medium">
                            {getEmployeeName(activity.responsibleId).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SprintDetails;
