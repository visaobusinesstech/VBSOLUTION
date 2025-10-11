
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  color?: string;
  event_type: string;
}

interface CalendarWeekViewProps {
  events: CalendarEvent[];
  currentDate: Date;
}

const CalendarWeekView = ({ events, currentDate }: CalendarWeekViewProps) => {
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

  const weekDates = getWeekDates(currentDate);
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_datetime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  return (
    <div className="grid grid-cols-7 gap-2 h-[600px]">
      {weekDates.map((date, index) => {
        const dayEvents = getEventsForDate(date);
        const isToday = date.toDateString() === new Date().toDateString();
        
        return (
          <Card key={index} className={`flex flex-col ${isToday ? 'ring-2 ring-vb-primary' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-center">
                <div className="text-xs font-medium text-muted-foreground">{weekDays[index]}</div>
                <div className={`text-lg font-bold ${isToday ? 'text-vb-primary' : ''}`}>
                  {date.getDate()}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-2 space-y-1 overflow-y-auto">
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-2 rounded text-xs"
                  style={{
                    backgroundColor: event.color ? `${event.color}20` : '#f3f4f6',
                    borderLeft: `3px solid ${event.color || '#6b7280'}`
                  }}
                >
                  <div className="font-medium text-xs line-clamp-2">{event.title}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    {new Date(event.start_datetime).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  <Badge variant="outline" className="text-xs mt-1">
                    {event.event_type}
                  </Badge>
                </div>
              ))}
              {dayEvents.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <Calendar className="h-4 w-4 mx-auto mb-1 opacity-50" />
                  <p className="text-xs">Nenhum evento</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CalendarWeekView;
