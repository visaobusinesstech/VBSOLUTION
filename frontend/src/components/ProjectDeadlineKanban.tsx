import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  Plus, 
  GripVertical, 
  Calendar, 
  Clock,
  User,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Project {
  id?: string;
  name?: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string;
  dueDate?: string;
  responsible?: string;
  company?: string;
  tags?: string[];
  archived?: boolean;
  created_at?: string;
  updated_at?: string;
  responsible_id?: string;
  company_id?: string;
}

interface ProjectDeadlineKanbanProps {
  projects: Project[];
  onProjectClick?: (project: Project) => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onCreateProject?: () => void;
  className?: string;
}

interface DeadlineColumn {
  id: string;
  title: string;
  name: string;
  color: string;
  projects: Project[];
  description: string;
}

const ProjectCard: React.FC<{ 
  project: Project; 
  columnId: string; 
  onDragStart: (e: React.DragEvent, project: Project, columnId: string) => void;
  onProjectClick?: (project: Project) => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
}> = ({ 
  project, 
  columnId, 
  onDragStart,
  onProjectClick,
  onEditProject,
  onDeleteProject
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
      case 'urgente':
        return 'destructive';
      case 'high':
      case 'alta':
        return 'destructive';
      case 'medium':
      case 'média':
        return 'default';
      case 'low':
      case 'baixa':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    });
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card
      className="cursor-move transition-all duration-300 border bg-background hover:shadow-md group"
      draggable
      onDragStart={(e) => onDragStart(e, project, columnId)}
      onClick={() => onProjectClick?.(project)}
    >
      <CardContent className="p-1.5">
        <div className="space-y-1">
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-foreground leading-tight text-xs flex-1 pr-1">
              {project.name || 'Projeto sem nome'}
            </h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              {project.priority && (
                <Badge variant={getPriorityColor(project.priority)} className="text-xs capitalize px-1 py-0">
                  {project.priority === 'urgent' ? 'Urgente' :
                   project.priority === 'high' ? 'Alta' :
                   project.priority === 'medium' ? 'Média' : 'Baixa'}
                </Badge>
              )}
              <GripVertical className="w-3 h-3 text-muted-foreground cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {project.description && (
            <p className="text-xs text-muted-foreground leading-tight">
              {project.description}
            </p>
          )}

          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-0.5">
              {project.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs px-1 py-0"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-border">
            <div className="flex items-center gap-2 text-muted-foreground">
              {(project.dueDate || project.due_date) && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs">{formatDate(project.dueDate || project.due_date)}</span>
                </div>
              )}
              {!project.dueDate && !project.due_date && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">Sem prazo</span>
                </div>
              )}
            </div>

            {project.responsible && (
              <Avatar className="w-5 h-5">
                <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                  {getInitials(project.responsible)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const DeadlineColumn: React.FC<{ 
  column: DeadlineColumn; 
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, columnId: string) => void;
  onDragStart: (e: React.DragEvent, project: Project, columnId: string) => void;
  onCreateProject?: () => void;
  onProjectClick?: (project: Project) => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
}> = ({ 
  column, 
  onDragOver, 
  onDrop, 
  onDragStart, 
  onCreateProject,
  onProjectClick,
  onEditProject,
  onDeleteProject
}) => {
  return (
    <div
      className="bg-transparent rounded-lg p-1 min-w-[180px] h-fit"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column.id)}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: column.color }} 
          />
          <h3 className="font-semibold text-foreground text-xs truncate">
            {column.name}
          </h3>
          <Badge variant="secondary" className="text-xs px-1 py-0">
            {column.projects.length}
          </Badge>
        </div>
        {onCreateProject && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onCreateProject}
            className="h-5 w-5 p-0"
          >
            <Plus className="w-3 h-3" />
          </Button>
        )}
      </div>

      <ScrollArea className="h-[300px]">
        <div className="space-y-1 pr-1">
          {column.projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              columnId={column.id}
              onDragStart={onDragStart}
              onProjectClick={onProjectClick}
              onEditProject={onEditProject}
              onDeleteProject={onDeleteProject}
            />
          ))}
          
          {column.projects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {column.description}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

const ProjectDeadlineKanban: React.FC<ProjectDeadlineKanbanProps> = ({
  projects = [],
  onProjectClick,
  onEditProject,
  onDeleteProject,
  onCreateProject,
  className
}) => {
  // Organizar projetos por prazo
  const deadlineColumns = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const columns: DeadlineColumn[] = [
      {
        id: 'overdue',
        title: 'VENCIDOS',
        name: 'VENCIDOS',
        color: '#EF4444',
        description: 'Nenhum projeto vencido',
        projects: projects.filter(project => {
          const dueDate = project.due_date || project.dueDate;
          if (!dueDate) return false;
          return new Date(dueDate) < today;
        })
      },
      {
        id: 'today',
        title: 'HOJE',
        name: 'HOJE',
        color: '#F59E0B',
        description: 'Nenhum projeto para hoje',
        projects: projects.filter(project => {
          const dueDate = project.due_date || project.dueDate;
          if (!dueDate) return false;
          const due = new Date(dueDate);
          return due.toDateString() === today.toDateString();
        })
      },
      {
        id: 'tomorrow',
        title: 'AMANHÃ',
        name: 'AMANHÃ',
        color: '#3B82F6',
        description: 'Nenhum projeto para amanhã',
        projects: projects.filter(project => {
          const dueDate = project.due_date || project.dueDate;
          if (!dueDate) return false;
          const due = new Date(dueDate);
          return due.toDateString() === tomorrow.toDateString();
        })
      },
      {
        id: 'this_week',
        title: 'ESTA SEMANA',
        name: 'ESTA SEMANA',
        color: '#10B981',
        description: 'Nenhum projeto esta semana',
        projects: projects.filter(project => {
          const dueDate = project.due_date || project.dueDate;
          if (!dueDate) return false;
          const due = new Date(dueDate);
          return due > tomorrow && due <= nextWeek;
        })
      },
      {
        id: 'later',
        title: 'MAIS TARDE',
        name: 'MAIS TARDE',
        color: '#8B5CF6',
        description: 'Nenhum projeto futuro',
        projects: projects.filter(project => {
          const dueDate = project.due_date || project.dueDate;
          if (!dueDate) return true; // Projetos sem prazo vão para "Mais tarde"
          const due = new Date(dueDate);
          return due > nextWeek;
        })
      }
    ];

    return columns;
  }, [projects]);

  const handleDragStart = (e: React.DragEvent, project: Project, columnId: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ project, sourceColumnId: columnId }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const { project, sourceColumnId } = data;

    if (sourceColumnId === targetColumnId) return;

    // Aqui você pode implementar a lógica para mover o projeto entre colunas
    // Por enquanto, apenas log para debug
    console.log('Move project:', project.id, 'from', sourceColumnId, 'to', targetColumnId);
  };

  return (
    <div className={cn("w-full", className)}>
      <ScrollArea className="w-full">
        <div className="flex gap-1 pb-2">
          {deadlineColumns.map((column) => (
            <DeadlineColumn
              key={column.id}
              column={column}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragStart={handleDragStart}
              onCreateProject={onCreateProject}
              onProjectClick={onProjectClick}
              onEditProject={onEditProject}
              onDeleteProject={onDeleteProject}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default ProjectDeadlineKanban;
