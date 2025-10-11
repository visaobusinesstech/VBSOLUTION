-- Sistema completo de Ações do Agente IA
-- Este script implementa o sistema de funis conversacionais e ações inteligentes

-- 1. Tabela para variáveis do sistema (baseadas em Contatos e Empresas)
CREATE TABLE IF NOT EXISTS public.agent_variables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Informações da variável
    name TEXT NOT NULL, -- Nome da variável (ex: "Nome do Cliente")
    key TEXT NOT NULL, -- Chave da variável (ex: "data.nome_cliente")
    data_type TEXT NOT NULL CHECK (data_type IN ('string', 'phone', 'email', 'number', 'date', 'boolean', 'select')),
    is_required BOOLEAN DEFAULT false,
    is_system_variable BOOLEAN DEFAULT false, -- Variáveis do sistema (não editáveis)
    
    -- Configurações da variável
    description TEXT,
    placeholder TEXT,
    validation_rules JSONB DEFAULT '{}',
    options JSONB DEFAULT '[]', -- Para campos select
    
    -- Mapeamento para tabelas do sistema
    source_table TEXT, -- 'contacts', 'companies', 'leads', etc.
    source_column TEXT, -- 'name', 'phone', 'email', etc.
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: chave única por owner/company
    CONSTRAINT unique_variable_key UNIQUE (owner_id, company_id, key)
);

-- 2. Tabela para funis conversacionais
CREATE TABLE IF NOT EXISTS public.conversation_funnels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Informações do funil
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    trigger_keywords TEXT[], -- Palavras-chave que ativam o funil
    
    -- Configurações
    max_steps INTEGER DEFAULT 10,
    timeout_minutes INTEGER DEFAULT 30,
    fallback_message TEXT DEFAULT 'Desculpe, não consegui processar sua solicitação.',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela para passos do funil
CREATE TABLE IF NOT EXISTS public.funnel_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    funnel_id UUID NOT NULL REFERENCES public.conversation_funnels(id) ON DELETE CASCADE,
    
    -- Informações do passo
    step_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    
    -- Configurações do passo
    step_type TEXT NOT NULL CHECK (step_type IN ('collect_variable', 'show_message', 'execute_action', 'conditional', 'wait')),
    message_template TEXT, -- Template da mensagem para o usuário
    variable_id UUID REFERENCES public.agent_variables(id), -- Variável a ser coletada
    
    -- Condições e ações
    conditions JSONB DEFAULT '[]', -- Condições para executar o passo
    actions JSONB DEFAULT '[]', -- Ações a serem executadas
    next_step_id UUID REFERENCES public.funnel_steps(id), -- Próximo passo
    
    -- Configurações de validação
    validation_rules JSONB DEFAULT '{}',
    retry_attempts INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 300,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: step_number único por funil
    CONSTRAINT unique_step_number UNIQUE (funnel_id, step_number)
);

-- 4. Tabela para ações do agente
CREATE TABLE IF NOT EXISTS public.agent_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Informações da ação
    name TEXT NOT NULL,
    description TEXT,
    action_type TEXT NOT NULL CHECK (action_type IN ('email', 'calendar', 'meeting', 'webhook', 'database', 'notification')),
    
    -- Configurações da ação
    config JSONB NOT NULL DEFAULT '{}', -- Configurações específicas da ação
    is_active BOOLEAN DEFAULT true,
    
    -- Integração
    connection_id UUID, -- ID da conexão necessária
    requires_auth BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela para execuções de ações
CREATE TABLE IF NOT EXISTS public.action_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action_id UUID NOT NULL REFERENCES public.agent_actions(id) ON DELETE CASCADE,
    funnel_id UUID REFERENCES public.conversation_funnels(id) ON DELETE CASCADE,
    step_id UUID REFERENCES public.funnel_steps(id) ON DELETE CASCADE,
    
    -- Contexto da execução
    chat_id TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    variables_data JSONB DEFAULT '{}', -- Dados das variáveis coletadas
    
    -- Status da execução
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    result JSONB DEFAULT '{}',
    error_message TEXT,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela para categorias de conexões
CREATE TABLE IF NOT EXISTS public.connection_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabela para conexões (atualizada com categorias)
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Informações da conexão
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.connection_categories(id),
    connection_type TEXT NOT NULL CHECK (connection_type IN ('whatsapp', 'webhook', 'google', 'microsoft', 'slack', 'discord')),
    
    -- Configurações
    config JSONB NOT NULL DEFAULT '{}',
    credentials JSONB DEFAULT '{}', -- Credenciais criptografadas
    is_active BOOLEAN DEFAULT true,
    is_connected BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- Inserir categorias padrão
