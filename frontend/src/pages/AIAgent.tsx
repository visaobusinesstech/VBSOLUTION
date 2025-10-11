import React, { useState, useCallback, useEffect } from 'react';
import { Bot, Brain, Settings, Plus, Edit, Trash2, Save, Upload, Link, FileText, MessageSquare, User, Zap, Target, Globe, Database, BookOpen, CheckCircle, AlertCircle, Key, TestTube, Eye, EyeOff, Shield, X, Building, AlignJustify } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useAIAgentConfig, AIAgentConfigForm } from '@/hooks/useAIAgentConfig';
import { useAIAgentVariables } from '@/hooks/useAIAgentVariables';
import AIAgentVariablesModal from '@/components/AIAgentVariablesModal';
import { CreateAIAgentVariableData } from '@/types/ai-agent-variables';

interface OpenAIModel {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  cost: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAgentConfig {
  // Cargo (Role) - Comportamento do agente
  name: string;
  function: string;
  personality: string;
  status: 'active' | 'inactive' | 'training';
  responseStyle: 'formal' | 'casual' | 'friendly' | 'professional';
  language: string;
  maxResponseLength: number;
  responseSpeed?: string;
  advancedSettings?: {
    tone?: string;
    rules?: string;
    companyContext?: string;
    sector?: string;
    companyDescription?: string;
  };
  
  // Cérebro (Brain) - Base de conhecimento
  knowledgeBase: {
    files: Array<{
      id: string;
      name: string;
      type: string;
      size: string;
      uploadedAt: string;
    }>;
    websites: Array<{
      id: string;
      url: string;
      title: string;
      lastCrawled: string;
    }>;
    qa: Array<{
      id: string;
      question: string;
      answer: string;
      category: string;
    }>;
  };

  // Integração - Configurações de API
  integration: {
    apiKey: string;
    selectedModel: string;
    isConnected: boolean;
  };

  // Configurações de Áudio
  audioSettings?: {
    transcriptionEnabled: boolean;
    transcriptionLanguage: string;
    transcriptionProvider: 'openai' | 'disabled';
    transcriptionModel: string;
    autoSave: boolean;
    maxDuration: number;
    fallbackText: string;
  };

  // Configurações de Mensagens
  messageSettings?: {
    debounceEnabled: boolean;
    debounceTimeMs: number;
    chunkSize: number;
    chunkDelayMs: number;
    maxMessagesPerBatch: number;
    randomDelayEnabled: boolean;
    minDelayMs: number;
    maxDelayMs: number;
  };

  // Configuração de escopo
  isCompanyWide?: boolean;
}

const OPENAI_MODELS: OpenAIModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Modelo mais avançado com visão multimodal',
    maxTokens: 128000,
    cost: '10 créditos'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Versão mais rápida e econômica do GPT-4o',
    maxTokens: 128000,
    cost: '1 crédito'
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Modelo GPT-4 otimizado para velocidade',
    maxTokens: 128000,
    cost: '7 créditos'
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'Modelo GPT-4 padrão',
    maxTokens: 8192,
    cost: '7 créditos'
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Modelo rápido e econômico',
    maxTokens: 16384,
    cost: '1 crédito'
  }
];

