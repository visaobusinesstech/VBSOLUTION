import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LeadActivity {
  id: string;
  lead_id: string;
  type: 'meeting' | 'call' | 'email' | 'follow_up' | 'deadline' | 'note';
  title: string;
  description?: string;
  scheduled_date?: string;
  completed_at?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'rescheduled';
  duration_minutes?: number;
  location?: string;
  attendees?: string[];
  created_by?: string;
  company_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadActivityData {
  lead_id: string;
  type: 'meeting' | 'call' | 'email' | 'follow_up' | 'deadline' | 'note';
  title: string;
  description?: string;
  scheduled_date?: string;
  duration_minutes?: number;
  location?: string;
  attendees?: string[];
}

export const useLeadActivities = () => {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar atividades
  const fetchActivities = useCallback(async (leadId?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Verificar se o Supabase está configurado
      if (!supabase) {
        console.warn('Supabase não configurado, usando dados mock');
        setActivities([]);
        return;
      }

      let query = supabase
        .from('lead_activities')
        .select('*')
        .order('scheduled_date', { ascending: true });

      if (leadId) {
        query = query.eq('lead_id', leadId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.warn('Erro ao buscar atividades do Supabase, usando dados mock:', fetchError);
        setActivities([]);
        return;
      }

      setActivities(data || []);
    } catch (err) {
      console.error('Erro ao buscar atividades:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar atividade
  const createActivity = useCallback(async (activityData: CreateLeadActivityData): Promise<LeadActivity> => {
    try {
      setError(null);

      // Verificar se o Supabase está configurado
      if (!supabase) {
        console.warn('Supabase não configurado, simulando criação de atividade');
        const mockActivity: LeadActivity = {
          id: Date.now().toString(),
          lead_id: activityData.lead_id,
          type: activityData.type,
          title: activityData.title,
          description: activityData.description,
          scheduled_date: activityData.scheduled_date,
          status: 'pending',
          duration_minutes: activityData.duration_minutes,
          location: activityData.location,
          attendees: activityData.attendees,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setActivities(prev => [...prev, mockActivity]);
        return mockActivity;
      }

      const activityToInsert = {
        lead_id: activityData.lead_id,
        type: activityData.type,
        title: activityData.title,
        description: activityData.description || null,
        scheduled_date: activityData.scheduled_date || null,
        status: 'pending' as const,
        duration_minutes: activityData.duration_minutes || null,
        location: activityData.location || null,
        attendees: activityData.attendees || []
      };

      const { data, error: createError } = await supabase
        .from('lead_activities')
        .insert([activityToInsert] as any)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Atualizar lista local
      setActivities(prev => [...prev, data]);
      
      return data;
    } catch (err) {
      console.error('Erro ao criar atividade:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar atividade');
      throw err;
    }
  }, []);

  // Atualizar atividade
  const updateActivity = useCallback(async (id: string, updates: Partial<LeadActivity>): Promise<LeadActivity> => {
    try {
      setError(null);

      const { data, error: updateError } = await (supabase as any)
        .from('lead_activities')
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
      setActivities(prev => prev.map(activity => 
        activity.id === id ? data : activity
      ));
      
      return data;
    } catch (err) {
      console.error('Erro ao atualizar atividade:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar atividade');
      throw err;
    }
  }, []);

  // Deletar atividade
  const deleteActivity = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('lead_activities')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Atualizar lista local
      setActivities(prev => prev.filter(activity => activity.id !== id));
    } catch (err) {
      console.error('Erro ao deletar atividade:', err);
      setError(err instanceof Error ? err.message : 'Erro ao deletar atividade');
      throw err;
    }
  }, []);

  // Marcar atividade como completa
  const completeActivity = useCallback(async (id: string): Promise<LeadActivity> => {
    return await updateActivity(id, {
      status: 'completed',
      completed_at: new Date().toISOString()
    });
  }, [updateActivity]);

  // Cancelar atividade
  const cancelActivity = useCallback(async (id: string): Promise<LeadActivity> => {
    return await updateActivity(id, {
      status: 'cancelled'
    });
  }, [updateActivity]);

  // Reagendar atividade
  const rescheduleActivity = useCallback(async (id: string, newDate: string): Promise<LeadActivity> => {
    return await updateActivity(id, {
      scheduled_date: newDate,
      status: 'rescheduled'
    });
  }, [updateActivity]);

  // Buscar atividades iniciais
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    completeActivity,
    cancelActivity,
    rescheduleActivity
  };
};

