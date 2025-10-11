import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { CalendarEvent } from '@/hooks/useCalendar';
import { LucideIcon } from 'lucide-react';

interface CalendarWeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onCreateEvent: (date: Date) => void;
  getEventTypeColor: (type: CalendarEvent['type']) => string;
  getEventTypeIcon: (type: CalendarEvent['type']) => LucideIcon;
}

export function CalendarWeekView({
  currentDate,
  events,
  onDateClick,
  onEventClick,
  onCreateEvent,
  getEventTypeColor,
  getEventTypeIcon,
}: CalendarWeekViewProps) {
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const weekDays = useMemo(() => {
    // Encontrar o domingo da semana atual
    const sunday = new Date(currentDate);
    sunday.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);
      
      const dayEvents = events.filter(event => {
        const eventStart = new Date(event.start);
        const eventEnd = event.end ? new Date(event.end) : eventStart;
        const dateString = date.toDateString();
        
        return (
          eventStart.toDateString() === dateString ||
          eventEnd.toDateString() === dateString ||
          (eventStart <= date && eventEnd >= date)
        );
      });

      days.push({
        date,
        events: dayEvents,
      });
    }
    
    return days;
  }, [currentDate, events]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getHourEvents = (hour: number, dayEvents: CalendarEvent[]) => {
    return dayEvents.filter(event => {
      if (event.is_all_day) return false;
      const eventHour = new Date(event.start).getHours();
      return eventHour === hour;
    });
  };

  const getAllDayEvents = (dayEvents: CalendarEvent[]) => {
    return dayEvents.filter(event => event.is_all_day);
  };

  // Gerar horas do dia (6h às 22h)
  const hours = Array.from({ length: 17 }, (_, i) => i + 6);

  return (
    <div className="space-y-2">
      {/* Cabeçalho dos dias da semana */}
      <div className="grid grid-cols-8 gap-1">
        <div className="p-3 text-center text-sm font-medium text-muted-foreground bg-muted/30 rounded-lg">
          Hora
        </div>
        {dayNames.map((day, index) => {
          const dayData = weekDays[index];
          return (
            <div 
              key={day} 
              className={`
                p-3 text-center text-sm font-medium rounded-lg cursor-pointer transition-colors
                ${isToday(dayData.date) ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-muted/30 text-muted-foreground'}
                hover:bg-muted/50
              `}
              onClick={() => onDateClick(dayData.date)}
            >
              <div>{day}</div>
              <div className="text-lg">{dayData.date.getDate()}</div>
            </div>
          );
        })}
      </div>

      {/* Eventos do dia todo */}
      {weekDays.some(day => getAllDayEvents(day.events).length > 0) && (
        <div className="grid grid-cols-8 gap-1 mb-2">
          <div className="p-2 text-xs font-medium text-muted-foreground bg-muted/20 rounded">
            Dia todo
          </div>
          {weekDays.map((day, index) => {
            const allDayEvents = getAllDayEvents(day.events);
            return (
              <div key={index} className="min-h-[40px] p-1 space-y-1">
                {allDayEvents.map((event, eventIndex) => {
                  const EventIcon = getEventTypeIcon(event.type);
                  return (
                    <div
                      key={eventIndex}
                      className={`
                        text-xs p-1.5 rounded text-white truncate cursor-pointer hover:opacity-80 transition-opacity
                        ${getEventTypeColor(event.type)}
                      `}
                      title={event.title}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <EventIcon className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{event.title}</span>
                      </div>
                    </div>
                  );
                })}
                {allDayEvents.length === 0 && (
                  <div 
                    className="text-xs text-muted-foreground/50 text-center py-2 hover:text-muted-foreground transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateEvent(day.date);
                    }}
                  >
                    +
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Grade de horas */}
      <div className="grid grid-cols-8 gap-1">
        {hours.map((hour) => (
          <React.Fragment key={hour}>
            <div className="p-2 text-xs font-medium text-muted-foreground bg-muted/20 rounded text-center">
              {hour.toString().padStart(2, '0')}:00
            </div>
            {weekDays.map((day, dayIndex) => {
              const hourEvents = getHourEvents(hour, day.events);
              return (
                <div 
                  key={dayIndex}
                  className="min-h-[60px] p-1 border-l border-t border-muted/30 relative"
                  onClick={() => onCreateEvent(day.date)}
                >
                  {hourEvents.map((event, eventIndex) => {
                    const EventIcon = getEventTypeIcon(event.type);
                    return (
                      <div
                        key={eventIndex}
                        className={`
                          text-xs p-1 rounded text-white cursor-pointer hover:opacity-80 transition-opacity mb-1
                          ${getEventTypeColor(event.type)}
                        `}
                        title={`${event.title} - ${new Date(event.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <EventIcon className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{event.title}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Resumo da semana */}
      <div className="mt-4 p-3 bg-muted/30 rounded-lg">
        <div className="text-sm font-medium mb-2">Resumo da Semana</div>
        <div className="grid grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground">Total:</span>
            <span className="ml-1 font-medium">
              {weekDays.reduce((total, day) => total + day.events.length, 0)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Reuniões:</span>
            <span className="ml-1 font-medium">
              {weekDays.reduce((total, day) => 
                total + day.events.filter(e => e.type === 'meeting').length, 0
              )}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Ligações:</span>
            <span className="ml-1 font-medium">
              {weekDays.reduce((total, day) => 
                total + day.events.filter(e => e.type === 'call').length, 0
              )}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Demos:</span>
            <span className="ml-1 font-medium">
              {weekDays.reduce((total, day) => 
                total + day.events.filter(e => e.type === 'demo').length, 0
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
