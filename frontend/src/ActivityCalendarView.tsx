
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Building2,
  Calendar,
  List,
  Grid3x3
} from 'lucide-react';

interface ActivityCalendarViewProps {
  activities: any[];
  companies: any[];
  employees: any[];
  onActivityClick: (activityId: string) => void;
  onUpdateStatus: (activityId: string, newStatus: string) => void;
}

const ActivityCalendarView = ({
  activities,
  companies,
  employees,
  onActivityClick,
  onUpdateStatus
}: ActivityCalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const weekDayNames = ['Seg 14', 'Ter 15', 'Qua 16', 'Qui 17', 'Sex 18', 'Sáb 19', 'Dom 20'];

  const getCompanyName = (companyId?: string) => {
    if (!companyId) return '';
    const company = companies.find(c => c.id === companyId);
    return company?.fantasyName || '';
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.name || '';
  };

  const getActivitiesForDate = (date: Date) => {
    return activities.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Ajustar para segunda-feira como primeiro dia
    const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    // Dias do mês anterior
    for (let i = adjustedStartingDay - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        activities: getActivitiesForDate(prevDate)
      });
    }

    // Dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        activities: getActivitiesForDate(date)
      });
    }

    // Dias do próximo mês
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        activities: getActivitiesForDate(nextDate)
      });
    }

    return days;
  };

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push({
        date,
        activities: getActivitiesForDate(date)
      });
    }
    return days;
  };

  const renderMonthView = () => {
    const days = getDaysInMonth();
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-1">
          {dayNames.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-600 bg-gray-50 rounded">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <div
              key={index}
              className={`min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors ${
                day.isCurrentMonth 
                  ? 'bg-white hover:bg-gray-50' 
                  : 'bg-gray-50 text-gray-400'
              }`}
              onClick={() => onActivityClick(day.date.getTime().toString())}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{day.date.getDate()}</span>
                {day.activities.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {day.activities.length}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1">
                {day.activities.slice(0, 2).map((activity, actIndex) => (
                  <div
                    key={actIndex}
                    className="text-xs p-1 rounded bg-blue-100 text-blue-800 truncate"
                    title={activity.title}
                  >
                    {activity.title}
                  </div>
                ))}
                {day.activities.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{day.activities.length - 2} mais
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays();
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-8 gap-1">
          <div className="p-2 text-center text-sm font-medium text-gray-600 bg-gray-50 rounded">
            Dia
          </div>
          {weekDays.map((day, index) => (
            <div key={index} className="p-2 text-center text-sm font-medium text-gray-600 bg-gray-50 rounded">
              {dayNames[index]} {day.date.getDate()}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-8 gap-1 max-h-[500px] overflow-y-auto">
          {hours.map((hour) => (
            <div key={hour} className="contents">
              <div className="p-2 text-xs text-gray-500 bg-gray-50 rounded text-center">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {weekDays.map((day, dayIndex) => (
                <div
                  key={`${hour}-${dayIndex}`}
                  className="min-h-[40px] p-1 border rounded bg-white hover:bg-gray-50 cursor-pointer"
                >
                  {day.activities
                    .filter(activity => new Date(activity.date).getHours() === hour)
                    .map((activity, actIndex) => (
                      <div
                        key={actIndex}
                        className="text-xs p-1 rounded bg-blue-100 text-blue-800 truncate mb-1"
                        onClick={() => onActivityClick(activity.id)}
                        title={activity.title}
                      >
                        {activity.title}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const todayActivities = getActivitiesForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-1">
          <div className="p-2 text-center text-sm font-medium text-gray-600 bg-gray-50 rounded">
            Hora
          </div>
          <div className="p-2 text-center text-sm font-medium text-gray-600 bg-gray-50 rounded">
            Atividades
          </div>
        </div>
        
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {hours.map((hour) => {
            const hourActivities = todayActivities.filter(
              activity => new Date(activity.date).getHours() === hour
            );
            
            return (
              <div key={hour} className="grid grid-cols-2 gap-1">
                <div className="p-3 bg-gray-50 rounded text-center">
                  <span className="text-sm font-medium text-gray-600">
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                </div>
                <div className="p-3 bg-white border rounded min-h-[60px]">
                  {hourActivities.length > 0 ? (
                    <div className="space-y-2">
                      {hourActivities.map((activity) => (
                        <Card
                          key={activity.id}
                          className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => onActivityClick(activity.id)}
                        >
                          <div className="space-y-1">
                            <h4 className="font-medium text-sm">{activity.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <User className="h-3 w-3" />
                              <span>{getEmployeeName(activity.responsibleId)}</span>
                            </div>
                            {activity.companyId && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Building2 className="h-3 w-3" />
                                <span>{getCompanyName(activity.companyId)}</span>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 text-sm">
                      Nenhuma atividade
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getNavigationHandler = () => {
    switch (viewMode) {
      case 'month': return navigateMonth;
      case 'week': return navigateWeek;
      case 'day': return navigateDay;
      default: return navigateMonth;
    }
  };

  const getDateDisplay = () => {
    switch (viewMode) {
      case 'month':
        return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      case 'week':
        return `Semana de ${currentDate.toLocaleDateString('pt-BR')}`;
      case 'day':
        return currentDate.toLocaleDateString('pt-BR', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => getNavigationHandler()('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <CardTitle className="text-xl">
                {getDateDisplay()}
              </CardTitle>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => getNavigationHandler()('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* View Mode Selector */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-md">
              <Button
                variant={viewMode === 'day' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('day')}
                className="px-3 py-1"
              >
                Dia
              </Button>
              <Button
                variant={viewMode === 'week' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('week')}
                className="px-3 py-1"
              >
                Semana
              </Button>
              <Button
                variant={viewMode === 'month' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('month')}
                className="px-3 py-1"
              >
                Mês
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Content */}
      <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50">
        <CardContent className="p-6">
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityCalendarView;
