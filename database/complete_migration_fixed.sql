-- Migração completa para o sistema AI Agent (SEM comandos \i)
-- Execute este arquivo no Supabase SQL Editor

-- ========================================
-- 1. TABELAS DE SUPORTE
-- ========================================

-- Tabela de contatos
CREATE TABLE IF NOT EXISTS contatos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Informações básicas
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    empresa VARCHAR(255),
    cargo VARCHAR(255),
    
    -- Informações adicionais
    data_nascimento DATE,
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(50),
    cep VARCHAR(10),
    pais VARCHAR(100) DEFAULT 'Brasil',
    
    -- Status e controle
    status VARCHAR(50) DEFAULT 'ativo',
    origem VARCHAR(100),
    tags TEXT[],
    observacoes TEXT,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Tabela de conversas
CREATE TABLE IF NOT EXISTS conversas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contatos(id) ON DELETE CASCADE,
    ai_agent_config_id UUID REFERENCES ai_agent_configs(id) ON DELETE CASCADE,
    
    -- Informações da conversa
    titulo VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ativa',
    canal VARCHAR(50) DEFAULT 'whatsapp',
    
    -- Dados da conversa
    mensagens JSONB DEFAULT '[]'::jsonb,
    contexto JSONB DEFAULT '{}'::jsonb,
    variaveis_coletadas JSONB DEFAULT '{}'::jsonb,
    
    -- Configurações
    configuracao JSONB DEFAULT '{}'::jsonb,
    preferencias JSONB DEFAULT '{}'::jsonb,
    
    -- Status e controle
    is_active BOOLEAN DEFAULT true,
    priority VARCHAR(20) DEFAULT 'normal',
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Tabela de equipes
CREATE TABLE IF NOT EXISTS equipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Informações da equipe
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    cor VARCHAR(7) DEFAULT '#6366f1',
    
    -- Configurações
    configuracao JSONB DEFAULT '{}'::jsonb,
    permissoes JSONB DEFAULT '{}'::jsonb,
    
    -- Status e controle
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Tabela de membros da equipe
CREATE TABLE IF NOT EXISTS equipe_membros (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    equipe_id UUID NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraint para evitar duplicatas
    UNIQUE(equipe_id, user_id)
);

-- ========================================
-- 2. TABELA PRINCIPAL DE AÇÕES
-- ========================================

-- Tabela para armazenar as ações/configurações dos Agentes IA
CREATE TABLE IF NOT EXISTS ai_agent_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ai_agent_config_id UUID NOT NULL REFERENCES ai_agent_configs(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Informações básicas do estágio
    name VARCHAR(255) NOT NULL,
    condition TEXT NOT NULL,
    instruction_prompt TEXT,
    
    -- Dados para coleta
    collect_data JSONB DEFAULT '[]'::jsonb,
    
    -- Ação a ser executada
    action VARCHAR(100),
    action_config JSONB DEFAULT '{}'::jsonb,
    
    -- Instruções finais
    final_instructions TEXT,
    
    -- Configurações de follow-up
    follow_up_timeout INTEGER DEFAULT 0,
    follow_up_action VARCHAR(100) DEFAULT 'none',
    
    -- Status e controle
    is_active BOOLEAN DEFAULT true,
    execution_order INTEGER DEFAULT 0,
    
    -- Referências opcionais
    contact_id UUID REFERENCES contatos(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversas(id) ON DELETE CASCADE,
    target_team_id UUID REFERENCES equipes(id) ON DELETE SET NULL,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Configurações avançadas
    integration_config JSONB DEFAULT '{}'::jsonb,
    custom_variables JSONB DEFAULT '{}'::jsonb,
    chunking_config JSONB DEFAULT '{
        "enabled": true,
        "max_chunk_size": 200,
        "debounce_time": 30000,
        "delay_between_chunks": 1000
    }'::jsonb,
    validation_rules JSONB DEFAULT '{}'::jsonb,
    
    -- Histórico e métricas
    execution_history JSONB DEFAULT '[]'::jsonb,
    performance_metrics JSONB DEFAULT '{
        "execution_count": 0,
        "success_rate": 0.0,
        "average_response_time": 0,
        "last_executed_at": null
    }'::jsonb,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- ========================================
