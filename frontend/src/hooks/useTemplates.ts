import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Template {
  id: string;
  owner_id: string;
  company_id?: string;
  name: string;
  type: 'email' | 'whatsapp' | 'proposal' | 'contract' | 'presentation';
  subject?: string;
  content: string;
  variables: Record<string, any>;
  is_active: boolean;
  is_public: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateData {
  name: string;
  type: 'email' | 'whatsapp' | 'proposal' | 'contract' | 'presentation';
  subject?: string;
  content: string;
  variables?: Record<string, any>;
  is_active?: boolean;
  is_public?: boolean;
  tags?: string[];
}

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar templates
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar se o Supabase está configurado
      if (!supabase) {
        console.warn('Supabase não configurado, usando dados mock');
        setTemplates([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.warn('Erro ao buscar templates do Supabase, usando dados mock:', fetchError);
        setTemplates([]);
        return;
      }

      setTemplates(data || []);
    } catch (err) {
      console.error('Erro ao buscar templates:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar template
  const createTemplate = useCallback(async (templateData: CreateTemplateData): Promise<Template> => {
    try {
      setError(null);

      // Verificar se o Supabase está configurado
      if (!supabase) {
        console.warn('Supabase não configurado, simulando criação de template');
        const mockTemplate: Template = {
          id: Date.now().toString(),
          owner_id: 'mock-user',
          name: templateData.name,
          type: templateData.type,
          subject: templateData.subject,
          content: templateData.content,
          variables: templateData.variables || {},
          is_active: templateData.is_active ?? true,
          is_public: templateData.is_public ?? false,
          tags: templateData.tags || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setTemplates(prev => [mockTemplate, ...prev]);
        return mockTemplate;
      }

      const templateToInsert = {
        name: templateData.name,
        type: templateData.type,
        subject: templateData.subject || null,
        content: templateData.content,
        variables: templateData.variables || {},
        is_active: templateData.is_active ?? true,
        is_public: templateData.is_public ?? false,
        tags: templateData.tags || []
      };

      const { data, error: createError } = await supabase
        .from('templates')
        .insert([templateToInsert] as any)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Atualizar lista local
      await fetchTemplates();
      
      return data;
    } catch (err) {
      console.error('Erro ao criar template:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar template');
      throw err;
    }
  }, [fetchTemplates]);

  // Atualizar template
  const updateTemplate = useCallback(async (id: string, updates: Partial<Template>): Promise<Template> => {
    try {
      setError(null);

      const { data, error: updateError } = await (supabase as any)
        .from('templates')
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
      await fetchTemplates();
      
      return data;
    } catch (err) {
      console.error('Erro ao atualizar template:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar template');
      throw err;
    }
  }, [fetchTemplates]);

  // Deletar template
  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('templates')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Atualizar lista local
      await fetchTemplates();
    } catch (err) {
      console.error('Erro ao deletar template:', err);
      setError(err instanceof Error ? err.message : 'Erro ao deletar template');
      throw err;
    }
  }, [fetchTemplates]);

  // Duplicar template
  const duplicateTemplate = useCallback(async (id: string): Promise<Template> => {
    try {
      const originalTemplate = templates.find(t => t.id === id);
      if (!originalTemplate) {
        throw new Error('Template não encontrado');
      }

      const duplicateData: CreateTemplateData = {
        name: `${originalTemplate.name} (Cópia)`,
        type: originalTemplate.type,
        subject: originalTemplate.subject,
        content: originalTemplate.content,
        variables: originalTemplate.variables,
        is_active: originalTemplate.is_active,
        is_public: false, // Cópias sempre privadas
        tags: originalTemplate.tags
      };

      return await createTemplate(duplicateData);
    } catch (err) {
      console.error('Erro ao duplicar template:', err);
      setError(err instanceof Error ? err.message : 'Erro ao duplicar template');
      throw err;
    }
  }, [templates, createTemplate]);

  // Buscar templates iniciais
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate
  };
};

