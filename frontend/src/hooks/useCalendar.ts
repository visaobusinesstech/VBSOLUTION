import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIntegrations } from './useIntegrations';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end?: Date;
  type: 'meeting' | 'call' | 'demo' | 'proposal' | 'follow_up' | 'deadline' | 'other';
  lead_id?: string;
  lead?: {
    id: string;
    name: string;
    company?: string;
    email?: string;
    phone?: string;
  };
  location?: string;
  attendees?: string[];
  is_all_day?: boolean;
  reminder_minutes?: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'postponed';
  google_event_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEventData {
  title: string;
  description?: string;
  start: Date;
  end?: Date;
  type: CalendarEvent['type'];
  lead_id?: string;
  location?: string;
  attendees?: string[];
  is_all_day?: boolean;
  reminder_minutes?: number;
  sync_to_google?: boolean;
}

export type ViewMode = 'month' | 'week' | 'day';

export function useCalendar() {
  const { user } = useAuth();
  const { integrations, isPlatformConnected } = useIntegrations();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Buscar eventos do calendário
  const fetchEvents = useCallback(async (startDate?: Date, endDate?: Date) => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Buscar eventos locais (lead_activities)
      const localEventsResponse = await fetch('/api/calendar/events', {
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json',
          'Authorization': 'Bearer VB_DEV_TOKEN',
        },
      });

      if (!localEventsResponse.ok) {
        throw new Error('Erro ao buscar eventos locais');
      }

      const localEventsData = await localEventsResponse.json();
      let allEvents: CalendarEvent[] = localEventsData.success ? localEventsData.data : [];

      // Se Google Calendar estiver conectado, buscar eventos do Google
      if (isPlatformConnected('GOOGLE')) {
        const googleIntegration = integrations.find(i => i.platform === 'GOOGLE' && i.isConnected);
        if (googleIntegration) {
          try {
            const googleEventsResponse = await fetch(
              `/api/integrations/google/calendars/${googleIntegration.id}`,
              {
                headers: {
                  'x-user-id': user.id,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (googleEventsResponse.ok) {
              const googleEventsData = await googleEventsResponse.json();
              if (googleEventsData.success) {
                // Buscar eventos de um calendário específico (ex: 'primary')
                const primaryCalendar = googleEventsData.data.items.find((c: any) => c.primary);
                if (primaryCalendar) {
                  const calendarEventsResponse = await fetch(
                    `/api/integrations/google/events/${googleIntegration.id}/${primaryCalendar.id}`,
                    {
                      headers: {
                        'x-user-id': user.id,
                        'Content-Type': 'application/json',
                      },
                    }
                  );

                  if (calendarEventsResponse.ok) {
                    const calendarEventsData = await calendarEventsResponse.json();
                    if (calendarEventsData.success) {
                      // Converter eventos do Google para o formato local
                      const googleEvents: CalendarEvent[] = calendarEventsData.data.items.map((event: any) => ({
                        id: `google-${event.id}`,
                        title: event.summary || 'Sem título',
                        description: event.description,
                        start: new Date(event.start.dateTime || event.start.date),
                        end: event.end ? new Date(event.end.dateTime || event.end.date) : undefined,
                        type: 'meeting',
                        location: event.location,
                        attendees: event.attendees?.map((a: any) => a.email) || [],
                        is_all_day: !event.start.dateTime,
                        status: 'scheduled' as const,
                        google_event_id: event.id,
                        created_at: event.created,
                        updated_at: event.updated,
                      }));

                      allEvents = [...allEvents, ...googleEvents];
                    }
                  }
                }
              }
            }
          } catch (googleError) {
            console.warn('Erro ao buscar eventos do Google Calendar:', googleError);
            // Continuar com eventos locais mesmo se Google falhar
          }
        }
      }

      setEvents(allEvents);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar eventos:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, integrations, isPlatformConnected]);

  // Criar novo evento
  const createEvent = useCallback(async (eventData: CreateEventData): Promise<CalendarEvent | null> => {
    if (!user?.id) return null;

    try {
      // Criar evento local primeiro
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json',
          'Authorization': 'Bearer VB_DEV_TOKEN',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar evento');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar evento');
      }

      const newEvent = data.data;

      // Se solicitado e Google Calendar estiver conectado, sincronizar
      if (eventData.sync_to_google && isPlatformConnected('GOOGLE')) {
        const googleIntegration = integrations.find(i => i.platform === 'GOOGLE' && i.isConnected);
        if (googleIntegration) {
          try {
            // Buscar calendário primário
            const calendarsResponse = await fetch(
              `/api/integrations/google/calendars/${googleIntegration.id}`,
              {
                headers: {
                  'x-user-id': user.id,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (calendarsResponse.ok) {
              const calendarsData = await calendarsResponse.json();
              if (calendarsData.success) {
                const primaryCalendar = calendarsData.data.items.find((c: any) => c.primary);
                if (primaryCalendar) {
                  // Criar evento no Google Calendar
                  const googleEventData = {
                    summary: eventData.title,
                    description: eventData.description,
                    start: eventData.is_all_day 
                      ? { date: eventData.start.toISOString().split('T')[0] }
                      : { dateTime: eventData.start.toISOString() },
                    end: eventData.end 
                      ? (eventData.is_all_day 
                          ? { date: eventData.end.toISOString().split('T')[0] }
                          : { dateTime: eventData.end.toISOString() })
                      : undefined,
                    location: eventData.location,
                    attendees: eventData.attendees?.map(email => ({ email })),
                  };

                  const googleEventResponse = await fetch(
                    `/api/integrations/google/events/${googleIntegration.id}/${primaryCalendar.id}`,
                    {
                      method: 'POST',
                      headers: {
                        'x-user-id': user.id,
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer VB_DEV_TOKEN',
                      },
                      body: JSON.stringify(googleEventData),
                    }
                  );

                  if (googleEventResponse.ok) {
                    const googleEventData = await googleEventResponse.json();
                    if (googleEventData.success) {
                      // Atualizar evento local com ID do Google
                      await fetch(`/api/calendar/events/${newEvent.id}`, {
                        method: 'PATCH',
                        headers: {
                          'x-user-id': user.id,
                          'Content-Type': 'application/json',
                          'Authorization': 'Bearer VB_DEV_TOKEN',
                        },
                        body: JSON.stringify({
                          google_event_id: googleEventData.data.id,
                        }),
                      });
                    }
                  }
                }
              }
            }
          } catch (googleError) {
            console.warn('Erro ao sincronizar com Google Calendar:', googleError);
            // Evento local foi criado com sucesso, apenas Google falhou
          }
        }
      }

      // Recarregar eventos
      await fetchEvents();
      return newEvent;
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao criar evento:', err);
      return null;
    }
  }, [user?.id, integrations, isPlatformConnected, fetchEvents]);

  // Atualizar evento
  const updateEvent = useCallback(async (eventId: string, eventData: Partial<CreateEventData>): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const response = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json',
          'Authorization': 'Bearer VB_DEV_TOKEN',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar evento');
      }

      const data = await response.json();
      
      if (data.success) {
        await fetchEvents(); // Recarregar eventos
        return true;
      } else {
        throw new Error(data.error || 'Erro ao atualizar evento');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao atualizar evento:', err);
      return false;
    }
  }, [user?.id, fetchEvents]);

  // Deletar evento
  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const response = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json',
          'Authorization': 'Bearer VB_DEV_TOKEN',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar evento');
      }

      const data = await response.json();
      
      if (data.success) {
        await fetchEvents(); // Recarregar eventos
        return true;
      } else {
        throw new Error(data.error || 'Erro ao deletar evento');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao deletar evento:', err);
      return false;
    }
  }, [user?.id, fetchEvents]);

  // Buscar eventos para uma data específica
  const getEventsForDate = useCallback((date: Date): CalendarEvent[] => {
    const dateString = date.toDateString();
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = event.end ? new Date(event.end) : eventStart;
      
      return (
        eventStart.toDateString() === dateString ||
        eventEnd.toDateString() === dateString ||
        (eventStart <= date && eventEnd >= date)
      );
    });
  }, [events]);

  // Buscar eventos para um intervalo de datas
  const getEventsForDateRange = useCallback((startDate: Date, endDate: Date): CalendarEvent[] => {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = event.end ? new Date(event.end) : eventStart;
      
      return (
        (eventStart >= startDate && eventStart <= endDate) ||
        (eventEnd >= startDate && eventEnd <= endDate) ||
        (eventStart <= startDate && eventEnd >= endDate)
      );
    });
  }, [events]);

  // Navegar pelo calendário
  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  }, [currentDate, viewMode]);

  // Ir para hoje
  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Carregar eventos iniciais
  useEffect(() => {
    if (user?.id) {
      fetchEvents();
    }
  }, [user?.id, fetchEvents]);

  return {
    events,
    loading,
    error,
    currentDate,
    viewMode,
    setViewMode,
    setCurrentDate,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    getEventsForDateRange,
    navigateDate,
    goToToday,
    refreshEvents: fetchEvents,
    isGoogleConnected: isPlatformConnected('GOOGLE'),
  };
}
