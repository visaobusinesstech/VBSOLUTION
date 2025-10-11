import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { CalendarEvent } from '@/hooks/useCalendar';
import { LucideIcon } from 'lucide-react';

interface CalendarDayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onCreateEvent: (date: Date) => void;
  getEventTypeColor: (type: CalendarEvent['type']) => string;
  getEventTypeIcon: (type: CalendarEvent['type']) => LucideIcon;
}

export function CalendarDayView({
  currentDate,
  events,
  onEventClick,
  onCreateEvent,
  getEventTypeColor,
  getEventTypeIcon,
}: CalendarDayViewProps) {
  const dayEvents = useMemo(() => {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = event.end ? new Date(event.end) : eventStart;
      const dateString = currentDate.toDateString();
      
      return (
        eventStart.toDateString() === dateString ||
        eventEnd.toDateString() === dateString ||
        (eventStart <= currentDate && eventEnd >= currentDate)
      );
    }).sort((a, b) => {
      if (a.is_all_day && !b.is_all_day) return -1;
      if (!a.is_all_day && b.is_all_day) return 1;
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });
  }, [currentDate, events]);

  const allDayEvents = useMemo(() => {
    return dayEvents.filter(event => event.is_all_day);
  }, [dayEvents]);

  const timedEvents = useMemo(() => {
    return dayEvents.filter(event => !event.is_all_day);
  }, [dayEvents]);

  // Gerar slots de hora (6h às 22h)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      const hourEvents = timedEvents.filter(event => {
        const eventHour = new Date(event.start).getHours();
        return eventHour === hour;
      });

      slots.push({
        hour,
        events: hourEvents,
      });
    }
    return slots;
  }, [timedEvents]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho do dia */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div>
          <h2 className="text-2xl font-bold">
            {formatDate(currentDate)}
          </h2>
          <p className="text-muted-foreground">
            {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'} agendado{dayEvents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isToday(currentDate) && (
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              Hoje
            </Badge>
          )}
          <button
            onClick={() => onCreateEvent(currentDate)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + Novo Evento
          </button>
        </div>
      </div>

      {/* Eventos do dia todo */}
      {allDayEvents.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-muted-foreground">Dia Todo</h3>
          <div className="space-y-2">
            {allDayEvents.map((event) => {
              const EventIcon = getEventTypeIcon(event.type);
              return (
                <div
                  key={event.id}
                  className={`
                    p-4 rounded-lg cursor-pointer hover:opacity-80 transition-opacity
                    ${getEventTypeColor(event.type)}
                  `}
                  onClick={() => onEventClick(event)}
                >
                  <div className="flex items-center gap-3 text-white">
                    <EventIcon className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium">{event.title}</h4>
                      {event.description && (
                        <p className="text-sm opacity-90">{event.description}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {event.type === 'meeting' ? 'Reunião' : 
                       event.type === 'call' ? 'Ligação' : 
                       event.type === 'demo' ? 'Demo' : 
                       event.type === 'proposal' ? 'Proposta' : 
                       event.type === 'follow_up' ? 'Follow-up' : 
                       event.type === 'deadline' ? 'Prazo' : 'Outro'}
                    </Badge>
                  </div>
                  {event.lead && (
                    <div className="mt-2 text-sm opacity-90 text-white">
                      📞 {event.lead.name} {event.lead.company && `- ${event.lead.company}`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline de eventos */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-muted-foreground">Agenda</h3>
        <div className="space-y-1">
          {timeSlots.map((slot) => (
            <div key={slot.hour} className="flex gap-4">
              <div className="w-16 text-sm font-medium text-muted-foreground text-right pt-2">
                {slot.hour.toString().padStart(2, '0')}:00
              </div>
              <div className="flex-1 min-h-[60px] border-l-2 border-muted/30 pl-4 relative">
                {slot.events.length > 0 ? (
                  slot.events.map((event) => {
                    const EventIcon = getEventTypeIcon(event.type);
                    const startTime = new Date(event.start);
                    const endTime = event.end ? new Date(event.end) : new Date(startTime.getTime() + 60 * 60 * 1000);
                    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
                    
                    return (
                      <div
                        key={event.id}
                        className={`
                          mb-2 p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity
                          ${getEventTypeColor(event.type)}
                        `}
                        onClick={() => onEventClick(event)}
                      >
                        <div className="flex items-start gap-3 text-white">
                          <EventIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{event.title}</h4>
                              <span className="text-xs opacity-75">
                                {startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                {endTime && ` - ${endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                              </span>
                            </div>
                            {event.description && (
                              <p className="text-sm opacity-90 mb-2">{event.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs opacity-75">
                              {event.lead && (
                                <span>👤 {event.lead.name}</span>
                              )}
                              {event.location && (
                                <span>📍 {event.location}</span>
                              )}
                              <span>⏱️ {duration}min</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div 
                    className="h-12 border border-dashed border-muted/30 rounded-lg flex items-center justify-center cursor-pointer hover:border-muted transition-colors"
                    onClick={() => onCreateEvent(currentDate)}
                  >
                    <span className="text-xs text-muted-foreground">+ Adicionar evento</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumo do dia */}
      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <div className="text-sm font-medium mb-3">Resumo do Dia</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total:</span>
            <span className="ml-1 font-medium">{dayEvents.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Reuniões:</span>
            <span className="ml-1 font-medium">
              {dayEvents.filter(e => e.type === 'meeting').length}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Ligações:</span>
            <span className="ml-1 font-medium">
              {dayEvents.filter(e => e.type === 'call').length}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Demos:</span>
            <span className="ml-1 font-medium">
              {dayEvents.filter(e => e.type === 'demo').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