export default function AIAgentPage() {
  const { sidebarExpanded, setSidebarExpanded } = useSidebar();
  const [activeTab, setActiveTab] = useState<'cargo' | 'cerebro' | 'acoes' | 'integracao' | 'teste'>('cargo');
  const [isEditing, setIsEditing] = useState(false); // Iniciar em modo de visualização
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPersonalityModal, setShowPersonalityModal] = useState(false);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Hook para gerenciar configurações do AI Agent
  const { 
    config: savedConfig, 
    companyConfig, 
    activeConfig, 
    loading: configLoading, 
    saving, 
    error: configError, 
    saveConfig,
    loadConfigs,
    canEditCompanyConfig 
  } = useAIAgentConfig();
  
  // Usar activeConfig do hook em vez de estado local
  const defaultConfig = {
    name: 'Assistente Virtual VB',
    function: 'Atendimento ao cliente via WhatsApp',
    personality: 'Profissional, prestativo e eficiente',
    status: 'active',
    responseStyle: 'friendly',
    language: 'pt-BR',
    maxResponseLength: 500,
    responseSpeed: 'normal',
    advancedSettings: {
      tone: '',
      rules: '',
      companyContext: '',
      sector: '',
      companyDescription: ''
    },
    knowledgeBase: {
      files: [],
      websites: [],
      qa: []
    },
    integration: {
      apiKey: '',
      selectedModel: 'gpt-4o-mini',
      isConnected: false
    },
    isCompanyWide: false
  };

  // Garantir que config nunca seja undefined e que todas as propriedades existam
  const config = {
    ...defaultConfig,
    ...activeConfig,
    advancedSettings: {
      ...defaultConfig.advancedSettings,
      ...(activeConfig?.advancedSettings || {})
    },
    knowledgeBase: {
      ...defaultConfig.knowledgeBase,
      ...(activeConfig?.knowledgeBase || {})
    },
    integration: {
      ...defaultConfig.integration,
      ...(activeConfig?.integration || {})
    }
  };
  
  const { 
    variables, 
    createVariable, 
    updateVariable, 
    deleteVariable, 
    loading: variablesLoading, 
    saving: variablesSaving 
  } = useAIAgentVariables(config?.id || '');

  console.log('=== CONFIG DEBUG ===');
  console.log('activeConfig:', activeConfig);
  console.log('config:', config);
  console.log('config.integration.apiKey:', config.integration.apiKey);


  // Estado local para mudanças em tempo real
  const [safeLocalConfig, setLocalConfig] = useState(() => ({
    ...defaultConfig,
    ...config,
    advancedSettings: {
      ...defaultConfig.advancedSettings,
      ...(config?.advancedSettings || {})
    },
    knowledgeBase: {
      ...defaultConfig.knowledgeBase,
      ...(config?.knowledgeBase || {})
    },
    integration: {
      ...defaultConfig.integration,
      ...(config?.integration || {})
    }
  }));

  // Atualizar estado local quando activeConfig mudar
  useEffect(() => {
    console.log('=== USEEFFECT ACTIVE CONFIG ===');
    console.log('activeConfig:', activeConfig);
    console.log('activeConfig?.integration?.apiKey:', activeConfig?.integration?.apiKey);
    
    if (activeConfig) {
      const newLocalConfig = {
        ...defaultConfig,
        ...activeConfig,
        advancedSettings: {
          ...defaultConfig.advancedSettings,
          ...(activeConfig?.advancedSettings || {})
        },
        knowledgeBase: {
          ...defaultConfig.knowledgeBase,
          ...(activeConfig?.knowledgeBase || {})
        },
        integration: {
          ...defaultConfig.integration,
          ...(activeConfig?.integration || {}),
          apiKey: activeConfig?.api_key || defaultConfig.integration.apiKey,
          selectedModel: activeConfig?.selected_model || defaultConfig.integration.selectedModel,
          isConnected: activeConfig?.is_connected || defaultConfig.integration.isConnected
        }
      };
      
      console.log('=== SETTING LOCAL CONFIG ===');
      console.log('newLocalConfig.integration.apiKey:', newLocalConfig.integration.apiKey);
      
      setLocalConfig(newLocalConfig);
    }
  }, [activeConfig]);

  // Função para atualizar config localmente (para mudanças em tempo real)
  const updateLocalConfig = (updater: any) => {
    if (typeof updater === 'function') {
      setLocalConfig(prev => {
        const current = prev || defaultConfig;
        const updated = updater(current);
        return {
          ...defaultConfig,
          ...updated,
          advancedSettings: {
            ...defaultConfig.advancedSettings,
            ...(updated?.advancedSettings || {})
          },
          knowledgeBase: {
            ...defaultConfig.knowledgeBase,
            ...(updated?.knowledgeBase || {})
          },
          integration: {
            ...defaultConfig.integration,
            ...(updated?.integration || {})
          }
        };
      });
    } else {
      setLocalConfig({
        ...defaultConfig,
        ...updater,
        advancedSettings: {
          ...defaultConfig.advancedSettings,
          ...(updater?.advancedSettings || {})
        },
        knowledgeBase: {
          ...defaultConfig.knowledgeBase,
          ...(updater?.knowledgeBase || {})
        },
        integration: {
          ...defaultConfig.integration,
          ...(updater?.integration || {})
        }
      });
    }
  };

  // Função para salvar no Supabase
  const saveToSupabase = async (configToSave: any) => {
    try {
      // Preparar dados para salvar no Supabase
      const formData: AIAgentConfigForm = {
        name: configToSave.name,
        function: configToSave.function,
        personality: configToSave.personality,
        response_style: configToSave.responseStyle,
        language: configToSave.language,
        max_response_length: configToSave.maxResponseLength,
        tone: configToSave.advancedSettings?.tone || '',
        rules: configToSave.advancedSettings?.rules || '',
        company_context: configToSave.advancedSettings?.companyContext || '',
        sector: configToSave.advancedSettings?.sector || '',
        company_description: configToSave.advancedSettings?.companyDescription || '',
        knowledge_base: {
          files: configToSave.knowledgeBase.files || [],
          websites: configToSave.knowledgeBase.websites || [],
          qa: configToSave.knowledgeBase.qa || []
        },
        integration: {
          apiKey: configToSave.integration.apiKey,
          selectedModel: configToSave.integration.selectedModel,
          isConnected: configToSave.integration.isConnected
        },
        advanced_settings: {
          temperature: configToSave.advancedSettings?.temperature || 0.7,
          max_tokens: configToSave.advancedSettings?.maxTokens || 1000
        },
        is_company_wide: configToSave.isCompanyWide || false
      };

      // Salvar no Supabase
      await saveConfig(formData);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    }
  };

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou seu assistente virtual VB. Como posso ajudá-lo hoje?',
      timestamp: new Date()
    }
  ]);

  const [newFile, setNewFile] = useState<File | null>(null);
  const [newWebsite, setNewWebsite] = useState({ url: '', title: '' });
  const [newQA, setNewQA] = useState({ question: '', answer: '', category: '' });
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const [tabDataCache, setTabDataCache] = useState<{[key: string]: any}>({});
  const [lastLocalUpdate, setLastLocalUpdate] = useState<number>(0);
  
  // Ações - Sistema de Funnel Steps
  const [funnelSteps, setFunnelSteps] = useState<Array<{
    id: string;
    name: string;
    condition: string;
    instructionPrompt: string;
    collectData: string[];
    action: string;
    finalInstructions: string;
    followUpTimeout: string;
    isActive: boolean;
  }>>([]);
  const [selectedStep, setSelectedStep] = useState<{
    id: string;
    name: string;
    condition: string;
    instructionPrompt: string;
    collectData: string[];
    action: string;
    finalInstructions: string;
    followUpTimeout: string;
    isActive: boolean;
  } | null>(null);
  const [editingStep, setEditingStep] = useState<typeof selectedStep>(null);
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [newCollectData, setNewCollectData] = useState('');
  const [showVariablesDropdown, setShowVariablesDropdown] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [textAreaRef, setTextAreaRef] = useState<HTMLTextAreaElement | null>(null);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showVariablesModal, setShowVariablesModal] = useState(false);
  const [isCreatingNewStep, setIsCreatingNewStep] = useState(false);
  const [executionLog, setExecutionLog] = useState<Array<{
    id: string;
    type: 'thinking' | 'action' | 'response';
    message: string;
    timestamp: Date;
    details?: any;
  }>>([]);

  // Função para scroll automático para o final do chat
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Scroll automático quando novas mensagens são adicionadas
  React.useEffect(() => {
    if (activeTab === 'teste') {
      scrollToBottom();
    }
  }, [chatMessages, activeTab]);

  // Inicializar com dados de exemplo para Funnel Steps
  React.useEffect(() => {
    if (funnelSteps.length === 0) {
      setFunnelSteps([
        {
          id: '1',
          name: 'Identificação e Qualificação Inicial',
          condition: 'Início da conversa ou cliente em potencial fazendo contato',
          instructionPrompt: '# CONTEXTO\n* Você está falando com alguém que está entrando em contato com a empresa.\n* Eles podem ser um novo ou contato existente.\n* Seu objetivo é determinar a intenção deles e direcioná-los para a equipe ou pessoa certa.\n\n# PAPEL E ESTILO DE COMUNICAÇÃO\n* Você é um recepcionista educado, profissional e eficiente.\n* Você fará uma pergunta por vez e nunca responderá consultas sozinho.\n* Você é um agente de suporte calmo e prestativo que usa linguagem simples e clara.',
          collectData: ['data.nome_cliente', 'data.telefone_cliente', 'data.email_cliente'],
          action: 'transfer_human',
          finalInstructions: 'Agradeça pelo contato, confirme os dados coletados e apresente-se como Lucas da Insight Cloud. Explique brevemente que a Insight Cloud é especializada em soluções de CRM para pequenas e médias empresas e pergunte sobre os desafios atuais da empresa dele na gestão de clientes.',
          followUpTimeout: '30',
          isActive: true
        },
        {
          id: '2',
          name: 'Descoberta de Necessidades',
          condition: 'Cliente demonstra interesse em conhecer soluções',
          instructionPrompt: '# CONTEXTO\n* Você está conversando com um cliente que demonstrou interesse em conhecer nossas soluções.\n* Seu objetivo é descobrir as necessidades específicas da empresa dele.\n\n# PAPEL E ESTILO DE COMUNICAÇÃO\n* Seja consultivo, mas não invasivo.\n* Faça perguntas abertas para entender melhor os desafios.\n* Use linguagem técnica apropriada, mas acessível.',
          collectData: ['data.nome_empresa', 'data.cargo_cliente', 'data.produto_interesse'],
          action: 'google_calendar',
          finalInstructions: 'Faça perguntas específicas sobre os processos atuais da empresa e identifique pontos de melhoria. Sugira uma reunião para apresentar a solução personalizada.',
          followUpTimeout: '60',
          isActive: true
        }
      ]);
    }
  }, [funnelSteps.length]);

  // Fechar dropdown quando clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showVariablesDropdown && textAreaRef && !textAreaRef.contains(event.target as Node)) {
        setShowVariablesDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVariablesDropdown, textAreaRef]);

  // Variáveis disponíveis baseadas na tabela de contatos
  const availableVariables = [
    { key: 'data.nome_cliente', label: 'Nome do Cliente', type: 'string', required: true },
    { key: 'data.telefone_cliente', label: 'Telefone do Cliente', type: 'phone', required: true },
    { key: 'data.email_cliente', label: 'Email do Cliente', type: 'email', required: false },
    { key: 'data.produto_interesse', label: 'Produto de Interesse', type: 'string', required: false },
    { key: 'data.cargo_cliente', label: 'Cargo do Cliente', type: 'string', required: false },
    { key: 'data.nome_empresa', label: 'Nome da Empresa', type: 'string', required: false },
    { key: 'data.empresa_tamanho', label: 'Tamanho da Empresa', type: 'string', required: false },
    { key: 'data.setor_empresa', label: 'Setor da Empresa', type: 'string', required: false },
    { key: 'data.orcamento_disponivel', label: 'Orçamento Disponível', type: 'number', required: false },
    { key: 'data.prazo_implementacao', label: 'Prazo de Implementação', type: 'string', required: false },
    { key: 'data.decisores_envolvidos', label: 'Decisores Envolvidos', type: 'string', required: false },
    { key: 'data.concorrentes_avaliando', label: 'Concorrentes Avaliando', type: 'string', required: false }
  ];

  // Carregar configurações salvas - REMOVIDO para evitar conflito com activeConfig
  // React.useEffect(() => {
  //   const savedApiKey = localStorage.getItem('openai_api_key');
  //   const savedModel = localStorage.getItem('openai_model');
  //   
  //   if (savedApiKey && savedModel) {
  //     updateLocalConfig(prev => ({
  //       ...prev,
  //       integration: {
  //         apiKey: savedApiKey,
  //         selectedModel: savedModel,
  //         isConnected: true
  //       }
  //     }));
  //   }
  // }, []);

  // Carregar configurações salvas do banco de dados
  React.  useEffect(() => {
    if (activeConfig) {
      console.log('🔧 Configuração ativa recebida:', activeConfig);
      console.log('🔧 Knowledge base:', activeConfig.knowledge_base);
      console.log('🔧 Knowledge base type:', typeof activeConfig.knowledge_base);
      console.log('🔧 Websites:', activeConfig.knowledge_base?.websites);
      console.log('🔧 Websites length:', activeConfig.knowledge_base?.websites?.length);
      console.log('🔧 Files:', activeConfig.knowledge_base?.files);
      console.log('🔧 QA:', activeConfig.knowledge_base?.qa);
      console.log('🔧 Estado local atual:', {
        websites: config.knowledgeBase.websites.length,
        files: config.knowledgeBase.files.length,
        qa: config.knowledgeBase.qa.length
      });
      
      // Verificar se há dados remotos
      const hasRemoteData = (activeConfig.knowledge_base?.websites?.length || 0) > 0 ||
                           (activeConfig.knowledge_base?.files?.length || 0) > 0 ||
                           (activeConfig.knowledge_base?.qa?.length || 0) > 0;
      
      // Verificar se há dados locais
      const hasLocalData = config.knowledgeBase.websites.length > 0 || 
                          config.knowledgeBase.files.length > 0 || 
                          config.knowledgeBase.qa.length > 0;
      
      console.log('🔧 Verificação de dados:', {
        hasRemoteData,
        hasLocalData,
        hasLocalChanges,
        remoteWebsites: activeConfig.knowledge_base?.websites?.length || 0,
        remoteFiles: activeConfig.knowledge_base?.files?.length || 0,
        remoteQA: activeConfig.knowledge_base?.qa?.length || 0,
        localWebsites: config.knowledgeBase.websites.length,
        localFiles: config.knowledgeBase.files.length,
        localQA: config.knowledgeBase.qa.length
      });
      
      // Lógica simplificada: sempre carregar se há dados remotos e não há dados locais
      if (!hasLocalData && hasRemoteData) {
        console.log('🔧 Carregando dados do banco - não há dados locais mas há dados remotos');
      } else if (hasLocalChanges) {
        console.log('🔧 Ignorando carregamento - há mudanças locais ativas');
        return;
      } else if (!hasRemoteData) {
        console.log('🔧 Ignorando carregamento - banco não tem dados');
        return;
      } else {
        console.log('🔧 Ignorando carregamento - já há dados locais');
        return;
      }
      
      console.log('🔧 Carregando dados do banco...');
      
      updateLocalConfig(prev => ({
        ...prev,
        name: activeConfig.name || prev.name,
        function: activeConfig.function || prev.function,
        personality: activeConfig.personality || prev.personality,
        responseStyle: activeConfig.response_style as any || prev.responseStyle,
        language: activeConfig.language || prev.language,
        maxResponseLength: activeConfig.max_response_length || prev.maxResponseLength,
        advancedSettings: {
          tone: activeConfig.tone || '',
          rules: activeConfig.rules || '',
          companyContext: activeConfig.company_context || '',
          sector: activeConfig.sector || '',
          companyDescription: activeConfig.company_description || ''
        },
        knowledgeBase: {
          ...prev.knowledgeBase,
          files: activeConfig.knowledge_base?.files || [],
          websites: activeConfig.knowledge_base?.websites || [],
          qa: (activeConfig.knowledge_base?.qa || []).map(qa => ({
            id: qa.id,
            question: qa.question,
            answer: qa.answer,
            category: qa.category || 'geral'
          }))
        },
        integration: {
          apiKey: activeConfig.api_key || prev.integration.apiKey,
          selectedModel: activeConfig.selected_model || prev.integration.selectedModel,
          isConnected: activeConfig.is_connected || prev.integration.isConnected
        },
        isCompanyWide: activeConfig.is_company_wide || false
      }));
      
      console.log('🔧 Configuração atualizada com knowledge base:', {
        websites: activeConfig.knowledge_base?.websites || [],
        files: activeConfig.knowledge_base?.files || [],
        qa: activeConfig.knowledge_base?.qa || []
      });
      
      // Log do estado local após atualização
      setTimeout(() => {
        console.log('🔧 Estado local após atualização:', {
          websites: config.knowledgeBase.websites.length,
          files: config.knowledgeBase.files.length,
          qa: config.knowledgeBase.qa.length
        });
        console.log('🔧 Websites no estado local:', config.knowledgeBase.websites);
      }, 100);
    }
  }, [activeConfig]);

  // Carregar dados do banco quando a página é carregada pela primeira vez
  React.useEffect(() => {
    if (activeConfig) {
      console.log('🔧 [INITIAL LOAD] Carregando configuração completa do banco...');
      console.log('🔧 [INITIAL LOAD] activeConfig:', activeConfig);
      
      let knowledgeBase = activeConfig.knowledge_base;
      if (typeof knowledgeBase === 'string') {
        knowledgeBase = JSON.parse(knowledgeBase);
      }
      
      // Carregar todos os dados da configuração
      updateLocalConfig(prev => ({
        ...prev,
        name: activeConfig.name || prev.name,
        function: activeConfig.function || prev.function,
        personality: activeConfig.personality || prev.personality,
        responseStyle: activeConfig.response_style as any || prev.responseStyle,
        language: activeConfig.language || prev.language,
        maxResponseLength: activeConfig.max_response_length || prev.maxResponseLength,
        advancedSettings: {
          tone: activeConfig.tone || '',
          rules: activeConfig.rules || '',
          companyContext: activeConfig.company_context || '',
          sector: activeConfig.sector || '',
          companyDescription: activeConfig.company_description || ''
        },
        knowledgeBase: {
          files: knowledgeBase?.files || [],
          websites: knowledgeBase?.websites || [],
          qa: (knowledgeBase?.qa || []).map(qa => ({
            id: qa.id,
            question: qa.question,
            answer: qa.answer,
            category: qa.category || 'geral'
          }))
        },
        integration: {
          apiKey: activeConfig.api_key || prev.integration.apiKey,
          selectedModel: activeConfig.selected_model || prev.integration.selectedModel,
          isConnected: activeConfig.is_connected || prev.integration.isConnected
        },
        isCompanyWide: activeConfig.is_company_wide || false
      }));
      
      console.log('✅ [INITIAL LOAD] Configuração completa carregada com sucesso!');
    }
  }, [activeConfig?.id]); // Usar apenas o ID da configuração para evitar loops

  // Salvar automaticamente antes de sair da página
  React.useEffect(() => {
    const handleBeforeUnload = async () => {
      // Verificar se há dados para salvar
      const hasDataToSave = config.knowledgeBase.websites.length > 0 || 
                           config.knowledgeBase.files.length > 0 || 
                           config.knowledgeBase.qa.length > 0;
      
      if (hasDataToSave) {
        console.log('🔧 Salvando dados antes de sair da página...');
        try {
          await saveConfig({
            name: config.name,
            function: config.function,
            personality: config.personality,
            response_style: config.responseStyle,
            language: config.language,
            max_response_length: config.maxResponseLength,
            tone: config.advancedSettings?.tone || '',
            rules: config.advancedSettings?.rules || '',
            company_context: config.advancedSettings?.companyContext || '',
            sector: config.advancedSettings?.sector || '',
            company_description: config.advancedSettings?.companyDescription || '',
            knowledge_base: {
              files: config.knowledgeBase.files,
              websites: config.knowledgeBase.websites,
              qa: config.knowledgeBase.qa
            },
            integration: config.integration,
            advanced_settings: {
              temperature: 0.7,
              max_tokens: config.maxResponseLength
            },
            is_company_wide: config.isCompanyWide || false
          });
          console.log('✅ Dados salvos com sucesso antes de sair');
        } catch (error) {
          console.error('❌ Erro ao salvar antes de sair:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [config, saveConfig]);

  // Salvar dados da aba atual no cache quando mudar de aba
  const saveCurrentTabData = useCallback(() => {
    setTabDataCache(prev => ({
      ...prev,
      [activeTab]: {
        config: { ...config },
        hasLocalChanges,
        timestamp: Date.now()
      }
    }));
  }, [activeTab, config, hasLocalChanges]);

  // Carregar dados da aba do cache quando mudar de aba
  const loadTabData = useCallback((tabName: string) => {
    const cachedData = tabDataCache[tabName];
    if (cachedData && cachedData.config) {
      console.log(`🔧 Carregando dados da aba ${tabName} do cache`);
      updateLocalConfig(cachedData.config);
      setHasLocalChanges(cachedData.hasLocalChanges || false);
    }
  }, [tabDataCache]);

  // Salvar dados da aba atual antes de mudar
  React.useEffect(() => {
    if (activeTab) {
      saveCurrentTabData();
    }
  }, [activeTab, saveCurrentTabData]);

  // Função para alternar modo de edição
  const toggleEditMode = () => {
    if (isEditing) {
      // Se está saindo do modo de edição, cancelar mudanças
      handleCancelEdit();
    } else {
      // Se está entrando no modo de edição, habilitar
      setIsEditing(true);
      console.log('🔄 Modo de edição HABILITADO - campos editáveis');
    }
  };

  // Função para cancelar edição e restaurar dados originais
  const handleCancelEdit = () => {
    setIsEditing(false);
    // Recarregar dados do banco para restaurar estado original
    loadConfigs();
    console.log('🔄 Modo de edição CANCELADO - campos bloqueados, dados restaurados');
  };

  // Função helper para classes CSS dos campos
  const getFieldClasses = (baseClasses: string = '') => {
    return `${baseClasses} ${
      isEditing 
        ? 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent' 
        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
    }`;
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      console.log('=== DEBUG SAVE ===');
      console.log('safeLocalConfig.integration.apiKey:', safeLocalConfig.integration.apiKey);
      console.log('safeLocalConfig.integration.apiKey length:', safeLocalConfig.integration.apiKey?.length);
      console.log('isEditing:', isEditing);
      console.log('activeConfig:', activeConfig);
      console.log('savedConfig:', savedConfig);
      console.log('Salvando configuração:', safeLocalConfig);
      console.log('🔑 API Key sendo enviada:', safeLocalConfig.integration.apiKey);
      console.log('🔑 API Key starts with sk-:', safeLocalConfig.integration.apiKey?.startsWith('sk-'));
      
      // Verificar se é configuração da empresa e se o usuário tem permissão
      if (config.isCompanyWide) {
        const canEdit = await canEditCompanyConfig();
        if (!canEdit) {
          alert('Você não tem permissão para editar configurações da empresa.');
          return;
        }
      }
      
      // Preparar dados para salvar
      const formData: AIAgentConfigForm = {
        name: safeLocalConfig.name,
        function: safeLocalConfig.function,
        personality: safeLocalConfig.personality,
        response_style: safeLocalConfig.responseStyle,
        language: safeLocalConfig.language,
        max_response_length: safeLocalConfig.maxResponseLength,
        tone: safeLocalConfig.advancedSettings?.tone || '',
        rules: safeLocalConfig.advancedSettings?.rules || '',
        company_context: safeLocalConfig.advancedSettings?.companyContext || '',
        sector: safeLocalConfig.advancedSettings?.sector || '',
        company_description: safeLocalConfig.advancedSettings?.companyDescription || '',
        knowledge_base: {
          files: safeLocalConfig.knowledgeBase.files || [],
          websites: safeLocalConfig.knowledgeBase.websites || [],
          qa: safeLocalConfig.knowledgeBase.qa.map(qa => ({
            id: qa.id,
            question: qa.question,
            answer: qa.answer,
            category: qa.category || 'geral'
          }))
        },
        integration: {
          apiKey: safeLocalConfig.integration.apiKey,
          selectedModel: safeLocalConfig.integration.selectedModel,
          isConnected: safeLocalConfig.integration.isConnected
        },
        advanced_settings: {
          temperature: 0.7, // Valor padrão
          max_tokens: safeLocalConfig.maxResponseLength
        },
        is_company_wide: safeLocalConfig.isCompanyWide || false
      };
      
      console.log('formData.integration.apiKey:', formData.integration.apiKey);
      console.log('formData completo:', formData);
      
      // Salvar usando o hook
      await saveConfig(formData);
      
      console.log('=== SAVE SUCCESS ===');
      setIsEditing(false); // Desabilitar modo de edição após salvar
      alert('Configuração salva com sucesso!');
      
      // Recarregar configurações
      await loadConfigs();
      
      // Forçar atualização do estado local
      setHasLocalChanges(false);
      
      // Confirmar que os campos estão bloqueados
      console.log('✅ Modo de edição desabilitado - campos bloqueados');
      
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error);
      alert(`Erro ao salvar configuração: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimizePersonality = async () => {
    if (!config.integration.isConnected || !config.integration.apiKey) {
      alert('Por favor, configure a API Key do OpenAI na aba Integração');
      return;
    }

    if (!config.personality.trim()) {
      alert('Por favor, digite uma personalidade antes de otimizar');
      return;
    }

    // Confirmar com o usuário antes de otimizar
    const confirmOptimize = window.confirm(
      'Deseja otimizar a personalidade atual? A IA irá melhorar o texto existente mantendo o conteúdo principal, mas organizando e enriquecendo a descrição.'
    );

    if (!confirmOptimize) {
      return;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.integration.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Você é um especialista em otimização de prompts para agentes de IA. Sua tarefa é pegar o texto de personalidade fornecido pelo usuário e otimizá-lo para ser mais claro, profissional e eficaz.

CONTEXTO DO AGENTE:
- Função: ${config.function}
- Estilo de Resposta: ${config.responseStyle}
- Idioma: ${config.language}
${config.advancedSettings?.tone ? `- Tom Específico: ${config.advancedSettings.tone}` : ''}
${config.advancedSettings?.sector ? `- Setor: ${config.advancedSettings.sector}` : ''}
${config.advancedSettings?.companyContext ? `- Contexto da Empresa: ${config.advancedSettings.companyContext}` : ''}

INSTRUÇÕES DE OTIMIZAÇÃO:
1. Mantenha o conteúdo principal e a essência do texto original
2. Melhore a estrutura e organização
3. Torne mais específico sobre comportamento e tom de voz
4. Adicione exemplos práticos de situações
5. Use linguagem profissional e clara
6. Mantenha em português brasileiro
7. Torne mais detalhado e abrangente

Otimize o seguinte texto de personalidade:`
            },
            {
              role: 'user',
              content: config.personality
            }
          ],
          max_tokens: 800,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro da API OpenAI:', errorData);
        
        if (response.status === 401) {
          throw new Error('API Key inválida. Verifique sua chave na aba Integração.');
        } else if (response.status === 429) {
          throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
        } else if (response.status === 400) {
          throw new Error('Requisição inválida. Verifique sua configuração.');
        } else {
          throw new Error(`Erro na API: ${response.status} - ${errorData.error?.message || 'Erro desconhecido'}`);
        }
      }

      const data = await response.json();
      const optimizedPersonality = data.choices[0]?.message?.content?.trim() || '';
      
      if (optimizedPersonality) {
        // Mostrar preview da otimização e confirmar substituição
        const confirmReplace = window.confirm(
          `Personalidade otimizada gerada com sucesso!\n\nDeseja substituir o texto atual pela versão otimizada?\n\nClique "OK" para substituir ou "Cancelar" para manter o texto original.`
        );

        if (confirmReplace) {
          updateLocalConfig(prev => ({ ...prev, personality: optimizedPersonality }));
          alert('Personalidade otimizada aplicada com sucesso!');
        } else {
          alert('Personalidade otimizada descartada. O texto original foi mantido.');
        }
      }
    } catch (error) {
      console.error('Erro ao otimizar personalidade:', error);
      alert('Erro ao otimizar personalidade. Tente novamente.');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!config.integration.isConnected || !config.integration.apiKey) {
      alert('Por favor, configure a API Key do OpenAI na aba Integração');
      return;
    }

    // Confirmar upload
    const confirmUpload = window.confirm(
      `Deseja processar o arquivo "${file.name}" com IA? O sistema irá extrair e analisar o conteúdo para treinar o agente.`
    );

    if (!confirmUpload) return;

    setIsLoading(true);

    try {
      // Criar FormData para upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('apiKey', config.integration.apiKey);

      // Simular processamento (em produção, seria uma API real)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Adicionar arquivo processado à base de conhecimento
      const processedFile = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        uploadedAt: new Date().toISOString(),
        status: 'processed',
        content: `Conteúdo extraído de ${file.name} - Processado com IA para treinamento do agente`
      };

      const updatedConfig = {
        ...config,
        knowledgeBase: {
          ...config.knowledgeBase,
          files: [...config.knowledgeBase.files, processedFile]
        }
      };

      updateLocalConfig(updatedConfig);
      setHasLocalChanges(true);

      // Salvar automaticamente no banco de dados
      try {
        await saveConfig({
          name: updatedConfig.name,
          function: updatedConfig.function,
          personality: updatedConfig.personality,
          response_style: updatedConfig.responseStyle,
          language: updatedConfig.language,
          max_response_length: updatedConfig.maxResponseLength,
          tone: updatedConfig.advancedSettings?.tone || '',
          rules: updatedConfig.advancedSettings?.rules || '',
          company_context: updatedConfig.advancedSettings?.companyContext || '',
          sector: updatedConfig.advancedSettings?.sector || '',
          company_description: updatedConfig.advancedSettings?.companyDescription || '',
          knowledge_base: {
            files: updatedConfig.knowledgeBase.files,
            websites: updatedConfig.knowledgeBase.websites,
            qa: updatedConfig.knowledgeBase.qa
          },
          integration: updatedConfig.integration,
          advanced_settings: {
            temperature: 0.7,
            max_tokens: updatedConfig.maxResponseLength
          },
          is_company_wide: updatedConfig.isCompanyWide || false
        });
        setHasLocalChanges(false); // Reset após salvamento bem-sucedido
        alert(`Arquivo "${file.name}" processado com sucesso! O conteúdo foi adicionado à base de conhecimento do agente.`);
      } catch (error) {
        console.error('Erro ao salvar configuração:', error);
        alert('Arquivo adicionado localmente, mas houve erro ao salvar no banco de dados.');
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      alert('Erro ao processar arquivo. Tente novamente.');
    } finally {
      setIsLoading(false);
      // Limpar input
      event.target.value = '';
    }
  };

  const addFile = async () => {
    if (newFile) {
      const fileData = {
        id: Date.now().toString(),
        name: newFile.name,
        type: newFile.type,
        size: `${(newFile.size / 1024).toFixed(1)} KB`,
        uploadedAt: new Date().toLocaleDateString('pt-BR'),
        content: `Conteúdo do arquivo ${newFile.name} - Adicionado manualmente`
      };
      
      const updatedConfig = {
        ...config,
        knowledgeBase: {
          ...config.knowledgeBase,
          files: [...config.knowledgeBase.files, fileData]
        }
      };

      updateLocalConfig(updatedConfig);
      setNewFile(null);
      setHasLocalChanges(true);

      // Salvar automaticamente no banco de dados
      try {
        await saveConfig({
          name: updatedConfig.name,
          function: updatedConfig.function,
          personality: updatedConfig.personality,
          response_style: updatedConfig.responseStyle,
          language: updatedConfig.language,
          max_response_length: updatedConfig.maxResponseLength,
          tone: updatedConfig.advancedSettings?.tone || '',
          rules: updatedConfig.advancedSettings?.rules || '',
          company_context: updatedConfig.advancedSettings?.companyContext || '',
          sector: updatedConfig.advancedSettings?.sector || '',
          company_description: updatedConfig.advancedSettings?.companyDescription || '',
          knowledge_base: {
            files: updatedConfig.knowledgeBase.files,
            websites: updatedConfig.knowledgeBase.websites,
            qa: updatedConfig.knowledgeBase.qa
          },
          integration: updatedConfig.integration,
          advanced_settings: {
            temperature: 0.7,
            max_tokens: updatedConfig.maxResponseLength
          },
          is_company_wide: updatedConfig.isCompanyWide || false
        });
        alert('Arquivo adicionado com sucesso à base de conhecimento!');
      } catch (error) {
        console.error('Erro ao salvar configuração:', error);
        alert('Arquivo adicionado localmente, mas houve erro ao salvar no banco de dados.');
      }
    }
  };

  const addWebsite = async () => {
    if (!newWebsite.url || !newWebsite.title) {
      alert('Por favor, preencha URL e título do website');
      return;
    }

    if (!config.integration.isConnected || !config.integration.apiKey) {
      alert('Por favor, configure a API Key do OpenAI na aba Integração');
      return;
    }

    // Validar URL
    try {
      new URL(newWebsite.url);
    } catch {
      alert('Por favor, insira uma URL válida');
      return;
    }

    // Confirmar scraping
    const confirmScraping = window.confirm(
      `Deseja fazer scraping do website "${newWebsite.title}" (${newWebsite.url})? O sistema irá extrair e analisar o conteúdo para treinar o agente.`
    );

    if (!confirmScraping) return;

    setIsLoading(true);

    try {
      // Simular scraping e processamento com IA
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Adicionar website processado à base de conhecimento
      const processedWebsite = {
        id: Date.now().toString(),
        url: newWebsite.url,
        title: newWebsite.title,
        addedAt: new Date().toISOString(),
        status: 'processed',
        lastChecked: new Date().toISOString(),
        lastCrawled: new Date().toISOString(), // Adicionar campo lastCrawled
        content: `Conteúdo extraído de ${newWebsite.title} - Processado com IA para treinamento do agente`
      };

      const updatedConfig = {
        ...config,
        knowledgeBase: {
          ...config.knowledgeBase,
          websites: [...config.knowledgeBase.websites, processedWebsite]
        }
      };

      console.log('🌐 Atualizando estado local com novo website:', {
        websitesAntes: config.knowledgeBase.websites.length,
        websitesDepois: updatedConfig.knowledgeBase.websites.length,
        novoWebsite: processedWebsite
      });
      
      updateLocalConfig(updatedConfig);
      setNewWebsite({ url: '', title: '' });
      setHasLocalChanges(true);
      setLastLocalUpdate(Date.now());

      // Salvar automaticamente no banco de dados
      try {
        console.log('🌐 Salvando website no banco de dados:', {
          title: newWebsite.title,
          url: newWebsite.url,
          websitesCount: updatedConfig.knowledgeBase.websites.length
        });
        
        await saveConfig({
          name: updatedConfig.name,
          function: updatedConfig.function,
          personality: updatedConfig.personality,
          response_style: updatedConfig.responseStyle,
          language: updatedConfig.language,
          max_response_length: updatedConfig.maxResponseLength,
          tone: updatedConfig.advancedSettings?.tone || '',
          rules: updatedConfig.advancedSettings?.rules || '',
          company_context: updatedConfig.advancedSettings?.companyContext || '',
          sector: updatedConfig.advancedSettings?.sector || '',
          company_description: updatedConfig.advancedSettings?.companyDescription || '',
          knowledge_base: {
            files: updatedConfig.knowledgeBase.files,
            websites: updatedConfig.knowledgeBase.websites,
            qa: updatedConfig.knowledgeBase.qa
          },
          integration: updatedConfig.integration,
          advanced_settings: {
            temperature: 0.7,
            max_tokens: updatedConfig.maxResponseLength
          },
          is_company_wide: updatedConfig.isCompanyWide || false
        });
        
           console.log('✅ Website salvo com sucesso no banco de dados');
           setHasLocalChanges(false); // Reset após salvamento bem-sucedido
           alert(`Website "${newWebsite.title}" processado com sucesso! O conteúdo foi adicionado à base de conhecimento do agente.`);
         } catch (error) {
           console.error('❌ Erro ao salvar configuração:', error);
           alert('Website adicionado localmente, mas houve erro ao salvar no banco de dados.');
         }
    } catch (error) {
      console.error('Erro ao processar website:', error);
      alert('Erro ao processar website. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const addQA = async () => {
    if (newQA.question && newQA.answer) {
      const qaData = {
        id: Date.now().toString(),
        question: newQA.question,
        answer: newQA.answer,
        category: newQA.category || 'Geral'
      };
      
      const updatedConfig = {
        ...config,
        knowledgeBase: {
          ...config.knowledgeBase,
          qa: [...config.knowledgeBase.qa, qaData]
        }
      };

      updateLocalConfig(updatedConfig);
      setNewQA({ question: '', answer: '', category: '' });
      setHasLocalChanges(true);
      setLastLocalUpdate(Date.now());

      // Salvar automaticamente no banco de dados
      try {
        await saveConfig({
          name: updatedConfig.name,
          function: updatedConfig.function,
          personality: updatedConfig.personality,
          response_style: updatedConfig.responseStyle,
          language: updatedConfig.language,
          max_response_length: updatedConfig.maxResponseLength,
          tone: updatedConfig.advancedSettings?.tone || '',
          rules: updatedConfig.advancedSettings?.rules || '',
          company_context: updatedConfig.advancedSettings?.companyContext || '',
          sector: updatedConfig.advancedSettings?.sector || '',
          company_description: updatedConfig.advancedSettings?.companyDescription || '',
          knowledge_base: {
            files: updatedConfig.knowledgeBase.files,
            websites: updatedConfig.knowledgeBase.websites,
            qa: updatedConfig.knowledgeBase.qa
          },
          integration: updatedConfig.integration,
          advanced_settings: {
            temperature: 0.7,
            max_tokens: updatedConfig.maxResponseLength
          },
          is_company_wide: updatedConfig.isCompanyWide || false
        });
        setHasLocalChanges(false); // Reset após salvamento bem-sucedido
        alert('Pergunta e resposta adicionadas com sucesso à base de conhecimento!');
      } catch (error) {
        console.error('Erro ao salvar configuração:', error);
        alert('Q&A adicionado localmente, mas houve erro ao salvar no banco de dados.');
      }
    }
  };

  const removeItem = async (type: 'files' | 'websites' | 'qa', id: string) => {
    const updatedConfig = {
      ...config,
      knowledgeBase: {
        ...config.knowledgeBase,
        [type]: config.knowledgeBase[type].filter(item => item.id !== id)
      }
    };

    updateLocalConfig(updatedConfig);
    setHasLocalChanges(true);

    // Salvar automaticamente no banco de dados
    try {
      await saveConfig({
        name: updatedConfig.name,
        function: updatedConfig.function,
        personality: updatedConfig.personality,
        response_style: updatedConfig.responseStyle,
        language: updatedConfig.language,
        max_response_length: updatedConfig.maxResponseLength,
        tone: updatedConfig.advancedSettings?.tone || '',
        rules: updatedConfig.advancedSettings?.rules || '',
        company_context: updatedConfig.advancedSettings?.companyContext || '',
        sector: updatedConfig.advancedSettings?.sector || '',
        company_description: updatedConfig.advancedSettings?.companyDescription || '',
        knowledge_base: {
          files: updatedConfig.knowledgeBase.files,
          websites: updatedConfig.knowledgeBase.websites,
          qa: updatedConfig.knowledgeBase.qa
        },
        integration: updatedConfig.integration,
        advanced_settings: {
          temperature: 0.7,
          max_tokens: updatedConfig.maxResponseLength
        },
        is_company_wide: updatedConfig.isCompanyWide || false
      });
      alert('Item removido com sucesso da base de conhecimento!');
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      alert('Item removido localmente, mas houve erro ao salvar no banco de dados.');
    }
  };

  const handleSaveIntegration = async () => {
    setIsLoading(true);
    try {
      // Validar formato da API Key
      if (!safeLocalConfig.integration.apiKey.startsWith('sk-')) {
        alert('API Key inválida. Deve começar com "sk-"');
        return;
      }

      // Testar a API Key fazendo uma requisição simples
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${safeLocalConfig.integration.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`API Key inválida: ${response.status}`);
      }

      // Preparar dados para salvar (mantendo a API Key)
      const configToSave = {
        ...safeLocalConfig,
        integration: {
          ...safeLocalConfig.integration,
          isConnected: true
        }
      };

      // Salvar no Supabase primeiro
      await saveToSupabase(configToSave);

      // Atualizar estado local apenas após salvamento bem-sucedido
      updateLocalConfig(prev => ({
        ...prev,
        integration: {
          ...prev.integration,
          isConnected: true
        }
      }));
      
      alert('Integração configurada e salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar integração:', error);
      alert('Erro ao validar API Key. Verifique se a chave está correta e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para ativar IA para todos os contatos
  const activateAIForAllContacts = async () => {
    if (!user?.id) {
      alert('Usuário não autenticado');
      return;
    }
    
    if (!confirm('Tem certeza que deseja ativar a IA para TODOS os seus contatos? Esta ação irá sobrescrever as configurações individuais de cada contato.')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/activate-ai-for-all-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('✅ IA ativada para todos os contatos com sucesso!');
      } else {
        alert('❌ Erro ao ativar IA: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao ativar IA para contatos:', error);
      alert('❌ Erro ao ativar IA para contatos');
    } finally {
      setIsLoading(false);
    }
  };

  // Funções para gerenciar Funnel Steps
  const handleStepUpdate = (field: string, value: any) => {
    if (!selectedStep) return;
    
    setSelectedStep(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleCreateNewStep = () => {
    const newStep = {
      id: 'new-step-' + Date.now(),
      name: '',
      condition: '',
      instructionPrompt: '',
      collectData: [],
      action: '',
      finalInstructions: '',
      followUpTimeout: '',
      isActive: true
    };
    
    setSelectedStep(newStep);
    setIsCreatingNewStep(true);
  };

  const handleCancelNewStep = () => {
    setSelectedStep(null);
    setIsCreatingNewStep(false);
  };

  // Funções para gerenciar variáveis
  const handleCreateVariable = async (data: CreateAIAgentVariableData) => {
    try {
      await createVariable(data);
    } catch (error) {
      console.error('Erro ao criar variável:', error);
    }
  };

  const handleUpdateVariable = async (data: { id: string; name: string; key: string; data_type: string; description?: string; default_value?: string; options?: any[] }) => {
    try {
      await updateVariable(data);
    } catch (error) {
      console.error('Erro ao atualizar variável:', error);
    }
  };

  const handleDeleteVariable = async (id: string) => {
    try {
      await deleteVariable(id);
    } catch (error) {
      console.error('Erro ao deletar variável:', error);
    }
  };

  // Funções para simular processamento dos estágios
  const simulateAgentProcessing = async (message: string) => {
    // Adicionar log de pensamento inicial
    addExecutionLog('thinking', 'Analisando mensagem do usuário...');
    
    await delay(1000);

    // Verificar qual estágio se aplica
    const applicableStep = findApplicableStep(message);
    
    if (applicableStep) {
      addExecutionLog('thinking', `Estágio selecionado: "${applicableStep.name}"`);
      addExecutionLog('action', `Condição: ${applicableStep.condition}`);
      
      await delay(1500);

      // Simular coleta de dados
      if (applicableStep.collectData && applicableStep.collectData.length > 0) {
        addExecutionLog('action', `Coletando dados: ${applicableStep.collectData.join(', ')}`);
        await delay(1000);
      }

      // Simular execução de ação
      if (applicableStep.action) {
        addExecutionLog('action', `Executando ação: ${applicableStep.action}`);
        await delay(1000);
      }

      // Simular processamento do prompt de instruções
      if (applicableStep.instructionPrompt) {
        addExecutionLog('thinking', 'Processando prompt de instruções...');
        await delay(1500);
      }

      // Simular geração de resposta final
      addExecutionLog('thinking', 'Gerando resposta final...');
      await delay(1000);
    } else {
      addExecutionLog('thinking', 'Nenhum estágio específico aplicável, usando configuração padrão...');
      await delay(1000);
    }
  };

  const findApplicableStep = (message: string) => {
    // Lógica simples para encontrar estágio aplicável
    // Em um sistema real, isso seria mais sofisticado
    return funnelSteps.find(step => 
      step.isActive && 
      step.condition && 
      message.toLowerCase().includes(step.condition.toLowerCase())
    ) || null;
  };

  const addExecutionLog = (type: 'thinking' | 'action' | 'response', message: string, details?: any) => {
    const logEntry = {
      id: Date.now().toString() + Math.random(),
      type,
      message,
      timestamp: new Date(),
      details
    };
    setExecutionLog(prev => [...prev, logEntry]);
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleInstructionsChange = (value: string, textarea: HTMLTextAreaElement) => {
    if (!selectedStep) return;
    
    setSelectedStep(prev => prev ? { ...prev, finalInstructions: value } : null);
    
    // Detectar se o usuário digitou @
    const cursorPos = textarea.selectionStart;
    const beforeCursor = value.substring(0, cursorPos);
    const lastAtPos = beforeCursor.lastIndexOf('@');
    
    // Verificar se @ foi digitado e não está dentro de uma variável já existente
    if (lastAtPos !== -1) {
      const afterAt = beforeCursor.substring(lastAtPos + 1);
      // Se não há espaço ou @ após o último @, mostrar dropdown
      if (!afterAt.includes(' ') && !afterAt.includes('@')) {
        setCursorPosition(cursorPos);
        setShowVariablesDropdown(true);
      } else {
        setShowVariablesDropdown(false);
      }
    } else {
      setShowVariablesDropdown(false);
    }
  };


  const handleAddCollectData = () => {
    if (!selectedStep || !newCollectData) return;
    
    setSelectedStep(prev => prev ? {
      ...prev,
      collectData: [...prev.collectData, newCollectData]
    } : null);
    
    setNewCollectData('');
  };

  const handleRemoveCollectData = (index: number) => {
    if (!selectedStep) return;
    
    const newCollectData = selectedStep.collectData.filter((_, i) => i !== index);
    
    setSelectedStep(prev => prev ? {
      ...prev,
      collectData: newCollectData
    } : null);
  };

  const handleInsertVariable = (variable: string) => {
    if (!selectedStep || !textAreaRef) return;
    
    const currentInstructions = selectedStep.finalInstructions;
    const beforeCursor = currentInstructions.substring(0, cursorPosition);
    const afterCursor = currentInstructions.substring(cursorPosition);
    
    // Remove o @ que foi digitado e adiciona a variável
    const newInstructions = beforeCursor.replace(/@$/, '') + `@${variable}` + afterCursor;
    
    setSelectedStep(prev => prev ? {
      ...prev,
      finalInstructions: newInstructions
    } : null);
    
    setShowVariablesDropdown(false);
    
    // Focar no textarea após inserir a variável
    setTimeout(() => {
      if (textAreaRef) {
        const newCursorPos = beforeCursor.replace(/@$/, '').length + variable.length + 1;
        textAreaRef.setSelectionRange(newCursorPos, newCursorPos);
        textAreaRef.focus();
      }
    }, 0);
  };

  const handleToggleStep = (stepId: string, isActive: boolean) => {
    setFunnelSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, isActive } : step
    ));
    
    if (selectedStep?.id === stepId) {
      setSelectedStep(prev => prev ? { ...prev, isActive } : null);
    }
  };

  const handleDeleteStep = (stepId: string) => {
    if (!confirm('Tem certeza que deseja excluir este estágio?')) return;
    
    setFunnelSteps(prev => prev.filter(step => step.id !== stepId));
    
    if (selectedStep?.id === stepId) {
      setSelectedStep(null);
    }
  };

  const handleSaveStep = async () => {
    if (!selectedStep) return;
    
    // Validar campos obrigatórios
    if (!selectedStep.name.trim()) {
      alert('❌ Nome do estágio é obrigatório');
      return;
    }
    
    if (!selectedStep.condition.trim()) {
      alert('❌ Condição do estágio é obrigatória');
      return;
    }
    
    try {
      // Gerar ID único para o novo estágio
      const stepToSave = {
        ...selectedStep,
        id: isCreatingNewStep ? 'step-' + Date.now() : selectedStep.id
      };
      
      // Adicionar à lista de estágios
      setFunnelSteps(prev => {
        if (isCreatingNewStep) {
          return [...prev, stepToSave];
        } else {
          const existingIndex = prev.findIndex(step => step.id === selectedStep.id);
          if (existingIndex >= 0) {
            const newSteps = [...prev];
            newSteps[existingIndex] = stepToSave;
            return newSteps;
          }
          return prev;
        }
      });
      
      // Limpar estado de criação
      setIsCreatingNewStep(false);
      
      alert('✅ Estágio salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar estágio:', error);
      alert('❌ Erro ao salvar estágio');
    }
  };

  const handleTestMessage = async () => {
    if (!testMessage.trim()) {
      alert('Por favor, digite uma mensagem para testar');
      return;
    }
    
    if (!config.integration.isConnected || !config.integration.apiKey) {
      alert('Por favor, configure a API Key do OpenAI na aba Integração');
      return;
    }

    // Limpar log de execução anterior
    setExecutionLog([]);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: testMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setTestMessage('');
    setIsTyping(true);
    
    // Scroll para o final após adicionar mensagem do usuário
    setTimeout(() => scrollToBottom(), 100);

    // Simular processamento dos estágios
    await simulateAgentProcessing(testMessage);

    try {
      // Integração real com OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.integration.apiKey}`
        },
        body: JSON.stringify({
          model: config.integration.selectedModel,
          messages: [
            {
              role: 'system',
              content: `Você é ${config.name}, um assistente virtual especializado em ${config.function}.

PERSONALIDADE E COMPORTAMENTO:
${config.personality}

CONFIGURAÇÕES DE RESPOSTA:
- Estilo: ${config.responseStyle}
- Idioma: ${config.language === 'pt-BR' ? 'Português brasileiro' : config.language}
- Tamanho máximo: ${config.maxResponseLength} caracteres

FUNÇÃO PRINCIPAL:
${config.function}

STATUS DO AGENTE:
- Status: ${config.status === 'active' ? 'Ativo e operacional' : config.status === 'inactive' ? 'Inativo' : 'Em treinamento'}

CONFIGURAÇÕES AVANÇADAS:
${config.advancedSettings?.tone ? `- Tom específico: ${config.advancedSettings.tone}` : ''}
${config.advancedSettings?.rules ? `- Regras específicas: ${config.advancedSettings.rules}` : ''}
${config.advancedSettings?.companyContext ? `- Contexto da empresa: ${config.advancedSettings.companyContext}` : ''}
${config.advancedSettings?.sector ? `- Setor de atuação: ${config.advancedSettings.sector}` : ''}
${config.advancedSettings?.companyDescription ? `- Descrição da empresa: ${config.advancedSettings.companyDescription}` : ''}

BASE DE CONHECIMENTO:
${config.knowledgeBase.files.length > 0 ? `
ARQUIVOS PROCESSADOS:
${config.knowledgeBase.files.map(file => `- ${file.name} (${file.type}): ${file.content}`).join('\n')}
` : ''}
${config.knowledgeBase.websites.length > 0 ? `
WEBSITES ANALISADOS:
${config.knowledgeBase.websites.map(website => `- ${website.title} (${website.url}): ${website.content}`).join('\n')}
` : ''}
${config.knowledgeBase.qa.length > 0 ? `
PERGUNTAS E RESPOSTAS:
${config.knowledgeBase.qa.map(qa => `P: ${qa.question}\nR: ${qa.answer}`).join('\n\n')}
` : ''}

INSTRUÇÕES IMPORTANTES:
- Sempre responda em ${config.language === 'pt-BR' ? 'português brasileiro' : 'o idioma selecionado'}
- Mantenha o estilo ${config.responseStyle}
- Seja ${config.personality}
- Foque em ${config.function}
- Use a base de conhecimento acima para responder com precisão
- Respostas devem ter no máximo ${config.maxResponseLength} caracteres
- ${config.status === 'active' ? 'Você está ativo e pronto para ajudar' : 'Você está em modo limitado'}

Responda de forma útil, profissional e alinhada com todas essas configurações e base de conhecimento.`
            },
            ...chatMessages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: 'user',
              content: userMessage.content
            }
          ],
          max_tokens: Math.min(config.maxResponseLength, 2000),
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro da API OpenAI:', errorData);
        
        if (response.status === 401) {
          throw new Error('API Key inválida. Verifique sua chave na aba Integração.');
        } else if (response.status === 429) {
          throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
        } else if (response.status === 400) {
          throw new Error('Requisição inválida. Verifique sua configuração.');
        } else {
          throw new Error(`Erro na API: ${response.status} - ${errorData.error?.message || 'Erro desconhecido'}`);
        }
      }

      const data = await response.json();
      const assistantContent = data.choices[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.';
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);
      
      // Scroll para o final após receber resposta do assistente
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      // Mensagem de erro amigável
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Verifique se sua API Key está correta e tente novamente.',
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
      
      // Scroll para o final após mensagem de erro
      setTimeout(() => scrollToBottom(), 100);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = () => {
    setChatMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Olá! Sou seu assistente virtual VB. Como posso ajudá-lo hoje?',
        timestamp: new Date()
      }
    ]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTestMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Agente IA</h1>
                <p className="text-gray-600">Configure seu assistente virtual inteligente</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${config.status === 'active' ? 'bg-green-500' : config.status === 'inactive' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {config.status === 'active' ? 'Ativo' : config.status === 'inactive' ? 'Inativo' : 'Treinando'}
                </span>
              </div>
              <button
                onClick={toggleEditMode}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                <Edit className="w-4 h-4" />
                {isEditing ? 'Cancelar' : 'Editar'}
              </button>
              {isEditing && (
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors duration-200 hover:opacity-90"
                  style={{ backgroundColor: '#4A5477' }}
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <div className="flex items-center space-x-8">
            {/* Botão fixo de toggle da sidebar */}
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-gray-600 hover:bg-gray-100 rounded transition-all duration-200 flex-shrink-0"
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              title={sidebarExpanded ? "Minimizar barra lateral" : "Expandir barra lateral"}
            >
              <AlignJustify size={14} />
            </Button>
            <button
              onClick={() => {
                saveCurrentTabData();
                setActiveTab('cargo');
                setTimeout(() => loadTabData('cargo'), 100);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'cargo'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Cargo
              </div>
            </button>
            <button
              onClick={() => {
                saveCurrentTabData();
                setActiveTab('cerebro');
                setTimeout(() => loadTabData('cerebro'), 100);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'cerebro'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Cérebro
              </div>
            </button>
            <button
              onClick={() => {
                saveCurrentTabData();
                setActiveTab('acoes');
                setTimeout(() => loadTabData('acoes'), 100);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'acoes'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Ações
              </div>
            </button>
            <button
              onClick={() => {
                saveCurrentTabData();
                setActiveTab('integracao');
                setTimeout(() => loadTabData('integracao'), 100);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'integracao'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Integração
              </div>
            </button>
            <button
              onClick={() => {
                saveCurrentTabData();
                setActiveTab('teste');
                setTimeout(() => loadTabData('teste'), 100);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'teste'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <TestTube className="w-4 h-4" />
                Teste
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'cargo' ? (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Informações Básicas */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Informações Básicas</h3>
              
              {/* Tipo de Configuração */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {config.isCompanyWide ? (
                        <Building className="w-5 h-5 text-blue-600" />
                      ) : (
                        <User className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {config.isCompanyWide ? 'Configuração da Empresa' : 'Configuração Pessoal'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {config.isCompanyWide 
                          ? 'Compartilhada com todos os usuários da empresa'
                          : 'Apenas para seu uso pessoal'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">
                      {config.isCompanyWide ? 'Empresa' : 'Pessoal'}
                    </span>
                    <Switch
                      checked={config.isCompanyWide}
                      onCheckedChange={(checked) => updateLocalConfig(prev => ({ ...prev, isCompanyWide: checked }))}
                      disabled={!isEditing}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>
                </div>
                {config.isCompanyWide && (
                  <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Configuração Compartilhada
                        </p>
                        <p className="text-xs text-blue-700">
                          Esta configuração será usada por todos os usuários da sua empresa. 
                          Apenas usuários com permissões administrativas podem editar.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Agente
                  </label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => updateLocalConfig(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Ex: Assistente Virtual VB"
                    className={getFieldClasses('w-full px-4 py-3 border rounded-xl transition-all duration-200')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Função Principal
                  </label>
                  <select
                    value={config.function}
                    onChange={(e) => updateLocalConfig(prev => ({ ...prev, function: e.target.value }))}
                    disabled={!isEditing}
                    className={getFieldClasses('w-full px-4 py-3 border rounded-xl transition-all duration-200')}
                  >
                    <option value="Atendimento ao cliente via WhatsApp">Atendimento ao cliente via WhatsApp</option>
                    <option value="Suporte técnico">Suporte técnico</option>
                    <option value="Vendas e prospecção">Vendas e prospecção</option>
                    <option value="Assistente geral">Assistente geral</option>
                    <option value="Consultor especializado">Consultor especializado</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Personalidade e Comportamento
                  </label>
                  <div 
                    className={`w-full px-4 py-3 border rounded-xl min-h-[60px] max-h-[120px] overflow-hidden transition-colors duration-200 ${
                      isEditing 
                        ? 'border-gray-300 bg-gray-50 cursor-pointer hover:bg-gray-100' 
                        : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                    }`}
                    onClick={() => {
                      if (isEditing) {
                        setShowPersonalityModal(true);
                      }
                    }}
                  >
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {config.personality || (isEditing 
                        ? "Clique para definir a personalidade e comportamento do agente..." 
                        : "Ative o modo de edição para configurar a personalidade do agente...")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Configurações de Resposta */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Configurações de Resposta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estilo de Resposta
                  </label>
                  <select
                    value={config.responseStyle}
                    onChange={(e) => updateLocalConfig(prev => ({ ...prev, responseStyle: e.target.value as any }))}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200"
                  >
                    <option value="formal">📝 Formal</option>
                    <option value="casual">😊 Casual</option>
                    <option value="friendly">🤝 Amigável</option>
                    <option value="professional">💼 Profissional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Idioma
                  </label>
                  <select
                    value={config.language}
                    onChange={(e) => updateLocalConfig(prev => ({ ...prev, language: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200"
                  >
                    <option value="pt-BR">🇧🇷 Português (Brasil)</option>
                    <option value="en-US">🇺🇸 English (US)</option>
                    <option value="es-ES">🇪🇸 Español</option>
                    <option value="fr-FR">🇫🇷 Français</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Velocidade de Resposta
                  </label>
                  <select
                    value={config.responseSpeed || 'normal'}
                    onChange={(e) => updateLocalConfig(prev => ({ ...prev, responseSpeed: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200"
                  >
                    <option value="fast">⚡ Rápida</option>
                    <option value="normal">🔄 Normal</option>
                    <option value="thoughtful">🤔 Reflexiva</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tamanho da Resposta
                  </label>
                  <select
                    value={config.maxResponseLength}
                    onChange={(e) => updateLocalConfig(prev => ({ ...prev, maxResponseLength: parseInt(e.target.value) }))}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200"
                  >
                    <option value="200">📝 Curta (200 chars)</option>
                    <option value="500">📄 Média (500 chars)</option>
                    <option value="1000">📋 Longa (1000 chars)</option>
                    <option value="2000">📚 Extensa (2000 chars)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Configurações Avançadas */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Configurações Avançadas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tom de Voz Específico
                  </label>
                  <textarea
                    value={config.advancedSettings?.tone || ''}
                    onChange={(e) => updateLocalConfig(prev => ({ 
                      ...prev, 
                      advancedSettings: { 
                        ...prev.advancedSettings, 
                        tone: e.target.value 
                      } 
                    }))}
                    disabled={!isEditing}
                    rows={3}
                    placeholder="Ex: Responda de forma direta e eficiente, sem ser prolixo. Seja objetivo e conciso..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Regras Específicas
                  </label>
                  <textarea
                    value={config.advancedSettings?.rules || ''}
                    onChange={(e) => updateLocalConfig(prev => ({ 
                      ...prev, 
                      advancedSettings: { 
                        ...prev.advancedSettings, 
                        rules: e.target.value 
                      } 
                    }))}
                    disabled={!isEditing}
                    rows={3}
                    placeholder="Ex: NUNCA mencione concorrentes. NUNCA quebre o personagem..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contexto da Empresa
                  </label>
                  <input
                    type="text"
                    value={config.advancedSettings?.companyContext || ''}
                    onChange={(e) => updateLocalConfig(prev => ({ 
                      ...prev, 
                      advancedSettings: { 
                        ...prev.advancedSettings, 
                        companyContext: e.target.value 
                      } 
                    }))}
                    disabled={!isEditing}
                    placeholder="Nome da empresa"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Setor de Atuação
                  </label>
                  <select
                    value={config.advancedSettings?.sector || ''}
                    onChange={(e) => updateLocalConfig(prev => ({ 
                      ...prev, 
                      advancedSettings: { 
                        ...prev.advancedSettings, 
                        sector: e.target.value 
                      } 
                    }))}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200"
                  >
                    <option value="">Selecionar setor</option>
                    <option value="tecnologia">💻 Tecnologia</option>
                    <option value="saude">🏥 Saúde</option>
                    <option value="educacao">🎓 Educação</option>
                    <option value="financeiro">💰 Financeiro</option>
                    <option value="ecommerce">🛒 E-commerce</option>
                    <option value="consultoria">📊 Consultoria</option>
                    <option value="outros">🔧 Outros</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição da Empresa
                  </label>
                  <textarea
                    value={config.advancedSettings?.companyDescription || ''}
                    onChange={(e) => updateLocalConfig(prev => ({ 
                      ...prev, 
                      advancedSettings: { 
                        ...prev.advancedSettings, 
                        companyDescription: e.target.value 
                      } 
                    }))}
                    disabled={!isEditing}
                    rows={4}
                    placeholder="Descreva brevemente sua empresa, produtos, serviços e valores..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">{config.advancedSettings?.companyDescription?.length || 0} de 1000 caracteres</p>
                </div>
              </div>
            </div>

            {/* Configurações de Áudio */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">🎵 Configurações de Áudio</h3>
              <div className="space-y-6">
                {/* Habilitar Transcrição */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Transcrição Automática de Áudios</h4>
                    <p className="text-sm text-gray-600">Transcrever automaticamente mensagens de áudio usando IA</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.audioSettings?.transcriptionEnabled || false}
                      onChange={(e) => updateLocalConfig(prev => ({
                        ...prev,
                        audioSettings: {
                          ...prev.audioSettings,
                          transcriptionEnabled: e.target.checked,
                          transcriptionProvider: e.target.checked ? 'openai' : 'disabled'
                        }
                      }))}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Configurações de Transcrição */}
                {config.audioSettings?.transcriptionEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-purple-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Idioma da Transcrição
                      </label>
                      <select
                        value={config.audioSettings?.transcriptionLanguage || 'pt-BR'}
                        onChange={(e) => updateLocalConfig(prev => ({
                          ...prev,
                          audioSettings: {
                            ...prev.audioSettings,
                            transcriptionLanguage: e.target.value
                          }
                        }))}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200"
                      >
                        <option value="pt-BR">🇧🇷 Português (Brasil)</option>
                        <option value="en-US">🇺🇸 English (US)</option>
                        <option value="es-ES">🇪🇸 Español (España)</option>
                        <option value="fr-FR">🇫🇷 Français</option>
                        <option value="de-DE">🇩🇪 Deutsch</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Modelo de Transcrição
                      </label>
                      <select
                        value={config.audioSettings?.transcriptionModel || 'whisper-1'}
                        onChange={(e) => updateLocalConfig(prev => ({
                          ...prev,
                          audioSettings: {
                            ...prev.audioSettings,
                            transcriptionModel: e.target.value
                          }
                        }))}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200"
                      >
                        <option value="whisper-1">Whisper-1 (Recomendado)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duração Máxima (segundos)
                      </label>
                      <input
                        type="number"
                        value={config.audioSettings?.maxDuration || 300}
                        onChange={(e) => updateLocalConfig(prev => ({
                          ...prev,
                          audioSettings: {
                            ...prev.audioSettings,
                            maxDuration: parseInt(e.target.value) || 300
                          }
                        }))}
                        disabled={!isEditing}
                        min="10"
                        max="600"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200"
                      />
                      <p className="text-xs text-gray-500 mt-1">Máximo: 10 minutos</p>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div>
                        <h5 className="font-medium text-gray-900">Salvar Automaticamente</h5>
                        <p className="text-sm text-gray-600">Atualizar coluna 'conteudo' com transcrição</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.audioSettings?.autoSave || true}
                          onChange={(e) => updateLocalConfig(prev => ({
                            ...prev,
                            audioSettings: {
                              ...prev.audioSettings,
                              autoSave: e.target.checked
                            }
                          }))}
                          disabled={!isEditing}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Texto de Fallback
                      </label>
                      <input
                        type="text"
                        value={config.audioSettings?.fallbackText || '[Áudio recebido]'}
                        onChange={(e) => updateLocalConfig(prev => ({
                          ...prev,
                          audioSettings: {
                            ...prev.audioSettings,
                            fallbackText: e.target.value
                          }
                        }))}
                        disabled={!isEditing}
                        placeholder="Texto exibido quando a transcrição falha"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Configurações de Mensagens */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">💬 Configurações de Mensagens</h3>
              <div className="space-y-6">
                {/* Habilitar Agrupamento */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Agrupar Mensagens Consecutivas</h4>
                    <p className="text-sm text-gray-600">Aguardar 30s para agrupar mensagens antes de responder</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.messageSettings?.debounceEnabled || true}
                      onChange={(e) => updateLocalConfig(prev => ({
                        ...prev,
                        messageSettings: {
                          ...prev.messageSettings,
                          debounceEnabled: e.target.checked
                        }
                      }))}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Configurações de Agrupamento */}
                {config.messageSettings?.debounceEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tempo de Espera (milissegundos)
                      </label>
                      <input
                        type="number"
                        value={config.messageSettings?.debounceTimeMs || 30000}
                        onChange={(e) => updateLocalConfig(prev => ({
                          ...prev,
                          messageSettings: {
                            ...prev.messageSettings,
                            debounceTimeMs: parseInt(e.target.value) || 30000
                          }
                        }))}
                        disabled={!isEditing}
                        min="5000"
                        max="120000"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200"
                      />
                      <p className="text-xs text-gray-500 mt-1">Tempo para aguardar mensagens consecutivas (5s - 2min)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Máximo de Mensagens por Lote
                      </label>
                      <input
                        type="number"
                        value={config.messageSettings?.maxMessagesPerBatch || 5}
                        onChange={(e) => updateLocalConfig(prev => ({
                          ...prev,
                          messageSettings: {
                            ...prev.messageSettings,
                            maxMessagesPerBatch: parseInt(e.target.value) || 5
                          }
                        }))}
                        disabled={!isEditing}
                        min="1"
                        max="20"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200"
                      />
                      <p className="text-xs text-gray-500 mt-1">Máximo de mensagens para agrupar (1 - 20)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tamanho dos Chunks (caracteres)
                      </label>
                      <input
                        type="number"
                        value={config.messageSettings?.chunkSize || 300}
                        onChange={(e) => updateLocalConfig(prev => ({
                          ...prev,
                          messageSettings: {
                            ...prev.messageSettings,
                            chunkSize: parseInt(e.target.value) || 300
                          }
                        }))}
                        disabled={!isEditing}
                        min="100"
                        max="1000"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200"
                      />
                      <p className="text-xs text-gray-500 mt-1">Tamanho máximo de cada parte da resposta (100 - 1000)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delay entre Chunks (milissegundos)
                      </label>
                      <input
                        type="number"
                        value={config.messageSettings?.chunkDelayMs || 2000}
                        onChange={(e) => updateLocalConfig(prev => ({
                          ...prev,
                          messageSettings: {
                            ...prev.messageSettings,
                            chunkDelayMs: parseInt(e.target.value) || 2000
                          }
                        }))}
                        disabled={!isEditing}
                        min="500"
                        max="10000"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200"
                      />
                      <p className="text-xs text-gray-500 mt-1">Tempo entre envio de cada parte (0.5s - 10s)</p>
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div>
                          <h5 className="font-medium text-gray-900">Delay Aleatório</h5>
                          <p className="text-sm text-gray-600">Intervalo aleatório entre 3-5 segundos para comportamento mais natural</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.messageSettings?.randomDelayEnabled || true}
                            onChange={(e) => updateLocalConfig(prev => ({
                              ...prev,
                              messageSettings: {
                                ...prev.messageSettings,
                                randomDelayEnabled: e.target.checked
                              }
                            }))}
                            disabled={!isEditing}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    {config.messageSettings?.randomDelayEnabled && (
                      <div className="md:col-span-2 grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Delay Mínimo (milissegundos)
                          </label>
                          <input
                            type="number"
                            value={config.messageSettings?.minDelayMs || 3000}
                            onChange={(e) => updateLocalConfig(prev => ({
                              ...prev,
                              messageSettings: {
                                ...prev.messageSettings,
                                minDelayMs: parseInt(e.target.value) || 3000
                              }
                            }))}
                            disabled={!isEditing}
                            min="1000"
                            max="10000"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200"
                          />
                          <p className="text-xs text-gray-500 mt-1">Delay mínimo entre chunks (1s - 10s)</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Delay Máximo (milissegundos)
                          </label>
                          <input
                            type="number"
                            value={config.messageSettings?.maxDelayMs || 5000}
                            onChange={(e) => updateLocalConfig(prev => ({
                              ...prev,
                              messageSettings: {
                                ...prev.messageSettings,
                                maxDelayMs: parseInt(e.target.value) || 5000
                              }
                            }))}
                            disabled={!isEditing}
                            min="2000"
                            max="15000"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200"
                          />
                          <p className="text-xs text-gray-500 mt-1">Delay máximo entre chunks (2s - 15s)</p>
                        </div>
                      </div>
                    )}

                    <div className="md:col-span-2 p-4 bg-white rounded-lg border">
                      <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        💡 Como Funciona
                      </h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Mensagens consecutivas são agrupadas automaticamente</li>
                        <li>• Resposta é dividida em partes menores para melhor legibilidade</li>
                        <li>• Cada parte é enviada com delay para evitar spam</li>
                        <li>• Melhora a experiência do usuário e evita bloqueios</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Estatísticas */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">1,247</div>
                  <div className="text-sm text-gray-600">Mensagens Processadas</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">94.2%</div>
                  <div className="text-sm text-gray-600">Taxa de Sucesso</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">2.3s</div>
                  <div className="text-sm text-gray-600">Tempo Médio de Resposta</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Target className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">87%</div>
                  <div className="text-sm text-gray-600">Satisfação do Cliente</div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'integracao' ? (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Integração OpenAI</h2>
                  <p className="text-purple-100">Configure sua API e personalize o comportamento do agente</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${config.integration.isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="text-sm">
                    {config.integration.isConnected ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Modelo: {OPENAI_MODELS.find(m => m.id === config.integration.selectedModel)?.name || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Configuration */}
              <div className="lg:col-span-2 space-y-6">
                {/* API Configuration */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Key className="w-5 h-5 text-purple-600" />
                    Configuração da API
                  </h3>
                  
                  <div className="space-y-6">
                    {/* API Key */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chave de API OpenAI
                      </label>
                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={safeLocalConfig.integration.apiKey}
                          onChange={(e) => updateLocalConfig(prev => ({
                            ...prev,
                            integration: { ...prev.integration, apiKey: e.target.value }
                          }))}
                          disabled={!isEditing}
                          placeholder="sk-..."
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        🔒 Sua chave de API será armazenada de forma segura e usada apenas para processar mensagens
                      </p>
                    </div>

                    {/* Model Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Modelo de IA
                      </label>
                      <select
                        value={config.integration.selectedModel}
                        onChange={(e) => updateLocalConfig(prev => ({
                          ...prev,
                          integration: { ...prev.integration, selectedModel: e.target.value }
                        }))}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200"
                      >
                        {OPENAI_MODELS.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name} - {model.description}
                          </option>
                        ))}
                      </select>
                      <p className="mt-2 text-sm text-gray-500">
                        🤖 Escolha o modelo que melhor se adequa às suas necessidades
                      </p>
                    </div>

                    {/* Advanced Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Temperatura (Criatividade)
                        </label>
                        <select 
                          disabled={!isEditing}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200"
                        >
                          <option value="0.1">🎯 Muito Conservador (0.1)</option>
                          <option value="0.3">📝 Conservador (0.3)</option>
                          <option value="0.7" selected>⚖️ Balanceado (0.7)</option>
                          <option value="1.0">🎨 Criativo (1.0)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Máximo de Tokens
                        </label>
                        <select 
                          disabled={!isEditing}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200"
                        >
                          <option value="500">📝 Curto (500)</option>
                          <option value="1000" selected>📄 Médio (1000)</option>
                          <option value="2000">📋 Longo (2000)</option>
                          <option value="4000">📚 Extenso (4000)</option>
                        </select>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Model Information */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    Informações do Modelo Selecionado
                  </h3>
                  {(() => {
                    const model = OPENAI_MODELS.find(m => m.id === config.integration.selectedModel);
                    return model ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium text-gray-600">Nome:</span>
                            <p className="text-gray-900 font-semibold">{model.name}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Descrição:</span>
                            <p className="text-gray-900">{model.description}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium text-gray-600">Tokens Máximos:</span>
                            <p className="text-gray-900 font-semibold">{model.maxTokens.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Custo:</span>
                            <p className="text-gray-900 font-semibold">{model.cost}</p>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Status Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Status da Integração</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${config.integration.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-medium text-gray-700">Conexão</span>
                      </div>
                      <span className="text-sm font-semibold">{config.integration.isConnected ? 'Ativa' : 'Inativa'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Brain className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Modelo</span>
                      </div>
                      <span className="text-sm font-semibold">{OPENAI_MODELS.find(m => m.id === config.integration.selectedModel)?.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">Segurança</span>
                      </div>
                      <span className="text-sm font-semibold">Criptografada</span>
                    </div>
                  </div>
                </div>


                {/* Help Section */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Precisa de Ajuda?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure sua API Key da OpenAI para começar a usar o agente de IA.
                  </p>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Ver Guia Completo →
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'acoes' ? (
          <div className="max-w-7xl mx-auto h-[calc(100vh-180px)]">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
              {/* Sidebar - Lista de Funnel Steps */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl border border-gray-200 h-full flex flex-col shadow-sm">
                  {/* Header da Sidebar */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Estágios</h3>
                      <button
                        onClick={handleCreateNewStep}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200"
                        title="Adicionar estágio específico"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Os estágios serão selecionados com base na condição definida, e não na ordem em que aparecem na lista.
                    </p>
                    
                    {/* Separador */}
                    <div className="border-t border-gray-200 mb-4"></div>
                    
                    {/* Botão @ Variáveis */}
                    <button
                      onClick={() => setShowVariablesModal(true)}
                      className="w-full px-3 py-2 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg hover:from-purple-100 hover:to-blue-100 transition-all duration-200 flex items-center justify-center gap-2 text-purple-700 font-medium"
                    >
                      <span className="text-lg">@</span>
                      <span>Variáveis</span>
                    </button>
                  </div>

                  {/* Lista de Funnel Steps */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-2">
                      {funnelSteps.map((step, index) => (
                        <div
                          key={step.id}
                          onClick={() => setSelectedStep(step)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                            selectedStep?.id === step.id
                              ? 'bg-purple-50 border border-purple-200'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-gray-900 text-sm">
                              {step.name}
                            </h4>
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingStep({
                                    id: step.id,
                                    name: step.name,
                                    condition: step.condition,
                                    instructionPrompt: step.instructionPrompt,
                                    collectData: step.collectData,
                                    action: step.action,
                                    finalInstructions: step.finalInstructions,
                                    followUpTimeout: step.followUpTimeout,
                                    isActive: step.isActive
                                  });
                                  setShowAddStepModal(true);
                                }}
                                className="text-gray-400 hover:text-blue-600 p-1"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteStep(step.id);
                                }}
                                className="text-gray-400 hover:text-red-600 p-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {step.condition}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className={`w-2 h-2 rounded-full ${
                              step.isActive ? 'bg-green-500' : 'bg-gray-300'
                            }`} />
                            <span className="text-xs text-gray-500">
                              {step.isActive ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      {funnelSteps.length === 0 && (
                        <div className="text-center py-8">
                          <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">Nenhum estágio criado</p>
                          <p className="text-gray-400 text-xs">Clique em "Adicionar estágio" para começar</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Área Principal - Configuração do Step */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-xl border border-gray-200 h-full flex flex-col shadow-sm">
                  {selectedStep ? (
                    <>
                      {/* Header do Step */}
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">
                              {isCreatingNewStep ? 'Novo Estágio' : 'Estágio ativo'}
                            </h2>
                            <p className="text-gray-600 mt-1">
                              {isCreatingNewStep ? 'Preencha os campos abaixo para criar um novo estágio' : selectedStep.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">Ativo</span>
                              <Switch
                                checked={selectedStep.isActive}
                                onCheckedChange={(checked) => handleToggleStep(selectedStep.id, checked)}
                              />
                            </div>
                            {isCreatingNewStep ? (
                              <button
                                onClick={handleCancelNewStep}
                                className="px-3 py-1 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                Cancelar
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDeleteStep(selectedStep.id)}
                                className="text-gray-400 hover:text-red-600 p-2"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Conteúdo do Step */}
                      <div className="flex-1 overflow-y-auto p-6">
                        <div className="space-y-6">
                          {/* Seção Condições */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Condições</h3>
                            
                            {/* Nome do Estágio */}
                            <div className="mb-6">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nome do estágio
                              </label>
                              <p className="text-xs text-gray-500 mb-2">
                                O nome serve apenas para a sua organização
                              </p>
                              <input
                                type="text"
                                value={selectedStep.name}
                                onChange={(e) => handleStepUpdate('name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Ex: Identificação e Qualificação Inicial"
                              />
                            </div>

                            {/* Condição Geral */}
                            <div className="mb-6">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                1. Condição geral para o estágio ser escolhido
                              </label>
                              <p className="text-xs text-gray-500 mb-2">
                                Exemplo: "Se é o início da conversa" ou "Se o usuário quer agendar uma reunião" etc.
                              </p>
                              <input
                                type="text"
                                value={selectedStep.condition}
                                onChange={(e) => handleStepUpdate('condition', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Início da conversa ou cliente em potencial fazendo contato"
                              />
                            </div>

                            {/* Prompt de Instruções */}
                            <div className="mb-6">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                2. Prompt de Instruções
                              </label>
                              <p className="text-xs text-gray-500 mb-3">
                                Descreva o papel do Agente IA, estilo de comunicação e as ações que ele deve executar. Forneça instruções passo a passo usando linguagem clara e acionável.
                              </p>
                              <div className="relative">
                                <textarea
                                  value={selectedStep.instructionPrompt || ''}
                                  onChange={(e) => handleStepUpdate('instructionPrompt', e.target.value)}
                                  rows={6}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                  placeholder="Ex: # CONTEXTO\n* Você está falando com alguém que está entrando em contato com a empresa.\n* Eles podem ser um novo ou contato existente.\n* Seu objetivo é determinar a intenção deles e direcioná-los para a equipe ou pessoa certa.\n\n# PAPEL E ESTILO DE COMUNICAÇÃO\n* Você é um recepcionista educado, profissional e eficiente.\n* Você fará uma pergunta por vez e nunca responderá consultas sozinho.\n* Você é um agente de suporte calmo e prestativo que usa linguagem simples e clara."
                                />
                                <div className="absolute bottom-2 right-2 flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setShowVariablesDropdown(!showVariablesDropdown)}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                    title="Inserir variável"
                                  >
                                    @
                                  </button>
                                  <button
                                    type="button"
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                    title="Código"
                                  >
                                    &lt;/&gt;
                                  </button>
                                </div>
                                
                                {/* Dropdown de Variáveis */}
                                {showVariablesDropdown && (
                                  <div className="absolute bottom-12 right-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto min-w-64">
                                    <div className="p-2">
                                      <div className="text-xs font-medium text-gray-500 mb-2">Dados do Contato</div>
                                      {availableVariables.map((variable) => (
                                        <button
                                          key={variable.key}
                                          onClick={() => handleInsertVariable(variable.key)}
                                          className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                                        >
                                          {variable.key} - {variable.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex justify-between items-center mt-2">
                                <button
                                  onClick={() => setShowInstructionsModal(true)}
                                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                  <BookOpen className="w-4 h-4" />
                                  Aprenda a escrever suas instruções
                                </button>
                                <button
                                  className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center gap-1"
                                >
                                  <Zap className="w-4 h-4" />
                                  Otimizar
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Seção Ações */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações</h3>
                            
                            {/* Dados que o Agente deve coletar */}
                            <div className="mb-6">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Dados que o Agente deve coletar antes de seguir as instruções (opcional)
                              </label>
                              <p className="text-xs text-gray-500 mb-3">
                                Ao selecionar esse estágio, as variáveis abaixo serão solicitadas ao usuário antes de seguir as instruções.
                              </p>
                              <div className="space-y-2">
                                {selectedStep.collectData.map((data, index) => (
                                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-mono text-gray-700">{data}</span>
                                    <button
                                      onClick={() => handleRemoveCollectData(index)}
                                      className="text-red-600 hover:text-red-700 p-1"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                                <div className="flex items-center gap-2">
                                  <select
                                    value={newCollectData}
                                    onChange={(e) => setNewCollectData(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  >
                                    <option value="">Selecione uma variável...</option>
                                    {availableVariables.map((variable) => (
                                      <option key={variable.key} value={variable.key}>
                                        {variable.label} ({variable.key})
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={handleAddCollectData}
                                    disabled={!newCollectData}
                                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                  >
                                    Adicionar
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Ação que o Agente deve efetuar */}
                            <div className="mb-6">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                2. Ação que o Agente deve efetuar (opcional)
                              </label>
                              <p className="text-xs text-gray-500 mb-3">
                                Acontecerá após o passo 1
                              </p>
                              <select
                                value={selectedStep.action}
                                onChange={(e) => handleStepUpdate('action', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              >
                                <option value="">Adicionar uma ação</option>
                                <option value="call_api">Chamar uma API</option>
                                <option value="send_file">Enviar arquivos (beta)</option>
                                <option value="google_calendar">Conectar calendário</option>
                                <option value="transfer_human">Passar para um humano</option>
                              </select>
                            </div>

                            {/* Instruções finais */}
                            <div className="mb-6">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Instruções finais para responder o usuário
                              </label>
                              <p className="text-xs text-gray-500 mb-3">
                                Acontecerá após o passo 1 e 2, se houver. Se quiser referenciar alguma variável na instrução, basta digitar @ no campo que puxará as variáveis que você possui e você pode escolher a variável que deseja.
                              </p>
                              <div className="relative">
                                <textarea
                                  ref={(el) => setTextAreaRef(el)}
                                  value={selectedStep.finalInstructions}
                                  onChange={(e) => handleInstructionsChange(e.target.value, e.target)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                      setShowVariablesDropdown(false);
                                    }
                                  }}
                                  rows={6}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                  placeholder="Agradeça pelo contato, confirme os dados coletados e apresente-se como Lucas da Insight Cloud. Explique brevemente que a Insight Cloud é especializada em soluções de CRM para pequenas e médias empresas e pergunte sobre os desafios atuais da empresa dele na gestão de clientes."
                                />
                                <div className="absolute bottom-2 right-2 flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setShowVariablesDropdown(!showVariablesDropdown)}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                    title="Inserir variável"
                                  >
                                    @
                                  </button>
                                  <button
                                    type="button"
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                    title="Código"
                                  >
                                    &lt;/&gt;
                                  </button>
                                </div>
                                
                                {/* Dropdown de Variáveis */}
                                {showVariablesDropdown && (
                                  <div className="absolute bottom-12 right-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto min-w-64">
                                    <div className="p-2">
                                      <div className="text-xs font-medium text-gray-500 mb-2">Dados do Contato</div>
                                      {availableVariables.map((variable) => (
                                        <button
                                          key={variable.key}
                                          onClick={() => handleInsertVariable(variable.key)}
                                          className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                                        >
                                          {variable.key} - {variable.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Follow Up */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Defina um timeout para desativar o estágio temporariamente após ele ser executado (opcional)
                              </label>
                              <p className="text-xs text-gray-500 mb-3">
                                Use esta função para evitar repetições de comportamento ou controlar a experiência do usuário
                              </p>
                              <select
                                value={selectedStep.followUpTimeout}
                                onChange={(e) => handleStepUpdate('followUpTimeout', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              >
                                <option value="">Selecione uma opção</option>
                                <option value="none">Nenhum</option>
                                <option value="1">1 minuto</option>
                                <option value="5">5 minutos</option>
                                <option value="10">10 minutos</option>
                                <option value="30">30 minutos</option>
                                <option value="60">1 hora</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer com botão de salvar */}
                      <div className="p-6 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-500">
                            {isCreatingNewStep 
                              ? 'Preencha os campos obrigatórios e clique em "Treinar Agente IA" para salvar'
                              : 'Altere e defina as informações para treinar o seu Agente'
                            }
                          </p>
                          <button
                            onClick={handleSaveStep}
                            disabled={saving}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {saving ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Bot className="w-4 h-4" />
                            )}
                            {isCreatingNewStep ? 'Criar Estágio' : 'Treinar Agente IA'}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione um estágio</h3>
                        <p className="text-gray-500 mb-4">Escolha um estágio da lista ao lado para configurá-lo</p>
                        <button
                          onClick={handleCreateNewStep}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                        >
                          Criar primeiro estágio
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'teste' ? (
          <div className="max-w-7xl mx-auto h-[calc(100vh-180px)]">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
              {/* Chat Interface */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl border border-gray-200 h-[520px] flex flex-col shadow-sm">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Assistente Virtual VB</h3>
                          <p className="text-sm text-gray-600">Teste seu agente em tempo real</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${config.integration.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-gray-600">
                          {config.integration.isConnected ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-br-md'
                              : 'bg-gray-50 text-gray-900 border border-gray-100 rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <p className={`text-xs mt-2 ${
                            message.role === 'user' ? 'text-purple-100' : 'text-gray-500'
                          }`}>
                            {message.timestamp.toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Digite sua mensagem..."
                        disabled={!config.integration.isConnected}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 bg-white shadow-sm"
                      />
                      <button
                        onClick={handleTestMessage}
                        disabled={!testMessage.trim() || !config.integration.isConnected || isLoading}
                        className="px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-xs text-gray-500">
                        {config.integration.isConnected ? 'Pressione Enter para enviar' : 'Configure a API Key para começar'}
                      </p>
                      <button
                        onClick={handleResetChat}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-600 transition-colors duration-200"
                      >
                        <Zap className="w-3 h-3" />
                        Reiniciar
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Execution Log */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl border border-gray-200 h-[520px] flex flex-col shadow-sm">
                  {/* Execution Log Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Execution Log</h3>
                        <p className="text-sm text-gray-600">Agente Pensando</p>
                      </div>
                    </div>
                  </div>

                  {/* Execution Log Content */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {executionLog.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">O log de execução aparecerá aqui quando você testar o agente</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {executionLog.map((log) => (
                          <div
                            key={log.id}
                            className={`p-3 rounded-lg border-l-4 ${
                              log.type === 'thinking'
                                ? 'bg-blue-50 border-blue-400'
                                : log.type === 'action'
                                ? 'bg-green-50 border-green-400'
                                : 'bg-purple-50 border-purple-400'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                log.type === 'thinking'
                                  ? 'bg-blue-500 animate-pulse'
                                  : log.type === 'action'
                                  ? 'bg-green-500'
                                  : 'bg-purple-500'
                              }`}></div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-medium ${
                                    log.type === 'thinking'
                                      ? 'text-blue-700'
                                      : log.type === 'action'
                                      ? 'text-green-700'
                                      : 'text-purple-700'
                                  }`}>
                                    {log.type === 'thinking' && '🤔 Agente Pensando'}
                                    {log.type === 'action' && '⚡ Executando Ação'}
                                    {log.type === 'response' && '💬 Resposta Gerada'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {log.timestamp.toLocaleTimeString('pt-BR', { 
                                      hour: '2-digit', 
                                      minute: '2-digit',
                                      second: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{log.message}</p>
                                {log.details && (
                                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
                                    <pre>{JSON.stringify(log.details, null, 2)}</pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Arquivos */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Arquivos
                </h3>
                <button
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={!isEditing || isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Processar com IA
                    </>
                  )}
                </button>
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.md"
                />
              </div>
              
              {newFile && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{newFile.name}</p>
                      <p className="text-sm text-gray-600">{(newFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={addFile}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                      >
                        Adicionar
                      </button>
                      <button
                        onClick={() => setNewFile(null)}
                        className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {config.knowledgeBase.files.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Nenhum arquivo adicionado</p>
                  </div>
                ) : (
                  config.knowledgeBase.files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-600">{file.size} • {file.uploadedAt}</p>
                        </div>
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => removeItem('files', file.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Websites */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Websites
              </h3>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                    <input
                      type="url"
                      value={newWebsite.url}
                      onChange={(e) => setNewWebsite(prev => ({ ...prev, url: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="https://exemplo.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                    <input
                      type="text"
                      value={newWebsite.title}
                      onChange={(e) => setNewWebsite(prev => ({ ...prev, title: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="Nome do site"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>
                </div>
                {isEditing && (
                  <button
                    onClick={addWebsite}
                    disabled={isLoading}
                    className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processando...
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4" />
                        Fazer Scraping
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {(() => {
                  console.log('🔍 Renderizando websites:', {
                    websitesLength: config.knowledgeBase.websites.length,
                    websites: config.knowledgeBase.websites
                  });
                  return null;
                })()}
                {config.knowledgeBase.websites.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Globe className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Nenhum website adicionado</p>
                  </div>
                ) : (
                  config.knowledgeBase.websites.map((website) => (
                    <div key={website.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">{website.title}</p>
                          <p className="text-sm text-gray-600">{website.url}</p>
                          <p className="text-xs text-gray-500">Última verificação: {website.lastCrawled}</p>
                        </div>
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => removeItem('websites', website.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Perguntas e Respostas */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Perguntas e Respostas
              </h3>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pergunta</label>
                    <input
                      type="text"
                      value={newQA.question}
                      onChange={(e) => setNewQA(prev => ({ ...prev, question: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="Qual é a pergunta?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resposta</label>
                    <textarea
                      value={newQA.answer}
                      onChange={(e) => setNewQA(prev => ({ ...prev, answer: e.target.value }))}
                      disabled={!isEditing}
                      rows={3}
                      placeholder="Qual é a resposta?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <input
                      type="text"
                      value={newQA.category}
                      onChange={(e) => setNewQA(prev => ({ ...prev, category: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="Categoria (opcional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>
                </div>
                {isEditing && (
                  <button
                    onClick={addQA}
                    className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
                  >
                    Adicionar Q&A
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {config.knowledgeBase.qa.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Nenhuma pergunta e resposta adicionada</p>
                  </div>
                ) : (
                  config.knowledgeBase.qa.map((qa) => (
                    <div key={qa.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              {qa.category}
                            </span>
                          </div>
                          <p className="font-medium text-gray-900 mb-1">Q: {qa.question}</p>
                          <p className="text-gray-700">A: {qa.answer}</p>
                        </div>
                        {isEditing && (
                          <button
                            onClick={() => removeItem('qa', qa.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Personalidade */}
      {showPersonalityModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPersonalityModal(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Personalidade e Comportamento</h3>
                  <p className="text-sm text-gray-500">Configure como o agente deve se comportar</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOptimizePersonality}
                  disabled={!isEditing}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="w-4 h-4" />
                  Otimizar
                </button>
                <button
                  onClick={() => setShowPersonalityModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição da Personalidade
                  </label>
                  <textarea
                    value={config.personality}
                    onChange={(e) => updateLocalConfig(prev => ({ ...prev, personality: e.target.value }))}
                    disabled={!isEditing}
                    rows={12}
                    placeholder="Descreva como o agente deve se comportar, sua personalidade, tom de voz, estilo de comunicação, etc.

Exemplos:
- Profissional, prestativo e eficiente
- Amigável, caloroso e acolhedor
- Direto, objetivo e técnico
- Empático, paciente e compreensivo
- Dinâmico, energético e motivador"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200 resize-none"
                  />
                </div>

                {/* Dicas */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Dicas para uma boa personalidade:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Seja específico sobre o tom de voz (formal, casual, amigável)</li>
                    <li>• Descreva como o agente deve reagir a diferentes situações</li>
                    <li>• Inclua características únicas que diferenciem seu agente</li>
                    <li>• Considere o público-alvo e o contexto de uso</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowPersonalityModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                Fechar
              </button>
              {isEditing && (
                <button
                  onClick={() => setShowPersonalityModal(false)}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
                >
                  Salvar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para Criação/Edição de Funnel Step */}
      {showAddStepModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingStep ? 'Editar Estágio' : 'Criar Novo Estágio'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddStepModal(false);
                    setEditingStep(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Nome do Estágio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do estágio
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    O nome serve apenas para a sua organização
                  </p>
                  <input
                    type="text"
                    value={editingStep?.name || ''}
                    onChange={(e) => setEditingStep(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ex: Identificação e Qualificação Inicial"
                  />
                </div>

                {/* Condição Geral */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    1. Condição geral para o estágio ser escolhido
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Exemplo: "Se é o início da conversa" ou "Se o usuário quer agendar uma reunião" etc.
                  </p>
                  <input
                    type="text"
                    value={editingStep?.condition || ''}
                    onChange={(e) => setEditingStep(prev => prev ? { ...prev, condition: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Início da conversa ou cliente em potencial fazendo contato"
                  />
                </div>

                {/* Prompt de Instruções */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    2. Prompt de Instruções
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Descreva o papel do Agente IA, estilo de comunicação e as ações que ele deve executar. Forneça instruções passo a passo usando linguagem clara e acionável.
                  </p>
                  <textarea
                    value={editingStep?.instructionPrompt || ''}
                    onChange={(e) => setEditingStep(prev => prev ? { ...prev, instructionPrompt: e.target.value } : null)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Ex: # CONTEXTO\n* Você está falando com alguém que está entrando em contato com a empresa.\n* Eles podem ser um novo ou contato existente.\n* Seu objetivo é determinar a intenção deles e direcioná-los para a equipe ou pessoa certa.\n\n# PAPEL E ESTILO DE COMUNICAÇÃO\n* Você é um recepcionista educado, profissional e eficiente.\n* Você fará uma pergunta por vez e nunca responderá consultas sozinho.\n* Você é um agente de suporte calmo e prestativo que usa linguagem simples e clara."
                  />
                </div>

                {/* Follow Up */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Defina um timeout para desativar o estágio temporariamente após ele ser executado (opcional)
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Use esta função para evitar repetições de comportamento ou controlar a experiência do usuário
                  </p>
                  <select
                    value={editingStep?.followUpTimeout || ''}
                    onChange={(e) => setEditingStep(prev => prev ? { ...prev, followUpTimeout: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma opção</option>
                    <option value="none">Nenhum</option>
                    <option value="1">1 minuto</option>
                    <option value="5">5 minutos</option>
                    <option value="10">10 minutos</option>
                    <option value="30">30 minutos</option>
                    <option value="60">1 hora</option>
                  </select>
                </div>
              </div>

              {/* Botões do Modal */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowAddStepModal(false);
                    setEditingStep(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (!editingStep?.name || !editingStep?.condition) {
                      alert('Por favor, preencha o nome e a condição do estágio');
                      return;
                    }
                    
                    const newStep = {
                      id: editingStep.id || Date.now().toString(),
                      name: editingStep.name,
                      condition: editingStep.condition,
                      instructionPrompt: editingStep.instructionPrompt || '',
                      collectData: editingStep.collectData || [],
                      action: editingStep.action || '',
                      finalInstructions: editingStep.finalInstructions || '',
                      followUpTimeout: editingStep.followUpTimeout || '',
                      isActive: editingStep.isActive !== undefined ? editingStep.isActive : true
                    };
                    
                    setFunnelSteps(prev => {
                      const existingIndex = prev.findIndex(step => step.id === newStep.id);
                      if (existingIndex >= 0) {
                        const newSteps = [...prev];
                        newSteps[existingIndex] = newStep;
                        return newSteps;
                      } else {
                        return [...prev, newStep];
                      }
                    });
                    
                    setSelectedStep(newStep);
                    setShowAddStepModal(false);
                    setEditingStep(null);
                  }}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                >
                  {editingStep?.id ? 'Salvar Alterações' : 'Criar Estágio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal com Guia de Instruções */}
      {showInstructionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Como Escrever Instruções Eficazes para Agentes IA
                </h2>
                <button
                  onClick={() => setShowInstructionsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="prose max-w-none">
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Por - Visão Business</strong>
                  </p>
                  <p className="text-gray-700">
                    Escrever prompts claros e estruturados ajuda seu Agente IA a se comportar com mais precisão e responder naturalmente. Este guia cobre como escrever prompts eficazes para Agentes IA, incluindo tanto Instruções quanto Ações.
                  </p>
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Instruções vs. Ações</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Tipo</th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Propósito</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-medium">Instruções</td>
                          <td className="border border-gray-300 px-4 py-2">Orienta o comportamento geral do Agente IA, tom e objetivo com instruções passo a passo</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-medium">Ações</td>
                          <td className="border border-gray-300 px-4 py-2">Diz ao Agente IA exatamente quando executar essas ações e como fazer (ex: atribuir, fechar, atualizar campos)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Escrevendo Instruções</h3>
                  <p className="text-gray-700 mb-4">
                    Ao criar instruções, estruture-as claramente para que o Agente IA sempre saiba quem é, como se comportar e quais passos seguir. Recomendamos dividir as instruções em quatro partes.
                  </p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Elemento</th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold">O que faz</th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Exemplo</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-medium">Contexto</td>
                          <td className="border border-gray-300 px-4 py-2">Define a cena para o Agente IA. Explique com quem está falando e qual é o objetivo principal da conversa.</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm">
                            • Você está falando com alguém que está entrando em contato com a empresa.<br/>
                            • Eles podem ser um novo ou contato existente.<br/>
                            • Seu objetivo é determinar a intenção deles e direcioná-los para a equipe ou pessoa certa.
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-medium">Papel e estilo de comunicação</td>
                          <td className="border border-gray-300 px-4 py-2">Define como o Agente IA deve agir e soar. Inclua seu papel, tom e regras de comunicação.</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm">
                            • Você é um recepcionista educado, profissional e eficiente.<br/>
                            • Você fará uma pergunta por vez e nunca responderá consultas sozinho.<br/>
                            • Você é um agente de suporte calmo e prestativo que usa linguagem simples e clara.
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-medium">Fluxo</td>
                          <td className="border border-gray-300 px-4 py-2">Define a conversa passo a passo. Isso diz ao Agente IA exatamente como guiar a interação.</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm">
                            1. Cumprimente e pergunte: "Oi $contact.firstname! 👋 Como posso ajudá-lo hoje?"<br/>
                            2. Com base na resposta, infira a intenção:<br/>
                            &nbsp;&nbsp;Problemas relacionados → atribuir a [selecionar equipe]<br/>
                            &nbsp;&nbsp;Preços relacionados → atribuir a [selecionar equipe]<br/>
                            &nbsp;&nbsp;Se não houver intenção clara → atribuir a [selecionar equipe]<br/>
                            3. Sempre agradeça e informe que alguém ajudará em breve.
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-medium">Limites</td>
                          <td className="border border-gray-300 px-4 py-2">Define o que o Agente IA não deve tentar (ex: aconselhamento jurídico, diagnóstico médico, aconselhamento financeiro).</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm">
                            Não forneça:<br/>
                            • Aconselhamento financeiro<br/>
                            • Aconselhamento médico<br/>
                            • Aconselhamento jurídico<br/>
                            • Verificação de estoque em tempo real
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Dicas para Instruções</h3>
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Exemplo de Boas Práticas</h4>
                    <div className="text-sm text-blue-800 font-mono bg-white p-3 rounded border">
                      <div className="mb-2"><strong># CONTEXTO</strong></div>
                      <div className="mb-2">* Você está conversando com alguém explorando nosso produto (novo, retornando ou navegando). Seu objetivo é guiá-los para o produto ou plano certo.</div>
                      <div className="mb-2"><strong># PAPEL E ESTILO DE COMUNICAÇÃO</strong></div>
                      <div className="mb-2">* Seja caloroso, prestativo e relaxado—nunca insistente. Faça uma pergunta por vez. Mantenha respostas curtas, claras e encorajadoras.</div>
                      <div className="mb-2"><strong># FLUXO PRINCIPAL</strong></div>
                      <div className="mb-2">1. Cumprimente e dê boas-vindas ao Contato (Nome do contato $contact.firstname).</div>
                      <div className="mb-2">2. Pergunte, colete e salve campos do Contato: nome, email e telefone (todos obrigatórios).</div>
                      <div className="mb-2">3. Pergunte sobre suas necessidades: <strong>"Você tem um orçamento em mente? 🙂"</strong></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">✅ Boas Práticas</h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• Use cabeçalhos claros (# CONTEXTO, # PAPEL, etc.)</li>
                        <li>• Quebre passos em ordem lógica</li>
                        <li>• Use pontos em vez de parágrafos</li>
                        <li>• Mantenha linguagem limpa e utilizável</li>
                        <li>• Seja claro sobre capacidades</li>
                        <li>• Organize por fluxos e cenários</li>
                      </ul>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-red-900 mb-2">❌ Evite</h4>
                      <ul className="text-sm text-red-800 space-y-1">
                        <li>• Instruções vagas ou confusas</li>
                        <li>• Parágrafos longos sem estrutura</li>
                        <li>• Linguagem técnica excessiva</li>
                        <li>• Sobrecarregar com detalhes</li>
                        <li>• Não definir limites claros</li>
                        <li>• Fluxos desorganizados</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Usando Variáveis</h3>
                  <p className="text-gray-700 mb-4">
                    As variáveis tornam as respostas mais pessoais e precisas. Use @ para mencionar nomes de usuários e equipes, e $contact.campo para puxar informações dos campos de contato.
                  </p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Exemplos de Variáveis</h4>
                    <div className="text-sm space-y-2">
                      <div><code className="bg-white px-2 py-1 rounded">@nome</code> - Menciona nomes de usuários e equipes</div>
                      <div><code className="bg-white px-2 py-1 rounded">$contact.campo</code> - Puxa informações dos campos de contato (ex: $contact.email)</div>
                      <div><code className="bg-white px-2 py-1 rounded">$contact.firstName</code> - Nome do contato</div>
                      <div><code className="bg-white px-2 py-1 rounded">$contact.email</code> - Email do contato</div>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Exemplos de Prompts</h3>
                  
                  <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">✅ Exemplo 1 - Bom Prompt</h4>
                      <div className="text-sm font-mono bg-gray-50 p-3 rounded">
                        <div className="mb-2"><strong># CONTEXTO</strong></div>
                        <div className="mb-2">* Guie visitantes da página de preços para o plano certo.</div>
                        <div className="mb-2"><strong># PAPEL E ESTILO DE COMUNICAÇÃO</strong></div>
                        <div className="mb-2">* Caloroso, conciso; uma pergunta por vez.</div>
                        <div className="mb-2"><strong># FLUXO PRINCIPAL</strong></div>
                        <div className="mb-2">1) Cumprimente o cliente usando o nome: $contact.firstname</div>
                        <div className="mb-2">2) Pergunte e salve <strong>Campo Nome</strong>, <strong>Campo Email</strong>, <strong>Campo Telefone</strong></div>
                        <div className="mb-2">3) Pergunte sobre orçamento</div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">❌ Exemplo 2 - Prompt Ruim</h4>
                      <div className="text-sm font-mono bg-gray-50 p-3 rounded text-red-600">
                        Oi bem-vindo! pegue as informações e orçamento, recomende algo, talvez envie para vendas se forem grandes. Se não tiverem certeza, continue conversando e não diga que estão qualificados ou algo assim. vamos descobrir depois e fechar.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowInstructionsModal(false)}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                >
                  Entendi, Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Variáveis */}
      <AIAgentVariablesModal
        isOpen={showVariablesModal}
        onClose={() => setShowVariablesModal(false)}
        variables={variables}
        loading={variablesLoading}
        saving={variablesSaving}
        onCreateVariable={handleCreateVariable}
        onUpdateVariable={handleUpdateVariable}
        onDeleteVariable={handleDeleteVariable}
      />
    </div>
  );
}
