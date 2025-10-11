import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { CalendarEvent } from '@/hooks/useCalendar';
import { LucideIcon } from 'lucide-react';

interface CalendarMonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onCreateEvent: (date: Date) => void;
  getEventTypeColor: (type: CalendarEvent['type']) => string;
  getEventTypeIcon: (type: CalendarEvent['type']) => LucideIcon;
}

export function CalendarMonthView({
  currentDate,
  events,
  onDateClick,
  onEventClick,
  onCreateEvent,
  getEventTypeColor,
  getEventTypeIcon,
}: CalendarMonthViewProps) {
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Dias do mês anterior
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      const dayEvents = events.filter(event => {
        const eventStart = new Date(event.start);
        const eventEnd = event.end ? new Date(event.end) : eventStart;
        const dateString = prevDate.toDateString();
        
        return (
          eventStart.toDateString() === dateString ||
          eventEnd.toDateString() === dateString ||
          (eventStart <= prevDate && eventEnd >= prevDate)
        );
      });

      days.push({
        date: prevDate,
        isCurrentMonth: false,
        events: dayEvents,
      });
    }

    // Dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
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
        isCurrentMonth: true,
        events: dayEvents,
      });
    }

    // Dias do próximo mês para completar a grade
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dayEvents = events.filter(event => {
        const eventStart = new Date(event.start);
        const eventEnd = event.end ? new Date(event.end) : eventStart;
        const dateString = nextDate.toDateString();
        
        return (
          eventStart.toDateString() === dateString ||
          eventEnd.toDateString() === dateString ||
          (eventStart <= nextDate && eventEnd >= nextDate)
        );
      });

      days.push({
        date: nextDate,
        isCurrentMonth: false,
        events: dayEvents,
      });
    }

    return days;
  }, [currentDate, events]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="space-y-2">
      {/* Cabeçalho dos dias da semana */}
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map((day) => (
          <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground bg-muted/30 rounded-lg">
            {day}
          </div>
        ))}
      </div>

      {/* Grade do calendário */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`
              min-h-[120px] p-2 border rounded-lg cursor-pointer transition-all duration-200
              ${day.isCurrentMonth ? 'bg-background hover:bg-muted' : 'bg-muted/30 text-muted-foreground'}
              ${isToday(day.date) ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
              hover:shadow-sm
            `}
            onClick={() => onDateClick(day.date)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${isToday(day.date) ? 'text-blue-600 font-bold' : ''}`}>
                {day.date.getDate()}
              </span>
              {day.events.length > 0 && (
                <Badge variant="secondary" className="text-xs h-5 px-1.5">
                  {day.events.length}
                </Badge>
              )}
            </div>
            
            <div className="space-y-1">
              {day.events.slice(0, 3).map((event, eventIndex) => {
                const EventIcon = getEventTypeIcon(event.type);
                return (
                  <div
                    key={eventIndex}
                    className={`
                      text-xs p-1.5 rounded text-white truncate cursor-pointer hover:opacity-80 transition-opacity
                      ${getEventTypeColor(event.type)}
                    `}
                    title={`${event.title} - ${event.is_all_day ? 'Dia todo' : new Date(event.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
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
              
              {day.events.length > 3 && (
                <div className="text-xs text-muted-foreground text-center py-1">
                  +{day.events.length - 3} mais
                </div>
              )}
              
              {day.events.length === 0 && day.isCurrentMonth && (
                <div 
                  className="text-xs text-muted-foreground/50 text-center py-2 hover:text-muted-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateEvent(day.date);
                  }}
                >
                  + Adicionar evento
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
