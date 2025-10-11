
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { retryFetch, cache } from '@/utils/retryFetch';
import { useAuth } from './useAuth';

export interface Company {
  id: string;
  owner_id: string;
  fantasy_name: string;
  company_name: string | null;
  cnpj: string | null;
  reference: string | null;
  cep: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
  description: string | null;
  sector: string | null;
  status: string;
  settings: any;
  is_supplier: boolean;
  activity_data: any;
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyData {
  fantasy_name: string;
  company_name?: string;
  cnpj?: string;
  reference?: string;
  cep?: string;
  address?: string;
  city?: string;
  state?: string;
  email?: string;
  phone?: string;
  logo_url?: string;
  description?: string;
  sector?: string;
  status?: string;
  settings?: any;
  is_supplier?: boolean;
  activity_data?: any;
}

export interface UpdateCompanyData extends Partial<CreateCompanyData> {}

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getProfile } = useAuth();

  // Função para obter o owner_id do usuário logado
  const getOwnerId = async () => {
    try {
      console.log('🔍 Obtendo perfil do usuário...');
      const { profile, error: profileError } = await getProfile();
      
      if (profileError) {
        console.error('❌ Erro ao obter perfil:', profileError);
        throw new Error(`Erro ao obter perfil: ${profileError}`);
      }
      
      if (!profile) {
        console.error('❌ Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }
      
      console.log('✅ Perfil obtido:', profile.id);
      return profile.id;
    } catch (err) {
      console.error('❌ Erro em getOwnerId:', err);
      throw err;
    }
  };

  // Buscar todas as empresas do usuário
  const fetchCompanies = useCallback(async () => {
    try {
      console.log('🚀 Iniciando busca de empresas...');
      setLoading(true);
      setError(null);

      // Verificar cache primeiro
      const cacheKey = 'companies';
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log('✅ Usando dados do cache para companies');
        setCompanies(cachedData);
        setLoading(false);
        return;
      }

      const companies = await retryFetch(async () => {
        // Primeiro, vamos verificar se conseguimos acessar a tabela
        console.log('🔍 Testando acesso à tabela companies...');
        const { data: testData, error: testError } = await supabase
          .from('companies')
          .select('count')
          .limit(1);

        if (testError) {
          console.error('❌ Erro ao acessar tabela companies:', testError);
          throw new Error(`Erro ao acessar tabela: ${testError.message}`);
        }

        console.log('✅ Tabela companies acessível');

        // Agora vamos buscar as empresas (sem filtro de owner_id por enquanto)
        console.log('🔍 Buscando empresas...');
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Erro ao buscar empresas:', error);
          throw error;
        }

        console.log('✅ Empresas encontradas:', data?.length || 0);
        return data || [];
      });
      
      // Salvar no cache
      cache.set(cacheKey, companies);
      setCompanies(companies);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar empresas';
      console.error('❌ Erro em fetchCompanies:', err);
      setError(errorMessage);
      
      // Se for erro de autenticação, vamos tentar uma abordagem alternativa
      if (errorMessage.includes('autenticado') || errorMessage.includes('perfil')) {
        console.log('🔄 Tentando abordagem alternativa...');
        try {
          // Tentar buscar sem filtro de owner_id para debug
          const { data: debugData, error: debugError } = await supabase
            .from('companies')
            .select('*')
            .limit(5);
          
          if (debugError) {
            console.error('❌ Erro na busca de debug:', debugError);
          } else {
            console.log('🔍 Dados de debug (sem filtro):', debugData);
          }
        } catch (debugErr) {
          console.error('❌ Erro na busca de debug:', debugErr);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar nova empresa
  const createCompany = useCallback(async (companyData: CreateCompanyData) => {
    try {
      console.log('🚀 Iniciando criação de empresa...');
      setLoading(true);
      setError(null);

      // Preparar dados para inserção (apenas campos válidos)
      const insertData = {
        fantasy_name: companyData.fantasy_name,
        company_name: companyData.company_name || null,
        cnpj: companyData.cnpj || null,
        reference: companyData.reference || null,
        cep: companyData.cep || null,
        address: companyData.address || null,
        city: companyData.city || null,
        state: companyData.state || null,
        email: companyData.email || null,
        phone: companyData.phone || null,
        logo_url: companyData.logo_url || null,
        description: companyData.description || null,
        sector: companyData.sector || null,
        status: companyData.status || 'active'
      };

      console.log('📝 Dados para inserção:', insertData);

      const { data, error } = await supabase
        .from('companies')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao inserir empresa:', error);
        throw error;
      }

      console.log('✅ Empresa criada com sucesso:', data);
      setCompanies(prev => [data, ...prev]);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar empresa';
      setError(errorMessage);
      console.error('❌ Erro ao criar empresa:', err);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar empresa existente
  const updateCompany = useCallback(async (id: string, updates: UpdateCompanyData) => {
    try {
      setLoading(true);
      setError(null);

      const ownerId = await getOwnerId();

      const { data, error } = await supabase
        .from('companies')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('owner_id', ownerId) // Garantir que só atualiza empresas próprias
        .select()
        .single();

      if (error) {
        throw error;
      }

      setCompanies(prev => prev.map(company => 
        company.id === id ? data : company
      ));

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar empresa';
      setError(errorMessage);
      console.error('Erro ao atualizar empresa:', err);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Excluir empresa
  const deleteCompany = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const ownerId = await getOwnerId();

      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id)
        .eq('owner_id', ownerId); // Garantir que só exclui empresas próprias

      if (error) {
        throw error;
      }

      setCompanies(prev => prev.filter(company => company.id !== id));
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir empresa';
      setError(errorMessage);
      console.error('Erro ao excluir empresa:', err);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar empresa por ID
  const getCompanyById = useCallback(async (id: string) => {
    try {
      setError(null);

      const ownerId = await getOwnerId();

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .eq('owner_id', ownerId) // Garantir que só busca empresas próprias
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar empresa';
      setError(errorMessage);
      console.error('Erro ao buscar empresa:', err);
      return { data: null, error: errorMessage };
    }
  }, []);

  // Buscar empresas por filtros
  const searchCompanies = useCallback(async (filters: {
    search?: string;
    status?: string;
    sector?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const ownerId = await getOwnerId();

      let query = supabase
        .from('companies')
        .select('*')
        .eq('owner_id', ownerId);

      if (filters.search) {
        query = query.or(`fantasy_name.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%,cnpj.ilike.%${filters.search}%`);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.sector) {
        query = query.eq('sector', filters.sector);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setCompanies(data || []);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar empresas';
      setError(errorMessage);
      console.error('Erro ao buscar empresas:', err);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar empresas ao inicializar
  useEffect(() => {
    console.log('🔄 useEffect executado, chamando fetchCompanies...');
    fetchCompanies();
  }, [fetchCompanies]);

  return {
    companies,
    loading,
    error,
    fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    getCompanyById,
    searchCompanies,
  };
}
