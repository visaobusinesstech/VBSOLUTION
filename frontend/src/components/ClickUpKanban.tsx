'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, GripVertical, Calendar, MessageCircle, Paperclip, MoreHorizontal } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';

interface Task {
  id: string;
  title: string;
  name?: string;
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

interface ClickUpKanbanProps {
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
  const [isHovered, setIsHovered] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-500';
      case 'doing':
        return 'bg-orange-500';
      case 'done':
        return 'bg-green-500';
      case 'planning':
        return 'bg-blue-500';
      case 'active':
        return 'bg-yellow-500';
      case 'on_hold':
        return 'bg-orange-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
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
    <div
      className={`group bg-white border border-gray-200 rounded-lg cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-95 shadow-xl' : ''
      }`}
      draggable
      onDragStart={(e) => {
        setIsDragging(true);
        onDragStart(e, task, columnId);
      }}
      onDragEnd={(e) => {
        setIsDragging(false);
        console.log('🏁 [DRAG END] Drag finalizado para task:', task.id);
      }}
      onClick={() => onTaskClick?.(task.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status bar no topo */}
      <div className={`h-1 w-full rounded-t-lg ${getStatusColor(task.status || columnId)}`} />
      
      <div className="p-3 pb-2">
        {/* Header com título e ações */}
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900 leading-tight flex-1">
            {task.title || task.name}
          </h4>
          
          {/* Ações visíveis no hover */}
          <div className={`flex items-center gap-1 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditTask?.(task);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <MoreHorizontal size={14} />
            </button>
            <div className="text-gray-400 cursor-move">
              <GripVertical size={14} />
            </div>
          </div>
        </div>

        {/* Descrição se existir */}
        {task.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Tags se existirem */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="text-xs text-gray-400">+{task.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer com metadados */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3 text-gray-400">
            {/* Data de vencimento */}
            {(task.dueDate || task.due_date) && (
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span className="text-xs">
                  {formatDate(task.dueDate || task.due_date)}
                </span>
              </div>
            )}

            {/* Comentários */}
            {task.comments && task.comments > 0 && (
              <div className="flex items-center gap-1">
                <MessageCircle size={12} />
                <span className="text-xs">{task.comments}</span>
              </div>
            )}

            {/* Anexos */}
            {task.attachments && task.attachments > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip size={12} />
                <span className="text-xs">{task.attachments}</span>
              </div>
            )}
          </div>

          {/* Avatar do responsável */}
          <div className="flex items-center gap-1">
            {/* Indicador de prioridade */}
            {task.priority && task.priority !== 'low' && (
              <div 
                className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}
                title={`Prioridade: ${task.priority}`}
              />
            )}
            
            {/* Avatar */}
            {task.assignee && (
              <div 
                className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium"
                title={task.assignee.name}
              >
                {task.assignee.avatar ? (
                  <img 
                    src={task.assignee.avatar} 
                    alt={task.assignee.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(task.assignee.name)
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
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
  const [isDragOver, setIsDragOver] = React.useState(false);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return '#6B7280'; // gray
      case 'doing':
        return '#F97316'; // orange
      case 'done':
        return '#22C55E'; // green
      case 'planning':
        return '#3B82F6'; // blue
      case 'active': 
        return '#EAB308'; // yellow
      case 'on_hold':
        return '#F97316'; // orange
      case 'completed':
        return '#22C55E'; // green
      case 'cancelled':
        return '#EF4444'; // red
      default:
        return column.color || '#6B7280'; // gray
    }
  };

  return (
    <div
      className={`flex-shrink-0 transition-all duration-200 ${
        isDragOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed rounded-lg' : ''
      }`}
      style={{ width: '280px' }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
        onDragOver(e);
      }}
      onDragLeave={() => {
        setIsDragOver(false);
      }}
      onDrop={(e) => {
        setIsDragOver(false);
        onDrop(e, column.id);
      }}
    >
      {/* Header da coluna */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: getStatusColor(column.status) }}
          />
          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
            {column.name || column.title}
          </h3>
          <span 
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{ 
              backgroundColor: getStatusColor(column.status) + '20',
              color: getStatusColor(column.status)
            }}
          >
            {column.tasks.length}
          </span>
        </div>

        {/* Botão adicionar grupo */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          onClick={() => console.log('Adicionar grupo')}
          title="Adicionar grupo"
        >
          <Plus size={14} />
        </Button>
      </div>

      {/* Lista de tarefas */}
      <div className={`space-y-3 ${isDragOver ? 'p-2' : ''}`}>
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

        {/* Botão adicionar tarefa */}
        {onAddTask && (
          <Button
            variant="ghost"
            className="w-full h-10 text-left text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-dashed border-gray-300 hover:border-gray-400 rounded-lg"
            onClick={() => onAddTask(column.id)}
          >
            <Plus size={16} className="mr-2" />
            Adicionar Tarefa
          </Button>
        )}

        {/* Estado vazio */}
        {column.tasks.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <div className="text-sm">Nenhuma tarefa</div>
          </div>
        )}
      </div>
    </div>
  );
};

const ClickUpKanban: React.FC<ClickUpKanbanProps> = ({ 
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
    console.log('🔍 [KANBAN] Mapeando tasks para colunas:', {
      columns: columns.map(col => ({ id: col.id, name: col.name, status: col.status })),
      tasks: tasks.map(task => ({ id: task.id, status: task.status, title: task.title }))
    });
    
    const mappedColumns = columns.map(column => {
      const columnTasks = tasks.filter(task => {
        // Mapeamento de status para compatibilidade - CORRIGIDO
        if (column.status === 'todo' && (task.status === 'pending' || task.status === 'todo' || task.status === 'open')) {
          console.log(`✅ [KANBAN] Task "${task.title}" (${task.status}) → Coluna "${column.name}" (${column.status})`);
          return true;
        }
        if (column.status === 'doing' && (task.status === 'in_progress' || task.status === 'doing')) {
          console.log(`✅ [KANBAN] Task "${task.title}" (${task.status}) → Coluna "${column.name}" (${column.status})`);
          return true;
        }
        if (column.status === 'done' && (task.status === 'completed' || task.status === 'done')) {
          console.log(`✅ [KANBAN] Task "${task.title}" (${task.status}) → Coluna "${column.name}" (${column.status})`);
          return true;
        }
        // Mapeamento direto para outros status
        if (task.status === column.status) {
          console.log(`✅ [KANBAN] Task "${task.title}" (${task.status}) → Coluna "${column.name}" (${column.status}) - mapeamento direto`);
          return true;
        }
        return false;
      });
      console.log(`📋 [KANBAN] Coluna "${column.name}" (${column.status}): ${columnTasks.length} tarefas`);
      console.log(`📋 [KANBAN] Tasks na coluna:`, columnTasks.map(t => ({ id: t.id, title: t.title, status: t.status })));
      
      return {
        ...column,
        tasks: columnTasks
      };
    });
    
    console.log('✅ [KANBAN] Mapeamento concluído:', mappedColumns.map(col => ({
      name: col.name,
      status: col.status,
      taskCount: col.tasks.length
    })));
    
    return mappedColumns;
  }, [columns, tasks]);

  const handleDragStart = (e: React.DragEvent, task: Task, columnId: string) => {
    console.log('🚀 [DRAG START] Iniciando drag:', { 
      taskId: task.id, 
      taskTitle: task.title,
      sourceColumn: columnId 
    });
    
    const dragData = { task, sourceColumnId: columnId };
    
    // Definir dados do drag
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
    
    console.log('🚀 [DRAG START] Dados salvos no dataTransfer:', dragData);
    console.log('🚀 [DRAG START] DataTransfer types:', e.dataTransfer.types);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🎯 [DROP] ===== INICIANDO DROP =====');
    console.log('🎯 [DROP] Target column ID:', targetColumnId);
    
    try {
      const dataString = e.dataTransfer.getData('text/plain');
      console.log('🎯 [DROP] DataTransfer data:', dataString);
      
      if (!dataString) {
        console.error('❌ [DROP] Nenhum dado encontrado no dataTransfer');
        return;
      }
      
      const data = JSON.parse(dataString);
      const { task, sourceColumnId } = data;

      console.log('🎯 [DROP] Dados do drag:', { 
        taskId: task.id, 
        taskTitle: task.title,
        fromColumn: sourceColumnId, 
        toColumn: targetColumnId 
      });

      if (sourceColumnId === targetColumnId) {
        console.log('⚠️ [DROP] Mesma coluna, ignorando');
        return;
      }

      console.log('🎯 [DROP] Chamando onTaskMove...');
      if (onTaskMove) {
        onTaskMove(task.id, sourceColumnId, targetColumnId);
        console.log('✅ [DROP] onTaskMove chamado com sucesso');
      } else {
        console.error('❌ [DROP] onTaskMove não está definido');
      }
    } catch (error) {
      console.error('❌ [DROP] Erro ao processar drop:', error);
    }
  };

  const handleAddTask = (columnId: string) => {
    onAddTask?.(columnId);
  };

  // Verificar se precisa de scroll horizontal baseado no container
  const needsHorizontalScroll = React.useMemo(() => {
    // Para colunas Kanban, sempre usar scroll horizontal quando tiver mais de 4 colunas
    // ou quando a largura total exceder o espaço disponível
    const maxColumnsWithoutScroll = 4;
    return boardColumns.length > maxColumnsWithoutScroll;
  }, [boardColumns.length]);

  return (
    <div className={cn("w-full h-full", className)}>
      <div 
        className={`flex ${needsHorizontalScroll ? 'overflow-x-auto' : 'justify-start'} gap-6`}
        style={{ 
          paddingBottom: needsHorizontalScroll ? '16px' : '0'
        }}
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

      {/* Scrollbar customizada */}
      {needsHorizontalScroll && (
        <style jsx>{`
          .flex::-webkit-scrollbar {
            height: 8px;
          }
          .flex::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
          }
          .flex::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          .flex::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}</style>
      )}
    </div>
  );
};

export default ClickUpKanban;
