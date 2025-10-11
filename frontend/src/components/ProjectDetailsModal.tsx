
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProject, Project } from '@/contexts/ProjectContext';
import { useVB } from '@/contexts/VBContext';
import { ArrowLeft, Calendar, User, Building2, CheckCircle2 } from 'lucide-react';

interface ProjectDetailsModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProjectDetailsModal = ({ project, isOpen, onClose }: ProjectDetailsModalProps) => {
  const { state: projectState } = useProject();
  const { state } = useVB();
  const { activities, employees, companies } = state;
  const [statusFilter, setStatusFilter] = useState<string>('all');

  if (!project) return null;

  // Filtrar tarefas do projeto
  const projectTasks = activities.filter(activity => 
    project.tasks?.includes(activity.id) || activity.projectId === project.id
  );

  const getFilteredTasks = () => {
    if (statusFilter === 'all') return projectTasks;
    
    const statusMap = {
      'finalizado': 'completed',
      'pendente': 'pending',
      'atrasado': 'overdue',
      'andamento': 'in-progress'
    };
    
    return projectTasks.filter(task => task.status === statusMap[statusFilter as keyof typeof statusMap]);
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.name || 'Não definido';
  };

  const getCompanyName = (companyId?: string) => {
    if (!companyId) return 'Sem empresa';
    const company = companies.find(c => c.id === companyId);
    return company?.fantasyName || 'Empresa não encontrada';
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'completed': { label: 'Finalizado', color: 'bg-green-100 text-green-800' },
      'pending': { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      'overdue': { label: 'Atrasado', color: 'bg-red-100 text-red-800' },
      'in-progress': { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' },
      'backlog': { label: 'Backlog', color: 'bg-gray-100 text-gray-800' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.backlog;
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  const filteredTasks = getFilteredTasks();

  const statusFilters = [
    { key: 'all', label: 'Todas' },
    { key: 'finalizado', label: 'Finalizadas' },
    { key: 'andamento', label: 'Em Andamento' },
    { key: 'pendente', label: 'Pendentes' },
    { key: 'atrasado', label: 'Atrasadas' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle className="text-xl">{project.name}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do projeto */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Status</div>
              <Badge className={project.status === 'Concluído' ? 'bg-green-100 text-green-800' : 
                              project.status === 'Em Andamento' ? 'bg-blue-100 text-blue-800' :
                              project.status === 'Pausado' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'}>
                {project.status}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Responsável</div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{project.responsible}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Prazo</div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {project.dueDate ? new Date(project.dueDate).toLocaleDateString('pt-BR') : 'Não definido'}
                </span>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Descrição</div>
            <p className="text-sm text-gray-600">{project.description}</p>
          </div>

          {/* Filtros de status das tarefas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Tarefas do Projeto ({filteredTasks.length})</h3>
              <div className="flex gap-2">
                {statusFilters.map(filter => (
                  <Button
                    key={filter.key}
                    variant={statusFilter === filter.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(filter.key)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Lista de tarefas */}
            <div className="space-y-3">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma tarefa encontrada para este filtro.</p>
                </div>
              ) : (
                filteredTasks.map(task => (
                  <Card key={task.id} className="border border-gray-200">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{task.title}</CardTitle>
                        {getStatusBadge(task.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {task.description && (
                        <p className="text-sm text-gray-600">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          <span>{getEmployeeName(task.responsibleId)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>{task.date.toLocaleDateString('pt-BR')}</span>
                        </div>
                        {task.companyId && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3 w-3" />
                            <span>{getCompanyName(task.companyId)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailsModal;
