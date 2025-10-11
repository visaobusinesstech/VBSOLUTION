import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  stage_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  stage_id: string;
  source?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status: 'hot' | 'cold' | 'won' | 'lost';
  value?: number;
  currency?: string;
}

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        console.warn('Supabase não configurado');
        setLeads([]);
        return;
      }

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar leads:', error);
        throw error;
      }

      setLeads(data || []);
    } catch (err) {
      console.error('Erro ao buscar leads:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createLead = useCallback(async (leadData: CreateLeadData): Promise<Lead | null> => {
    try {
      if (!supabase) {
        console.warn('Supabase não configurado');
        return null;
      }

      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select('*');

      if (error) {
        console.error('❌ Erro ao criar lead:', error);
        throw error;
      }

      await fetchLeads();
      return data && data.length > 0 ? data[0] : null;
    } catch (err) {
      console.error('Erro ao criar lead:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return null;
    }
  }, [fetchLeads]);

  const moveLeadToStage = useCallback(async (leadId: string, stageId: string): Promise<boolean> => {
    try {
      if (!supabase) {
        console.warn('Supabase não configurado');
        return false;
      }

      const { error } = await supabase
        .from('leads')
        .update({ stage_id: stageId })
        .eq('id', leadId);

      if (error) throw error;

      await fetchLeads();
      return true;
    } catch (err) {
      console.error('Erro ao mover lead:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    }
  }, [fetchLeads]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return {
    leads,
    loading,
    error,
    fetchLeads,
    createLead,
    moveLeadToStage
  };
};

