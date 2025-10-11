import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { retryFetch, cache } from '../utils/retryFetch';

export interface FunnelStage {
  id: string;
  owner_id?: string;
  name: string;
  order_index: number;
  color: string;
  is_default?: boolean;
  stage_type?: string;
  pipeline_id?: string;
  created_at: string;
}

export interface CreateFunnelStageData {
  name: string;
  order_index: number;
  color?: string;
  is_default?: boolean;
  stage_type?: string;
  pipeline_id?: string;
  created_at?: string;
}

export interface Pipeline {
  id: string;
  owner_id?: string;
  name: string;
  description?: string;
  is_default?: boolean;
  created_at: string;
  stages?: FunnelStage[];
}

export const useFunnelStages = () => {
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar etapas do funil
  const fetchStages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);


      if (!supabase) {
        console.warn('Supabase não configurado, usando dados mock');
        // Dados padrão se não houver Supabase (usando UUIDs válidos)
        const defaultStages: FunnelStage[] = [
          { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Novo Lead', order_index: 1, color: '#3b82f6', created_at: new Date().toISOString() },
          { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Contato Inicial', order_index: 2, color: '#8b5cf6', created_at: new Date().toISOString() },
          { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Proposta', order_index: 3, color: '#f59e0b', created_at: new Date().toISOString() },
          { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Reunião', order_index: 4, color: '#ef4444', created_at: new Date().toISOString() },
          { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Fechamento', order_index: 5, color: '#10b981', created_at: new Date().toISOString() }
        ];
      setStages(defaultStages);
      return;
      }

      const { data, error } = await supabase
        .from('funnel_stages')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;

      
      // Filtrar e validar dados para evitar erros de DOM
      const validStages = (data || []).filter(stage => {
        // Garantir que stage existe e tem id válido
        if (!stage || !stage.id || typeof stage.id !== 'string') {
          console.warn('⚠️ Stage inválido encontrado:', stage);
          return false;
        }
        return true;
      }).map(stage => ({
        ...stage,
        // Garantir propriedades obrigatórias
        id: stage.id,
        name: stage.name || 'Etapa sem nome',
        order_index: stage.order_index || 0,
        color: stage.color || '#3b82f6',
        created_at: stage.created_at || new Date().toISOString()
      }));

      
      setStages(validStages);
    } catch (err) {
      console.error('Erro ao buscar etapas do funil:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      
      // Fallback para dados padrão (usando UUIDs válidos)
      const defaultStages: FunnelStage[] = [
        { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Novo Lead', order_index: 1, color: '#3b82f6', created_at: new Date().toISOString() },
        { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Contato Inicial', order_index: 2, color: '#8b5cf6', created_at: new Date().toISOString() },
        { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Proposta', order_index: 3, color: '#f59e0b', created_at: new Date().toISOString() },
        { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Reunião', order_index: 4, color: '#ef4444', created_at: new Date().toISOString() },
        { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Fechamento', order_index: 5, color: '#10b981', created_at: new Date().toISOString() }
      ];
      setStages(defaultStages);
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar nova etapa
  const createStage = useCallback(async (stageData: CreateFunnelStageData): Promise<FunnelStage | null> => {
    try {
      if (!supabase) {
        console.warn('Supabase não configurado');
        return null;
      }

      const { data, error } = await supabase
        .from('funnel_stages')
        .insert([stageData])
        .select()
        .single();

      if (error) throw error;

      await fetchStages(); // Recarregar lista
      return data;
    } catch (err) {
      console.error('Erro ao criar etapa:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return null;
    }
  }, [fetchStages]);

  // Atualizar etapa
  const updateStage = useCallback(async (id: string, stageData: Partial<CreateFunnelStageData>): Promise<boolean> => {
    try {
      if (!supabase) {
        console.warn('Supabase não configurado');
        return false;
      }

      const { error } = await supabase
        .from('funnel_stages')
        .update(stageData)
        .eq('id', id);

      if (error) throw error;

      await fetchStages(); // Recarregar lista
      return true;
    } catch (err) {
      console.error('Erro ao atualizar etapa:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    }
  }, [fetchStages]);

  // Deletar etapa
  const deleteStage = useCallback(async (id: string): Promise<boolean> => {
    try {
      if (!supabase) {
        console.warn('Supabase não configurado');
        return false;
      }

      const { error } = await supabase
        .from('funnel_stages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchStages(); // Recarregar lista
      return true;
    } catch (err) {
      console.error('Erro ao deletar etapa:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    }
  }, [fetchStages]);

  // Buscar pipelines
  const fetchPipelines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        console.warn('Supabase não configurado, usando dados mock');
        const defaultPipeline: Pipeline[] = [
          { 
            id: '550e8400-e29b-41d4-a716-446655440000', 
            name: 'Pipeline Padrão', 
            description: 'Pipeline padrão do sistema',
            is_default: true,
            created_at: new Date().toISOString()
          }
        ];
        setPipelines(defaultPipeline);
        return;
      }

      // Verificar cache primeiro
      const cacheKey = 'pipelines';
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log('✅ Usando dados do cache para pipelines');
        setPipelines(cachedData);
        setLoading(false);
        return;
      }

      const pipelines = await retryFetch(async () => {
        const { data, error } = await supabase
          .from('pipelines')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return data || [];
      });
      
      // Salvar no cache
      cache.set(cacheKey, pipelines);
      setPipelines(pipelines);
    } catch (err) {
      console.error('Erro ao buscar pipelines:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      
      // Fallback para dados padrão
      const defaultPipeline: Pipeline[] = [
        { 
          id: '550e8400-e29b-41d4-a716-446655440000', 
          name: 'Pipeline Padrão', 
          description: 'Pipeline padrão do sistema',
          is_default: true,
          created_at: new Date().toISOString()
        }
      ];
      setPipelines(defaultPipeline);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    fetchStages();
    fetchPipelines();
  }, []); // Remover dependências para evitar loop infinito

  return {
    stages,
    pipelines,
    loading,
    error,
    fetchStages,
    createStage,
    updateStage,
    deleteStage,
    fetchPipelines
  };
};