import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Força o reload do módulo - timestamp: 2025-01-03 20:30
console.log('🔄 useLeads.ts carregado - v3.0');

export interface Lead {
  id: string;
  owner_id?: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  source?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  stage_id: string;
  responsible_id?: string;
  contact_id?: string;
  product_id?: string;
  product_quantity?: number;
  product_price?: number;
  value?: number;
  currency?: string;
  expected_close_date?: string;
  notes?: string;
  status: 'hot' | 'cold' | 'won' | 'lost';
  created_at: string;
  updated_at: string;
  days_in_funnel?: number;
  stage?: {
    id: string;
    name: string;
    color: string;
    order_position: number;
  };
  contact?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
  };
  product?: {
    id: string;
    name: string;
    base_price: number;
    currency: string;
  };
  responsible?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface CreateLeadData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  source?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  stage_id: string;
  responsible_id?: string;
  contact_id?: string;
  product_id?: string;
  value?: number;
  currency?: string;
  expected_close_date?: string;
  notes?: string;
  status?: 'hot' | 'cold';
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
        console.warn('Supabase não configurado, usando dados mock');
        setLeads([]);
        return;
      }

      console.log('🔍 Buscando leads...');
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar leads:', error);
        throw error;
      }

      console.log('✅ Leads encontrados:', data?.length || 0);

      const processedLeads = (data || []).map(lead => ({
        ...lead,
        days_in_funnel: Math.floor(
          (new Date().getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)
        ),
        priority: lead.priority || 'medium',
        status: lead.status || 'cold'
      }));

      setLeads(processedLeads);
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

      const validatedData = {
        name: leadData.name?.trim() || '',
        email: leadData.email?.trim() || null,
        phone: leadData.phone?.trim() || null,
        company: leadData.company?.trim() || null,
        position: leadData.position?.trim() || null,
        source: leadData.source || 'website',
        priority: leadData.priority || 'medium',
        stage_id: leadData.stage_id,
        responsible_id: leadData.responsible_id || null,
        contact_id: leadData.contact_id || null,
        product_id: leadData.product_id || null,
        value: leadData.value || 0,
        currency: leadData.currency || 'BRL',
        expected_close_date: leadData.expected_close_date || null,
        notes: leadData.notes?.trim() || null,
        status: leadData.status || 'cold'
      };

      const { data, error } = await supabase
        .from('leads')
        .insert([validatedData])
        .select('id, name, email, phone, company, source, status, value, stage_id, created_at');

      if (error) {
        console.error('❌ Erro ao criar lead:', error);
        throw error;
      }

      await fetchLeads();
      
      const lead = data && data.length > 0 ? data[0] : null;
      return lead ? {
        ...lead,
        days_in_funnel: 0,
        priority: lead.priority || 'medium',
        status: lead.status || 'cold'
      } : null;
    } catch (err) {
      console.error('Erro ao criar lead:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return null;
    }
  }, [fetchLeads]);

  const updateLead = useCallback(async (id: string, leadData: Partial<CreateLeadData>): Promise<boolean> => {
    try {
      if (!supabase) {
        console.warn('Supabase não configurado');
        return false;
      }

      const { error } = await supabase
        .from('leads')
        .update({
          ...leadData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await fetchLeads();
      return true;
    } catch (err) {
      console.error('Erro ao atualizar lead:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
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
        .update({
          stage_id: stageId,
          updated_at: new Date().toISOString()
        })
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

  const markLeadAsWon = useCallback(async (leadId: string): Promise<boolean> => {
    try {
      if (!supabase) {
        console.warn('Supabase não configurado');
        return false;
      }

      const { error } = await supabase
        .from('leads')
        .update({
          status: 'won',
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      await fetchLeads();
      return true;
    } catch (err) {
      console.error('Erro ao marcar lead como ganho:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    }
  }, [fetchLeads]);

  const markLeadAsLost = useCallback(async (leadId: string, deleteContact: boolean = false): Promise<boolean> => {
    try {
      if (!supabase) {
        console.warn('Supabase não configurado');
        return false;
      }

      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('contact_id')
        .eq('id', leadId)
        .single();

      if (leadError) throw leadError;

      const { error: updateError } = await supabase
        .from('leads')
        .update({
          status: 'lost',
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (updateError) throw updateError;

      if (deleteContact && lead?.contact_id) {
        const { error: deleteError } = await supabase
          .from('contacts')
          .delete()
          .eq('id', lead.contact_id);

        if (deleteError) throw deleteError;
      }

      await fetchLeads();
      return true;
    } catch (err) {
      console.error('Erro ao marcar lead como perdido:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    }
  }, [fetchLeads]);

  const deleteLead = useCallback(async (leadId: string): Promise<boolean> => {
    try {
      if (!supabase) {
        console.warn('Supabase não configurado');
        return false;
      }

      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

      await fetchLeads();
      return true;
    } catch (err) {
      console.error('Erro ao deletar lead:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    }
  }, [fetchLeads]);

  const getLeadById = useCallback((id: string): Lead | undefined => {
    return leads.find(lead => lead.id === id);
  }, [leads]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return {
    leads,
    loading,
    error,
    fetchLeads,
    createLead,
    updateLead,
    moveLeadToStage,
    markLeadAsWon,
    markLeadAsLost,
    deleteLead,
    getLeadById
  };
};

// Força o reload do módulo
console.log('✅ useLeads hook exportado com sucesso');

// Export default para garantir compatibilidade
export default useLeads;