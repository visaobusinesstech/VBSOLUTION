
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Clock, AlertTriangle, User, Building2, Calendar, Trash2, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ActivityFilters from './ActivityFilters';

interface TodoListProps {
  activities: any[];
  onUpdateStatus: (activityId: string, newStatus: string) => void;
  onActivityClick: (activityId: string) => void;
}

const TodoList = ({ activities, onUpdateStatus, onActivityClick }: TodoListProps) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [filters, setFilters] = useState({
    cargo: '',
    mes: '',
    ano: '',
    semana: '',
    dia: '',
    data: '',
    hora: ''
  });

  const getFilteredActivities = () => {
    let filtered = activities;

    // Filtro por status
    switch (statusFilter) {
      case 'pending':
        filtered = filtered.filter(a => a.status === 'pending' || a.status === 'backlog');
        break;
      case 'in-progress':
        filtered = filtered.filter(a => a.status === 'in-progress');
        break;
      case 'overdue':
        filtered = filtered.filter(a => new Date(a.date) < new Date() && a.status !== 'completed');
        break;
      case 'completed':
        filtered = filtered.filter(a => a.status === 'completed');
        break;
    }

    // Filtro por prioridade
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(a => a.priority === priorityFilter);
    }

    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const filteredActivities = getFilteredActivities();

  const isOverdue = (activity: any) => {
    return new Date(activity.date) < new Date() && activity.status !== 'completed';
  };

  const handleStatusChange = (activityId: string, isCompleted: boolean) => {
    const newStatus = isCompleted ? 'completed' : 'pending';
    onUpdateStatus(activityId, newStatus);
  };

  const handleDelete = (activityId: string) => {
    // Implementar lógica de exclusão
    toast({
      title: "Atividade excluída",
      description: "A atividade foi removida com sucesso.",
    });
  };

  const getStatusIcon = (activity: any) => {
    if (activity.status === 'completed') {
      return <CheckCircle2 className="h-4 w-4 text-gray-600" />;
    }
    if (isOverdue(activity)) {
      return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
    if (activity.status === 'in-progress') {
      return <Clock className="h-4 w-4 text-gray-600" />;
    }
    return <Clock className="h-4 w-4 text-gray-600" />;
  };

  const getStatusColor = (activity: any) => {
    if (activity.status === 'completed') return 'bg-gray-50 text-gray-700 border-gray-200';
    if (isOverdue(activity)) return 'bg-gray-50 text-gray-700 border-gray-200';
    if (activity.status === 'in-progress') return 'bg-gray-50 text-gray-700 border-gray-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const filterButtons = [
    { key: 'all', label: 'Todas', color: 'bg-gray-50 text-gray-700 border-gray-200' },
    { key: 'pending', label: 'Pendentes', color: 'bg-gray-50 text-gray-700 border-gray-200' },
    { key: 'in-progress', label: 'Em Andamento', color: 'bg-gray-50 text-gray-700 border-gray-200' },
    { key: 'overdue', label: 'Atrasadas', color: 'bg-gray-50 text-gray-700 border-gray-200' },
    { key: 'completed', label: 'Concluídas', color: 'bg-gray-50 text-gray-700 border-gray-200' }
  ];

  const priorityButtons = [
    { key: 'all', label: 'Todas', color: 'bg-gray-50 text-gray-700 border-gray-200' },
    { key: 'high', label: 'Alta', color: 'bg-gray-50 text-gray-700 border-gray-200' },
    { key: 'medium', label: 'Média', color: 'bg-gray-50 text-gray-700 border-gray-200' },
    { key: 'low', label: 'Baixa', color: 'bg-gray-50 text-gray-700 border-gray-200' }
  ];

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <ActivityFilters filters={filters} onFiltersChange={setFilters} />

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Todo List Profissional</h2>
            <p className="text-gray-600 mt-1">Gerencie suas atividades de forma organizada e eficiente</p>
          </div>

          {/* Filtros por Status */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Filter className="h-4 w-4 text-black" />
              Filtrar por Status:
            </div>
            <div className="flex flex-wrap gap-2">
              {filterButtons.map((button) => (
                <Button
                  key={button.key}
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusFilter(button.key)}
                  className={`border-2 transition-all duration-200 hover:scale-105 ${
                    statusFilter === button.key 
                      ? `${button.color} shadow-sm` 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {button.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Filtros por Prioridade */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <AlertTriangle className="h-4 w-4 text-black" />
              Filtrar por Prioridade:
            </div>
            <div className="flex flex-wrap gap-2">
              {priorityButtons.map((button) => (
                <Button
                  key={button.key}
                  variant="outline"
                  size="sm"
                  onClick={() => setPriorityFilter(button.key)}
                  className={`border-2 transition-all duration-200 hover:scale-105 ${
                    priorityFilter === button.key 
                      ? `${button.color} shadow-sm` 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {button.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Atividades */}
      <div className="space-y-3">
        {filteredActivities.map((activity) => (
          <Card key={activity.id} className={`bg-white/95 backdrop-blur-sm border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
            activity.status === 'completed' ? 'opacity-75' : ''
          }`}>
            <CardContent className="p-6" onClick={() => onActivityClick(activity.id)}>
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <div className="flex items-center pt-1" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={activity.status === 'completed'}
                    onCheckedChange={(checked) => handleStatusChange(activity.id, checked as boolean)}
                    className="h-5 w-5"
                  />
                </div>

                {/* Conteúdo Principal */}
                <div className="flex-1 space-y-3">
                  {/* Título e Status */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`font-semibold text-lg ${
                        activity.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                      }`}>
                        {activity.title}
                      </h3>
                      {activity.description && (
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {getStatusIcon(activity)}
                      <Badge className={`text-xs font-medium ${getStatusColor(activity)}`}>
                        {activity.status === 'completed' ? 'Concluída' :
                         isOverdue(activity) ? 'Atrasada' :
                         activity.status === 'in-progress' ? 'Em Andamento' : 'Pendente'}
                      </Badge>
                      <Badge className={`text-xs font-medium ${getPriorityColor(activity.priority)}`}>
                        {activity.priority === 'high' ? 'Alta' : 
                         activity.priority === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                    </div>
                  </div>

                  {/* Informações Detalhadas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4 text-black" />
                      <div>
                        <span className="font-medium">Data:</span>
                        <span className="ml-1">
                          {activity.date.toLocaleDateString('pt-BR')} às {activity.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    
                    {activity.responsibleId && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="h-4 w-4 text-black" />
                        <div>
                          <span className="font-medium">Responsável:</span>
                          <span className="ml-1">{activity.responsibleId}</span>
                        </div>
                      </div>
                    )}
                    
                    {activity.companyId && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="h-4 w-4 text-black" />
                        <div>
                          <span className="font-medium">Empresa:</span>
                          <span className="ml-1">Associada</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tipo de Atividade */}
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Tipo:</span>
                    <span className="ml-1">{activity.type || 'Geral'}</span>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
                    {activity.status !== 'completed' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUpdateStatus(activity.id, 'in-progress')}
                          disabled={activity.status === 'in-progress'}
                          className="bg-white border-gray-200 hover:bg-gray-50"
                        >
                          {activity.status === 'in-progress' ? 'Em Andamento' : 'Iniciar'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onUpdateStatus(activity.id, 'completed')}
                          className="bg-gray-800 hover:bg-gray-700 text-white"
                        >
                          Concluir
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(activity.id)}
                      className="bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredActivities.length === 0 && (
          <Card className="bg-white/95 backdrop-blur-sm border border-gray-100 shadow-sm">
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma atividade encontrada</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {statusFilter === 'all' ? 'Não há atividades cadastradas no momento.' :
                 statusFilter === 'completed' ? 'Não há atividades concluídas.' :
                 statusFilter === 'overdue' ? 'Não há atividades atrasadas.' :
                 statusFilter === 'in-progress' ? 'Não há atividades em andamento.' :
                 'Não há atividades pendentes.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TodoList;
