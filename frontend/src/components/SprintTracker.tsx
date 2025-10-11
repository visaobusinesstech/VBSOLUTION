
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Maximize2, Calendar, Users, Archive, Trash2, MoreVertical } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SprintDetails from './SprintDetails';

interface Sprint {
  id: number;
  name: string;
  status: 'completed' | 'in-progress' | 'planned' | 'archived';
  completedTasks: number;
  totalTasks: number;
  startDate: Date;
  endDate: Date;
  completedAt?: Date;
  activities: any[];
  description?: string;
}

interface SprintTrackerProps {
  onExpandView: () => void;
  activities?: any[];
  companies?: any[];
  employees?: any[];
  onActivityClick?: (activityId: string) => void;
}

const SprintTracker = ({ 
  onExpandView, 
  activities = [], 
  companies = [], 
  employees = [], 
  onActivityClick 
}: SprintTrackerProps) => {
  const [sprints, setSprints] = useState<Sprint[]>([
    { 
      id: 1, 
      name: 'Sprint 1', 
      status: 'completed', 
      completedTasks: 12, 
      totalTasks: 15,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-14'),
      completedAt: new Date('2024-01-14'),
      activities: [],
      description: 'Primeira sprint do projeto'
    },
    { 
      id: 2, 
      name: 'Sprint 2', 
      status: 'completed', 
      completedTasks: 18, 
      totalTasks: 18,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-28'),
      completedAt: new Date('2024-01-28'),
      activities: [],
      description: 'Segunda sprint do projeto'
    },
    { 
      id: 3, 
      name: 'Sprint 3', 
      status: 'in-progress', 
      completedTasks: 8, 
      totalTasks: 14,
      startDate: new Date('2024-01-29'),
      endDate: new Date('2024-02-11'),
      activities: activities.filter(a => a.status === 'in-progress' || a.status === 'completed'),
      description: 'Sprint atual em andamento'
    },
    { 
      id: 4, 
      name: 'Sprint 4', 
      status: 'planned', 
      completedTasks: 0, 
      totalTasks: 16,
      startDate: new Date('2024-02-12'),
      endDate: new Date('2024-02-25'),
      activities: [],
      description: 'Próxima sprint planejada'
    },
  ]);

  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [showSprintDetails, setShowSprintDetails] = useState(false);

  // Load saved sprints on component mount
  useEffect(() => {
    const savedSprints = localStorage.getItem('sprintHistory');
    if (savedSprints) {
      try {
        const parsedSprints = JSON.parse(savedSprints);
        setSprints(parsedSprints.map((sprint: any) => ({
          ...sprint,
          startDate: new Date(sprint.startDate),
          endDate: new Date(sprint.endDate),
          completedAt: sprint.completedAt ? new Date(sprint.completedAt) : undefined
        })));
      } catch (error) {
        console.error('Erro ao carregar sprints:', error);
      }
    }
  }, []);

  // Save sprints to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('sprintHistory', JSON.stringify(sprints));
  }, [sprints]);

  // Update active sprint with current activities
  useEffect(() => {
    const activeSprint = sprints.find(s => s.status === 'in-progress');
    if (activeSprint && activities.length > 0) {
      const sprintActivities = activities.filter(a => 
        a.status === 'in-progress' || a.status === 'completed' || a.status === 'pending'
      );
      
      setSprints(prevSprints => 
        prevSprints.map(sprint => 
          sprint.id === activeSprint.id 
            ? { 
                ...sprint, 
                activities: sprintActivities,
                totalTasks: sprintActivities.length,
                completedTasks: sprintActivities.filter(a => a.status === 'completed').length
              }
            : sprint
        )
      );
    }
  }, [activities]);

  const completedSprints = sprints.filter(s => s.status === 'completed').length;
  const totalSprints = sprints.filter(s => s.status !== 'archived').length;
  const activeSprint = sprints.find(s => s.status === 'in-progress');

  const handleCompleteSprint = (sprintId: number) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return;

    // Get all current activities for this sprint
    const sprintActivities = activities.filter(a => 
      a.status === 'in-progress' || a.status === 'completed' || a.status === 'pending'
    );

    const completedSprint: Sprint = {
      ...sprint,
      status: 'completed',
      completedAt: new Date(),
      activities: sprintActivities,
      totalTasks: sprintActivities.length,
      completedTasks: sprintActivities.filter(a => a.status === 'completed').length
    };

    setSprints(prevSprints => 
      prevSprints.map(s => 
        s.id === sprintId ? completedSprint : s
      )
    );

    // Save detailed sprint information
    const completedSprintInfo = {
      ...completedSprint,
      completedAt: new Date().toISOString(),
      summary: {
        totalActivities: sprintActivities.length,
        completedActivities: sprintActivities.filter(a => a.status === 'completed').length,
        pendingActivities: sprintActivities.filter(a => a.status === 'pending').length,
        inProgressActivities: sprintActivities.filter(a => a.status === 'in-progress').length,
        activitiesByEmployee: employees.reduce((acc: any, emp: any) => ({
          ...acc,
          [emp.name]: sprintActivities.filter(a => a.responsibleId === emp.id).length
        }), {}),
        activitiesByCompany: companies.reduce((acc: any, comp: any) => ({
          ...acc,
          [comp.fantasyName]: sprintActivities.filter(a => a.companyId === comp.id).length
        }), {})
      }
    };
    
    const sprintHistory = JSON.parse(localStorage.getItem('completedSprintsDetailed') || '[]');
    sprintHistory.push(completedSprintInfo);
    localStorage.setItem('completedSprintsDetailed', JSON.stringify(sprintHistory));

    toast({
      title: "Sprint finalizada com sucesso",
      description: `Sprint "${sprint.name}" foi concluída com ${sprintActivities.length} atividades salvas para revisão.`,
    });
  };

  const handleStartSprint = (sprintId: number) => {
    // End current active sprint if any
    setSprints(prevSprints => 
      prevSprints.map(sprint => {
        if (sprint.status === 'in-progress') {
          return { 
            ...sprint, 
            status: 'completed', 
            completedAt: new Date(),
            activities: activities.filter(a => a.status === 'completed')
          };
        }
        if (sprint.id === sprintId) {
          return { 
            ...sprint, 
            status: 'in-progress',
            activities: activities.filter(a => a.status !== 'completed')
          };
        }
        return sprint;
      })
    );

    const sprintName = sprints.find(s => s.id === sprintId)?.name || 'Sprint';
    toast({
      title: "Sprint iniciada",
      description: `${sprintName} foi iniciada com sucesso.`,
    });
  };

  const handleDeleteSprint = (sprintId: number) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return;

    if (sprint.status === 'in-progress') {
      toast({
        title: "Não é possível excluir",
        description: "Não é possível excluir uma sprint em andamento. Finalize ou arquive primeiro.",
        variant: "destructive"
      });
      return;
    }

    setSprints(prevSprints => prevSprints.filter(s => s.id !== sprintId));
    toast({
      title: "Sprint excluída",
      description: `Sprint "${sprint.name}" foi excluída permanentemente.`,
    });
  };

  const handleArchiveSprint = (sprintId: number) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return;

    if (sprint.status === 'in-progress') {
      toast({
        title: "Não é possível arquivar",
        description: "Não é possível arquivar uma sprint em andamento. Finalize primeiro.",
        variant: "destructive"
      });
      return;
    }

    setSprints(prevSprints => 
      prevSprints.map(s => 
        s.id === sprintId 
          ? { ...s, status: 'archived' as const }
          : s
      )
    );
    
    toast({
      title: "Sprint arquivada",
      description: `Sprint "${sprint.name}" foi arquivada com sucesso.`,
    });
  };

  const handleSprintClick = (sprint: Sprint) => {
    setSelectedSprint(sprint);
    setShowSprintDetails(true);
  };

  const handleCloseSprintDetails = () => {
    setShowSprintDetails(false);
    setSelectedSprint(null);
  };

  return (
    <>
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Acompanhamento de Sprints</h3>
            <p className="text-sm text-gray-600">
              {completedSprints} de {totalSprints} sprints finalizados
              {activeSprint && (
                <span className="ml-2 text-gray-500">
                  • Sprint ativa: {activeSprint.name} ({activeSprint.completedTasks}/{activeSprint.totalTasks} concluídas)
                </span>
              )}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onExpandView}
            className="flex items-center gap-2 border-gray-200"
          >
            <Maximize2 className="h-4 w-4" />
            Expandir Visualização
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {sprints.filter(s => s.status !== 'archived').map((sprint) => (
            <Card 
              key={sprint.id} 
              className="bg-white border border-gray-100 transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1 cursor-pointer relative group"
              onClick={() => handleSprintClick(sprint)}
            >
              {/* Sprint Actions Dropdown */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 bg-white/80 hover:bg-white shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchiveSprint(sprint.id);
                      }}
                      className="text-xs"
                      disabled={sprint.status === 'in-progress'}
                    >
                      <Archive className="h-3 w-3 mr-2" />
                      Arquivar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSprint(sprint.id);
                      }}
                      className="text-xs text-red-600 focus:text-red-600"
                      disabled={sprint.status === 'in-progress'}
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{sprint.name}</h4>
                  {sprint.status === 'completed' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : sprint.status === 'in-progress' ? (
                    <Clock className="h-4 w-4 text-blue-600" />
                  ) : (
                    <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Progresso</span>
                    <span>{sprint.completedTasks}/{sprint.totalTasks}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        sprint.status === 'completed' ? 'bg-green-500' :
                        sprint.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                      style={{ width: `${sprint.totalTasks > 0 ? (sprint.completedTasks / sprint.totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                  
                  {/* Dates */}
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {sprint.startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {' '}
                      {sprint.endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>

                  {/* Activities count */}
                  {sprint.activities.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Users className="h-3 w-3" />
                      <span>{sprint.activities.length} atividades</span>
                    </div>
                  )}

                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      sprint.status === 'completed' ? 'border-green-200 text-green-700 bg-green-50' :
                      sprint.status === 'in-progress' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                      'border-gray-200 text-gray-700 bg-gray-50'
                    }`}
                  >
                    {sprint.status === 'completed' ? 'Finalizada' :
                     sprint.status === 'in-progress' ? 'Em Andamento' : 'Planejada'}
                  </Badge>

                  {/* Action Buttons */}
                  <div className="flex gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
                    {sprint.status === 'in-progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCompleteSprint(sprint.id)}
                        className="text-xs h-6 px-2 bg-white border-green-200 text-green-600 hover:bg-green-50"
                      >
                        Finalizar Sprint
                      </Button>
                    )}
                    {sprint.status === 'planned' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartSprint(sprint.id)}
                        className="text-xs h-6 px-2 bg-white border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        Iniciar Sprint
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Sprint Details Modal */}
      {showSprintDetails && selectedSprint && (
        <SprintDetails
          sprint={selectedSprint}
          activities={selectedSprint.activities}
          companies={companies}
          employees={employees}
          onClose={handleCloseSprintDetails}
          onActivityClick={onActivityClick || (() => {})}
        />
      )}
    </>
  );
};

export default SprintTracker;
