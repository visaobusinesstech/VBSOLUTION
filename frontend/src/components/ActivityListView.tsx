
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Settings, 
  Clock, 
  User, 
  Building2,
  Calendar,
  ArrowUpDown,
  Trash2,
  Plus
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ColumnSelector from './ColumnSelector';

interface ActivityListViewProps {
  activities: any[];
  companies: any[];
  employees: any[];
  onActivityClick: (activityId: string) => void;
  onUpdateStatus: (activityId: string, newStatus: string) => void;
  onDeleteActivities: (activityIds: string[]) => void;
  searchTerm: string;
}

const ActivityListView = ({
  activities,
  companies,
  employees,
  onActivityClick,
  onUpdateStatus,
  onDeleteActivities,
  searchTerm
}: ActivityListViewProps) => {
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'nome', 'atividade', 'prazo-final', 'criado-por', 'responsavel', 'projeto', 'marcadores'
  ]);

  const getCompanyName = (companyId?: string) => {
    if (!companyId) return 'Sem empresa';
    const company = companies.find(c => c.id === companyId);
    return company?.fantasyName || 'Empresa não encontrada';
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.name || 'Funcionário não encontrado';
  };

  const filteredActivities = activities.filter(activity =>
    activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectActivity = (activityId: string) => {
    setSelectedActivities(prev => 
      prev.includes(activityId) 
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  const handleSelectAll = () => {
    if (selectedActivities.length === filteredActivities.length) {
      setSelectedActivities([]);
    } else {
      setSelectedActivities(filteredActivities.map(a => a.id));
    }
  };

  const handleIncludeActivity = () => {
    if (selectedActivities.length === 0) {
      toast({
        title: "Nenhuma atividade selecionada",
        description: "Selecione pelo menos uma atividade para incluir.",
        variant: "destructive"
      });
      return;
    }

    // Move selected activities to pending status
    selectedActivities.forEach(activityId => {
      const activity = activities.find(a => a.id === activityId);
      if (activity && activity.status === 'cancelled') {
        onUpdateStatus(activityId, 'pending');
      }
    });

    setSelectedActivities([]);
    toast({
      title: "Atividades incluídas",
      description: `${selectedActivities.length} atividade(s) foram incluídas no fluxo de trabalho.`
    });
  };

  const handleExcludeActivity = () => {
    if (selectedActivities.length === 0) {
      toast({
        title: "Nenhuma atividade selecionada",
        description: "Selecione pelo menos uma atividade para excluir.",
        variant: "destructive"
      });
      return;
    }

    onDeleteActivities(selectedActivities);
    setSelectedActivities([]);
    toast({
      title: "Atividades excluídas",
      description: `${selectedActivities.length} atividade(s) foram excluídas com sucesso.`
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'in_progress': return 'Em Andamento';
      case 'cancelled': return 'Cancelada';
      case 'pending': return 'Pendente';
      default: return 'Pendente';
    }
  };

  const getColumnHeader = (columnId: string) => {
    const headers: { [key: string]: string } = {
      'id': 'ID',
      'nome': 'Nome',
      'atividade': 'Atividade',
      'prazo-final': 'Prazo final',
      'criado-por': 'Criado por',
      'responsavel': 'Responsável',
      'status': 'Status',
      'projeto': 'Projeto',
      'fluxo': 'Fluxo',
      'criado-em': 'Criado em',
      'modificado-em': 'Modificado em',
      'fechado-em': 'Fechado em',
      'tempo-necessario': 'Tempo necessário',
      'controlar-tempo': 'Controlar tempo',
      'avaliacao': 'Avaliação',
      'responsavel-alterar': 'Resp. alterar prazo',
      'duracao-efetiva': 'Duração efetiva',
      'concluida': 'Concluída',
      'marcadores': 'Marcadores',
      'lead': 'Lead',
      'contato': 'Contato',
      'empresa': 'Empresa',
      'negocio': 'Negócio',
      'itens-crm': 'Itens de CRM'
    };
    return headers[columnId] || columnId;
  };

  const renderCellContent = (activity: any, columnId: string) => {
    switch (columnId) {
      case 'id':
        return <span className="text-sm text-gray-600">{activity.id.slice(0, 8)}...</span>;
      case 'nome':
        return (
          <div className="flex items-center gap-2">
            <div className="font-medium text-gray-900">{activity.title}</div>
          </div>
        );
      case 'atividade':
        return (
          <div className="flex items-center gap-2">
            <Badge className={`text-xs border ${getStatusColor(activity.status)}`}>
              {getStatusLabel(activity.status)}
            </Badge>
            <span className="text-sm text-gray-600">
              {activity.type === 'task' ? 'Tarefa' :
               activity.type === 'meeting' ? 'Reunião' :
               activity.type === 'call' ? 'Chamada' :
               activity.type === 'email' ? 'Email' :
               activity.type === 'other' ? 'Outro' : activity.type}
            </span>
          </div>
        );
      case 'prazo-final':
        return (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>
              {activity.due_date 
                ? new Date(activity.due_date).toLocaleDateString('pt-BR')
                : 'Sem prazo'
              }
            </span>
          </div>
        );
      case 'criado-por':
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-medium">
                {activity.createdBy ? activity.createdBy.charAt(0).toUpperCase() : 'A'}
              </span>
            </div>
            <span className="text-sm text-gray-700">Admin</span>
          </div>
        );
      case 'responsavel':
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-medium">
                {getEmployeeName(activity.responsible_id || activity.assigned_to).charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-gray-700">
              {getEmployeeName(activity.responsible_id || activity.assigned_to)}
            </span>
          </div>
        );
      case 'projeto':
        return (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {activity.project_id ? `Projeto ${activity.project_id.slice(0, 8)}...` : 'Sem projeto'}
            </span>
          </div>
        );
      case 'marcadores':
        return (
          <div className="flex gap-1">
            <Badge className={`text-xs border ${getPriorityColor(activity.priority)}`}>
              {activity.priority === 'high' ? 'Alta' : 
               activity.priority === 'medium' ? 'Média' : 
               activity.priority === 'urgent' ? 'Urgente' : 'Baixa'}
            </Badge>
          </div>
        );
      case 'criado-em':
        return <span className="text-sm text-gray-600">
          {activity.created_at 
            ? new Date(activity.created_at).toLocaleDateString('pt-BR')
            : '-'
          }
        </span>;
      case 'modificado-em':
        return <span className="text-sm text-gray-600">
          {activity.updated_at 
            ? new Date(activity.updated_at).toLocaleDateString('pt-BR')
            : '-'
          }
        </span>;
      case 'concluida':
        return (
          <Checkbox 
            checked={activity.status === 'completed'}
            disabled={true}
            className="h-4 w-4"
          />
        );
      default:
        return <span className="text-sm text-gray-600">-</span>;
    }
  };

  if (filteredActivities.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg min-h-[500px]">
        {/* Header da Tabela */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex items-center px-6 py-3">
            <div className="flex items-center gap-3">
              <Checkbox 
                checked={false}
                className="h-4 w-4"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-600 hover:text-gray-700 rounded-md"
                onClick={handleIncludeActivity}
                title="Incluir atividades selecionadas"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-600 hover:text-gray-700 rounded-md"
                onClick={handleExcludeActivity}
                title="Excluir atividades selecionadas"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-600 hover:border-gray-300 rounded-md"
                onClick={() => setShowColumnSelector(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 grid grid-cols-7 gap-4 ml-4">
              {selectedColumns.map((columnId) => (
                <div key={columnId} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <span>{getColumnHeader(columnId)}</span>
                  <ArrowUpDown className="h-3 w-3 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="text-center py-24">
          <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-3xl text-gray-400">×</span>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Criar uma tarefa</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Esta visualização mostrará as tarefas pelas quais você e/ou seus colaboradores são responsáveis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Bulk Actions */}
      {selectedActivities.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700 font-medium">
              {selectedActivities.length} atividade(s) selecionada(s)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleIncludeActivity}
                className="text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              >
                <Plus className="h-4 w-4 mr-1" />
                Incluir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExcludeActivity}
                className="text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header da Tabela */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex items-center px-6 py-3">
          <div className="flex items-center gap-3">
            <Checkbox 
              checked={selectedActivities.length === filteredActivities.length}
              onCheckedChange={handleSelectAll}
              className="h-4 w-4"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-600 hover:text-gray-700 rounded-md"
              onClick={handleIncludeActivity}
              title="Incluir atividades selecionadas"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-600 hover:text-gray-700 rounded-md"
              onClick={handleExcludeActivity}
              title="Excluir atividades selecionadas"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-600 hover:border-gray-300 rounded-md"
              onClick={() => setShowColumnSelector(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 grid grid-cols-7 gap-4 ml-4">
            {selectedColumns.map((columnId) => (
              <div key={columnId} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <span>{getColumnHeader(columnId)}</span>
                <ArrowUpDown className="h-3 w-3 text-gray-400 cursor-pointer" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Atividades */}
      <div className="divide-y divide-gray-100">
        {filteredActivities.map((activity) => (
          <div 
            key={activity.id} 
            className={`flex items-center px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer ${
              selectedActivities.includes(activity.id) ? 'bg-blue-50' : ''
            }`}
            onClick={() => onActivityClick(activity.id)}
          >
            <div className="flex items-center gap-3">
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox 
                  checked={selectedActivities.includes(activity.id)}
                  onCheckedChange={() => handleSelectActivity(activity.id)}
                  className="h-4 w-4"
                />
              </div>
              <div className="w-12"> {/* Espaço para botões de ação */} </div>
            </div>
            <div className="flex-1 grid grid-cols-7 gap-4 ml-4">
              {selectedColumns.map((columnId) => (
                <div key={columnId} className="min-w-0">
                  {renderCellContent(activity, columnId)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ColumnSelector
        open={showColumnSelector}
        onOpenChange={setShowColumnSelector}
        selectedColumns={selectedColumns}
        onColumnsChange={setSelectedColumns}
      />
    </div>
  );
};

export default ActivityListView;
