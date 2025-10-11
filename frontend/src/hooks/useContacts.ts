import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Contact {
  id: string;
  owner_id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  gender?: string;
  status: 'active' | 'inactive' | 'lead';
  pipeline?: string;
  tags?: string[];
  whatsapp_opted?: boolean;
  profile_image_url?: string;
  created_at: string;
  updated_at: string;
  last_contact_at?: string;
}

export interface CreateContactData {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  gender?: string;
  status?: 'active' | 'inactive' | 'lead';
  pipeline?: string;
  tags?: string[];
  whatsapp_opted?: boolean;
}

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar contatos
  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar se o Supabase está configurado
      if (!supabase) {
        console.warn('Supabase não configurado, usando dados mock');
        setContacts([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.warn('Erro ao buscar contatos do Supabase, usando dados mock:', fetchError);
        setContacts([]);
        return;
      }

      setContacts(data || []);
    } catch (err) {
      console.error('Erro ao buscar contatos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar contato
  const createContact = useCallback(async (contactData: CreateContactData): Promise<Contact> => {
    try {
      setError(null);

      // Verificar se o Supabase está configurado
      if (!supabase) {
        console.warn('Supabase não configurado, simulando criação de contato');
        const mockContact: Contact = {
          id: Date.now().toString(),
          owner_id: 'mock-user',
          name: contactData.name,
          phone: contactData.phone,
          email: contactData.email,
          company: contactData.company,
          gender: contactData.gender,
          status: contactData.status || 'active',
          pipeline: contactData.pipeline,
          tags: contactData.tags,
          whatsapp_opted: contactData.whatsapp_opted ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setContacts(prev => [mockContact, ...prev]);
        return mockContact;
      }

      const contactToInsert = {
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email || null,
        company: contactData.company || null,
        gender: contactData.gender || null,
        status: contactData.status || 'active',
        pipeline: contactData.pipeline || null,
        tags: contactData.tags || [],
        whatsapp_opted: contactData.whatsapp_opted ?? true
      };

      const { data, error: createError } = await supabase
        .from('contacts')
        .insert([contactToInsert] as any)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Atualizar lista local
      await fetchContacts();
      
      return data;
    } catch (err) {
      console.error('Erro ao criar contato:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar contato');
      throw err;
    }
  }, [fetchContacts]);

  // Atualizar contato
  const updateContact = useCallback(async (id: string, updates: Partial<Contact>): Promise<Contact> => {
    try {
      setError(null);

      const { data, error: updateError } = await (supabase as any)
        .from('contacts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Atualizar lista local
      await fetchContacts();
      
      return data;
    } catch (err) {
      console.error('Erro ao atualizar contato:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar contato');
      throw err;
    }
  }, [fetchContacts]);

  // Deletar contato
  const deleteContact = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Atualizar lista local
      await fetchContacts();
    } catch (err) {
      console.error('Erro ao deletar contato:', err);
      setError(err instanceof Error ? err.message : 'Erro ao deletar contato');
      throw err;
    }
  }, [fetchContacts]);

  // Buscar contatos iniciais
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return {
    contacts,
    loading,
    error,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact
  };
};

