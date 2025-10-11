import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Archive, Clock, AlertTriangle } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  responsible?: string;
  company?: string;
  due_date?: string;
  dueDate?: string;
  tags?: string[];
  archived?: boolean;
}

interface ProjectDeadlineViewProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  onCompleteProject: (projectId: string) => void;
  onArchiveProject: (projectId: string) => void;
  searchTerm: string;
  selectedResponsibles: string[];
  selectedWorkGroup: string;
  selectedDepartment: string;
}

const ProjectDeadlineView: React.FC<ProjectDeadlineViewProps> = ({
  projects,
  onProjectClick,
  onCompleteProject,
  onArchiveProject,
  searchTerm,
  selectedResponsibles,
  selectedWorkGroup,
  selectedDepartment
}) => {
  // Verificações de segurança
  if (!projects) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Nenhum projeto encontrado</div>
      </div>
    );
  }

  if (!Array.isArray(projects)) {
    console.error('ProjectDeadlineView: projects não é um array:', projects);
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Erro: dados de projetos inválidos</div>
      </div>
    );
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em Andamento': return 'bg-gray-200 text-gray-800 border-gray-300';
      case 'Concluído': return 'bg-gray-800 text-white border-gray-900';
      case 'Pausado': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Planejado': return 'bg-white text-gray-900 border-gray-400';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (project: Project) => {
    const dueDate = project.due_date || project.dueDate;
    if (!dueDate) return 'text-gray-500';
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-600'; // Atrasado
    if (diffDays <= 3) return 'text-orange-600'; // Crítico
    if (diffDays <= 7) return 'text-yellow-600'; // Atenção
    return 'text-green-600'; // OK
  };

  const getPriorityIcon = (project: Project) => {
    const dueDate = project.due_date || project.dueDate;
    if (!dueDate) return <Clock className="h-4 w-4" />;
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return <AlertTriangle className="h-4 w-4" />; // Atrasado
    if (diffDays <= 3) return <AlertTriangle className="h-4 w-4" />; // Crítico
    if (diffDays <= 7) return <Clock className="h-4 w-4" />; // Atenção
    return <Clock className="h-4 w-4" />; // OK
  };

  const filteredProjects = projects.filter(project => {
    try {
      if (!project || typeof project !== 'object') return false;
      
      const matchesSearch = !searchTerm || 
        (project.name && project.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesResponsible = !selectedResponsibles || 
        !Array.isArray(selectedResponsibles) || 
        selectedResponsibles.length === 0 || 
        selectedResponsibles.includes(project.responsible);
      
      return matchesSearch && matchesResponsible;
    } catch (error) {
      console.error('Erro ao filtrar projeto:', project, error);
      return false;
    }
  });

  // Ordenar por prazo
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    try {
      if (!a || !b) return 0;
      
      const dueDateA = a.due_date || a.dueDate;
      const dueDateB = b.due_date || b.dueDate;
      
      if (!dueDateA && !dueDateB) return 0;
      if (!dueDateA) return 1;
      if (!dueDateB) return -1;
      
      const dateA = new Date(dueDateA);
      const dateB = new Date(dueDateB);
      
      // Verificar se as datas são válidas
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        return 0;
      }
      
      return dateA.getTime() - dateB.getTime();
    } catch (error) {
      console.error('Erro ao ordenar projetos:', error);
      return 0;
    }
  });

  // Se não há projetos, mostrar mensagem
  if (sortedProjects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-2">📋</div>
          <div className="text-gray-500">Nenhum projeto encontrado</div>
          <div className="text-gray-400 text-sm mt-1">
            {projects.length === 0 ? 'Crie seu primeiro projeto para começar' : 'Tente ajustar os filtros'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedProjects.map((project, index) => {
        try {
          if (!project || typeof project !== 'object') {
            console.warn(`Projeto inválido no índice ${index}:`, project);
            return null;
          }
          
          return (
          <Card 
            key={project.id} 
            className="bg-white border-2 border-gray-200 hover:border-gray-400 transition-all cursor-pointer"
            onClick={() => onProjectClick(project)}
          >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <h3 className="text-xl font-semibold text-black">{project.name}</h3>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                  {project.archived && (
                    <Badge className="bg-gray-300 text-gray-800 border-gray-400">
                      Arquivado
                    </Badge>
                  )}
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{project.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-black">Responsável:</span>
                    <span className="text-gray-600">{project.responsible || 'Não definido'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-black">Empresa:</span>
                    <span className="text-gray-600">{project.company || 'Não definida'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-black">Prazo:</span>
                    <span className={`flex items-center gap-1 ${getPriorityColor(project)}`}>
                      {getPriorityIcon(project)}
                      {(project.due_date || project.dueDate) ? 
                        new Date(project.due_date || project.dueDate).toLocaleDateString('pt-BR') : 
                        'Sem prazo'
                      }
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 flex flex-wrap gap-1">
                  {(project.tags ?? []).map((tag, index) => (
                    <Badge key={index} className="bg-gray-100 text-gray-800 border-gray-300 text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col gap-2 ml-4">
                {!project.archived ? (
                  <>
                    {project.status !== 'Concluído' && (
                      <Button
                        size="sm"
                        className="bg-gray-800 hover:bg-black text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCompleteProject(project.id);
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Finalizar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-gray-600 border-gray-300 hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchiveProject(project.id);
                      }}
                    >
                      <Archive className="h-4 w-4 mr-1" />
                      Arquivar
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-gray-600 border-gray-300 hover:bg-gray-100"
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    Restaurar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
          );
        } catch (error) {
          console.error(`Erro ao renderizar projeto no índice ${index}:`, error);
          return null;
        }
      })}
    </div>
  );
};

export default ProjectDeadlineView;
