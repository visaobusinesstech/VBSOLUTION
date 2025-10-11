import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CalendarEvent {
  id: string;
  lead_id?: string;
  activity_id?: string;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  event_type: 'meeting' | 'call' | 'follow_up' | 'deadline';
  color: string;
  is_all_day: boolean;
  location?: string;
  attendees?: string[];
  created_by?: string;
  company_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCalendarEventData {
  lead_id?: string;
  activity_id?: string;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  event_type?: 'meeting' | 'call' | 'follow_up' | 'deadline';
  color?: string;
  is_all_day?: boolean;
  location?: string;
  attendees?: string[];
}

export const useCalendarEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar eventos do calendário
  const fetchEvents = useCallback(async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Verificar se o Supabase está configurado
      if (!supabase) {
        console.warn('Supabase não configurado, usando dados mock');
        setEvents([]);
        return;
      }

      let query = supabase
        .from('lead_calendar_events')
        .select('*')
        .order('start_datetime', { ascending: true });

      if (startDate && endDate) {
        query = query
          .gte('start_datetime', startDate)
          .lte('end_datetime', endDate);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.warn('Erro ao buscar eventos do calendário do Supabase, usando dados mock:', fetchError);
        setEvents([]);
        return;
      }

      setEvents(data || []);
    } catch (err) {
      console.error('Erro ao buscar eventos do calendário:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar evento
  const createEvent = useCallback(async (eventData: CreateCalendarEventData): Promise<CalendarEvent> => {
    try {
      setError(null);

      // Verificar se o Supabase está configurado
      if (!supabase) {
        console.warn('Supabase não configurado, simulando criação de evento');
        const mockEvent: CalendarEvent = {
          id: Date.now().toString(),
          lead_id: eventData.lead_id,
          activity_id: eventData.activity_id,
          title: eventData.title,
          description: eventData.description,
          start_datetime: eventData.start_datetime,
          end_datetime: eventData.end_datetime,
          event_type: eventData.event_type || 'meeting',
          color: eventData.color || '#3b82f6',
          is_all_day: eventData.is_all_day || false,
          location: eventData.location,
          attendees: eventData.attendees,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setEvents(prev => [...prev, mockEvent]);
        return mockEvent;
      }

      const eventToInsert = {
        lead_id: eventData.lead_id || null,
        activity_id: eventData.activity_id || null,
        title: eventData.title,
        description: eventData.description || null,
        start_datetime: eventData.start_datetime,
        end_datetime: eventData.end_datetime,
        event_type: eventData.event_type || 'meeting',
        color: eventData.color || '#3b82f6',
        is_all_day: eventData.is_all_day || false,
        location: eventData.location || null,
        attendees: eventData.attendees || []
      };

      const { data, error: createError } = await supabase
        .from('lead_calendar_events')
        .insert([eventToInsert] as any)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Atualizar lista local
      setEvents(prev => [...prev, data]);
      
      return data;
    } catch (err) {
      console.error('Erro ao criar evento:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar evento');
      throw err;
    }
  }, []);

  // Atualizar evento
  const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    try {
      setError(null);

      const { data, error: updateError } = await (supabase as any)
        .from('lead_calendar_events')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Atualizar lista local
      setEvents(prev => prev.map(event => 
        event.id === id ? data : event
      ));
      
      return data;
    } catch (err) {
      console.error('Erro ao atualizar evento:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar evento');
      throw err;
    }
  }, []);

  // Deletar evento
  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('lead_calendar_events')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Atualizar lista local
      setEvents(prev => prev.filter(event => event.id !== id));
    } catch (err) {
      console.error('Erro ao deletar evento:', err);
      setError(err instanceof Error ? err.message : 'Erro ao deletar evento');
      throw err;
    }
  }, []);

  // Buscar eventos por período
  const fetchEventsByDateRange = useCallback(async (startDate: Date, endDate: Date) => {
    const start = startDate.toISOString();
    const end = endDate.toISOString();
    await fetchEvents(start, end);
  }, [fetchEvents]);

  // Buscar eventos iniciais
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    fetchEvents,
    fetchEventsByDateRange,
    createEvent,
    updateEvent,
    deleteEvent
  };
};

