'use client';

import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Project } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Plus, GripVertical, Calendar, MessageCircle, Paperclip, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KanbanColumn {
  id: string;
  title: string;
  name?: string;
  color: string;
  status?: string;
}

interface ProjectKanbanBoardProps {
  projects: Project[];
  onMoveProject: (projectId: string, newColumn: string, newPosition: number) => Promise<{ data: any; error: string | null }>;
  onReindexColumn: (column: string) => Promise<{ data: any; error: string | null }>;
  onAddProject?: (columnId: string) => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onProjectClick?: (projectId: string) => void;
  className?: string;
  columns?: KanbanColumn[];
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'planning', title: 'PENDENTE', color: '#6B7280' },
  { id: 'active', title: 'EM PROGRESSO', color: '#F97316' },
  { id: 'completed', title: 'CONCLUÍDO', color: '#22C55E' }
];

const ProjectCard: React.FC<{
  project: Project;
  index: number;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
  onClick?: (projectId: string) => void;
}> = ({ project, index, onEdit, onDelete, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString?: string | null) => {
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
      className="group bg-white border border-gray-200 rounded-lg cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick?.(project.id)}
    >
      {/* Status bar no topo */}
      <div className={`h-1 w-full rounded-t-lg`} style={{ 
        backgroundColor: project.status === 'planning' || project.status === 'pending' || project.status === 'open' ? '#6B7280' :
        project.status === 'active' || project.status === 'in_progress' ? '#F97316' :
        project.status === 'completed' || project.status === 'done' ? '#22C55E' : '#6B7280'
      }} />
      
      <div className="p-3 pb-2">
        {/* Header com título e ações */}
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900 leading-tight flex-1">
            {project.name}
          </h4>
          
          {/* Ações visíveis no hover */}
          <div className={`flex items-center gap-1 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(project);
                }}
                className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                title="Editar projeto"
              >
                <Edit size={12} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project.id);
                }}
                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                title="Excluir projeto"
              >
                <Trash2 size={12} />
              </button>
            )}
            <div className="text-gray-400 cursor-move">
              <GripVertical size={14} />
            </div>
          </div>
        </div>

        {/* Descrição */}
        {project.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Tags de prioridade */}
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-2 h-2 rounded-full ${getPriorityColor(project.priority)}`} />
          <span className="text-xs text-gray-600 capitalize">
            {project.priority === 'urgent' ? 'Urgente' :
             project.priority === 'high' ? 'Alta' :
             project.priority === 'medium' ? 'Média' :
             project.priority === 'low' ? 'Baixa' : 'Média'}
          </span>
        </div>

        {/* Footer com informações */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            {project.start_date && (
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span>{formatDate(project.start_date)}</span>
              </div>
            )}
            {project.budget && (
              <div className="flex items-center gap-1">
                <span>R$ {project.budget.toLocaleString()}</span>
              </div>
            )}
          </div>
          
          {project.progress !== undefined && (
            <div className="flex items-center gap-1">
              <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <span>{project.progress}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProjectKanbanBoard: React.FC<ProjectKanbanBoardProps> = ({
  projects,
  onMoveProject,
  onReindexColumn,
  onAddProject,
  onEditProject,
  onDeleteProject,
  onProjectClick,
  className = '',
  columns
}) => {
  const [isHovered, setIsHovered] = useState<string | null>(null);
  
  // Garantir que projects seja sempre um array
  const safeProjects = projects || [];
  
  // Usar colunas personalizadas se fornecidas, senão usar as padrão
  const boardColumns = columns && columns.length > 0 ? columns : KANBAN_COLUMNS;

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    try {
      await onMoveProject(draggableId, destination.droppableId, destination.index);
    } catch (error) {
      console.error('Erro ao mover projeto:', error);
    }
  }, [onMoveProject]);

  const getColumnProjects = (columnId: string) => {
    return safeProjects.filter(project => {
      // Mapear status do projeto para coluna baseado no ID da coluna
      if (columnId === 'planning') return project.status === 'planning' || project.status === 'pending' || project.status === 'open';
      if (columnId === 'active') return project.status === 'active' || project.status === 'in_progress';
      if (columnId === 'completed') return project.status === 'completed' || project.status === 'done';
      if (columnId === 'on_hold') return project.status === 'on_hold' || project.status === 'paused';
      
      // Para colunas personalizadas, verificar se o status do projeto corresponde ao status da coluna
      const column = boardColumns.find(col => col.id === columnId);
      if (column && column.status) {
        // Para colunas personalizadas, usar o status da coluna
        return project.status === column.status;
      }
      
      return false;
    });
  };

  return (
    <div className={cn("w-full", className)}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-6">
          {boardColumns.map((column) => {
            const columnProjects = getColumnProjects(column.id);
            
            return (
              <div key={column.id} className="flex-shrink-0 w-80 space-y-4">
                {/* Header da coluna */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: column.color }}
                    />
                    <h3 className="text-sm font-medium text-gray-900">{column.name || column.title}</h3>
                    <span className="text-sm text-gray-500">({columnProjects.length})</span>
                  </div>
                </div>

                {/* Área de drop */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "min-h-[200px] p-2 rounded-lg border-2 border-dashed transition-colors",
                        snapshot.isDraggingOver 
                          ? "border-blue-300 bg-blue-50" 
                          : "border-gray-200 bg-transparent"
                      )}
                    >
                      {columnProjects.map((project, index) => (
                        <Draggable key={project.id} draggableId={project.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "mb-3",
                                snapshot.isDragging && "rotate-2 shadow-lg"
                              )}
                            >
                              <ProjectCard
                                project={project}
                                index={index}
                                onEdit={onEditProject}
                                onDelete={onDeleteProject}
                                onClick={onProjectClick}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {/* Botão de adicionar */}
                      {onAddProject && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAddProject(column.id)}
                          className="w-full h-12 border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-500 hover:text-gray-700"
                        >
                          <Plus size={16} className="mr-2" />
                          Adicionar Projeto
                        </Button>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

export default ProjectKanbanBoard;