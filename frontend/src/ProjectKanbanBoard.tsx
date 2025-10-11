
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal } from 'lucide-react';
import { useProject, Project, ProjectStage } from '@/contexts/ProjectContext';
import { toast } from '@/hooks/use-toast';

interface ProjectKanbanBoardProps {
  projects: Project[];
  stages: ProjectStage[];
  onProjectClick: (project: Project) => void;
  onCreateProject: () => void;
}

const ProjectKanbanBoard = ({ projects, stages, onProjectClick, onCreateProject }: ProjectKanbanBoardProps) => {
  const { dispatch } = useProject();

  const getProjectsByStage = (stageName: string) => {
    return projects.filter(project => {
      // Map project status to stage names
      const statusToStage: Record<string, string> = {
        'Planejado': 'Backlog',
        'Em Andamento': 'Em Andamento', 
        'Pausado': 'Pendente',
        'Concluído': 'Finalizado'
      };
      return statusToStage[project.status] === stageName;
    });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const projectId = result.draggableId;
    const project = projects.find(p => p.id === projectId);
    
    if (!project) return;

    const destinationStage = stages.find(s => s.name === destination.droppableId);
    if (!destinationStage) return;

    // Map stage names back to project status
    const stageToStatus: Record<string, string> = {
      'Backlog': 'Planejado',
      'Pendente': 'Pausado',
      'Em Andamento': 'Em Andamento',
      'Finalizado': 'Concluído'
    };

    const newStatus = stageToStatus[destinationStage.name] || 'Planejado';
    
    const updatedProject = {
      ...project,
      status: newStatus as Project['status']
    };

    dispatch({ type: 'UPDATE_PROJECT', payload: updatedProject });

    toast({
      title: "Projeto movido",
      description: `${project.name} foi movido para ${destinationStage.name}`
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em Andamento': return 'bg-blue-100 text-blue-800';
      case 'Concluído': return 'bg-green-100 text-green-800';
      case 'Pausado': return 'bg-yellow-100 text-yellow-800';
      case 'Planejado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageProjects = getProjectsByStage(stage.name);
          
          return (
            <div key={stage.id} className="flex-shrink-0 w-80">
              <div className={`rounded-lg ${stage.color} p-4`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{stage.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {stageProjects.length}
                    </Badge>
                  </div>
                  {stage.name === 'Backlog' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onCreateProject}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <Droppable droppableId={stage.name}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[200px] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-white/50 rounded-lg' : ''
                      }`}
                    >
                      {stageProjects.map((project, index) => (
                        <Draggable
                          key={project.id}
                          draggableId={project.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                                snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                              }`}
                              onClick={() => onProjectClick(project)}
                            >
                              <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                  <CardTitle className="text-sm font-semibold text-gray-900 line-clamp-2">
                                    {project.name}
                                  </CardTitle>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </div>
                              </CardHeader>
                              
                              <CardContent className="space-y-3">
                                <p className="text-xs text-gray-600 line-clamp-2">
                                  {project.description}
                                </p>
                                
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-700">
                                      {project.responsible}
                                    </span>
                                  </div>
                                  {project.dueDate && (
                                    <span className="text-gray-500">
                                      {new Date(project.dueDate).toLocaleDateString('pt-BR')}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center justify-between">
                                  <Badge className={getStatusColor(project.status)}>
                                    {project.status}
                                  </Badge>
                                  
                                  {project.tasks && project.tasks.length > 0 && (
                                    <span className="text-xs text-gray-500">
                                      {project.tasks.length} tarefa{project.tasks.length > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>

                                {project.tags && project.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {project.tags.slice(0, 3).map((tag, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                    {project.tags.length > 3 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{project.tags.length - 3}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default ProjectKanbanBoard;
