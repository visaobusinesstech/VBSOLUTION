import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Debug: Verificar se o módulo está sendo carregado
console.log('🔄 useLeads-simple.ts: Módulo carregado');

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  stage_id: string;
  status: 'hot' | 'cold' | 'won' | 'lost';
  created_at: string;
  updated_at: string;
}

export interface CreateLeadData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  stage_id: string;
  status?: 'hot' | 'cold';
}

export const useLeads = () => {
  console.log('🔍 useLeads-simple.ts: Hook useLeads chamado');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);

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
      
      // Filtrar e validar leads para evitar erros de DOM
      const validLeads = (data || []).filter(lead => {
        // Garantir que lead existe e tem id válido
        if (!lead || !lead.id || typeof lead.id !== 'string') {
          console.warn('⚠️ Lead inválido encontrado:', lead);
          return false;
        }
        return true;
      }).map(lead => ({
        ...lead,
        // Garantir propriedades obrigatórias
        id: lead.id,
        name: lead.name || 'Lead sem nome',
        stage_id: lead.stage_id || '',
        status: lead.status || 'cold',
        created_at: lead.created_at || new Date().toISOString(),
        updated_at: lead.updated_at || new Date().toISOString()
      }));
      
      setLeads(validLeads);
    } catch (err) {
      console.error('Erro ao buscar leads:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const createLead = async (leadData: CreateLeadData): Promise<Lead | null> => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) throw error;

      await fetchLeads();
      return data;
    } catch (err) {
      console.error('Erro ao criar lead:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return null;
    }
  };

  const moveLeadToStage = async (leadId: string, stageId: string): Promise<boolean> => {
    try {
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
  };

  const markLeadAsWon = async (leadId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: 'won' })
        .eq('id', leadId);

      if (error) throw error;

      await fetchLeads();
      return true;
    } catch (err) {
      console.error('Erro ao marcar lead como ganho:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    }
  };

  const markLeadAsLost = async (leadId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: 'lost' })
        .eq('id', leadId);

      if (error) throw error;

      await fetchLeads();
      return true;
    } catch (err) {
      console.error('Erro ao marcar lead como perdido:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    }
  };

  const updateLead = async (id: string, leadData: Partial<CreateLeadData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('leads')
        .update(leadData)
        .eq('id', id);

      if (error) throw error;

      await fetchLeads();
      return true;
    } catch (err) {
      console.error('Erro ao atualizar lead:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    }
  };

  const deleteLead = async (leadId: string): Promise<boolean> => {
    try {
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
  };

  const getLeadById = (id: string): Lead | undefined => {
    return leads.find(lead => lead.id === id);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

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

export default useLeads;