-- 3. TABELA DE VARIÁVEIS
-- ========================================

-- Tabela para armazenar variáveis do sistema AI Agent
CREATE TABLE IF NOT EXISTS ai_agent_variables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ai_agent_config_id UUID NOT NULL REFERENCES ai_agent_configs(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Informações da variável
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    variable_type VARCHAR(50) NOT NULL,
    
    -- Configurações da variável
    is_required BOOLEAN DEFAULT false,
    validation_rules JSONB DEFAULT '{}'::jsonb,
    default_value TEXT,
    placeholder_text TEXT,
    
    -- Configurações de coleta
    collection_prompt TEXT,
    collection_order INTEGER DEFAULT 0,
    
    -- Status e controle
    is_active BOOLEAN DEFAULT true,
    is_system_variable BOOLEAN DEFAULT false,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- ========================================
-- 4. ÍNDICES PARA PERFORMANCE
-- ========================================

-- Índices para contatos
CREATE INDEX IF NOT EXISTS idx_contatos_owner_id ON contatos(owner_id);
CREATE INDEX IF NOT EXISTS idx_contatos_email ON contatos(email);
CREATE INDEX IF NOT EXISTS idx_contatos_telefone ON contatos(telefone);
CREATE INDEX IF NOT EXISTS idx_contatos_status ON contatos(status);
CREATE INDEX IF NOT EXISTS idx_contatos_created_at ON contatos(created_at);

-- Índices para conversas
CREATE INDEX IF NOT EXISTS idx_conversas_owner_id ON conversas(owner_id);
CREATE INDEX IF NOT EXISTS idx_conversas_contact_id ON conversas(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversas_ai_agent_config_id ON conversas(ai_agent_config_id);
CREATE INDEX IF NOT EXISTS idx_conversas_status ON conversas(status);
CREATE INDEX IF NOT EXISTS idx_conversas_canal ON conversas(canal);
CREATE INDEX IF NOT EXISTS idx_conversas_created_at ON conversas(created_at);
CREATE INDEX IF NOT EXISTS idx_conversas_last_message_at ON conversas(last_message_at);

-- Índices para equipes
CREATE INDEX IF NOT EXISTS idx_equipes_owner_id ON equipes(owner_id);
CREATE INDEX IF NOT EXISTS idx_equipes_is_active ON equipes(is_active);
CREATE INDEX IF NOT EXISTS idx_equipes_is_default ON equipes(is_default);

-- Índices para membros da equipe
CREATE INDEX IF NOT EXISTS idx_equipe_membros_equipe_id ON equipe_membros(equipe_id);
CREATE INDEX IF NOT EXISTS idx_equipe_membros_user_id ON equipe_membros(user_id);
CREATE INDEX IF NOT EXISTS idx_equipe_membros_role ON equipe_membros(role);

-- Índices para ações
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_config_id ON ai_agent_actions(ai_agent_config_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_owner_id ON ai_agent_actions(owner_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_active ON ai_agent_actions(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_order ON ai_agent_actions(execution_order);
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_contact_id ON ai_agent_actions(contact_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_conversation_id ON ai_agent_actions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_target_team_id ON ai_agent_actions(target_team_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_target_user_id ON ai_agent_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_created_at ON ai_agent_actions(created_at);

-- Índices para variáveis
CREATE INDEX IF NOT EXISTS idx_ai_agent_variables_config_id ON ai_agent_variables(ai_agent_config_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_variables_owner_id ON ai_agent_variables(owner_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_variables_active ON ai_agent_variables(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_agent_variables_name ON ai_agent_variables(name);
CREATE INDEX IF NOT EXISTS idx_ai_agent_variables_type ON ai_agent_variables(variable_type);

-- ========================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ========================================

-- Habilitar RLS
ALTER TABLE contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipe_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_variables ENABLE ROW LEVEL SECURITY;

-- Políticas para contatos
CREATE POLICY "Users can view their own contatos" ON contatos
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own contatos" ON contatos
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own contatos" ON contatos
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own contatos" ON contatos
    FOR DELETE USING (auth.uid() = owner_id);

-- Políticas para conversas
CREATE POLICY "Users can view their own conversas" ON conversas
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own conversas" ON conversas
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own conversas" ON conversas
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own conversas" ON conversas
    FOR DELETE USING (auth.uid() = owner_id);

-- Políticas para equipes
CREATE POLICY "Users can view their own equipes" ON equipes
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own equipes" ON equipes
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own equipes" ON equipes
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own equipes" ON equipes
    FOR DELETE USING (auth.uid() = owner_id);

-- Políticas para membros da equipe
CREATE POLICY "Users can view equipe_membros for their teams" ON equipe_membros
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM equipes 
            WHERE equipes.id = equipe_membros.equipe_id 
            AND equipes.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert equipe_membros for their teams" ON equipe_membros
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM equipes 
            WHERE equipes.id = equipe_membros.equipe_id 
            AND equipes.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update equipe_membros for their teams" ON equipe_membros
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM equipes 
            WHERE equipes.id = equipe_membros.equipe_id 
            AND equipes.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete equipe_membros for their teams" ON equipe_membros
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM equipes 
            WHERE equipes.id = equipe_membros.equipe_id 
            AND equipes.owner_id = auth.uid()
        )
    );

-- Políticas para ações
CREATE POLICY "Users can view their own ai_agent_actions" ON ai_agent_actions
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own ai_agent_actions" ON ai_agent_actions
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own ai_agent_actions" ON ai_agent_actions
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own ai_agent_actions" ON ai_agent_actions
    FOR DELETE USING (auth.uid() = owner_id);

-- Políticas para variáveis
CREATE POLICY "Users can view their own ai_agent_variables" ON ai_agent_variables
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own ai_agent_variables" ON ai_agent_variables
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own ai_agent_variables" ON ai_agent_variables
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own ai_agent_variables" ON ai_agent_variables
    FOR DELETE USING (auth.uid() = owner_id);

-- ========================================
-- 6. TRIGGERS E FUNÇÕES
-- ========================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para definir created_by
CREATE OR REPLACE FUNCTION set_created_by_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_by = auth.uid();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers para todas as tabelas
CREATE TRIGGER trigger_contatos_updated_at
    BEFORE UPDATE ON contatos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_contatos_created_by
    BEFORE INSERT ON contatos
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by_column();

CREATE TRIGGER trigger_conversas_updated_at
    BEFORE UPDATE ON conversas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_conversas_created_by
    BEFORE INSERT ON conversas
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by_column();

CREATE TRIGGER trigger_equipes_updated_at
    BEFORE UPDATE ON equipes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_equipes_created_by
    BEFORE INSERT ON equipes
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by_column();

CREATE TRIGGER trigger_equipe_membros_created_by
    BEFORE INSERT ON equipe_membros
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by_column();

CREATE TRIGGER trigger_ai_agent_actions_updated_at
    BEFORE UPDATE ON ai_agent_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_ai_agent_actions_created_by
    BEFORE INSERT ON ai_agent_actions
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by_column();

CREATE TRIGGER trigger_ai_agent_variables_updated_at
    BEFORE UPDATE ON ai_agent_variables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_ai_agent_variables_created_by
    BEFORE INSERT ON ai_agent_variables
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by_column();

-- ========================================
-- 7. FUNÇÕES ESPECÍFICAS DO SISTEMA
-- ========================================

-- Função para buscar ações ativas de um agente
CREATE OR REPLACE FUNCTION get_active_ai_agent_actions(p_agent_config_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    condition TEXT,
    instruction_prompt TEXT,
    collect_data JSONB,
    action VARCHAR(100),
    action_config JSONB,
    final_instructions TEXT,
    follow_up_timeout INTEGER,
    follow_up_action VARCHAR(100),
    execution_order INTEGER,
    chunking_config JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.condition,
        a.instruction_prompt,
        a.collect_data,
        a.action,
        a.action_config,
        a.final_instructions,
        a.follow_up_timeout,
        a.follow_up_action,
        a.execution_order,
        a.chunking_config
    FROM ai_agent_actions a
    WHERE a.ai_agent_config_id = p_agent_config_id
    AND a.is_active = true
    ORDER BY a.execution_order ASC, a.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar variáveis ativas de um agente
CREATE OR REPLACE FUNCTION get_active_ai_agent_variables(p_agent_config_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    display_name VARCHAR(255),
    description TEXT,
    variable_type VARCHAR(50),
    is_required BOOLEAN,
    validation_rules JSONB,
    default_value TEXT,
    placeholder_text TEXT,
    collection_prompt TEXT,
    collection_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.name,
        v.display_name,
        v.description,
        v.variable_type,
        v.is_required,
        v.validation_rules,
        v.default_value,
        v.placeholder_text,
        v.collection_prompt,
        v.collection_order
    FROM ai_agent_variables v
    WHERE v.ai_agent_config_id = p_agent_config_id
    AND v.is_active = true
    ORDER BY v.collection_order ASC, v.display_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter configuração completa
CREATE OR REPLACE FUNCTION get_complete_ai_agent_config(p_config_id UUID)
RETURNS JSONB AS $$
DECLARE
    config_record RECORD;
    actions JSONB;
    variables JSONB;
    result JSONB;
BEGIN
    -- Buscar configuração
    SELECT * INTO config_record
    FROM ai_agent_configs
    WHERE id = p_config_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Configuração não encontrada');
    END IF;
    
    -- Buscar ações
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', a.id,
            'name', a.name,
            'condition', a.condition,
            'instruction_prompt', a.instruction_prompt,
            'collect_data', a.collect_data,
            'action', a.action,
            'action_config', a.action_config,
            'final_instructions', a.final_instructions,
            'follow_up_timeout', a.follow_up_timeout,
            'follow_up_action', a.follow_up_action,
            'is_active', a.is_active,
            'execution_order', a.execution_order,
            'chunking_config', a.chunking_config,
            'performance_metrics', a.performance_metrics
        )
    ) INTO actions
    FROM ai_agent_actions a
    WHERE a.ai_agent_config_id = p_config_id
    AND a.is_active = true
    ORDER BY a.execution_order ASC;
    
    -- Buscar variáveis
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', v.id,
            'name', v.name,
            'display_name', v.display_name,
            'description', v.description,
            'variable_type', v.variable_type,
            'is_required', v.is_required,
            'validation_rules', v.validation_rules,
            'default_value', v.default_value,
            'placeholder_text', v.placeholder_text,
            'collection_prompt', v.collection_prompt,
            'collection_order', v.collection_order,
            'is_active', v.is_active
        )
    ) INTO variables
    FROM ai_agent_variables v
    WHERE v.ai_agent_config_id = p_config_id
    AND v.is_active = true
    ORDER BY v.collection_order ASC;
    
    -- Construir resultado
    result := jsonb_build_object(
        'config', to_jsonb(config_record),
        'actions', COALESCE(actions, '[]'::jsonb),
        'variables', COALESCE(variables, '[]'::jsonb),
        'generated_at', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 8. DADOS INICIAIS
-- ========================================

-- Inserir equipes padrão
INSERT INTO equipes (id, owner_id, nome, descricao, is_default, is_active) 
VALUES 
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'Equipe Padrão', 'Equipe padrão do sistema', true, true),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'Suporte', 'Equipe de suporte técnico', false, true),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'Vendas', 'Equipe de vendas', false, true);

-- Inserir variáveis padrão do sistema
INSERT INTO ai_agent_variables (
    ai_agent_config_id,
    owner_id,
    name,
    display_name,
    description,
    variable_type,
    is_required,
    collection_prompt,
    is_system_variable,
    is_active
) VALUES 
-- Variáveis de dados do contato
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'data.nome_cliente', 'Nome do Cliente', 'Nome completo do cliente', 'string', true, 'Qual é o seu nome completo?', true, true),
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'data.telefone_cliente', 'Telefone do Cliente', 'Número de telefone do cliente', 'phone', true, 'Qual é o seu número de telefone?', true, true),
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'data.email_cliente', 'Email do Cliente', 'Endereço de email do cliente', 'email', true, 'Qual é o seu email?', true, true),
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'data.cargo_cliente', 'Cargo do Cliente', 'Cargo ou função do cliente na empresa', 'string', false, 'Qual é o seu cargo na empresa?', true, true),
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'data.nome_empresa', 'Nome da Empresa', 'Nome da empresa do cliente', 'string', false, 'Qual é o nome da sua empresa?', true, true),
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'data.produto_interesse', 'Produto de Interesse', 'Produto ou serviço de interesse do cliente', 'string', false, 'Qual produto ou serviço te interessa?', true, true),