INSERT INTO public.connection_categories (name, description, icon, color, sort_order) VALUES
('Comunicação', 'Canais de comunicação com clientes', 'message-circle', '#3B82F6', 1),
('Integrações', 'Aplicações de terceiros integradas', 'zap', '#10B981', 2)
ON CONFLICT (name) DO NOTHING;

-- Inserir variáveis padrão do sistema
INSERT INTO public.agent_variables (owner_id, name, key, data_type, is_required, is_system_variable, description, source_table, source_column) VALUES
-- Variáveis de Contatos
('00000000-0000-0000-0000-000000000000', 'Nome do Cliente', 'data.nome_cliente', 'string', true, true, 'Nome completo do cliente', 'contacts', 'name'),
('00000000-0000-0000-0000-000000000000', 'Telefone do Cliente', 'data.telefone_cliente', 'phone', true, true, 'Número de telefone do cliente', 'contacts', 'phone'),
('00000000-0000-0000-0000-000000000000', 'Email do Cliente', 'data.email_cliente', 'email', false, true, 'Endereço de email do cliente', 'contacts', 'email'),
('00000000-0000-0000-0000-000000000000', 'Cargo do Cliente', 'data.cargo_cliente', 'string', false, true, 'Cargo ou função do cliente', 'contacts', 'position'),
('00000000-0000-0000-0000-000000000000', 'Empresa do Cliente', 'data.empresa_cliente', 'string', false, true, 'Empresa onde o cliente trabalha', 'contacts', 'company'),
('00000000-0000-0000-0000-000000000000', 'Produto de Interesse', 'data.produto_interesse', 'string', false, true, 'Produto ou serviço de interesse', 'contacts', 'interest_product'),
('00000000-0000-0000-0000-000000000000', 'Orçamento Estimado', 'data.orcamento_estimado', 'number', false, true, 'Orçamento estimado do cliente', 'contacts', 'estimated_budget'),
('00000000-0000-0000-0000-000000000000', 'Prazo de Implementação', 'data.prazo_implementacao', 'date', false, true, 'Prazo desejado para implementação', 'contacts', 'implementation_deadline'),
('00000000-0000-0000-0000-000000000000', 'Tamanho da Empresa', 'data.tamanho_empresa', 'select', false, true, 'Tamanho da empresa do cliente', 'contacts', 'company_size'),
('00000000-0000-0000-0000-000000000000', 'Setor de Atuação', 'data.setor_atuacao', 'string', false, true, 'Setor de atuação da empresa', 'contacts', 'sector'),
('00000000-0000-0000-0000-000000000000', 'Tecnologias Utilizadas', 'data.tecnologias_utilizadas', 'string', false, true, 'Tecnologias já utilizadas pela empresa', 'contacts', 'technologies_used'),
('00000000-0000-0000-0000-000000000000', 'Objetivos Principais', 'data.objetivos_principais', 'string', false, true, 'Objetivos principais do cliente', 'contacts', 'main_goals'),

