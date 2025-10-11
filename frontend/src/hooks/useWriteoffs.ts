import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Writeoff {
  id: string;
  owner_id: string;
  company_id?: string;
  product_id?: string;
  name: string;
  quantity: number;
  reason: string;
  approved_by?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface CreateWriteoffData {
  name: string;
  quantity: number;
  reason: string;
  company_id?: string;
  product_id?: string;
  approved_by?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export const useWriteoffs = () => {
  const { user } = useAuth();
  const [writeoffs, setWriteoffs] = useState<Writeoff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWriteoffs = async () => {
    if (!user) {
      console.log('useWriteoffs: Usuário não autenticado');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('useWriteoffs: Buscando writeoffs para usuário:', user.id);
      
      const { data, error } = await supabase
        .from('writeoffs')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('useWriteoffs: Erro Supabase ao buscar writeoffs:', error);
        throw error;
      }
      
      console.log('useWriteoffs: Writeoffs encontrados:', data);
      setWriteoffs(data || []);
    } catch (err) {
      console.error('useWriteoffs: Erro ao buscar writeoffs:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const createWriteoff = async (writeoffData: CreateWriteoffData): Promise<Writeoff | null> => {
    if (!user) {
      console.error('useWriteoffs: Usuário não autenticado para criar writeoff');
      return null;
    }

    try {
      setError(null);
      
      console.log('useWriteoffs: Criando writeoff:', writeoffData);
      
      const { data, error } = await supabase
        .from('writeoffs')
        .insert([{
          ...writeoffData,
          owner_id: user.id,
          status: writeoffData.status || 'pending'
        }])
        .select()
        .single();

      if (error) {
        console.error('useWriteoffs: Erro Supabase ao criar writeoff:', error);
        throw error;
      }

      console.log('useWriteoffs: Writeoff criado com sucesso:', data);
      
      // Atualizar a lista local
      setWriteoffs(prev => [data, ...prev]);
      
      return data;
    } catch (err) {
      console.error('useWriteoffs: Erro ao criar writeoff:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return null;
    }
  };

  const updateWriteoff = async (id: string, updates: Partial<CreateWriteoffData>): Promise<Writeoff | null> => {
    if (!user) {
      console.error('useWriteoffs: Usuário não autenticado para atualizar writeoff');
      return null;
    }

    try {
      setError(null);
      
      console.log('useWriteoffs: Atualizando writeoff:', id, updates);
      
      const { data, error } = await supabase
        .from('writeoffs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('owner_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('useWriteoffs: Erro Supabase ao atualizar writeoff:', error);
        throw error;
      }

      console.log('useWriteoffs: Writeoff atualizado com sucesso:', data);
      
      // Atualizar a lista local
      setWriteoffs(prev => prev.map(w => w.id === id ? data : w));
      
      return data;
    } catch (err) {
      console.error('useWriteoffs: Erro ao atualizar writeoff:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return null;
    }
  };

  const deleteWriteoff = async (id: string): Promise<boolean> => {
    if (!user) {
      console.error('useWriteoffs: Usuário não autenticado para deletar writeoff');
      return false;
    }

    try {
      setError(null);
      
      console.log('useWriteoffs: Deletando writeoff:', id);
      
      const { error } = await supabase
        .from('writeoffs')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id);

      if (error) {
        console.error('useWriteoffs: Erro Supabase ao deletar writeoff:', error);
        throw error;
      }

      console.log('useWriteoffs: Writeoff deletado com sucesso');
      
      // Atualizar a lista local
      setWriteoffs(prev => prev.filter(w => w.id !== id));
      
      return true;
    } catch (err) {
      console.error('useWriteoffs: Erro ao deletar writeoff:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    }
  };

  useEffect(() => {
    fetchWriteoffs();
  }, [user]);

  return {
    writeoffs,
    loading,
    error,
    fetchWriteoffs,
    createWriteoff,
    updateWriteoff,
    deleteWriteoff
  };
};
