import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
}

export function useCompaniesSimple() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Buscar empresas do usuário logado
  const fetchCompanies = useCallback(async () => {
    if (!user) {
      console.log('❌ Usuário não logado');
      return;
    }

    try {
      console.log('🚀 Buscando empresas do usuário:', user.id);
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar empresas:', error);
        throw error;
      }

      console.log('✅ Empresas encontradas:', data?.length || 0);
      setCompanies(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar empresas';
      console.error('❌ Erro em fetchCompanies:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Criar nova empresa
  const createCompany = useCallback(async (companyData: CreateCompanyData) => {
    if (!user) {
      console.log('❌ Usuário não logado');
      return { data: null, error: 'Usuário não logado' };
    }

    try {
      console.log('🚀 Criando empresa para usuário:', user.id, companyData);
      setLoading(true);
      setError(null);

      // Preparar dados para inserção
      const insertData = {
        owner_id: user.id,
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
  }, [user]);

  // Atualizar empresa existente
  const updateCompany = useCallback(async (id: string, updates: CreateCompanyData) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('companies')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
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
    if (!user) {
      console.log('❌ Usuário não logado');
      return { error: 'Usuário não logado' };
    }

    try {
      console.log('🗑️ Excluindo empresa:', id, 'do usuário:', user.id);
      setLoading(true);
      setError(null);

      // Primeiro verificar se a empresa pertence ao usuário
      const { data: company, error: checkError } = await supabase
        .from('companies')
        .select('id, owner_id')
        .eq('id', id)
        .eq('owner_id', user.id)
        .single();

      if (checkError) {
        console.error('❌ Erro ao verificar empresa:', checkError);
        throw new Error('Empresa não encontrada ou não pertence ao usuário');
      }

      if (!company) {
        throw new Error('Empresa não encontrada ou não pertence ao usuário');
      }

      console.log('✅ Empresa encontrada, procedendo com exclusão');

      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id); // Garantir que só exclui empresas próprias

      if (error) {
        console.error('❌ Erro ao excluir empresa:', error);
        throw error;
      }

      console.log('✅ Empresa excluída com sucesso');
      setCompanies(prev => prev.filter(company => company.id !== id));
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir empresa';
      setError(errorMessage);
      console.error('❌ Erro ao excluir empresa:', err);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Carregar empresas ao inicializar ou quando usuário mudar
  useEffect(() => {
    if (user) {
      console.log('🔄 useEffect executado, chamando fetchCompanies...');
      fetchCompanies();
    }
  }, [user, fetchCompanies]);

  return {
    companies,
    loading,
    error,
    fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
  };
}
