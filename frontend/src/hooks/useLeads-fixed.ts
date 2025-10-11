import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { retryFetch, cache } from '@/utils/retryFetch';

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  stage_id: string;
  status: 'hot' | 'cold' | 'won' | 'lost';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  value?: number;
  currency?: string;
  responsible_id?: string;
  tags?: string[];
  profile_image_url?: string;
  days_in_funnel?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateLeadData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  stage_id: string;
  status?: 'hot' | 'cold';
  tags?: string[];
}

export function useLeads() {
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
        setLoading(false);
        return;
      }

      // Verificar cache primeiro
      const cacheKey = 'leads';
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log('✅ Usando dados do cache para leads');
        setLeads(cachedData);
        setLoading(false);
        return;
      }

      const validLeads = await retryFetch(async () => {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao buscar leads:', error);
          throw error;
        }

        // Processamento otimizado
        return (data || []).filter(lead => lead?.id).map(lead => ({
          ...lead,
          name: lead.name || 'Lead sem nome',
          stage_id: lead.stage_id || '',
          status: lead.status || 'cold',
          created_at: lead.created_at || new Date().toISOString(),
          updated_at: lead.updated_at || new Date().toISOString()
        }));
      });
      
      // Salvar no cache
      cache.set(cacheKey, validLeads);
      setLeads(validLeads);
    } catch (err) {
      console.error('Erro ao buscar leads:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createLead = async (leadData: CreateLeadData): Promise<Lead | null> => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) throw error;

      // Adicionar novo lead ao estado local
      if (data) {
        const newLead = {
          ...data,
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString()
        };
        setLeads(prevLeads => [newLead, ...prevLeads]);
      }
      
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

      // Atualizar estado local em vez de buscar todos os dados
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId 
            ? { ...lead, stage_id: stageId, updated_at: new Date().toISOString() }
            : lead
        )
      );
      
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

      // Atualizar estado local
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId 
            ? { ...lead, status: 'won' as const, updated_at: new Date().toISOString() }
            : lead
        )
      );
      
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

      // Atualizar estado local
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId 
            ? { ...lead, status: 'lost' as const, updated_at: new Date().toISOString() }
            : lead
        )
      );
      
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

      // Atualizar estado local
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === id 
            ? { ...lead, ...leadData, updated_at: new Date().toISOString() }
            : lead
        )
      );
      
      return true;
    } catch (err) {
      console.error('Erro ao atualizar lead:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    }
  };

  const deleteLead = async (leadId: string): Promise<boolean> => {
    try {
      console.log('🗑️ Excluindo lead do Supabase:', leadId);
      
      // Primeiro, tentar excluir referências em outras tabelas
      console.log('🔄 Removendo referências em outras tabelas...');
      
      // Lista de tabelas que podem ter referências ao lead
      const referenceTables = [
        'atendimentos',
        'lead_activities', 
        'lead_notes',
        'lead_attachments',
        'lead_comments',
        'lead_tasks',
        'contacts' // Adicionar contatos relacionados
      ];
      
      for (const tableName of referenceTables) {
        try {
          let error;
          
          if (tableName === 'contacts') {
            // Para contatos, buscar por phone ou email do lead
            const leadData = await supabase
              .from('leads')
              .select('phone, email')
              .eq('id', leadId)
              .single();
            
            if (leadData.data) {
              const { phone, email } = leadData.data;
              
              // Excluir contatos que tenham o mesmo phone ou email
              if (phone) {
                const { error: phoneError } = await supabase
                  .from('contacts')
                  .delete()
                  .eq('phone', phone);
                error = phoneError;
              }
              
              if (email && !error) {
                const { error: emailError } = await supabase
                  .from('contacts')
                  .delete()
                  .eq('email', email);
                error = emailError;
              }
            }
          } else {
            // Para outras tabelas, usar lead_id
            const { error: refError } = await supabase
              .from(tableName)
              .delete()
              .eq('lead_id', leadId);
            error = refError;
          }
          
          if (error) {
            console.warn(`⚠️ Erro ao remover referências de ${tableName}:`, error);
          } else {
            console.log(`✅ Referências de ${tableName} removidas`);
          }
        } catch (refError) {
          console.warn(`⚠️ Erro ao acessar tabela ${tableName}:`, refError);
        }
      }

      // Agora excluir o lead da tabela principal
      console.log('🗑️ Excluindo lead da tabela leads...');
      const { error, data } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId)
        .select();

      if (error) {
        console.error('❌ Erro ao excluir lead do Supabase:', error);
        
        // Se for erro de foreign key, tentar abordagem alternativa
        if (error.code === '23503' || error.message?.includes('23503')) {
          console.log('🔄 Tentando abordagem alternativa...');
          
          // Tentar atualizar o lead para marcá-lo como excluído
          const { error: updateError } = await supabase
            .from('leads')
            .update({ 
              status: 'lost',
              name: '[EXCLUÍDO] ' + (data?.[0]?.name || 'Lead'),
              email: null,
              phone: null,
              company: null
            })
            .eq('id', leadId);
          
          if (updateError) {
            console.error('❌ Erro na abordagem alternativa:', updateError);
            throw error; // Re-throw o erro original
          }
          
          console.log('✅ Lead marcado como excluído (soft delete)');
        } else {
          throw error;
        }
      } else {
        console.log('✅ Lead excluído com sucesso do Supabase:', data);
      }

      // Remover do estado local
      setLeads(prevLeads => prevLeads.filter(lead => lead.id !== leadId));
      console.log('✅ Lead removido do estado local');
      
      return true;
    } catch (err) {
      console.error('❌ Erro ao excluir lead:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      
      // NÃO remover do estado local se não conseguiu excluir do banco
      console.log('❌ Lead NÃO foi excluído do banco, mantendo na tela');
      return false;
    }
  };

  const getLeadById = (id: string): Lead | undefined => {
    return leads.find(lead => lead.id === id);
  };

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
}

// Default export
export default useLeads;
