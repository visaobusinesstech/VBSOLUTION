
import React, { useState } from 'react';
import { Activity } from '@/hooks/useActivities';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal, Search, Zap, Filter, SortAsc, Users, Share, MoreVertical, Flag, Calendar, User, Copy, ExternalLink, Eye, EyeOff, Settings, Archive, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface KanbanBoardProps {
  activities: Activity[];
  employees: any[];
  onActivityClick: (activityId: string) => void;
  onCreateQuickTask: (title: string, status: string) => void;
  onOpenCreateModal: (status?: string) => void;
}

interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  color: string;
  count: number;
  topBorderColor: string;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  activities,
  employees,
  onActivityClick,
  onCreateQuickTask,
  onOpenCreateModal
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('priority');
  const [groupBy, setGroupBy] = useState('status');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showMyTasksOnly, setShowMyTasksOnly] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [selectedResponsible, setSelectedResponsible] = useState<string>('');

  // Definir as colunas do Kanban com cores extremamente discretas como no Pipedrive
  const columns: KanbanColumn[] = [
    { id: 'open', title: 'ABERTO', status: 'pending', color: '#E5E7EB', count: 0, topBorderColor: '#D1D5DB' },
    { id: 'pending', title: 'PENDENTE', status: 'pending', color: '#FEF3C7', count: 0, topBorderColor: '#FCD34D' },
    { id: 'in_progress', title: 'EM PROGRESSO', status: 'in_progress', color: '#E0E7FF', count: 0, topBorderColor: '#A5B4FC' },
    { id: 'review', title: 'REVISÃO', status: 'in_progress', color: '#FCE7F3', count: 0, topBorderColor: '#F9A8D4' },
    { id: 'completed', title: 'CONCLUÍDO', status: 'completed', color: '#D1FAE5', count: 0, topBorderColor: '#6EE7B7' }
  ];

  // Filtrar atividades baseado nos filtros selecionados
  const getFilteredActivities = () => {
    let filtered = activities;

    // Filtro por prioridade
    if (selectedPriority) {
      filtered = filtered.filter(activity => activity.priority === selectedPriority);
    }

    // Filtro por status
    if (selectedStatus) {
      filtered = filtered.filter(activity => activity.status === selectedStatus);
    }

    // Filtro "Me" - apenas tarefas do usuário logado
    if (showMyTasksOnly && user) {
      filtered = filtered.filter(activity => activity.responsible_id === user.id);
    }

    // Filtro por responsável
    if (selectedResponsible) {
      filtered = filtered.filter(activity => activity.responsible_id === selectedResponsible);
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(activity => 
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredActivities = getFilteredActivities();

  // Calcular contagem de atividades por coluna
  const getActivitiesByColumn = (columnStatus: string) => {
    return filteredActivities.filter(activity => {
      if (columnStatus === 'pending') return activity.status === 'pending';
      if (columnStatus === 'in_progress') return activity.status === 'in_progress';
      if (columnStatus === 'completed') return activity.status === 'completed';
      return false;
    });
  };

  // Atualizar contagem das colunas
  React.useEffect(() => {
    updateColumnCounts();
  }, [filteredActivities]);

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-700 border-green-300',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      high: 'bg-orange-100 text-orange-700 border-orange-300',
      urgent: 'bg-red-100 text-red-700 border-red-300'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getPriorityDisplayName = (priority: string) => {
    const names = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      urgent: 'Urgente'
    };
    return names[priority as keyof typeof names] || priority;
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee?.name || 'Não atribuído';
  };

  const getEmployeeAvatar = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee?.avatar || null;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const handleQuickTaskCreate = (status: string) => {
    const title = prompt('Digite o título da tarefa:');
    if (title && title.trim()) {
      onCreateQuickTask(title.trim(), status);
    }
  };

  const handleShare = () => {
    const currentUrl = window.location.href;
    setShareLink(currentUrl);
    setIsShareModalOpen(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast({
        title: "Link copiado!",
        description: "Link do quadro copiado para a área de transferência"
      });
    } catch (err) {
      console.error('Erro ao copiar link:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com filtros e controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Filtros principais */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Busca */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Filtrar por nome da tarefa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          {/* Filtro de Prioridade */}
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro de Status */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="in_progress">Em Progresso</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro de Subtarefas */}
          <Button
            variant={showSubtasks ? "default" : "outline"}
            size="sm"
            onClick={() => setShowSubtasks(!showSubtasks)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Subtarefas
          </Button>

          {/* Filtro de Prioridade */}
          <Select value={selectedResponsible} onValueChange={setSelectedResponsible}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {employees.map(emp => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro "Eu" */}
          <Button
            variant={showMyTasksOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowMyTasksOnly(!showMyTasksOnly)}
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            Eu
          </Button>
        </div>

        {/* Controles da direita */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="flex items-center gap-2"
          >
            <Share className="h-4 w-4" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* Kanban Board - Padding reduzido */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {columns.map((column) => {
          const columnActivities = getActivitiesByColumn(column.status);
          
          return (
            <div key={column.id} className="space-y-4">
              {/* Cabeçalho da coluna */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.topBorderColor }}
                  />
                  <h3 className="font-semibold text-gray-700">{column.title}</h3>
                  <Badge variant="secondary" className="ml-2">
                    {columnActivities.length}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onOpenCreateModal(column.status)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nova tarefa
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Configurações
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Lista de atividades */}
              <div className="space-y-3 min-h-[200px]">
                {columnActivities.map((activity) => (
                  <div
                    key={activity.id}
                    onClick={() => onActivityClick(activity.id)}
                    className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow group"
                  >
                    {/* Cabeçalho da atividade */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm leading-tight mb-1">
                          {activity.title}
                        </h4>
                        {activity.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Abrir
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Tags e prioridade */}
                    <div className="flex items-center gap-2 mb-3">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(activity.priority)}`}
                      >
                        {getPriorityDisplayName(activity.priority)}
                      </Badge>
                      {activity.tags && activity.tags.length > 0 && (
                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">
                          {activity.tags[0]}
                        </Badge>
                      )}
                    </div>

                    {/* Responsável e data */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={getEmployeeAvatar(activity.responsible_id)} />
                          <AvatarFallback className="text-xs">
                            {getEmployeeName(activity.responsible_id).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-500">
                          {getEmployeeName(activity.responsible_id)}
                        </span>
                      </div>
                      {activity.due_date && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {formatDate(activity.due_date)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Botão para adicionar nova tarefa */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenCreateModal(column.status)}
                  className="w-full h-12 border-dashed border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  NOVA TAREFA
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de compartilhamento */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compartilhar Quadro</DialogTitle>
            <DialogDescription>
              Compartilhe este link com sua equipe para colaboração
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={shareLink} readOnly />
              <Button onClick={copyToClipboard} size="sm">
                Copiar
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Qualquer pessoa com este link poderá visualizar o quadro
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KanbanBoard;
