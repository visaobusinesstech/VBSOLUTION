
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  color?: string;
  event_type: string;
  responsible?: string;
}

interface CalendarDayViewProps {
  events: CalendarEvent[];
  currentDate: Date;
}

const CalendarDayView = ({ events, currentDate }: CalendarDayViewProps) => {
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_datetime);
      return eventDate.toDateString() === date.toDateString();
    }).sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());
  };

  const dayEvents = getEventsForDate(currentDate);
  const isToday = currentDate.toDateString() === new Date().toDateString();

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDuration = (start: string, end: string) => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    
    if (duration < 60) {
      return `${duration}min`;
    } else {
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header do dia */}
      <Card className={`${isToday ? 'ring-2 ring-vb-primary' : ''}`}>
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
      </Card>

      {/* Timeline de eventos */}
      <div className="space-y-3">
        {dayEvents.length > 0 ? (
          dayEvents.map((event, index) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Linha do tempo */}
                  <div className="flex flex-col items-center">
                    <div 
                      className="w-4 h-4 rounded-full border-2 bg-white"
                      style={{ borderColor: event.color || '#6b7280' }}
                    />
                    {index < dayEvents.length - 1 && (
                      <div className="w-0.5 h-12 bg-gray-200 mt-2" />
                    )}
                  </div>

                  {/* Conteúdo do evento */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-sm">{event.title}</h3>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        )}
                      </div>
                      <Badge 
                        variant="outline" 
                        style={{ 
                          color: event.color,
                          borderColor: event.color 
                        }}
                      >
                        {event.event_type}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatTime(event.start_datetime)} - {formatTime(event.end_datetime)}
                        </span>
                        <span className="text-xs">
                          ({formatDuration(event.start_datetime, event.end_datetime)})
                        </span>
                      </div>
                      
                      {event.responsible && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{event.responsible}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-2">Nenhum evento agendado</h3>
              <p className="text-sm text-muted-foreground">
                Não há eventos programados para este dia.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CalendarDayView;
