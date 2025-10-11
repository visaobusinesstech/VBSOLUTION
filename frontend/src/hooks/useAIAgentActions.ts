import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { AIAgentAction, CreateAIAgentActionRequest, UpdateAIAgentActionRequest, AIAgentActionFilters, AIAgentActionStats } from '@/types/ai-agent-actions';

interface UseAIAgentActionsReturn {
  actions: AIAgentAction[];
  loading: boolean;
  error: string | null;
  stats: AIAgentActionStats | null;
  createAction: (action: CreateAIAgentActionRequest) => Promise<AIAgentAction | null>;
  updateAction: (action: UpdateAIAgentActionRequest) => Promise<AIAgentAction | null>;
  deleteAction: (id: string) => Promise<boolean>;
  toggleAction: (id: string, isActive: boolean) => Promise<boolean>;
  reorderActions: (actionIds: string[]) => Promise<boolean>;
  loadActions: (filters?: AIAgentActionFilters) => Promise<void>;
  loadStats: (aiAgentConfigId: string) => Promise<void>;
  executeAction: (actionId: string, inputData: Record<string, any>) => Promise<any>;
}

export const useAIAgentActions = (aiAgentConfigId?: string): UseAIAgentActionsReturn => {
  const [actions, setActions] = useState<AIAgentAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AIAgentActionStats | null>(null);

  // Carregar ações
  const loadActions = useCallback(async (filters: AIAgentActionFilters = {}) => {
    if (!aiAgentConfigId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('ai_agent_actions')
        .select('*')
        .eq('ai_agent_config_id', aiAgentConfigId)
        .eq('owner_id', (await supabase.auth.getUser()).data.user?.id);

      // Aplicar filtros
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,condition.ilike.%${filters.search}%`);
      }

      // Ordenação
      const sortBy = filters.sort_by || 'execution_order';
      const sortOrder = filters.sort_order || 'asc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Paginação
      if (filters.page && filters.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setActions(data || []);
    } catch (err) {
      console.error('Erro ao carregar ações:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar ações');
    } finally {
      setLoading(false);
    }
  }, [aiAgentConfigId]);

  // Carregar estatísticas
  const loadStats = useCallback(async (configId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .rpc('get_ai_agent_action_stats', { p_config_id: configId });

      if (fetchError) {
        throw fetchError;
      }

      setStats(data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  }, []);

  // Criar ação
  const createAction = useCallback(async (actionData: CreateAIAgentActionRequest): Promise<AIAgentAction | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('ai_agent_actions')
        .insert([actionData])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Atualizar lista local
      setActions(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Erro ao criar ação:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar ação');
      return null;
    }
  }, []);

  // Atualizar ação
  const updateAction = useCallback(async (actionData: UpdateAIAgentActionRequest): Promise<AIAgentAction | null> => {
    try {
      const { id, ...updateData } = actionData;
      
      const { data, error: updateError } = await supabase
        .from('ai_agent_actions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Atualizar lista local
      setActions(prev => prev.map(action => action.id === id ? data : action));
      return data;
    } catch (err) {
      console.error('Erro ao atualizar ação:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar ação');
      return null;
    }
  }, []);

  // Deletar ação
  const deleteAction = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('ai_agent_actions')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Atualizar lista local
      setActions(prev => prev.filter(action => action.id !== id));
      return true;
    } catch (err) {
      console.error('Erro ao deletar ação:', err);
      setError(err instanceof Error ? err.message : 'Erro ao deletar ação');
      return false;
    }
  }, []);

  // Toggle ação (ativar/desativar)
  const toggleAction = useCallback(async (id: string, isActive: boolean): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('ai_agent_actions')
        .update({ is_active: isActive })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      // Atualizar lista local
      setActions(prev => prev.map(action => 
        action.id === id ? { ...action, is_active: isActive } : action
      ));
      return true;
    } catch (err) {
      console.error('Erro ao toggle ação:', err);
      setError(err instanceof Error ? err.message : 'Erro ao toggle ação');
      return false;
    }
  }, []);

  // Reordenar ações
  const reorderActions = useCallback(async (actionIds: string[]): Promise<boolean> => {
    try {
      const updates = actionIds.map((id, index) => ({
        id,
        execution_order: index
      }));

      const { error: updateError } = await supabase
        .from('ai_agent_actions')
        .upsert(updates);

      if (updateError) {
        throw updateError;
      }

      // Atualizar lista local
      setActions(prev => {
        const reordered = actionIds.map(id => prev.find(action => action.id === id)).filter(Boolean) as AIAgentAction[];
        return reordered;
      });
      return true;
    } catch (err) {
      console.error('Erro ao reordenar ações:', err);
      setError(err instanceof Error ? err.message : 'Erro ao reordenar ações');
      return false;
    }
  }, []);

  // Executar ação
  const executeAction = useCallback(async (actionId: string, inputData: Record<string, any>): Promise<any> => {
    try {
      const { data, error: executeError } = await supabase
        .functions
        .invoke('execute-ai-agent-action', {
          body: {
            action_id: actionId,
            input_data: inputData
          }
        });

      if (executeError) {
        throw executeError;
      }

      return data;
    } catch (err) {
      console.error('Erro ao executar ação:', err);
      setError(err instanceof Error ? err.message : 'Erro ao executar ação');
      throw err;
    }
  }, []);

  // Carregar ações quando o componente monta ou aiAgentConfigId muda
  useEffect(() => {
    if (aiAgentConfigId) {
      loadActions();
      loadStats(aiAgentConfigId);
    }
  }, [aiAgentConfigId, loadActions, loadStats]);

  return {
    actions,
    loading,
    error,
    stats,
    createAction,
    updateAction,
    deleteAction,
    toggleAction,
    reorderActions,
    loadActions,
    loadStats,
    executeAction
  };
};
