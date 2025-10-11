import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Target, AlertTriangle } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import CalendarViewSelector, { CalendarViewType } from '@/components/CalendarViewSelector';

interface ProjectCalendarTimelineProps {
  onProjectClick?: (project: any) => void;
}

const ProjectCalendarTimeline = ({ onProjectClick }: ProjectCalendarTimelineProps) => {
  const { state } = useProject();
  const [currentView, setCurrentView] = useState<CalendarViewType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const getProjectsWithDueDate = () => {
    return state.projects.filter(project => project.dueDate);
  };

  const getProjectsForDate = (date: Date) => {
    return getProjectsWithDueDate().filter(project => {
      if (!project.dueDate) return false;
      const projectDate = new Date(project.dueDate);
      return projectDate.toDateString() === date.toDateString();
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em Andamento': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Concluído': return 'bg-green-100 text-green-800 border-green-200';
      case 'Pausado': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Planejado': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    return due < today;
  };

  const isDueSoon = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startOfWeek);
      weekDate.setDate(startOfWeek.getDate() + i);
      week.push(weekDate);
    }
    return week;
  };

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers */}
        {weekDays.map(day => (
          <div key={day} className="text-center font-medium text-gray-500 p-2 text-sm">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((date, index) => {
          if (!date) {
            return <div key={index} className="h-28 border border-gray-100"></div>;
          }

          const dayProjects = getProjectsForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`h-28 border border-gray-100 p-1 ${isToday ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}
            >
              <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                {date.getDate()}
              </div>
              
              <div className="space-y-1 overflow-hidden">
                {dayProjects.slice(0, 3).map(project => {
                  const overdue = isOverdue(project.dueDate);
                  const dueSoon = isDueSoon(project.dueDate);
                  
                  return (
                    <div
                      key={project.id}
                      onClick={() => onProjectClick?.(project)}
                      className={`text-xs border rounded px-1 py-0.5 cursor-pointer hover:shadow-sm truncate ${
                        overdue 
                          ? 'bg-red-100 border-red-300 text-red-800' 
                          : dueSoon
                          ? 'bg-orange-100 border-orange-300 text-orange-800'
                          : 'bg-white border-gray-200'
                      }`}
                      title={`${project.name} - ${overdue ? 'ATRASADO' : dueSoon ? 'VENCE EM BREVE' : 'Prazo'}`}
                    >
                      <div className="flex items-center gap-1">
                        {(overdue || dueSoon) && (
                          <AlertTriangle className="w-2 h-2 flex-shrink-0" />
                        )}
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ 
                            backgroundColor: overdue ? '#EF4444' : dueSoon ? '#F97316' : 
                            project.status === 'Em Andamento' ? '#3B82F6' : '#10B981' 
                          }}
                        />
                        <span className="truncate">{project.name}</span>
                      </div>
                      <div className="text-xs opacity-75 truncate">
                        {overdue ? 'ATRASADO' : dueSoon ? 'VENCE HOJE!' : project.responsible}
                      </div>
                    </div>
                  );
                })}
                {dayProjects.length > 3 && (
                  <div className="text-xs text-gray-500 bg-gray-100 rounded px-1 py-0.5">
                    +{dayProjects.length - 3} projetos
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date, index) => {
          const dayProjects = getProjectsForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <Card key={index} className={`h-64 ${isToday ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-center">
                  <div className="text-xs font-medium text-muted-foreground">{weekDays[index]}</div>
                  <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : ''}`}>
                    {date.getDate()}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-2 overflow-y-auto">
                {dayProjects.map(project => {
                  const overdue = isOverdue(project.dueDate);
                  const dueSoon = isDueSoon(project.dueDate);
                  
                  return (
                    <div
                      key={project.id}
                      onClick={() => onProjectClick?.(project)}
                      className={`p-2 rounded border cursor-pointer hover:shadow-sm ${
                        overdue 
                          ? 'bg-red-50 border-red-200' 
                          : dueSoon
                          ? 'bg-orange-50 border-orange-200'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {(overdue || dueSoon) && (
                          <AlertTriangle className={`w-3 h-3 ${overdue ? 'text-red-500' : 'text-orange-500'}`} />
                        )}
                        <div className="text-sm font-medium truncate flex-1" title={project.name}>
                          {project.name}
                        </div>
                      </div>
                      
                      <Badge className={`text-xs mb-1 ${getStatusColor(project.status)}`}>
                        {project.status}
                      </Badge>
                      
                      {(overdue || dueSoon) && (
                        <div className={`text-xs font-medium mb-1 ${overdue ? 'text-red-700' : 'text-orange-700'}`}>
                          {overdue ? '🚨 ATRASADO' : '⚠️ VENCE HOJE'}
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        {project.responsible}
                      </div>
                    </div>
                  );
                })}
                {dayProjects.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <Calendar className="h-4 w-4 mx-auto mb-1 opacity-50" />
                    <p className="text-xs">Nenhum projeto</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayProjects = getProjectsForDate(currentDate);
    const isToday = currentDate.toDateString() === new Date().toDateString();

    return (
      <div className="space-y-4">
        <Card className={`${isToday ? 'ring-2 ring-blue-500' : ''}`}>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Calendar className="h-5 w-5" />
              <div>
                <div className="text-lg font-bold">
                  {currentDate.toLocaleDateString('pt-BR', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric' 
                  })}
                </div>
                {isToday && (
                  <Badge variant="default" className="mt-1">
                    Hoje
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dayProjects.length > 0 ? (
              dayProjects.map(project => {
                const overdue = isOverdue(project.dueDate);
                const dueSoon = isDueSoon(project.dueDate);
                
                return (
                  <Card 
                    key={project.id} 
                    className={`cursor-pointer hover:shadow-md ${
                      overdue 
                        ? 'border-red-300 bg-red-50' 
                        : dueSoon
                        ? 'border-orange-300 bg-orange-50'
                        : ''
                    }`}
                    onClick={() => onProjectClick?.(project)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {(overdue || dueSoon) && (
                              <AlertTriangle className={`w-4 h-4 ${overdue ? 'text-red-500' : 'text-orange-500'}`} />
                            )}
                            <h3 className="font-semibold text-sm">{project.name}</h3>
                          </div>
                          
                          {(overdue || dueSoon) && (
                            <div className={`text-sm font-medium mb-2 ${overdue ? 'text-red-700' : 'text-orange-700'}`}>
                              {overdue ? '🚨 PROJETO ATRASADO!' : '⚠️ PRAZO VENCE HOJE!'}
                            </div>
                          )}
                          
                          <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              <span>{project.responsible}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>Prazo: {new Date(project.dueDate).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge className={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                          {(overdue || dueSoon) && (
                            <Badge variant="outline" className={overdue ? 'border-red-400 text-red-700' : 'border-orange-400 text-orange-700'}>
                              {overdue ? 'Atrasado' : 'Urgente'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-medium mb-2">Nenhum projeto com prazo</h3>
                <p className="text-sm text-muted-foreground">
                  Não há projetos com prazo para este dia.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Calendário de Projetos</h2>
          <p className="text-muted-foreground text-sm">
            Visualize os prazos de todos os projetos com alertas para prazos vencidos
          </p>
        </div>
        <CalendarViewSelector currentView={currentView} onViewChange={setCurrentView} />
      </div>

      {/* Calendar content */}
      <div className="bg-white rounded-lg border p-6">
        {currentView === 'month' && renderMonthView()}
        {currentView === 'week' && renderWeekView()}
        {currentView === 'day' && renderDayView()}
      </div>
    </div>
  );
};

export default ProjectCalendarTimeline;
