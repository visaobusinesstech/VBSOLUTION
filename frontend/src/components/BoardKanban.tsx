'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus, GripVertical, Calendar, MessageCircle, Paperclip } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: {
    name: string;
    avatar?: string;
  };
  tags?: string[];
  dueDate?: string;
  attachments?: number;
  comments?: number;
  status?: string;
  due_date?: string;
  responsible_id?: string;
  company_id?: string;
  project_id?: string;
  work_group?: string;
  department?: string;
  type?: string;
}

interface Column {
  id: string;
  title: string;
  name: string;
  tasks: Task[];
  color?: string;
  status: string;
}

interface BoardKanbanProps {
  columns?: Column[];
  tasks?: Task[];
  onTaskMove?: (taskId: string, fromColumn: string, toColumn: string) => void;
  onAddTask?: (columnId: string) => void;
  onTaskClick?: (taskId: string) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  className?: string;
}

const TaskCard: React.FC<{ 
  task: Task; 
  columnId: string; 
  onDragStart: (e: React.DragEvent, task: Task, columnId: string) => void;
  onTaskClick?: (taskId: string) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}> = ({ 
  task, 
  columnId, 
  onDragStart,
  onTaskClick,
  onEditTask,
  onDeleteTask
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
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
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Card
      className="cursor-move transition-all duration-300 border bg-background hover:shadow-md group"
      draggable
      onDragStart={(e) => onDragStart(e, task, columnId)}
      onClick={() => onTaskClick?.(task.id)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-foreground leading-tight text-sm flex-1 pr-2">
              {task.title}
            </h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={getPriorityColor(task.priority)} className="text-xs capitalize">
                {task.priority === 'urgent' ? 'Urgente' :
                 task.priority === 'high' ? 'Alta' :
                 task.priority === 'medium' ? 'Média' : 'Baixa'}
              </Badge>
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {task.description}
            </p>
          )}

          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-3 text-muted-foreground">
              {(task.dueDate || task.due_date) && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs">{formatDate(task.dueDate || task.due_date)}</span>
                </div>
              )}
              {task.comments && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  <span className="text-xs">{task.comments}</span>
                </div>
              )}
              {task.attachments && (
                <div className="flex items-center gap-1">
                  <Paperclip className="w-3 h-3" />
                  <span className="text-xs">{task.attachments}</span>
                </div>
              )}
            </div>

            {task.assignee && (
              <Avatar className="w-6 h-6">
                <AvatarImage src={task.assignee.avatar} />
                <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                  {getInitials(task.assignee.name)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const KanbanColumn: React.FC<{ 
  column: Column; 
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, columnId: string) => void;
  onDragStart: (e: React.DragEvent, task: Task, columnId: string) => void;
  onAddTask?: (columnId: string) => void;
  onTaskClick?: (taskId: string) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}> = ({ 
  column, 
  onDragOver, 
  onDrop, 
  onDragStart, 
  onAddTask,
  onTaskClick,
  onEditTask,
  onDeleteTask
}) => {
  return (
    <div
      className="bg-transparent rounded-lg p-4 min-w-[300px] h-fit"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column.id)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: column.color || '#6B7280' }} 
          />
          <h3 className="font-semibold text-foreground text-sm">
            {column.name || column.title}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {column.tasks.length}
          </Badge>
        </div>
        {onAddTask && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onAddTask(column.id)}
            className="h-8 w-8 p-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-3 pr-4">
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              columnId={column.id}
              onDragStart={onDragStart}
              onTaskClick={onTaskClick}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
            />
          ))}
          
          {column.tasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma tarefa {(column.name || column.title).toLowerCase()}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

const BoardKanban: React.FC<BoardKanbanProps> = ({ 
  columns = [], 
  tasks = [],
  onTaskMove,
  onAddTask,
  onTaskClick,
  onEditTask,
  onDeleteTask,
  className 
}) => {
  const { sidebarExpanded } = useSidebar();
  
  // Mapear tasks para as colunas corretas
  const boardColumns = React.useMemo(() => {
    return columns.map(column => ({
      ...column,
      tasks: tasks.filter(task => task.status === column.status)
    }));
  }, [columns, tasks]);

  const handleDragStart = (e: React.DragEvent, task: Task, columnId: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ task, sourceColumnId: columnId }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const { task, sourceColumnId } = data;

    if (sourceColumnId === targetColumnId) return;

    onTaskMove?.(task.id, sourceColumnId, targetColumnId);
  };

  const handleAddTask = (columnId: string) => {
    onAddTask?.(columnId);
  };

  const shouldShowHorizontalScroll = boardColumns.length > 3;

  // Calcular largura disponível considerando o sidebar
  const getAvailableWidth = () => {
    const sidebarWidth = sidebarExpanded ? 240 : 64;
    const padding = 48; // 24px cada lado
    return `calc(100vw - ${sidebarWidth}px - ${padding}px)`;
  };

  return (
    <div className={cn("w-full", className)}>
      {shouldShowHorizontalScroll ? (
        <ScrollArea className="w-full" style={{ maxWidth: getAvailableWidth() }}>
          <div className="flex gap-6 pb-4">
            {boardColumns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragStart={handleDragStart}
                onAddTask={handleAddTask}
                onTaskClick={onTaskClick}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <div 
          className={cn(
            "grid gap-6",
            boardColumns.length === 1 && "grid-cols-1 max-w-sm mx-auto",
            boardColumns.length === 2 && "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto",
            boardColumns.length === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto",
            boardColumns.length >= 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          )}
          style={{ maxWidth: getAvailableWidth() }}
        >
          {boardColumns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragStart={handleDragStart}
              onAddTask={handleAddTask}
              onTaskClick={onTaskClick}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BoardKanban;
