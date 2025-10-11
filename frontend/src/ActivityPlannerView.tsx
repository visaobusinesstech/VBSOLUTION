import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useVB } from '@/contexts/VBContext';
import SprintTracker from './SprintTracker';
import KanbanBoard from '@/components/ui/kanban-board';
import { 
  Plus, 
  RotateCcw,
  Clock,
  User,
  Building2,
  CheckCircle,
  Play,
  Archive,
  Calendar,
  Settings,
  MoreVertical,
  X,
  Minimize2
} from 'lucide-react';

interface ActivityPlannerViewProps {
  activities: any[];
  companies: any[];
  employees: any[];
  onActivityClick: (activityId: string) => void;
  onUpdateStatus: (activityId: string, newStatus: string) => void;
  onActivityEdit?: (activityId: string) => void;
  onActivityDelete?: (activityId: string) => void;
}

const ActivityPlannerView = ({
  activities,
  companies,
  employees,
  onActivityClick,
  onUpdateStatus,
  onActivityEdit,
  onActivityDelete
}: ActivityPlannerViewProps) => {
  const { state } = useVB();
  const { currentUser } = state;
  const [isExpanded, setIsExpanded] = useState(false);

  const getCompanyName = (companyId?: string) => {
    if (!companyId) return 'Sem empresa';
    const company = companies.find(c => c.id === companyId);
    return company?.fantasyName || 'Empresa não encontrada';
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.name || 'Funcionário não encontrado';
  };

  // Convert activities to Kanban format
  const convertActivityToTask = (activity: any) => ({
    id: activity.id,
    title: activity.title,
    description: activity.description,
    priority: activity.priority,
    assignee: {
      name: getEmployeeName(activity.responsibleId),
      avatar: undefined // You can add avatar logic here
    },
    tags: [
      activity.type === 'task' ? 'Tarefa' : 
      activity.type === 'meeting' ? 'Reunião' : 
      activity.type === 'call' ? 'Ligação' : 'Outro',
      activity.companyId ? getCompanyName(activity.companyId) : undefined
    ].filter(Boolean) as string[],
    dueDate: activity.date,
    attachments: 0, // You can add attachment logic here
    comments: 0, // You can add comment logic here
    status: activity.status,
    type: activity.type
  });

  const kanbanColumns = [
    {
      id: 'backlog',
      title: 'Backlog',
      color: '#6b7280',
      tasks: activities.filter(a => a.status === 'backlog').map(convertActivityToTask)
    },
    {
      id: 'pending',
      title: 'A Fazer',
      color: '#3b82f6',
      tasks: activities.filter(a => a.status === 'pending').map(convertActivityToTask)
    },
    {
      id: 'in-progress',
      title: 'Em Andamento',
      color: '#eab308',
      tasks: activities.filter(a => a.status === 'in-progress').map(convertActivityToTask)
    },
    {
      id: 'completed',
      title: 'Finalizado',
      color: '#10b981',
      tasks: activities.filter(a => a.status === 'completed').map(convertActivityToTask)
    }
  ];

  const handleTaskMove = (taskId: string, fromColumn: string, toColumn: string) => {
    onUpdateStatus(taskId, toColumn);
  };

  const handleTaskClick = (taskId: string) => {
    onActivityClick(taskId);
  };

  const handleAddTask = (columnId: string) => {
    // This would open the create task modal
    console.log('Add task to column:', columnId);
  };

  const handleEndSprint = () => {
    // Get all current activities to save with the sprint
    const sprintActivities = activities.filter(a => 
      a.status === 'in-progress' || a.status === 'completed'
    );

    // Find active sprint tracker component and end it
    const sprintTrackerComponent = document.querySelector('[data-sprint-tracker]');
    if (sprintTrackerComponent) {
      // This would trigger the sprint completion in the SprintTracker
      // For now, we'll use localStorage to communicate
      const sprintData = {
        id: Date.now(),
        name: `Sprint ${new Date().toLocaleDateString('pt-BR')}`,
        activities: sprintActivities,
        completedAt: new Date().toISOString(),
        totalTasks: sprintActivities.length,
        completedTasks: sprintActivities.filter(a => a.status === 'completed').length
      };

      const existingSprints = JSON.parse(localStorage.getItem('completedSprints') || '[]');
      existingSprints.push(sprintData);
      localStorage.setItem('completedSprints', JSON.stringify(existingSprints));
    }
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-3xl text-gray-400">×</span>
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Criar uma tarefa</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Esta visualização mostrará as tarefas no formato Scrum Board
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sprint Tracker */}
      <div data-sprint-tracker>
        <SprintTracker 
          onExpandView={() => setIsExpanded(!isExpanded)}
          activities={activities}
          companies={companies}
          employees={employees}
          onActivityClick={onActivityClick}
        />
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Planejador Scrum</h2>
          <p className="text-gray-600 mt-1">Gerencie o fluxo de trabalho da equipe</p>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded && (
            <Button 
              onClick={() => setIsExpanded(false)} 
              variant="outline" 
              size="sm"
            >
              <Minimize2 className="h-4 w-4 mr-2" />
              Minimizar
            </Button>
          )}
          {currentUser?.role === 'admin' && (
            <Button 
              variant="outline" 
              className="bg-white border-gray-300 hover:bg-gray-50"
              onClick={handleEndSprint}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Encerrar Sprint
            </Button>
          )}
        </div>
      </div>

      {/* Modern Kanban Board */}
      <div className={`w-full ${isExpanded ? 'fixed inset-0 z-50 bg-white p-6' : ''}`}>
        <KanbanBoard
          columns={kanbanColumns}
          onTaskMove={handleTaskMove}
          onTaskClick={handleTaskClick}
          onAddTask={handleAddTask}
          onTaskEdit={onActivityEdit}
          onTaskDelete={onActivityDelete}
          showHeader={false}
          className="w-full"
        />
        
        {/* Close button for expanded view */}
        {isExpanded && (
          <Button
            onClick={() => setIsExpanded(false)}
            variant="ghost"
            size="sm"
            className="fixed top-4 right-4 z-60"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ActivityPlannerView;
