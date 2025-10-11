import { useState, useEffect, useCallback } from 'react';
import { useLeads } from './useLeads-fixed';
import { useCompanies } from './useCompanies';
import { useFunnelStages } from './useFunnelStages';

// Hook para carregar dados sequencialmente e evitar requisições simultâneas
export const useSequentialData = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { leads, loading: leadsLoading, error: leadsError, fetchLeads } = useLeads();
  const { companies, loading: companiesLoading, error: companiesError, fetchCompanies } = useCompanies();
  const { stages, loading: stagesLoading, error: stagesError, fetchStages, fetchPipelines } = useFunnelStages();

  const loadDataSequentially = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🚀 Iniciando carregamento sequencial de dados...');

      // 1. Carregar leads primeiro (mais crítico)
      console.log('📊 Carregando leads...');
      await fetchLeads();
      
      // Aguardar um pouco para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 500));

      // 2. Carregar stages
      console.log('🎯 Carregando stages...');
      await fetchStages();
      
      // Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Carregar pipelines
      console.log('🔄 Carregando pipelines...');
      await fetchPipelines();
      
      // Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 500));

      // 4. Carregar companies por último (menos crítico)
      console.log('🏢 Carregando companies...');
      await fetchCompanies();

      console.log('✅ Todos os dados carregados com sucesso');
      setIsInitialized(true);
    } catch (err) {
      console.error('❌ Erro no carregamento sequencial:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [fetchLeads, fetchStages, fetchPipelines, fetchCompanies]);

  // Carregar dados na inicialização
  useEffect(() => {
    if (!isInitialized) {
      loadDataSequentially();
    }
  }, [isInitialized, loadDataSequentially]);

  // Verificar se há erros
  useEffect(() => {
    const errors = [leadsError, companiesError, stagesError].filter(Boolean);
    if (errors.length > 0) {
      setError(errors.join('; '));
    }
  }, [leadsError, companiesError, stagesError]);

  const isLoading = loading || leadsLoading || companiesLoading || stagesLoading;
  const hasError = error || leadsError || companiesError || stagesError;

  return {
    leads,
    companies,
    stages,
    loading: isLoading,
    error: hasError,
    isInitialized,
    refetch: loadDataSequentially
  };
};
