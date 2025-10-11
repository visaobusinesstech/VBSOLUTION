import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AIAgentVariable, CreateAIAgentVariableData, UpdateAIAgentVariableData } from '../types/ai-agent-variables';

export const useAIAgentVariables = (configId: string) => {
  const [variables, setVariables] = useState<AIAgentVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar variáveis
  const loadVariables = async () => {
    if (!configId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('ai_agent_variables')
        .select('*')
        .eq('ai_agent_config_id', configId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setVariables(data || []);
    } catch (err) {
      console.error('Erro ao carregar variáveis:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Criar nova variável
  const createVariable = async (variableData: CreateAIAgentVariableData) => {
    try {
      setSaving(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('ai_agent_variables')
        .insert([{
          ...variableData,
          ai_agent_config_id: configId,
          owner_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      setVariables(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Erro ao criar variável:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Atualizar variável
  const updateVariable = async (variableData: UpdateAIAgentVariableData) => {
    try {
      setSaving(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('ai_agent_variables')
        .update({
          name: variableData.name,
          key: variableData.key,
          data_type: variableData.data_type,
          description: variableData.description,
          is_system_variable: variableData.is_system_variable,
          default_value: variableData.default_value,
          options: variableData.options,
          validation_rules: variableData.validation_rules
        })
        .eq('id', variableData.id)
        .select()
        .single();

      if (error) throw error;
      
      setVariables(prev => prev.map(v => v.id === variableData.id ? data : v));
      return data;
    } catch (err) {
      console.error('Erro ao atualizar variável:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Deletar variável
  const deleteVariable = async (variableId: string) => {
    try {
      setSaving(true);
      setError(null);
      
      const { error } = await supabase
        .from('ai_agent_variables')
        .delete()
        .eq('id', variableId);

      if (error) throw error;
      
      setVariables(prev => prev.filter(v => v.id !== variableId));
    } catch (err) {
      console.error('Erro ao deletar variável:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Carregar variáveis quando configId mudar
  useEffect(() => {
    loadVariables();
  }, [configId]);

  return {
    variables,
    loading,
    saving,
    error,
    loadVariables,
    createVariable,
    updateVariable,
    deleteVariable
  };
};
