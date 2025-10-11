-- Migração inicial para ai_agent_configs
-- Execute este arquivo ANTES do complete_migration_fixed.sql se a tabela não existir

-- Tabela principal de configurações do AI Agent
CREATE TABLE IF NOT EXISTS ai_agent_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Informações básicas
    name VARCHAR(255) NOT NULL,
    description TEXT,
    personality TEXT,
    
    -- Configurações da API
    openai_api_key TEXT,
    selected_model VARCHAR(100) DEFAULT 'gpt-3.5-turbo',
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    
    -- Configurações do sistema
    chunking_config JSONB DEFAULT '{
        "enabled": true,
        "max_chunk_size": 200,
        "debounce_time": 30000,
        "delay_between_chunks": 1000
    }'::jsonb,
    
    integration_config JSONB DEFAULT '{}'::jsonb,
    variables_config JSONB DEFAULT '{}'::jsonb,
    actions_config JSONB DEFAULT '{}'::jsonb,
    test_config JSONB DEFAULT '{
        "enabled": true,
        "max_test_messages": 50,
        "test_timeout": 30000
    }'::jsonb,
    
    -- Métricas e status
    usage_metrics JSONB DEFAULT '{
        "total_messages": 0,
        "total_tokens_used": 0,
        "last_used_at": null,
        "average_response_time": 0
    }'::jsonb,
    
    validation_status VARCHAR(50) DEFAULT 'pending',
    validation_message TEXT,
    
    security_config JSONB DEFAULT '{
        "rate_limiting": {
            "enabled": true,
            "max_requests_per_minute": 60
        },
        "content_filtering": {
            "enabled": true,
            "blocked_keywords": []
        }
    }'::jsonb,
    
    -- Status e controle
    is_active BOOLEAN DEFAULT true,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_agent_configs_owner_id ON ai_agent_configs(owner_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_configs_selected_model ON ai_agent_configs(selected_model);
CREATE INDEX IF NOT EXISTS idx_ai_agent_configs_validation_status ON ai_agent_configs(validation_status);
CREATE INDEX IF NOT EXISTS idx_ai_agent_configs_is_active ON ai_agent_configs(is_active);

-- RLS (Row Level Security)
ALTER TABLE ai_agent_configs ENABLE ROW LEVEL SECURITY;

-- Políticas para ai_agent_configs
CREATE POLICY "Users can view their own ai_agent_configs" ON ai_agent_configs
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own ai_agent_configs" ON ai_agent_configs
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own ai_agent_configs" ON ai_agent_configs
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own ai_agent_configs" ON ai_agent_configs
    FOR DELETE USING (auth.uid() = owner_id);

-- Triggers para ai_agent_configs
CREATE TRIGGER trigger_ai_agent_configs_updated_at
    BEFORE UPDATE ON ai_agent_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_ai_agent_configs_created_by
    BEFORE INSERT ON ai_agent_configs
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by_column();

-- Função para validar configuração do AI Agent
CREATE OR REPLACE FUNCTION validate_ai_agent_config(p_config_id UUID)
RETURNS JSONB AS $$
DECLARE
    config_record RECORD;
    validation_result JSONB;
    errors TEXT[] := '{}';
    warnings TEXT[] := '{}';
BEGIN
    -- Buscar configuração
    SELECT * INTO config_record
    FROM ai_agent_configs
    WHERE id = p_config_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'valid', false,
            'errors', ARRAY['Configuração não encontrada'],
            'warnings', ARRAY[]::TEXT[]
        );
    END IF;
    
    -- Validar API Key
    IF config_record.openai_api_key IS NULL OR config_record.openai_api_key = '' THEN
        errors := array_append(errors, 'API Key do OpenAI é obrigatória');
    ELSIF NOT (config_record.openai_api_key ~ '^sk-[a-zA-Z0-9]{48}$') THEN
        errors := array_append(errors, 'Formato da API Key do OpenAI inválido');
    END IF;
    
    -- Validar modelo selecionado
    IF config_record.selected_model IS NULL OR config_record.selected_model = '' THEN
        errors := array_append(errors, 'Modelo selecionado é obrigatório');
    END IF;
    
    -- Validar temperatura
    IF config_record.temperature IS NULL OR config_record.temperature < 0 OR config_record.temperature > 2 THEN
        errors := array_append(errors, 'Temperatura deve estar entre 0 e 2');
    END IF;
    
    -- Validar máximo de tokens
    IF config_record.max_tokens IS NULL OR config_record.max_tokens < 1 OR config_record.max_tokens > 4000 THEN
        errors := array_append(errors, 'Máximo de tokens deve estar entre 1 e 4000');
    END IF;
    
    -- Warnings
    IF config_record.temperature > 1.5 THEN
        warnings := array_append(warnings, 'Temperatura alta pode gerar respostas inconsistentes');
    END IF;
    
    IF config_record.max_tokens > 2000 THEN
        warnings := array_append(warnings, 'Máximo de tokens alto pode aumentar custos');
    END IF;
    
    -- Construir resultado
    validation_result := jsonb_build_object(
        'valid', array_length(errors, 1) IS NULL,
        'errors', errors,
        'warnings', warnings,
        'validated_at', NOW()
    );
    
    -- Atualizar status de validação
    UPDATE ai_agent_configs
    SET 
        validation_status = CASE WHEN array_length(errors, 1) IS NULL THEN 'valid' ELSE 'invalid' END,
        validation_message = CASE 
            WHEN array_length(errors, 1) IS NULL THEN 'Configuração válida'
            ELSE array_to_string(errors, '; ')
        END
    WHERE id = p_config_id;
    
    RETURN validation_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar métricas de uso
