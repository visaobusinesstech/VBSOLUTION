
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users, Target, Calendar, Settings, Edit, UserPlus } from 'lucide-react';

interface WorkGroupDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  workGroup: {
    id: number;
    name: string;
    description: string;
    color: string;
    photo: string;
    sector: string;
    members: Array<{ name: string; initials: string }>;
    tasksCount: number;
    completedTasks: number;
    activeProjects: number;
  } | null;
}

const WorkGroupDetailModal = ({ isOpen, onClose, workGroup }: WorkGroupDetailModalProps) => {
  if (!workGroup) return null;

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const progressPercentage = getProgressPercentage(workGroup.completedTasks, workGroup.tasksCount);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: workGroup.color }}
            >
              {workGroup.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{workGroup.name}</h2>
              <p className="text-gray-600">{workGroup.description}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Informações Principais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Estatísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{workGroup.tasksCount}</div>
                    <div className="text-sm text-gray-600">Tarefas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{workGroup.completedTasks}</div>
                    <div className="text-sm text-gray-600">Concluídas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{workGroup.activeProjects}</div>
                    <div className="text-sm text-gray-600">Projetos Ativos</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progresso */}
            <Card>
              <CardHeader>
                <CardTitle>Progresso das Tarefas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Progresso Geral</span>
                    <span className="font-semibold">{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{workGroup.completedTasks} de {workGroup.tasksCount} tarefas concluídas</span>
                    <span>{workGroup.tasksCount - workGroup.completedTasks} pendentes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Membros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Membros ({workGroup.members.length})
                  </div>
                  <Button size="sm" variant="outline">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Membro
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {workGroup.members.map((member, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-black text-white font-semibold">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-600">Membro</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Painel Lateral */}
          <div className="space-y-6">
            {/* Informações do Grupo */}
            <Card>
              <CardHeader>
                <CardTitle>Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Setor</label>
                  <Badge variant="outline" className="ml-2">
                    {workGroup.sector}
                  </Badge>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Cor do Grupo</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div 
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: workGroup.color }}
                    ></div>
                    <span className="text-sm text-gray-700">{workGroup.color}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Data de Criação</label>
                  <p className="text-sm text-gray-700 mt-1">01/01/2024</p>
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Ações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Grupo
                </Button>
                <Button className="w-full" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Ver Cronograma
                </Button>
                <Button className="w-full" variant="outline">
                  <Target className="h-4 w-4 mr-2" />
                  Gerenciar Tarefas
                </Button>
              </CardContent>
            </Card>

            {/* Atividade Recente */}
            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                    <div>
                      <p className="font-medium">Tarefa concluída</p>
                      <p className="text-gray-600 text-xs">há 2 horas</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    <div>
                      <p className="font-medium">Novo membro adicionado</p>
                      <p className="text-gray-600 text-xs">há 1 dia</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
                    <div>
                      <p className="font-medium">Projeto iniciado</p>
                      <p className="text-gray-600 text-xs">há 3 dias</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkGroupDetailModal;