-- Variáveis de ações do sistema
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'action.googleCalendar.email', 'Email do Calendário', 'Email para agendamento no Google Calendar', 'email', false, 'Qual email devo usar para o agendamento?', true, true),
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'action.googleCalendar.startDate', 'Data de Início', 'Data para início do agendamento', 'date', false, 'Qual data você prefere?', true, true),
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'action.googleCalendar.startTime', 'Hora de Início', 'Hora para início do agendamento', 'time', false, 'Qual horário funciona melhor?', true, true),

-- Variáveis do sistema
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'system.chat.id', 'ID do Chat', 'Identificador único do chat', 'string', false, '', true, true),
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'system.user.id', 'ID do Usuário', 'Identificador único do usuário', 'string', false, '', true, true),
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'system.timestamp', 'Timestamp Atual', 'Data e hora atual', 'datetime', false, '', true, true);

-- ========================================
-- 9. VERIFICAÇÃO FINAL
-- ========================================

DO $$
BEGIN
    -- Verificar se as tabelas existem
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_agent_configs') THEN
        RAISE EXCEPTION 'Tabela ai_agent_configs não foi criada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_agent_actions') THEN
        RAISE EXCEPTION 'Tabela ai_agent_actions não foi criada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_agent_variables') THEN
        RAISE EXCEPTION 'Tabela ai_agent_variables não foi criada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contatos') THEN
        RAISE EXCEPTION 'Tabela contatos não foi criada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversas') THEN
        RAISE EXCEPTION 'Tabela conversas não foi criada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'equipes') THEN
        RAISE EXCEPTION 'Tabela equipes não foi criada';
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRAÇÃO COMPLETA EXECUTADA COM SUCESSO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tabelas criadas:';
    RAISE NOTICE '- ai_agent_configs (configurações do agente)';
    RAISE NOTICE '- ai_agent_actions (ações/estágios do agente)';
    RAISE NOTICE '- ai_agent_variables (variáveis do sistema)';
    RAISE NOTICE '- contatos (contatos do sistema)';
    RAISE NOTICE '- conversas (conversas do agente)';
    RAISE NOTICE '- equipes (equipes para transferência)';
    RAISE NOTICE '- equipe_membros (membros das equipes)';
    RAISE NOTICE '';
    RAISE NOTICE 'Funções criadas:';
    RAISE NOTICE '- get_complete_ai_agent_config()';
    RAISE NOTICE '- get_active_ai_agent_actions()';
    RAISE NOTICE '- get_active_ai_agent_variables()';
    RAISE NOTICE '';
    RAISE NOTICE 'Sistema pronto para uso!';
    RAISE NOTICE '========================================';
END $$;