-- Variáveis de Empresas
('00000000-0000-0000-0000-000000000000', 'Nome da Empresa', 'data.nome_empresa', 'string', true, true, 'Nome da empresa', 'companies', 'name'),
('00000000-0000-0000-0000-000000000000', 'CNPJ da Empresa', 'data.cnpj_empresa', 'string', false, true, 'CNPJ da empresa', 'companies', 'cnpj'),
('00000000-0000-0000-0000-000000000000', 'Razão Social', 'data.razao_social', 'string', false, true, 'Razão social da empresa', 'companies', 'legal_name'),
('00000000-0000-0000-0000-000000000000', 'Email da Empresa', 'data.email_empresa', 'email', false, true, 'Email principal da empresa', 'companies', 'email'),
('00000000-0000-0000-0000-000000000000', 'Telefone da Empresa', 'data.telefone_empresa', 'phone', false, true, 'Telefone principal da empresa', 'companies', 'phone'),
('00000000-0000-0000-0000-000000000000', 'Endereço da Empresa', 'data.endereco_empresa', 'string', false, true, 'Endereço completo da empresa', 'companies', 'address'),
('00000000-0000-0000-0000-000000000000', 'Cidade da Empresa', 'data.cidade_empresa', 'string', false, true, 'Cidade da empresa', 'companies', 'city'),
('00000000-0000-0000-0000-000000000000', 'Estado da Empresa', 'data.estado_empresa', 'string', false, true, 'Estado da empresa', 'companies', 'state'),
('00000000-0000-0000-0000-000000000000', 'CEP da Empresa', 'data.cep_empresa', 'string', false, true, 'CEP da empresa', 'companies', 'zip_code'),
('00000000-0000-0000-0000-000000000000', 'Nicho da Empresa', 'data.nicho_empresa', 'string', false, true, 'Nicho ou setor da empresa', 'companies', 'sector'),
('00000000-0000-0000-0000-000000000000', 'Tamanho da Empresa', 'data.tamanho_empresa', 'select', false, true, 'Tamanho da empresa', 'companies', 'company_size'),
('00000000-0000-0000-0000-000000000000', 'Descrição da Empresa', 'data.descricao_empresa', 'string', false, true, 'Descrição da empresa', 'companies', 'description')
ON CONFLICT (owner_id, company_id, key) DO NOTHING;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_agent_variables_owner_id ON public.agent_variables(owner_id);
CREATE INDEX IF NOT EXISTS idx_agent_variables_company_id ON public.agent_variables(company_id);
CREATE INDEX IF NOT EXISTS idx_agent_variables_key ON public.agent_variables(key);

CREATE INDEX IF NOT EXISTS idx_conversation_funnels_owner_id ON public.conversation_funnels(owner_id);
CREATE INDEX IF NOT EXISTS idx_conversation_funnels_company_id ON public.conversation_funnels(company_id);
CREATE INDEX IF NOT EXISTS idx_conversation_funnels_active ON public.conversation_funnels(is_active);

CREATE INDEX IF NOT EXISTS idx_funnel_steps_funnel_id ON public.funnel_steps(funnel_id);
CREATE INDEX IF NOT EXISTS idx_funnel_steps_step_number ON public.funnel_steps(funnel_id, step_number);

CREATE INDEX IF NOT EXISTS idx_agent_actions_owner_id ON public.agent_actions(owner_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_company_id ON public.agent_actions(company_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_type ON public.agent_actions(action_type);

CREATE INDEX IF NOT EXISTS idx_action_executions_action_id ON public.action_executions(action_id);
CREATE INDEX IF NOT EXISTS idx_action_executions_chat_id ON public.action_executions(chat_id);
CREATE INDEX IF NOT EXISTS idx_action_executions_status ON public.action_executions(status);

CREATE INDEX IF NOT EXISTS idx_connections_owner_id ON public.connections(owner_id);
CREATE INDEX IF NOT EXISTS idx_connections_category_id ON public.connections(category_id);
CREATE INDEX IF NOT EXISTS idx_connections_type ON public.connections(connection_type);

-- RLS (Row Level Security)
ALTER TABLE public.agent_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can manage their own agent variables" ON public.agent_variables
    FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Users can manage their own conversation funnels" ON public.conversation_funnels
    FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Users can manage funnel steps" ON public.funnel_steps
    FOR ALL USING (auth.uid() = (SELECT owner_id FROM public.conversation_funnels WHERE id = funnel_id));

CREATE POLICY "Users can manage their own agent actions" ON public.agent_actions
    FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Users can view their own action executions" ON public.action_executions
    FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Users can manage their own connections" ON public.connections
    FOR ALL USING (auth.uid() = owner_id);

-- Comentários para documentação
COMMENT ON TABLE public.agent_variables IS 'Variáveis disponíveis para coleta em funis conversacionais';
COMMENT ON TABLE public.conversation_funnels IS 'Funil conversacional com passos e ações';
COMMENT ON TABLE public.funnel_steps IS 'Passos individuais de um funil conversacional';
COMMENT ON TABLE public.agent_actions IS 'Ações que o agente pode executar';
COMMENT ON TABLE public.action_executions IS 'Histórico de execuções de ações';
COMMENT ON TABLE public.connection_categories IS 'Categorias de conexões (Comunicação, Integrações)';
COMMENT ON TABLE public.connections IS 'Conexões com serviços externos';

-- Verificar se as tabelas foram criadas corretamente
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('agent_variables', 'conversation_funnels', 'funnel_steps', 'agent_actions', 'action_executions', 'connection_categories', 'connections')
ORDER BY table_name, column_name;
