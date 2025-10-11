
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  contact_person?: string;
  status: string;
  owner_id: string;
  company_id?: string;
  created_at: string;
  updated_at: string;
}

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchSuppliers = async () => {
    
    try {
      setLoading(true);
      setError(null);

      // Buscar fornecedores filtrados por owner_id (usuário atual)
      // Isso garante isolamento de dados mesmo sem company_id
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ fetchSuppliers: Erro ao buscar fornecedores:', error);
        throw error;
      }

      setSuppliers(data || []);
    } catch (err) {
      console.error('❌ fetchSuppliers: Erro ao buscar fornecedores:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar fornecedores');
    } finally {
      setLoading(false);
    }
  };

  const createSupplier = async (formData: any) => {
    console.log('🚀 createSupplier: Iniciando criação de fornecedor...', { formData });

    try {
      // Validar dados obrigatórios
      if (!formData.name || formData.name.trim() === '') {
        throw new Error('Nome do fornecedor é obrigatório');
      }

      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      // Mapear dados do formulário para o schema da tabela
      const supplierData = {
        name: formData.name.trim(),
        cnpj: formData.cnpj || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        contact_person: formData.contact_person || null,
        status: 'active',
        owner_id: user.id
      };

      console.log('📝 createSupplier: Dados mapeados para inserção:', supplierData);

      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplierData])
        .select()
        .single();

      if (error) {
        console.error('❌ createSupplier: Erro do Supabase:', error);
        throw error;
      }
      
      await fetchSuppliers(); // Recarregar dados
      return data;
    } catch (err) {
      console.error('❌ createSupplier: Erro ao criar fornecedor:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar fornecedor');
      throw err;
    }
  };

  const updateSupplier = async (id: string, formData: any) => {
    try {
      // Validar dados obrigatórios
      if (!formData.name || formData.name.trim() === '') {
        throw new Error('Nome do fornecedor é obrigatório');
      }

      // Mapear dados do formulário para o schema da tabela
      const supplierData = {
        name: formData.name.trim(),
        cnpj: formData.cnpj || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        contact_person: formData.contact_person || null,
        updated_at: new Date().toISOString()
      };

      console.log('📝 updateSupplier: Dados para atualização:', supplierData);

      const { data, error } = await supabase
        .from('suppliers')
        .update(supplierData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ updateSupplier: Erro do Supabase:', error);
        throw error;
      }
      
      await fetchSuppliers(); // Recarregar dados
      return data;
    } catch (err) {
      console.error('❌ updateSupplier: Erro ao atualizar fornecedor:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar fornecedor');
      throw err;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchSuppliers(); // Recarregar dados
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir fornecedor');
      throw err;
    }
  };

  const getActiveSuppliers = () => {
    return suppliers.filter(supplier => supplier.status === 'active');
  };

  const searchSuppliers = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return suppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(lowerQuery) ||
      (supplier.cnpj && supplier.cnpj.includes(lowerQuery)) ||
      (supplier.email && supplier.email.toLowerCase().includes(lowerQuery)) ||
      (supplier.contact_person && supplier.contact_person.toLowerCase().includes(lowerQuery))
    );
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Função para limpar erros
  const clearError = () => {
    setError(null);
  };

  return {
    suppliers,
    loading,
    error,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    searchSuppliers,
    getActiveSuppliers,
    refetch: fetchSuppliers,
    clearError
  };
};
