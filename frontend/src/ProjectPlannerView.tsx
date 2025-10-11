
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Calendar,
  Target, 
  Users, 
  Building2, 
  Clock, 
  CheckCircle2,
  Play,
  Pause,
  AlertCircle,
  Filter,
  Search,
  BarChart3
} from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';

interface ProjectPlannerViewProps {
  projects: any[];
  onProjectClick?: (project: any) => void;
}

const ProjectPlannerView = ({ projects, onProjectClick }: ProjectPlannerViewProps) => {
  const { state, dispatch } = useProject();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [responsibleFilter, setResponsibleFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid, timeline, kanban
  const [draggedProject, setDraggedProject] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Em Andamento': return <Play className="h-4 w-4" />;
      case 'Concluído': return <CheckCircle2 className="h-4 w-4" />;
      case 'Pausado': return <Pause className="h-4 w-4" />;
      case 'Planejado': return <Target className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em Andamento': return 'bg-gray-200 text-gray-800 border-gray-300';
      case 'Concluído': return 'bg-black text-white border-gray-900';
      case 'Pausado': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Planejado': return 'bg-white text-gray-900 border-gray-400';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityLevel = (project: any) => {
    if (!project.dueDate) return 'low';
    
    const today = new Date();
    const dueDate = new Date(project.dueDate);
    const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return 'overdue';
    if (daysLeft <= 3) return 'high';
    if (daysLeft <= 7) return 'medium';
    return 'low';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'overdue': return 'bg-gray-800 text-white border-gray-900';
      case 'high': return 'bg-gray-600 text-white border-gray-700';
      case 'medium': return 'bg-gray-400 text-white border-gray-500';
      default: return 'bg-gray-200 text-gray-800 border-gray-300';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'overdue': return 'Atrasado';
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      default: return 'Baixa';
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || getPriorityLevel(project) === priorityFilter;
    const matchesResponsible = responsibleFilter === 'all' || project.responsible === responsibleFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesResponsible;
  });

  const getProgressPercentage = (project: any) => {
    if (project.status === 'Concluído') return 100;
    if (project.status === 'Em Andamento') return 65;
    if (project.status === 'Pausado') return 35;
    return 10;
  };

  const uniqueResponsibles = Array.from(new Set(projects.map(p => p.responsible)));

  const handleDragStart = (project: any) => {
    setDraggedProject(project.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    if (draggedProject) {
      const project = projects.find(p => p.id === draggedProject);
      if (project) {
        const updatedProject = {
          ...project,
          status: targetStatus as any
        };
        dispatch({ type: 'UPDATE_PROJECT', payload: updatedProject });
      }
      setDraggedProject(null);
    }
  };

  // Timeline View Component
  const TimelineView = () => (
    <div className="space-y-4">
      {filteredProjects
        .sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        })
        .map((project) => {
          const priority = getPriorityLevel(project);
          const progress = getProgressPercentage(project);
          
          return (
            <Card 
              key={project.id}
              className="bg-white hover:shadow-lg transition-shadow cursor-pointer border-2 border-gray-200"
              onClick={() => onProjectClick?.(project)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-black">{project.name}</h3>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                      <Badge className={getPriorityColor(priority)}>
                        {getPriorityLabel(priority)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{project.responsible}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        <span>{project.company}</span>
                      </div>
                      {project.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(project.dueDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-48">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progresso</span>
                      <span className="font-medium text-black">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          progress === 100 ? 'bg-black' : 
                          progress >= 50 ? 'bg-gray-700' : 'bg-gray-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
    </div>
  );

  // Kanban View Component with Drag and Drop
  const KanbanView = () => {
    const statusColumns = [
      { key: 'Planejado', label: 'Planejado', color: 'bg-white' },
      { key: 'Em Andamento', label: 'Em Andamento', color: 'bg-gray-100' },
      { key: 'Pausado', label: 'Pausado', color: 'bg-gray-50' },
      { key: 'Concluído', label: 'Concluído', color: 'bg-gray-200' }
    ];

    return (
      <div className="grid grid-cols-4 gap-6">
        {statusColumns.map((column) => (
          <div 
            key={column.key} 
            className={`${column.color} rounded-lg p-4 min-h-96`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.key)}
          >
            <h3 className="font-semibold text-black mb-4 text-center">
              {column.label}
              <Badge className="ml-2 bg-black text-white">
                {filteredProjects.filter(p => p.status === column.key).length}
              </Badge>
            </h3>
            
            <div className="space-y-3">
              {filteredProjects
                .filter(project => project.status === column.key)
                .map((project) => {
                  const priority = getPriorityLevel(project);
                  const progress = getProgressPercentage(project);
                  
                  return (
                    <Card 
                      key={project.id}
                      className={`bg-white hover:shadow-md transition-shadow cursor-move border border-gray-300 ${
                        draggedProject === project.id ? 'opacity-50' : ''
                      }`}
                      draggable
                      onDragStart={() => handleDragStart(project)}
                      onClick={() => onProjectClick?.(project)}
                    >
                      <CardContent className="p-3">
                        <h4 className="font-medium text-black text-sm mb-2">{project.name}</h4>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getPriorityColor(priority)} style={{ fontSize: '10px' }}>
                            {getPriorityLabel(priority)}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-gray-600 mb-2">
                          <div className="flex items-center gap-1 mb-1">
                            <Users className="h-3 w-3" />
                            <span>{project.responsible}</span>
                          </div>
                          {project.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(project.dueDate).toLocaleDateString('pt-BR')}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Progresso</span>
                            <span className="font-medium text-black">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className={`h-1 rounded-full ${
                                progress === 100 ? 'bg-black' : 
                                progress >= 50 ? 'bg-gray-700' : 'bg-gray-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">Planejador de Projetos</h2>
          <p className="text-gray-600 mt-1">Visualize e gerencie o planejamento estratégico dos projetos</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-32 bg-white border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">Grade</SelectItem>
              <SelectItem value="timeline">Timeline</SelectItem>
              <SelectItem value="kanban">Kanban</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white border-2 border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 min-w-64">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar projetos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-white border-gray-300"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-white border-gray-300">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Planejado">Planejado</SelectItem>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Pausado">Pausado</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40 bg-white border-gray-300">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="overdue">Atrasado</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
              <SelectTrigger className="w-40 bg-white border-gray-300">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueResponsibles.map(responsible => (
                  <SelectItem key={responsible} value={responsible}>
                    {responsible}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-2 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Projetos</p>
                <p className="text-2xl font-bold text-black">{filteredProjects.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Andamento</p>
                <p className="text-2xl font-bold text-black">
                  {filteredProjects.filter(p => p.status === 'Em Andamento').length}
                </p>
              </div>
              <Play className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Concluídos</p>
                <p className="text-2xl font-bold text-black">
                  {filteredProjects.filter(p => p.status === 'Concluído').length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alta Prioridade</p>
                <p className="text-2xl font-bold text-black">
                  {filteredProjects.filter(p => getPriorityLevel(p) === 'high').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const priority = getPriorityLevel(project);
            const progress = getProgressPercentage(project);
            
            return (
              <Card 
                key={project.id}
                className="bg-white hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-2 border-gray-200"
                style={{ borderLeftColor: priority === 'overdue' ? '#000000' : priority === 'high' ? '#4B5563' : '#9CA3AF' }}
                onClick={() => onProjectClick?.(project)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-black mb-2">
                        {project.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {project.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(project.status)}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                    <Badge className={getPriorityColor(priority)}>
                      {getPriorityLabel(priority)}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{project.responsible}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="h-4 w-4" />
                      <span>{project.company}</span>
                    </div>
                    
                    {project.dueDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(project.dueDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progresso</span>
                      <span className="font-medium text-black">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          progress === 100 ? 'bg-black' : 
                          progress >= 50 ? 'bg-gray-700' : 'bg-gray-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} className="bg-gray-100 text-gray-800 border-gray-300 text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {project.tags.length > 3 && (
                        <Badge className="bg-gray-100 text-gray-800 border-gray-300 text-xs">
                          +{project.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {viewMode === 'timeline' && <TimelineView />}
      {viewMode === 'kanban' && <KanbanView />}

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <Card className="bg-white border-2 border-gray-200">
          <CardContent className="py-16 text-center">
            <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              Nenhum projeto encontrado
            </h3>
            <p className="text-gray-500">
              Ajuste os filtros para encontrar os projetos desejados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectPlannerView;
