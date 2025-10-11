-- Tabela para variáveis do sistema de IA Agent
CREATE TABLE IF NOT EXISTS ai_agent_variables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ai_agent_config_id UUID NOT NULL REFERENCES ai_agent_configs(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key VARCHAR(255) NOT NULL UNIQUE,
    data_type VARCHAR(50) NOT NULL CHECK (data_type IN ('string', 'number', 'boolean', 'date', 'email', 'phone', 'url', 'select', 'json')),
    description TEXT,
    is_system_variable BOOLEAN DEFAULT false,
    default_value TEXT,
    options JSONB DEFAULT '[]'::jsonb,
    validation_rules JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_agent_variables_config_id ON ai_agent_variables(ai_agent_config_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_variables_owner_id ON ai_agent_variables(owner_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_variables_key ON ai_agent_variables(key);
CREATE INDEX IF NOT EXISTS idx_ai_agent_variables_data_type ON ai_agent_variables(data_type);

-- RLS (Row Level Security)
ALTER TABLE ai_agent_variables ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas suas próprias variáveis
CREATE POLICY "Users can view their own variables" ON ai_agent_variables
    FOR SELECT USING (auth.uid() = owner_id);

-- Política para permitir que usuários criem variáveis para suas próprias configurações
CREATE POLICY "Users can create variables for their own configs" ON ai_agent_variables
    FOR INSERT WITH CHECK (
        auth.uid() = owner_id AND 
        EXISTS (
            SELECT 1 FROM ai_agent_configs 
            WHERE id = ai_agent_config_id AND owner_id = auth.uid()
        )
    );

-- Política para permitir que usuários atualizem suas próprias variáveis
CREATE POLICY "Users can update their own variables" ON ai_agent_variables
    FOR UPDATE USING (auth.uid() = owner_id);

-- Política para permitir que usuários deletem suas próprias variáveis
CREATE POLICY "Users can delete their own variables" ON ai_agent_variables
    FOR DELETE USING (auth.uid() = owner_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_ai_agent_variables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_agent_variables_updated_at
    BEFORE UPDATE ON ai_agent_variables
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_agent_variables_updated_at();

-- Inserir variáveis do sistema baseadas nos campos de contato
INSERT INTO ai_agent_variables (ai_agent_config_id, owner_id, name, key, data_type, description, is_system_variable, default_value)
SELECT 
    c.id,
    c.owner_id,
    'Nome do Cliente',
    'data.nome_cliente',
    'string',
    'Nome completo do cliente',
    true,
    ''
FROM ai_agent_configs c
WHERE NOT EXISTS (
    SELECT 1 FROM ai_agent_variables v 
    WHERE v.key = 'data.nome_cliente' AND v.ai_agent_config_id = c.id
);

INSERT INTO ai_agent_variables (ai_agent_config_id, owner_id, name, key, data_type, description, is_system_variable, default_value)
SELECT 
    c.id,
    c.owner_id,
    'Nome Completo do Cliente',
    'data.nome_completo',
    'string',
    'Nome completo do cliente (incluindo sobrenome)',
    true,
    ''
FROM ai_agent_configs c
WHERE NOT EXISTS (
    SELECT 1 FROM ai_agent_variables v 
    WHERE v.key = 'data.nome_completo' AND v.ai_agent_config_id = c.id
);

INSERT INTO ai_agent_variables (ai_agent_config_id, owner_id, name, key, data_type, description, is_system_variable, default_value)
SELECT 
    c.id,
    c.owner_id,
    'Email do Cliente',
    'data.email_cliente',
    'email',
    'Endereço de email do cliente',
    true,
    ''
FROM ai_agent_configs c
WHERE NOT EXISTS (
    SELECT 1 FROM ai_agent_variables v 
    WHERE v.key = 'data.email_cliente' AND v.ai_agent_config_id = c.id
);

INSERT INTO ai_agent_variables (ai_agent_config_id, owner_id, name, key, data_type, description, is_system_variable, default_value)
SELECT 
    c.id,
    c.owner_id,
    'Telefone do Cliente',
    'data.telefone_cliente',
    'phone',
    'Número de telefone do cliente (WhatsApp)',
    true,
    ''
FROM ai_agent_configs c
WHERE NOT EXISTS (
    SELECT 1 FROM ai_agent_variables v 
    WHERE v.key = 'data.telefone_cliente' AND v.ai_agent_config_id = c.id
);

INSERT INTO ai_agent_variables (ai_agent_config_id, owner_id, name, key, data_type, description, is_system_variable, default_value)
SELECT 
    c.id,
    c.owner_id,
    'Empresa do Cliente',
    'data.empresa_cliente',
    'string',
    'Nome da empresa do cliente',
    true,
    ''
FROM ai_agent_configs c
WHERE NOT EXISTS (
    SELECT 1 FROM ai_agent_variables v 
    WHERE v.key = 'data.empresa_cliente' AND v.ai_agent_config_id = c.id
);

INSERT INTO ai_agent_variables (ai_agent_config_id, owner_id, name, key, data_type, description, is_system_variable, default_value)
SELECT 
    c.id,
    c.owner_id,
    'Status do Cliente',
    'data.status_cliente',
    'select',
    'Status atual do cliente (Ativo, Lead, Inativo)',
    true,
    'Ativo'
FROM ai_agent_configs c
WHERE NOT EXISTS (
    SELECT 1 FROM ai_agent_variables v 
    WHERE v.key = 'data.status_cliente' AND v.ai_agent_config_id = c.id
);

INSERT INTO ai_agent_variables (ai_agent_config_id, owner_id, name, key, data_type, description, is_system_variable, default_value, options)
SELECT 
    c.id,
    c.owner_id,
    'Status do Cliente',
    'data.status_cliente',
    'select',
    'Status atual do cliente (Ativo, Lead, Inativo)',
    true,
    'Ativo',
    '["Ativo", "Lead", "Inativo"]'::jsonb
FROM ai_agent_configs c
WHERE NOT EXISTS (
    SELECT 1 FROM ai_agent_variables v 
    WHERE v.key = 'data.status_cliente' AND v.ai_agent_config_id = c.id
);

INSERT INTO ai_agent_variables (ai_agent_config_id, owner_id, name, key, data_type, description, is_system_variable, default_value)
SELECT 
    c.id,
    c.owner_id,
    'Pipeline do Cliente',
    'data.pipeline_cliente',
    'string',
    'Pipeline ou funil de vendas do cliente',
    true,
    ''
FROM ai_agent_configs c
WHERE NOT EXISTS (
    SELECT 1 FROM ai_agent_variables v 
    WHERE v.key = 'data.pipeline_cliente' AND v.ai_agent_config_id = c.id
);

INSERT INTO ai_agent_variables (ai_agent_config_id, owner_id, name, key, data_type, description, is_system_variable, default_value)
SELECT 
    c.id,
    c.owner_id,
    'Gênero do Cliente',
    'data.genero_cliente',
    'select',
    'Gênero do cliente',
    true,
    ''
FROM ai_agent_configs c
WHERE NOT EXISTS (
    SELECT 1 FROM ai_agent_variables v 
    WHERE v.key = 'data.genero_cliente' AND v.ai_agent_config_id = c.id
);

INSERT INTO ai_agent_variables (ai_agent_config_id, owner_id, name, key, data_type, description, is_system_variable, default_value, options)
SELECT 
    c.id,
    c.owner_id,
    'Gênero do Cliente',
    'data.genero_cliente',
    'select',
    'Gênero do cliente',
    true,
    '',
    '["Masculino", "Feminino", "Outro", "Prefiro não informar"]'::jsonb
FROM ai_agent_configs c
WHERE NOT EXISTS (
    SELECT 1 FROM ai_agent_variables v 
    WHERE v.key = 'data.genero_cliente' AND v.ai_agent_config_id = c.id
);

INSERT INTO ai_agent_variables (ai_agent_config_id, owner_id, name, key, data_type, description, is_system_variable, default_value)
SELECT 
    c.id,
    c.owner_id,
    'Opt-in WhatsApp',
    'data.whatsapp_optin',
    'boolean',
    'Cliente optou por receber mensagens via WhatsApp',
    true,
    'true'
FROM ai_agent_configs c
WHERE NOT EXISTS (
    SELECT 1 FROM ai_agent_variables v 
    WHERE v.key = 'data.whatsapp_optin' AND v.ai_agent_config_id = c.id
);

INSERT INTO ai_agent_variables (ai_agent_config_id, owner_id, name, key, data_type, description, is_system_variable, default_value)
SELECT 
    c.id,
    c.owner_id,
    'Data de Criação',
    'data.data_criacao',
    'date',
    'Data de criação do contato',
    true,
    ''
FROM ai_agent_configs c
WHERE NOT EXISTS (
    SELECT 1 FROM ai_agent_variables v 
    WHERE v.key = 'data.data_criacao' AND v.ai_agent_config_id = c.id
);

INSERT INTO ai_agent_variables (ai_agent_config_id, owner_id, name, key, data_type, description, is_system_variable, default_value)
SELECT 
    c.id,
    c.owner_id,
    'Último Contato',
    'data.ultimo_contato',
    'date',
    'Data do último contato com o cliente',
    true,
    ''
FROM ai_agent_configs c
WHERE NOT EXISTS (
    SELECT 1 FROM ai_agent_variables v 
    WHERE v.key = 'data.ultimo_contato' AND v.ai_agent_config_id = c.id
);

INSERT INTO ai_agent_variables (ai_agent_config_id, owner_id, name, key, data_type, description, is_system_variable, default_value)
SELECT 
    c.id,
    c.owner_id,
    'Tags do Cliente',
    'data.tags_cliente',
    'json',
    'Tags associadas ao cliente',
    true,
    '[]'
FROM ai_agent_configs c
WHERE NOT EXISTS (
    SELECT 1 FROM ai_agent_variables v 
    WHERE v.key = 'data.tags_cliente' AND v.ai_agent_config_id = c.id
);

-- Variáveis do sistema
INSERT INTO ai_agent_variables (ai_agent_config_id, owner_id, name, key, data_type, description, is_system_variable, default_value)
SELECT 
    c.id,
    c.owner_id,
    'ID do Chat',
    'system.chat.id',
    'string',
    'ID único da conversa',
    true,
    ''
FROM ai_agent_configs c
WHERE NOT EXISTS (
    SELECT 1 FROM ai_agent_variables v 
    WHERE v.key = 'system.chat.id' AND v.ai_agent_config_id = c.id
);

INSERT INTO ai_agent_variables (ai_agent_config_id, owner_id, name, key, data_type, description, is_system_variable, default_value)
SELECT 
    c.id,
    c.owner_id,
    'ID do Contato',
    'system.contact.id',
    'string',
    'ID único do contato',
    true,
    ''
FROM ai_agent_configs c
WHERE NOT EXISTS (
    SELECT 1 FROM ai_agent_variables v 
    WHERE v.key = 'system.contact.id' AND v.ai_agent_config_id = c.id
);

INSERT INTO ai_agent_variables (ai_agent_config_id, owner_id, name, key, data_type, description, is_system_variable, default_value)
SELECT 
    c.id,
    c.owner_id,
    'Ação Google Calendar',
    'action.googleCalendar.email',
    'email',
    'Email para ações do Google Calendar',
    true,
    ''
FROM ai_agent_configs c
WHERE NOT EXISTS (
    SELECT 1 FROM ai_agent_variables v 
    WHERE v.key = 'action.googleCalendar.email' AND v.ai_agent_config_id = c.id
);