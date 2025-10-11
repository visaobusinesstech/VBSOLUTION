
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CommercialActivity {
  id: string;
  title: string;
  type: 'call' | 'email' | 'meeting' | 'whatsapp' | 'task' | 'presentation';
  description?: string;
  datetime: string;
  status: 'pending' | 'completed' | 'cancelled';
  responsible_id: string;
  lead_id?: string;
  company_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityWithDetails extends CommercialActivity {
  lead?: {
    name: string;
    value: number;
  };
  company?: {
    fantasy_name: string;
  };
  responsible?: {
    name: string;
    email: string;
  };
}

export const useCommercialActivities = () => {
  const [activities, setActivities] = useState<ActivityWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('commercial_activities')
        .select(`
          *,
          leads:lead_id(name, value),
          companies:company_id(fantasy_name),
          team_members:responsible_id(name, email)
        `)
        .order('datetime', { ascending: true });

      if (error) throw error;
      
      console.log('Raw activities data:', data);
      
      // Map the data to our TypeScript interface
      const typedActivities = (data || []).map(activity => ({
        id: activity.id,
        title: activity.title,
        type: activity.type as 'call' | 'email' | 'meeting' | 'whatsapp' | 'task' | 'presentation',
        description: activity.description,
        datetime: activity.datetime,
        status: activity.status as 'pending' | 'completed' | 'cancelled',
        responsible_id: activity.responsible_id,
        lead_id: activity.lead_id,
        company_id: activity.company_id,
        created_at: activity.created_at,
        updated_at: activity.updated_at,
        lead: Array.isArray(activity.leads) && activity.leads.length > 0 ? {
          name: activity.leads[0].name,
          value: Number(activity.leads[0].value) || 0
        } : undefined,
        company: Array.isArray(activity.companies) && activity.companies.length > 0 ? {
          fantasy_name: activity.companies[0].fantasy_name
        } : undefined,
        responsible: Array.isArray(activity.team_members) && activity.team_members.length > 0 ? {
          name: activity.team_members[0].name,
          email: activity.team_members[0].email
        } : undefined
      })) as ActivityWithDetails[];
      
      setActivities(typedActivities);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err instanceof Error ? err.message : 'Error fetching activities');
    } finally {
      setLoading(false);
    }
  };

  const createActivity = async (activityData: Omit<CommercialActivity, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('commercial_activities')
        .insert([activityData])
        .select()
        .single();

      if (error) throw error;
      await fetchActivities();
      return data;
    } catch (err) {
      console.error('Error creating activity:', err);
      setError(err instanceof Error ? err.message : 'Error creating activity');
      throw err;
    }
  };

  const updateActivity = async (id: string, updates: Partial<CommercialActivity>) => {
    try {
      const { data, error } = await supabase
        .from('commercial_activities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchActivities();
      return data;
    } catch (err) {
      console.error('Error updating activity:', err);
      setError(err instanceof Error ? err.message : 'Error updating activity');
      throw err;
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  return {
    activities,
    loading,
    error,
    createActivity,
    updateActivity,
    refetch: fetchActivities
  };
};
