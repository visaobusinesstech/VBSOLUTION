import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Building2, Plus, Filter, Search, AlertTriangle, CheckCircle, Play, Archive, Edit } from 'lucide-react';
import { format, isAfter, isBefore, startOfDay, endOfDay, addDays, ptBR } from '@/utils/dateUtils';
import { Input } from '@/components/ui/input';
import ResponsibleFilter from './ResponsibleFilter';
import KanbanBoard from '@/components/ui/kanban-board';

interface ActivityDeadlineViewProps {
  activities: any[];
  companies: any[];
  employees: any[];
  onActivityClick: (activityId: string) => void;
  onUpdateStatus: (activityId: string, newStatus: string) => void;
  onCreateQuickTask: (title: string, status: string) => void;
  onOpenCreateModal?: () => void;
  onActivityEdit?: (activityId: string) => void;
  onActivityDelete?: (activityId: string) => void;
}

const ActivityDeadlineView = ({
  activities,
  companies,
  employees,
  onActivityClick,
  onUpdateStatus,
  onCreateQuickTask,
  onOpenCreateModal,
  onActivityEdit,
  onActivityDelete
}: ActivityDeadlineViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResponsibles, setSelectedResponsibles] = useState<string[]>([]);

  const getCompanyName = (companyId?: string) => {
    if (!companyId) return 'Sem empresa';
    const company = (companies ?? []).find(c => c.id === companyId);
    return company?.fantasyName || company?.fantasy_name || company?.companyName || 'Empresa não encontrada';
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = (employees ?? []).find(e => e.id === employeeId);
    return employee?.name || 'Funcionário não encontrado';
  };

  // Filter activities
  const getFilteredActivities = () => {
    let filtered = activities;
    
    if (searchTerm) {
      filtered = filtered.filter(activity => 
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedResponsibles.length > 0) {
      filtered = filtered.filter(activity => 
        selectedResponsibles.includes(activity.responsibleId)
      );
    }
    
    return filtered;
  };

  const categorizeByDeadline = (activities: any[]) => {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = startOfDay(addDays(now, 1));
    const nextWeek = startOfDay(addDays(now, 7));

    return {
      overdue: activities.filter(activity => 
        isBefore(new Date(activity.date), today) && activity.status !== 'completed'
      ),
      today: activities.filter(activity => {
        const activityDate = startOfDay(new Date(activity.date));
        return activityDate.getTime() === today.getTime();
      }),
      tomorrow: activities.filter(activity => {
        const activityDate = startOfDay(new Date(activity.date));
        return activityDate.getTime() === tomorrow.getTime();
      }),
      thisWeek: activities.filter(activity => {
        const activityDate = new Date(activity.date);
        return isAfter(activityDate, tomorrow) && isBefore(activityDate, nextWeek);
      }),
      later: activities.filter(activity => {
        const activityDate = new Date(activity.date);
        return isAfter(activityDate, nextWeek);
      })
    };
  };

  const filteredActivities = getFilteredActivities();
  const categorizedActivities = categorizeByDeadline(filteredActivities);

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
      id: 'overdue',
      title: 'Atrasadas',
      color: '#ef4444',
      tasks: categorizedActivities.overdue.map(convertActivityToTask)
    },
    {
      id: 'today',
      title: 'Hoje',
      color: '#f97316',
      tasks: categorizedActivities.today.map(convertActivityToTask)
    },
    {
      id: 'tomorrow',
      title: 'Amanhã',
      color: '#eab308',
      tasks: categorizedActivities.tomorrow.map(convertActivityToTask)
    },
    {
      id: 'thisWeek',
      title: 'Esta Semana',
      color: '#3b82f6',
      tasks: categorizedActivities.thisWeek.map(convertActivityToTask)
    },
    {
      id: 'later',
      title: 'Mais Tarde',
      color: '#6b7280',
      tasks: categorizedActivities.later.map(convertActivityToTask)
    }
  ];

  const cardHeightClass = 'min-h-[140px]';

  const handleTaskMove = (taskId: string, fromColumn: string, toColumn: string) => {
    // Update the activity's date based on the column
    const activity = activities.find(a => a.id === taskId);
    if (activity) {
      let newDate = new Date();
      
      switch (toColumn) {
        case 'today':
          newDate = new Date();
          break;
        case 'tomorrow':
          newDate = addDays(new Date(), 1);
          break;
        case 'thisWeek':
          newDate = addDays(new Date(), 3);
          break;
        case 'later':
          newDate = addDays(new Date(), 14);
          break;
        default:
          newDate = activity.date;
      }
      
      // For now, we'll just update the status
      // In a real implementation, you'd update the date as well
      onUpdateStatus(taskId, activity.status);
    }
  };

  const handleTaskClick = (taskId: string) => {
    onActivityClick(taskId);
  };

  const handleAddTask = (columnId: string) => {
    if (onOpenCreateModal) {
      onOpenCreateModal();
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
          Esta visualização mostrará as tarefas organizadas por prazo
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modern Kanban Board */}
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
    </div>
  );
};

export default ActivityDeadlineView;