CREATE OR REPLACE FUNCTION update_ai_agent_usage_metrics(
    p_config_id UUID,
    p_tokens_used INTEGER,
    p_response_time INTEGER
)
RETURNS VOID AS $$
DECLARE
    current_metrics JSONB;
    new_total_messages INTEGER;
    new_total_tokens INTEGER;
    new_avg_time INTEGER;
BEGIN
    -- Buscar métricas atuais
    SELECT usage_metrics INTO current_metrics
    FROM ai_agent_configs
    WHERE id = p_config_id;
    
    -- Calcular novas métricas
    new_total_messages := COALESCE((current_metrics->>'total_messages')::INTEGER, 0) + 1;
    new_total_tokens := COALESCE((current_metrics->>'total_tokens_used')::INTEGER, 0) + p_tokens_used;
    new_avg_time := COALESCE((current_metrics->>'average_response_time')::INTEGER, 0);
    new_avg_time := (new_avg_time * (new_total_messages - 1) + p_response_time) / new_total_messages;
    
    -- Atualizar métricas
    UPDATE ai_agent_configs
    SET usage_metrics = jsonb_build_object(
        'total_messages', new_total_messages,
        'total_tokens_used', new_total_tokens,
        'last_used_at', NOW(),
        'average_response_time', new_avg_time
    )
    WHERE id = p_config_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON TABLE ai_agent_configs IS 'Tabela principal de configurações do AI Agent';
COMMENT ON COLUMN ai_agent_configs.openai_api_key IS 'Chave da API do OpenAI para autenticação';
COMMENT ON COLUMN ai_agent_configs.selected_model IS 'Modelo de IA selecionado (gpt-3.5-turbo, gpt-4, etc.)';
COMMENT ON COLUMN ai_agent_configs.temperature IS 'Temperatura para controle de criatividade (0-2)';
COMMENT ON COLUMN ai_agent_configs.max_tokens IS 'Número máximo de tokens por resposta';
COMMENT ON COLUMN ai_agent_configs.chunking_config IS 'Configurações do sistema de chunking Redis/BullMQ';
COMMENT ON COLUMN ai_agent_configs.integration_config IS 'Configurações de integrações externas';
COMMENT ON COLUMN ai_agent_configs.variables_config IS 'Configurações de variáveis do sistema';
COMMENT ON COLUMN ai_agent_configs.actions_config IS 'Configurações de ações do agente';
COMMENT ON COLUMN ai_agent_configs.test_config IS 'Configurações para teste do agente';
COMMENT ON COLUMN ai_agent_configs.usage_metrics IS 'Métricas de uso do agente';
COMMENT ON COLUMN ai_agent_configs.validation_status IS 'Status de validação da configuração';
COMMENT ON COLUMN ai_agent_configs.validation_message IS 'Mensagem de validação';
COMMENT ON COLUMN ai_agent_configs.security_config IS 'Configurações de segurança do agente';
