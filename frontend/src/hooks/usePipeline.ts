import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Pipeline {
  id: string;
  name: string;
  is_default: boolean;
  company_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  position: number;
  color: string;
  is_active: boolean;
  created_at: string;
}

export const usePipeline = () => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar pipelines
  const fetchPipelines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        console.warn('Supabase não configurado, usando dados mock');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('pipelines')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Erro ao buscar pipelines:', fetchError);
        throw fetchError;
      }

      setPipelines(data || []);
    } catch (err) {
      console.error('Erro ao buscar pipelines:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar pipelines');
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar etapas de uma pipeline
  const fetchPipelineStages = useCallback(async (pipelineId?: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        console.warn('Supabase não configurado, usando dados mock');
        // Dados mock para desenvolvimento (usando UUIDs válidos)
        const mockStages: PipelineStage[] = [
          { id: '550e8400-e29b-41d4-a716-446655440001', pipeline_id: 'default', name: 'Novo Lead', position: 1, color: '#ef4444', is_active: true, created_at: '2024-01-01T00:00:00Z' },
          { id: '550e8400-e29b-41d4-a716-446655440002', pipeline_id: 'default', name: 'Contato Inicial', position: 2, color: '#f59e0b', is_active: true, created_at: '2024-01-01T00:00:00Z' },
          { id: '550e8400-e29b-41d4-a716-446655440003', pipeline_id: 'default', name: 'Proposta', position: 3, color: '#3b82f6', is_active: true, created_at: '2024-01-01T00:00:00Z' },
          { id: '550e8400-e29b-41d4-a716-446655440004', pipeline_id: 'default', name: 'Reunião', position: 4, color: '#8b5cf6', is_active: true, created_at: '2024-01-01T00:00:00Z' },
          { id: '550e8400-e29b-41d4-a716-446655440005', pipeline_id: 'default', name: 'Fechamento', position: 5, color: '#10b981', is_active: true, created_at: '2024-01-01T00:00:00Z' }
        ];
        setStages(mockStages);
        return;
      }

      let query = supabase
        .from('pipeline_stages')
        .select('*')
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (pipelineId) {
        query = query.eq('pipeline_id', pipelineId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Erro ao buscar etapas:', fetchError);
        throw fetchError;
      }

      console.log('🔍 [USE PIPELINE] Etapas encontradas:', {
        pipelineId,
        stagesCount: data?.length || 0,
        stages: data?.map(s => ({ id: s.id, name: s.name, position: s.position }))
      });

      setStages(data || []);
    } catch (err) {
      console.error('Erro ao buscar etapas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar etapas');
      
      // Fallback para dados mock
      const mockStages: PipelineStage[] = [
        { id: '1', pipeline_id: 'default', name: 'Novo Lead', position: 1, color: '#ef4444', is_active: true, created_at: '2024-01-01T00:00:00Z' },
        { id: '2', pipeline_id: 'default', name: 'Contato Inicial', position: 2, color: '#f59e0b', is_active: true, created_at: '2024-01-01T00:00:00Z' },
        { id: '3', pipeline_id: 'default', name: 'Proposta', position: 3, color: '#3b82f6', is_active: true, created_at: '2024-01-01T00:00:00Z' },
        { id: '4', pipeline_id: 'default', name: 'Reunião', position: 4, color: '#8b5cf6', is_active: true, created_at: '2024-01-01T00:00:00Z' },
        { id: '5', pipeline_id: 'default', name: 'Fechamento', position: 5, color: '#10b981', is_active: true, created_at: '2024-01-01T00:00:00Z' }
      ];
      setStages(mockStages);
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar nova pipeline
  const createPipeline = useCallback(async (pipelineData: {
    name: string;
    stages: Omit<PipelineStage, 'id' | 'pipeline_id' | 'created_at'>[];
  }): Promise<Pipeline> => {
    try {
      setError(null);

      if (!supabase) {
        console.warn('Supabase não configurado, simulando criação de pipeline');
        const mockPipeline: Pipeline = {
          id: Date.now().toString(),
          name: pipelineData.name,
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setPipelines(prev => [...prev, mockPipeline]);
        return mockPipeline;
      }

      // Criar pipeline
      const { data: pipeline, error: pipelineError } = await supabase
        .from('pipelines')
        .insert([{
          name: pipelineData.name,
          is_default: false
        }])
        .select()
        .single();

      if (pipelineError) {
        throw pipelineError;
      }

      // Criar etapas da pipeline
      const stagesToInsert = pipelineData.stages.map((stage, index) => ({
        pipeline_id: pipeline.id,
        name: stage.name,
        position: index + 1,
        color: stage.color,
        is_active: stage.is_active
      }));

      const { error: stagesError } = await supabase
        .from('pipeline_stages')
        .insert(stagesToInsert);

      if (stagesError) {
        // Se falhar ao criar etapas, deletar a pipeline criada
        await supabase.from('pipelines').delete().eq('id', pipeline.id);
        throw stagesError;
      }

      await fetchPipelines();
      await fetchPipelineStages();

      toast({
        title: "Pipeline criada",
        description: "Pipeline criada com sucesso!",
      });

      return pipeline;
    } catch (err) {
      console.error('Erro ao criar pipeline:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar pipeline');
      throw err;
    }
  }, [fetchPipelines, fetchPipelineStages]);

  // Criar nova etapa
  const createStage = useCallback(async (stageData: {
    pipeline_id: string;
    name: string;
    position: number;
    color: string;
  }): Promise<PipelineStage | null> => {
    try {
      setError(null);

      if (!supabase) {
        console.warn('Supabase não configurado, simulando criação de etapa');
        const mockStage: PipelineStage = {
          id: Date.now().toString(),
          pipeline_id: stageData.pipeline_id,
          name: stageData.name,
          position: stageData.position,
          color: stageData.color,
          is_active: true,
          created_at: new Date().toISOString()
        };
        setStages(prev => [...prev, mockStage]);
        return mockStage;
      }

      const { data, error } = await supabase
        .from('pipeline_stages')
        .insert([{
          pipeline_id: stageData.pipeline_id,
          name: stageData.name,
          position: stageData.position,
          color: stageData.color,
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar etapa:', error);
        throw error;
      }

      // Recarregar etapas da pipeline
      await fetchPipelineStages(stageData.pipeline_id);

      return data;
    } catch (err) {
      console.error('Erro ao criar etapa:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar etapa');
      return null;
    }
  }, [fetchPipelineStages]);

  // Atualizar etapas de uma pipeline
  const updatePipelineStages = useCallback(async (stages: PipelineStage[]): Promise<void> => {
    try {
      setError(null);

      if (!supabase) {
        console.warn('Supabase não configurado, atualizando etapas localmente');
        setStages(stages);
        return;
      }

      // Atualizar cada etapa
      for (const stage of stages) {
        const { error } = await supabase
          .from('pipeline_stages')
          .update({
            name: stage.name,
            position: stage.position,
            color: stage.color,
            is_active: stage.is_active
          })
          .eq('id', stage.id);

        if (error) {
          throw error;
        }
      }

      await fetchPipelineStages();

      toast({
        title: "Etapas atualizadas",
        description: "Etapas da pipeline atualizadas com sucesso!",
      });
    } catch (err) {
      console.error('Erro ao atualizar etapas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar etapas');
      throw err;
    }
  }, [fetchPipelineStages]);

  // Deletar pipeline
  const deletePipeline = useCallback(async (pipelineId: string): Promise<void> => {
    try {
      setError(null);

      if (!supabase) {
        console.warn('Supabase não configurado, removendo pipeline localmente');
        setPipelines(prev => prev.filter(p => p.id !== pipelineId));
        return;
      }

      // Deletar etapas da pipeline primeiro
      const { error: stagesError } = await supabase
        .from('pipeline_stages')
        .delete()
        .eq('pipeline_id', pipelineId);

      if (stagesError) {
        throw stagesError;
      }

      // Deletar pipeline
      const { error: pipelineError } = await supabase
        .from('pipelines')
        .delete()
        .eq('id', pipelineId);

      if (pipelineError) {
        throw pipelineError;
      }

      await fetchPipelines();

      toast({
        title: "Pipeline deletada",
        description: "Pipeline deletada com sucesso!",
      });
    } catch (err) {
      console.error('Erro ao deletar pipeline:', err);
      setError(err instanceof Error ? err.message : 'Erro ao deletar pipeline');
      throw err;
    }
  }, [fetchPipelines]);

  // Buscar dados iniciais
  useEffect(() => {
    fetchPipelines();
    fetchPipelineStages();
  }, [fetchPipelines, fetchPipelineStages]);

  return {
    pipelines,
    stages,
    loading,
    error,
    fetchPipelines,
    fetchPipelineStages,
    createPipeline,
    createStage,
    updatePipelineStages,
    deletePipeline
  };
};
