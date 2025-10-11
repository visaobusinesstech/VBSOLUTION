import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Company {
  id: string;
  owner_id: string;
  fantasy_name: string;
  company_name: string;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useCompany() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, getProfile } = useAuth();

  // Função para obter a empresa do usuário logado
  const getCompany = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Primeiro, obter o company_id do perfil
      const { profile } = await getProfile();
      if (!profile || !profile.company_id) {
        throw new Error('Usuário não possui empresa associada');
      }

      // Buscar dados da empresa
      const { data, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();

      if (companyError) {
        throw companyError;
      }

      setCompany(data);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar empresa';
      setError(errorMessage);
      console.error('Erro ao buscar empresa:', err);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, getProfile]);

  // Função para criar uma nova empresa
  const createCompany = useCallback(async (companyData: {
    fantasy_name: string;
    company_name: string;
    email: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('companies')
        .insert([
          {
            owner_id: user.id,
            fantasy_name: companyData.fantasy_name,
            company_name: companyData.company_name,
            email: companyData.email,
            status: 'active'
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Atualizar o perfil com o company_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ company_id: data.id })
        .eq('id', user.id);

      if (profileError) {
        console.warn('Empresa criada, mas erro ao atualizar perfil:', profileError);
      }

      setCompany(data);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar empresa';
      setError(errorMessage);
      console.error('Erro ao criar empresa:', err);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Função para atualizar dados da empresa
  const updateCompany = useCallback(async (updates: Partial<Company>) => {
    try {
      setLoading(true);
      setError(null);

      if (!company) {
        throw new Error('Nenhuma empresa carregada');
      }

      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', company.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setCompany(data);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar empresa';
      setError(errorMessage);
      console.error('Erro ao atualizar empresa:', err);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [company]);

  // Carregar empresa automaticamente quando o usuário mudar
  useEffect(() => {
    if (user) {
      getCompany();
    } else {
      setCompany(null);
      setError(null);
    }
  }, [user, getCompany]);

  return {
    company,
    loading,
    error,
    getCompany,
    createCompany,
    updateCompany,
    // Função de conveniência para obter company_id
    getCompanyId: () => company?.id || null,
  };
}
