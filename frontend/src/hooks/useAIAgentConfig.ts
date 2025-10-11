import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface AIAgentConfig {
  id?: string;
  owner_id: string;
  company_id?: string;
  name: string;
  function?: string;
  personality?: string;
  status: 'active' | 'inactive';
  response_style?: string;
  language?: string;
  max_response_length?: number;
  tone?: string;
  rules?: string;
  company_context?: string;
  sector?: string;
  company_description?: string;
  knowledge_base?: {
    files?: Array<{
      id: string;
      name: string;
      type: string;
      size: string;
      uploadedAt: string;
      content: string;
    }>;
    websites?: Array<{
      id: string;
      url: string;
      title: string;
      lastCrawled: string;
      content: string;
    }>;
    qa?: Array<{ id: string; question: string; answer: string; category?: string }>;
  };
  api_key?: string;
  selected_model?: string;
  is_connected?: boolean;
  is_company_wide?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AIAgentConfigForm {
  name: string;
  function: string;
  personality: string;
  response_style: string;
  language: string;
  max_response_length: number;
  tone: string;
  rules: string;
  company_context: string;
  sector: string;
  company_description: string;
  knowledge_base: {
    files?: Array<{
      id: string;
      name: string;
      type: string;
      size: string;
      uploadedAt: string;
      content: string;
    }>;
    websites?: Array<{
      id: string;
      url: string;
      title: string;
      lastCrawled: string;
      content: string;
    }>;
    qa: Array<{ id: string; question: string; answer: string; category?: string }>;
  };
  integration: {
    apiKey: string;
    selectedModel: string;
    isConnected: boolean;
  };
  advanced_settings: {
    temperature: number;
    max_tokens: number;
  };
  is_company_wide: boolean;
}

export function useAIAgentConfig() {
  const { user } = useAuth();
  const [config, setConfig] = useState<AIAgentConfig | null>(null);
  const [companyConfig, setCompanyConfig] = useState<AIAgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar company_id do usuário
  const getCompanyId = useCallback(async () => {
    if (!user?.id) return null;

    try {
      // Tentar buscar na tabela company_users (usar maybeSingle para evitar erros)
      const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

      if (companyUser?.company_id) {
        return companyUser.company_id;
      }

      // Tentar buscar na tabela user_profiles
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.company_id) {
        return profile.company_id;
      }

      return null;
    } catch (error) {
      // Silent catch - table might not exist
      return null;
    }
  }, [user?.id]);

  // Carregar configuração pessoal do usuário
  const loadPersonalConfig = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('ai_agent_configs')
        .select('*')
        .eq('owner_id', user.id)
        .eq('is_company_wide', false)
        .eq('is_active', true)
        .limit(1);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data && data.length > 0) {
        // Configuração pessoal carregada
        setConfig(data[0]);
      } else {
        // Nenhuma configuração pessoal encontrada
      }
    } catch (error) {
      console.error('Erro ao carregar configuração pessoal:', error);
      setError('Erro ao carregar configuração pessoal');
    }
  }, [user?.id]);

  // Carregar configuração da empresa
  const loadCompanyConfig = useCallback(async () => {
    if (!user?.id) return;

    try {
      const companyId = await getCompanyId();
      if (!companyId) return;

      const { data, error } = await supabase
        .from('ai_agent_configs')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_company_wide', true)
        .eq('is_active', true)
        .limit(1);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data && data.length > 0) {
        setCompanyConfig(data[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração da empresa:', error);
      setError('Erro ao carregar configuração da empresa');
    }
  }, [user?.id, getCompanyId]);

  // Carregar todas as configurações
  const loadConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadPersonalConfig(),
        loadCompanyConfig()
      ]);
    } finally {
      setLoading(false);
    }
  }, [loadPersonalConfig, loadCompanyConfig]);

  // Salvar configuração (pessoal ou da empresa)
  const saveConfig = useCallback(async (formData: AIAgentConfigForm) => {
    // Save config iniciado
    
    if (!user?.id) {
      console.error('❌ Usuário não autenticado');
      throw new Error('Usuário não autenticado');
    }

    // Verificar se há dados para salvar - SEMPRE permitir se há API key ou outros campos
    const hasApiKey = formData.integration?.apiKey && formData.integration.apiKey.trim() !== '';
    const hasOtherData = (formData.knowledge_base?.files?.length || 0) > 0 ||
                        (formData.knowledge_base?.websites?.length || 0) > 0 ||
                        (formData.knowledge_base?.qa?.length || 0) > 0 ||
                        formData.name ||
                        formData.function ||
                        formData.personality ||
                        formData.integration?.selectedModel ||
                        formData.response_style ||
                        formData.language ||
                        formData.max_response_length ||
                        formData.tone ||
                        formData.rules ||
                        formData.company_context ||
                        formData.sector ||
                        formData.company_description;

    const hasSubstantialData = hasApiKey || hasOtherData;

    // Validation debug

    // SEMPRE permitir salvamento se há API key ou outros dados
    if (!hasSubstantialData) {
      console.log('❌ Ignorando salvamento - não há dados substanciais para salvar');
      return null;
    }

    // Dados válidos, prosseguindo com salvamento

    setSaving(true);
    setError(null);

    try {
      const companyId = await getCompanyId();
      
      // Preparar dados para salvar
      const configData: Partial<AIAgentConfig> = {
        owner_id: user.id,
        company_id: formData.is_company_wide ? companyId : null,
        name: formData.name || 'Assistente Virtual VB',
        function: formData.function || 'Atendimento ao cliente via WhatsApp',
        personality: formData.personality || 'Profissional, prestativo e eficiente',
        status: 'active',
        response_style: formData.response_style || 'friendly',
        language: formData.language || 'pt-BR',
        max_response_length: formData.max_response_length || 500,
        tone: formData.tone || null,
        rules: formData.rules || null,
        company_context: formData.company_context || null,
        sector: formData.sector || null,
        company_description: formData.company_description || null,
        knowledge_base: formData.knowledge_base || {
          files: [],
          websites: [],
          qa: []
        },
        api_key: formData.integration?.apiKey || null,
        selected_model: formData.integration?.selectedModel || 'gpt-4o-mini',
        is_connected: formData.integration?.isConnected || false,
        is_company_wide: formData.is_company_wide || false,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      // Debug completo dos dados
      // Debug completo
      console.log('formData:', formData);
      console.log('formData.integration:', formData.integration);
      console.log('formData.integration?.apiKey:', formData.integration?.apiKey);
      console.log('formData.integration?.apiKey length:', formData.integration?.apiKey?.length);
      console.log('formData.integration?.apiKey starts with sk-:', formData.integration?.apiKey?.startsWith('sk-'));
      console.log('configData.api_key:', configData.api_key);
      console.log('configData.selected_model:', configData.selected_model);
      console.log('configData.name:', configData.name);
      console.log('configData.function:', configData.function);
      console.log('configData.personality:', configData.personality);
      console.log('configData completo:', configData);
      console.log('🔑 API Key sendo salva:', configData.api_key);
      console.log('🔑 API Key não é null:', configData.api_key !== null);
      console.log('🔑 API Key não é undefined:', configData.api_key !== undefined);
      console.log('🔑 API Key não é vazia:', configData.api_key !== '');

      // Se é configuração da empresa, desativar outras configurações da empresa
      if (formData.is_company_wide && companyId) {
        await supabase
          .from('ai_agent_configs')
          .update({ is_active: false })
          .eq('company_id', companyId)
          .eq('is_company_wide', true);
      }

      // Se é configuração pessoal, desativar outras configurações pessoais
      if (!formData.is_company_wide) {
        await supabase
          .from('ai_agent_configs')
          .update({ is_active: false })
          .eq('owner_id', user.id)
          .eq('is_company_wide', false);
      }

      // Verificar se já existe configuração
      const { data: existingConfig } = await supabase
        .from('ai_agent_configs')
        .select('id')
        .eq('owner_id', user.id)
        .eq('is_company_wide', formData.is_company_wide)
        .single();

      let data, error;

      if (existingConfig) {
        // Atualizar configuração existente
        console.log('🔄 Atualizando configuração existente:', existingConfig.id);
        console.log('🔄 Dados sendo atualizados:', {
          ...configData,
          updated_at: new Date().toISOString()
        });
        const result = await supabase
          .from('ai_agent_configs')
          .update({
            ...configData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id)
          .select()
          .single();
        
        console.log('🔄 Resultado da atualização:', result);
        console.log('🔄 result.data:', result.data);
        console.log('🔄 result.error:', result.error);
        console.log('🔄 result.data?.api_key:', result.data?.api_key);
        console.log('🔄 result.data?.selected_model:', result.data?.selected_model);
        data = result.data;
        error = result.error;
      } else {
        // Criar nova configuração
        console.log('➕ Criando nova configuração');
        console.log('➕ Dados sendo inseridos:', {
          ...configData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        const result = await supabase
          .from('ai_agent_configs')
          .insert([{
            ...configData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        console.log('➕ Resultado da inserção:', result);
        console.log('➕ result.data:', result.data);
        console.log('➕ result.error:', result.error);
        console.log('➕ result.data?.api_key:', result.data?.api_key);
        console.log('➕ result.data?.selected_model:', result.data?.selected_model);
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('❌ Erro ao salvar configuração:', error);
        console.error('❌ Detalhes do erro:', error.message);
        console.error('❌ Código do erro:', error.code);
        throw error;
      }

      console.log('✅ Upsert executado com sucesso');
      console.log('✅ Dados retornados:', data);

      // Debug do resultado do salvamento
      console.log('✅ Configuração salva com sucesso:');
      console.log('data.id:', data?.id);
      console.log('data.api_key:', data?.api_key);
      console.log('data.selected_model:', data?.selected_model);
      console.log('data.api_key não é null:', data?.api_key !== null);
      console.log('data.api_key não é undefined:', data?.api_key !== undefined);
      console.log('data.api_key não é vazia:', data?.api_key !== '');
      console.log('data.api_key length:', data?.api_key?.length);
      console.log('data completo:', data);

      // Atualizar estado local
      if (formData.is_company_wide) {
        setCompanyConfig(data);
      } else {
        setConfig(data);
      }

      // Recarregar configurações para garantir sincronização
      await loadConfigs();

      return data;
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error);
      setError(error.message || 'Erro ao salvar configuração');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [user?.id, getCompanyId]);

  // Obter configuração ativa (pessoal ou da empresa)
  const getActiveConfig = useCallback(() => {
    return companyConfig || config;
  }, [companyConfig, config]);

  // Verificar se usuário pode editar configuração da empresa
  const canEditCompanyConfig = useCallback(async () => {
    if (!user?.id) return false;

    try {
      const companyId = await getCompanyId();
      if (!companyId) return false;

      // Verificar se usuário tem permissão para editar configurações da empresa
      const { data: userRole, error } = await supabase
        .from('company_users')
        .select(`
          role_id,
          roles (name, permissions)
        `)
        .eq('id', user.id)
        .eq('company_id', companyId)
        .single();

      if (error) return false;

      // Verificar se tem permissão para editar AI Agent da empresa
      const permissions = userRole?.roles?.permissions;
      return permissions?.includes('edit_company_ai') || permissions?.includes('admin');
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return false;
    }
  }, [user?.id, getCompanyId]);

  // Ref para prevenir carregamentos múltiplos
  const hasLoadedRef = useRef(false);

  // Carregar configurações quando o usuário mudar - UMA VEZ APENAS
  useEffect(() => {
    if (!user?.id) {
      hasLoadedRef.current = false;
      setLoading(false);
      return;
    }

    // Prevenir carregamentos simultâneos
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadAll = async () => {
      setLoading(true);
      setError(null);

      try {
        await Promise.all([
          loadPersonalConfig(),
          loadCompanyConfig()
        ]);
      } catch (err: any) {
        console.error('Failed to load configs:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [user?.id]); // APENAS user?.id nas dependências

  return {
    config,
    companyConfig,
    activeConfig: getActiveConfig(),
    loading,
    saving,
    error,
    saveConfig,
    loadConfigs,
    canEditCompanyConfig,
    getCompanyId
  };
}

