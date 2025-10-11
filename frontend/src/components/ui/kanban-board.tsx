'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, GripVertical, MessageCircle, Paperclip, Plus, Clock, CheckCircle, AlertTriangle, Edit, Trash2 } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  assignee?: {
    name: string;
    avatar?: string;
  };
  tags?: string[];
  dueDate?: string;
  attachments?: number;
  comments?: number;
  status?: string;
  type?: string;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
  color?: string;
}

interface KanbanBoardProps {
  columns: Column[];
  onTaskMove?: (taskId: string, fromColumn: string, toColumn: string) => void;
  onTaskClick?: (taskId: string) => void;
  onAddTask?: (columnId: string) => void;
  onTaskEdit?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  showHeader?: boolean;
  className?: string;
}

export default function KanbanBoard({ 
  columns, 
  onTaskMove, 
  onTaskClick, 
  onAddTask,
  onTaskEdit,
  onTaskDelete,
  showHeader = true,
  className = "" 
}: KanbanBoardProps) {
  const [localColumns, setLocalColumns] = useState<Column[]>(columns);

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

    setLocalColumns((prev) =>
      prev.map((col) => {
        if (col.id === sourceColumnId) {
          return { ...col, tasks: col.tasks.filter((t) => t.id !== task.id) };
        }
        if (col.id === targetColumnId) {
          return { ...col, tasks: [...col.tasks, task] };
        }
        return col;
      }),
    );

    if (onTaskMove) {
      onTaskMove(task.id, sourceColumnId, targetColumnId);
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const handleTaskEdit = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    if (onTaskEdit) {
      onTaskEdit(taskId);
    }
  };

  const handleTaskDelete = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    if (onTaskDelete) {
      onTaskDelete(taskId);
    }
  };

  return (
    <div className={className}>
      {showHeader && (
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-light text-neutral-900 dark:text-neutral-100 mb-2">
            Kanban Board
          </h1>
          <p className="text-neutral-700 dark:text-neutral-300">Drag and drop task management</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {localColumns.map((column) => (
          <div
            key={column.id}
            className="bg-white/20 dark:bg-neutral-900/20 backdrop-blur-xl rounded-3xl p-5 border border-border dark:border-neutral-700/50"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: column.color || '#6B7280' }} />
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {column.title}
                </h3>
                <Badge className="bg-neutral-100/80 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 border-neutral-200/50 dark:border-neutral-600/50">
                  {column.tasks.length}
                </Badge>
              </div>
              {onAddTask && (
                <button 
                  className="p-1 rounded-full bg-white/30 dark:bg-neutral-800/30 hover:bg-white/50 dark:hover:bg-neutral-700/50 transition-colors"
                  onClick={() => onAddTask(column.id)}
                >
                  <Plus className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              {column.tasks.map((task) => (
                <Card
                  key={task.id}
                  className="group cursor-move transition-all duration-300 border bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-neutral-700/70 hover:shadow-lg min-h-[160px] relative"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task, column.id)}
                  onClick={() => onTaskClick && onTaskClick(task.id)}
                >
                  <CardContent className="p-5">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-5 h-5 text-neutral-500 dark:text-neutral-400 cursor-move" />
                          {/* Botões de ação - aparecem apenas no hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
                            {onTaskEdit && (
                              <button
                                onClick={(e) => handleTaskEdit(e, task.id)}
                                className="p-1 rounded-full bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 transition-colors"
                                title="Editar atividade"
                              >
                                <Edit className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              </button>
                            )}
                            {onTaskDelete && (
                              <button
                                onClick={(e) => handleTaskDelete(e, task.id)}
                                className="p-1 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/50 transition-colors"
                                title="Excluir atividade"
                              >
                                <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Priority Badge */}
                      {task.priority && (
                        <div className="flex items-center gap-2">
                          {getPriorityIcon(task.priority)}
                          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                          </Badge>
                        </div>
                      )}

                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {task.tags.map((tag) => (
                            <Badge
                              key={tag}
                              className="text-xs bg-neutral-100/60 dark:bg-neutral-700/60 text-neutral-800 dark:text-neutral-200 border-neutral-200/50 dark:border-neutral-600/50 backdrop-blur-sm"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-neutral-200/30 dark:border-neutral-700/30">
                        <div className="flex items-center gap-4 text-neutral-600 dark:text-neutral-400">
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span className="text-xs font-medium">{formatDate(task.dueDate)}</span>
                            </div>
                          )}
                          {task.comments && task.comments > 0 && (
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              <span className="text-xs font-medium">{task.comments}</span>
                            </div>
                          )}
                          {task.attachments && task.attachments > 0 && (
                            <div className="flex items-center gap-1">
                              <Paperclip className="w-4 h-4" />
                              <span className="text-xs font-medium">{task.attachments}</span>
                            </div>
                          )}
                        </div>

                        {task.assignee && (
                          <Avatar className="w-8 h-8 ring-2 ring-white/50 dark:ring-neutral-700/50">
                            <AvatarImage src={task.assignee.avatar} />
                            <AvatarFallback className="bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-medium">
                              {task.assignee.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
