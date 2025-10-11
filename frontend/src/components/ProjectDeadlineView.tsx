import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Calendar, 
  Edit, 
  Trash2,
  Plus,
  Building2,
  User,
  Eye
} from 'lucide-react';
import KanbanBoard from './KanbanBoard';

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
}

interface ProjectDeadlineViewProps {
  projects: Project[];
  onProjectClick?: (project: Project) => void;
  onCompleteProject?: (projectId: string) => void;
  onArchiveProject?: (projectId: string) => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onCreateProject?: () => void;
  searchTerm?: string;
  selectedResponsibles?: string[];
  selectedWorkGroup?: string;
  selectedDepartment?: string;
  topBarColor?: string;
}

const ProjectDeadlineView: React.FC<ProjectDeadlineViewProps> = ({
  projects = [],
  onProjectClick,
  onCompleteProject,
  onArchiveProject,
  onEditProject,
  onDeleteProject,
  onCreateProject,
  searchTerm = "",
  selectedResponsibles = [],
  selectedWorkGroup = "",
  selectedDepartment = "",
  topBarColor = "#3B82F6"
}) => {
  const [prazoViewMode, setPrazoViewMode] = useState<'kanban' | 'lista'>('kanban');

  // Debug: verificar dados dos projetos
  console.log('ProjectDeadlineView: projects recebidos:', projects);
  console.log('ProjectDeadlineView: número de projetos:', projects.length);
  projects.forEach((project, index) => {
    console.log(`Projeto ${index}:`, {
      id: project.id,
      name: project.name,
      due_date: project.due_date,
      dueDate: project.dueDate,
      status: project.status
    });
  });

  // Verificação de segurança máxima
  const safeProjects = Array.isArray(projects) ? projects : [];
  
  // Função para obter cor da prioridade
  const getPriorityColor = (priority: string = '') => {
    switch (priority.toLowerCase()) {
      case 'urgent':
      case 'urgente':
        return 'bg-red-100 text-red-700';
      case 'high':
      case 'alta':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
      case 'média':
        return 'bg-blue-100 text-blue-700';
      case 'low':
      case 'baixa':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Função para obter texto da prioridade
  const getPriorityText = (priority: string = '') => {
    switch (priority.toLowerCase()) {
      case 'urgent':
      case 'urgente':
        return 'Urgente';
      case 'high':
      case 'alta':
        return 'Alta';
      case 'medium':
      case 'média':
        return 'Média';
      case 'low':
      case 'baixa':
        return 'Baixa';
      default:
        return 'Normal';
    }
  };

  // Função para obter cor do status
  const getStatusColor = (status: string = '') => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'em andamento':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
      case 'concluído':
        return 'bg-green-100 text-green-700';
      case 'on_hold':
      case 'pausado':
        return 'bg-yellow-100 text-yellow-700';
      case 'planning':
      case 'planejado':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Função para obter texto do status
  const getStatusText = (status: string = '') => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'em andamento':
        return 'Em Andamento';
      case 'completed':
      case 'concluído':
        return 'Concluído';
      case 'on_hold':
      case 'pausado':
        return 'Pausado';
      case 'planning':
      case 'planejado':
        return 'Planejado';
      default:
        return status || 'Sem status';
    }
  };

  // Filtrar projetos por prazo - versão mais inclusiva
  const getProjectsByDeadline = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);

    console.log('Debug: Filtrando projetos por prazo...');
    console.log('Data de hoje:', today.toDateString());
    console.log('Data de amanhã:', tomorrow.toDateString());
    console.log('Fim da semana:', endOfWeek.toDateString());

    const overdue = safeProjects.filter(project => {
      const dueDate = project.due_date || project.dueDate;
      if (!dueDate) return false;
      
      try {
        const date = new Date(dueDate);
        if (isNaN(date.getTime())) return false;
        date.setHours(0, 0, 0, 0);
        const isOverdue = date < today && project.status !== 'completed' && project.status !== 'concluído';
        if (isOverdue) {
          console.log('Projeto vencido:', project.name, 'Data:', dueDate);
        }
        return isOverdue;
      } catch (error) {
        console.error('Erro ao processar data:', dueDate, error);
        return false;
      }
    });

    const todayProjects = safeProjects.filter(project => {
      const dueDate = project.due_date || project.dueDate;
      if (!dueDate) return false;
      
      try {
        const date = new Date(dueDate);
        if (isNaN(date.getTime())) return false;
        const isToday = date.toDateString() === today.toDateString();
        if (isToday) {
          console.log('Projeto para hoje:', project.name, 'Data:', dueDate);
        }
        return isToday;
      } catch (error) {
        return false;
      }
    });

    const tomorrowProjects = safeProjects.filter(project => {
      const dueDate = project.due_date || project.dueDate;
      if (!dueDate) return false;
      
      try {
        const date = new Date(dueDate);
        if (isNaN(date.getTime())) return false;
        const isTomorrow = date.toDateString() === tomorrow.toDateString();
        if (isTomorrow) {
          console.log('Projeto para amanhã:', project.name, 'Data:', dueDate);
        }
        return isTomorrow;
      } catch (error) {
        return false;
      }
    });

    const thisWeekProjects = safeProjects.filter(project => {
      const dueDate = project.due_date || project.dueDate;
      if (!dueDate) return false;
      
      try {
        const date = new Date(dueDate);
        if (isNaN(date.getTime())) return false;
        date.setHours(0, 0, 0, 0);
        const isThisWeek = date >= tomorrow && date <= endOfWeek;
        if (isThisWeek) {
          console.log('Projeto esta semana:', project.name, 'Data:', dueDate);
        }
        return isThisWeek;
      } catch (error) {
        return false;
      }
    });

    const laterProjects = safeProjects.filter(project => {
      const dueDate = project.due_date || project.dueDate;
      if (!dueDate) return false;
      
      try {
        const date = new Date(dueDate);
        if (isNaN(date.getTime())) return false;
        date.setHours(0, 0, 0, 0);
        const isLater = date > endOfWeek;
        if (isLater) {
          console.log('Projeto futuro:', project.name, 'Data:', dueDate);
        }
        return isLater;
      } catch (error) {
          return false;
      }
    });

    // Projetos sem data de vencimento - mostrar em "Mais Tarde"
    const noDueDateProjects = safeProjects.filter(project => {
      const dueDate = project.due_date || project.dueDate;
      return !dueDate;
    });

    console.log('Resultado da filtragem:');
    console.log('- Vencidos:', overdue.length);
    console.log('- Hoje:', todayProjects.length);
    console.log('- Amanhã:', tomorrowProjects.length);
    console.log('- Esta semana:', thisWeekProjects.length);
    console.log('- Mais tarde:', laterProjects.length);
    console.log('- Sem data:', noDueDateProjects.length);

    return {
      overdue,
      today: todayProjects,
      tomorrow: tomorrowProjects,
      thisWeek: thisWeekProjects,
      later: [...laterProjects, ...noDueDateProjects]
    };
  };

  const projectsByDeadline = getProjectsByDeadline();
  
  // Se não há projetos com datas de vencimento, mostrar todos os projetos em "Mais Tarde"
  const hasProjectsWithDueDate = safeProjects.some(project => project.due_date || project.dueDate);
  const displayProjects = hasProjectsWithDueDate ? projectsByDeadline : {
    overdue: [],
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: safeProjects
  };

  // Função para mapear projeto para status do Kanban baseado no prazo
  const getProjectStatusForKanban = (project: Project) => {
    const dueDate = project.due_date || project.dueDate;
    if (!dueDate) return 'later';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);
    
    try {
      const date = new Date(dueDate);
      if (isNaN(date.getTime())) return 'later';
      date.setHours(0, 0, 0, 0);
      
      if (date < today) return 'overdue';
      if (date.toDateString() === today.toDateString()) return 'today';
      if (date.toDateString() === tomorrow.toDateString()) return 'tomorrow';
      if (date >= tomorrow && date <= endOfWeek) return 'this_week';
      return 'later';
    } catch (error) {
      return 'later';
    }
  };

  // Renderizar cartão de projeto
  const renderProjectCard = (project: Project) => (
    <div 
      key={project.id} 
      className="group relative bg-white border border-gray-200 rounded-lg p-2 px-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onProjectClick?.(project)}
    >
      {/* Botões de ação - aparecem apenas no hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditProject?.(project);
          }}
          className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
          title="Editar projeto"
        >
          <Edit className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteProject?.(project.id || '');
          }}
          className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
          title="Excluir projeto"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      <div className="mb-2 pr-8">
        <h4 className="text-xs font-normal text-gray-900 mb-1">
          {project.name || 'Projeto sem nome'}
        </h4>
        <p className="text-xs text-gray-600">
          {project.description || 'Sem descrição'}
        </p>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getPriorityColor(project.priority)}`}>
          {getPriorityText(project.priority)}
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusColor(project.status)}`}>
          {getStatusText(project.status)}
        </span>
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
        <Calendar className="h-3 w-3" />
        {(project.due_date || project.dueDate) ? 
          new Date(project.due_date || project.dueDate).toLocaleDateString('pt-BR') : 
          'Sem prazo'
        }
      </div>

      {(project.responsible || project.company) && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          {project.responsible && (
            <>
              <User className="h-3 w-3" />
              <span>{project.responsible}</span>
            </>
          )}
          {project.company && (
            <>
              <Building2 className="h-3 w-3" />
              <span>{project.company}</span>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full -ml-2">
      {/* Cartões de Resumo dos Projetos - Replicando o padrão de Activities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Cartão Vencidas */}
        <div className="bg-white/80 border border-gray-100 rounded-lg p-4 relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
          <div className="absolute top-3 right-3">
            <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
              {displayProjects.overdue.length}
            </span>
          </div>
          <div className="flex flex-col items-start text-left">
            <div className="w-12 h-12 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Vencidas</h3>
            <p className="text-xs text-gray-600">Projetos com prazo vencido</p>
          </div>
        </div>

        {/* Cartão Para Hoje */}
        <div className="bg-white/80 border border-gray-100 rounded-lg p-4 relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
          <div className="absolute top-3 right-3">
            <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
              {displayProjects.today.length}
            </span>
          </div>
          <div className="flex flex-col items-start text-left">
            <div className="w-12 h-12 flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Para Hoje</h3>
            <p className="text-xs text-gray-600">Projetos para hoje</p>
          </div>
        </div>

        {/* Cartão Para Amanhã */}
        <div className="bg-white/80 border border-gray-100 rounded-lg p-4 relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
          <div className="absolute top-3 right-3">
            <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
              {displayProjects.tomorrow.length}
            </span>
          </div>
          <div className="flex flex-col items-start text-left">
            <div className="w-12 h-12 flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Para Amanhã</h3>
            <p className="text-xs text-gray-600">Projetos para amanhã</p>
          </div>
        </div>

        {/* Cartão Esta Semana */}
        <div className="bg-white/80 border border-gray-100 rounded-lg p-4 relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
          <div className="absolute top-3 right-3">
            <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
              {displayProjects.thisWeek.length}
            </span>
          </div>
          <div className="flex flex-col items-start text-left">
            <div className="w-12 h-12 flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Esta Semana</h3>
            <p className="text-xs text-gray-600">Projetos desta semana</p>
          </div>
        </div>

        {/* Cartão Mais Tarde */}
        <div className="bg-white/80 border border-gray-100 rounded-lg p-4 relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
          <div className="absolute top-3 right-3">
            <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
              {displayProjects.later.length}
            </span>
          </div>
          <div className="flex flex-col items-start text-left">
            <div className="w-12 h-12 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Mais Tarde</h3>
            <p className="text-xs text-gray-600">Projetos futuros</p>
          </div>
        </div>
      </div>

      {/* Visualização Principal por Prazo */}
      <div className="p-3">
        {/* Cabeçalho da Visualização - Replicando o padrão de Activities */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-pink-500" />
            <h3 className="text-base font-semibold text-gray-900/85">
              Visualização por Prazo
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={prazoViewMode === 'lista' ? 'default' : 'outline'}
              size="sm"
              className="h-6 px-2 text-xs font-medium"
              onClick={() => setPrazoViewMode('lista')}
              style={prazoViewMode === 'lista' ? {
                backgroundColor: topBarColor,
                borderColor: topBarColor,
                color: 'white'
              } : {}}
            >
              Lista
            </Button>
            <Button
              variant={prazoViewMode === 'kanban' ? 'default' : 'outline'}
              size="sm"
              className="h-6 px-2 text-xs font-medium"
              onClick={() => setPrazoViewMode('kanban')}
              style={prazoViewMode === 'kanban' ? {
                backgroundColor: topBarColor,
                borderColor: topBarColor,
                color: 'white'
              } : {}}
            >
              Kanban
            </Button>
          </div>
        </div>

        {/* Conteúdo baseado no modo de visualização selecionado */}
        {prazoViewMode === 'kanban' ? (
          /* KanbanBoard configurável para Prazo - Mesmo padrão de Activities */
          <KanbanBoard
            activities={safeProjects.filter(project => project.due_date || project.dueDate).map(project => ({
              id: project.id || '',
              title: project.name || 'Projeto sem nome',
              description: project.description || '',
              status: getProjectStatusForKanban(project),
              priority: project.priority || 'low',
              due_date: project.due_date || project.dueDate,
              responsible_id: project.responsible || '',
              owner_id: project.company || '',
              project_id: project.id || '',
              created_at: project.created_at || new Date().toISOString(),
              updated_at: project.updated_at || new Date().toISOString()
            }))}
            onMoveActivity={async (projectId: string, newColumn: string, newPosition: number) => {
              // Implementar lógica de movimentação de projetos se necessário
              console.log('Move project:', projectId, 'to column:', newColumn, 'position:', newPosition);
              return { data: null, error: null };
            }}
            onReindexColumn={async () => ({ data: null, error: null })}
            onAddActivity={onCreateProject}
            onEditActivity={(activity) => {
              const project = safeProjects.find(p => p.id === activity.id);
              if (project) onEditProject?.(project);
            }}
            onDeleteActivity={(activityId) => onDeleteProject?.(activityId)}
            onActivityClick={(activityId) => {
              const project = safeProjects.find(p => p.id === activityId);
              if (project) onProjectClick?.(project);
            }}
            className="px-3"
            columns={[
              { id: 'overdue', title: 'VENCIDOS', color: '#EF4444' },
              { id: 'today', title: 'HOJE', color: '#F59E0B' },
              { id: 'tomorrow', title: 'AMANHÃ', color: '#3B82F6' },
              { id: 'this_week', title: 'ESTA SEMANA', color: '#10B981' },
              { id: 'later', title: 'MAIS TARDE', color: '#8B5CF6' }
            ]}
          />
        ) : (
          /* Lista por Prazo - Visualização em lista com espaçamento correto seguindo padrão de Activities */
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Cabeçalho da Lista */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-600 uppercase tracking-wider">
                <div className="col-span-4">Projeto</div>
                <div className="col-span-2">Prioridade</div>
                <div className="col-span-2">Prazo</div>
                <div className="col-span-2">Responsável</div>
                <div className="col-span-2">Ações</div>
              </div>
            </div>

            {/* Lista de Projetos */}
            <div className="divide-y divide-gray-200">
              {safeProjects
                .filter(project => project.due_date || project.dueDate) // Filtra apenas projetos com prazo
                .sort((a, b) => {
                  // Ordena por prazo: vencidos primeiro, depois por data
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  const aDue = new Date(a.due_date || a.dueDate);
                  const bDue = new Date(b.due_date || b.dueDate);
                  
                  const aIsOverdue = aDue < today;
                  const bIsOverdue = bDue < today;
                  
                  if (aIsOverdue && !bIsOverdue) return -1;
                  if (!aIsOverdue && bIsOverdue) return 1;
                  
                  return aDue.getTime() - bDue.getTime();
                })
                .map(project => {
                  const dueDate = new Date(project.due_date || project.dueDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isOverdue = dueDate < today;
                  
                  return (
                    <div key={project.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Projeto */}
                        <div className="col-span-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
        </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {project.name || 'Projeto sem nome'}
                              </h4>
                              <p className="text-xs text-gray-600 truncate mt-1">
                                {project.description || 'Sem descrição'}
                              </p>
                      </div>
                      </div>
                    </div>

                        {/* Prioridade */}
                        <div className="col-span-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            project.priority === 'urgent' || project.priority === 'urgente' ? 'bg-red-100 text-red-800' :
                            project.priority === 'high' || project.priority === 'alta' ? 'bg-orange-100 text-orange-800' :
                            project.priority === 'medium' || project.priority === 'média' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {project.priority === 'urgent' || project.priority === 'urgente' ? 'Urgente' :
                             project.priority === 'high' || project.priority === 'alta' ? 'Alta' :
                             project.priority === 'medium' || project.priority === 'média' ? 'Média' : 'Baixa'}
                          </span>
                  </div>

                        {/* Prazo */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                              {dueDate.toLocaleDateString('pt-BR')}
                            </span>
                            {isOverdue && (
                              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                Vencido
                              </span>
                      )}
                    </div>
                  </div>

                        {/* Responsável */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {project.responsible || 'Não atribuído'}
                            </span>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-gray-200"
                              onClick={() => onEditProject?.(project)}
                            >
                              <Edit className="h-4 w-4 text-gray-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-gray-200"
                              onClick={() => onProjectClick?.(project)}
                            >
                              <Eye className="h-4 w-4 text-gray-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              
              {safeProjects.filter(project => project.due_date || project.dueDate).length === 0 && (
                <div className="px-6 py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum projeto encontrado</h3>
                  <p className="text-gray-600">Não há projetos com prazo definido no momento.</p>
              </div>
              )}
            </div>
          </div>
        )}
        
        {/* Espaço branco inferior */}
        <div className="h-32 bg-[#F9FAFB]"></div>
      </div>
    </div>
  );
};

export default ProjectDeadlineView;