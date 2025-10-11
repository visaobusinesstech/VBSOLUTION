-- Script simplificado para corrigir a configuração da IA
-- Execute este script no Supabase SQL Editor

-- 1. Dropar a tabela se existir (para recriar do zero)
DROP TABLE IF EXISTS ai_agent_configs CASCADE;

-- 2. Criar tabela ai_agent_configs
CREATE TABLE ai_agent_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID,
    name VARCHAR(255) NOT NULL DEFAULT 'Configuração IA',
    description TEXT,
    personality TEXT,
    tone VARCHAR(100),
    language VARCHAR(10) DEFAULT 'pt-BR',
    api_key TEXT,
    model VARCHAR(100) DEFAULT 'gpt-3.5-turbo',
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT true,
    is_company_wide BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar índices únicos
CREATE UNIQUE INDEX ai_agent_configs_owner_unique ON ai_agent_configs(owner_id) WHERE is_company_wide = false;
CREATE UNIQUE INDEX ai_agent_configs_company_unique ON ai_agent_configs(company_id) WHERE is_company_wide = true AND company_id IS NOT NULL;

-- 4. Criar função para upsert
CREATE OR REPLACE FUNCTION upsert_ai_agent_config(
    p_owner_id UUID,
    p_company_id UUID DEFAULT NULL,
    p_name VARCHAR DEFAULT 'Configuração IA',
    p_description TEXT DEFAULT NULL,
    p_personality TEXT DEFAULT NULL,
    p_tone VARCHAR DEFAULT NULL,
    p_language VARCHAR DEFAULT 'pt-BR',
    p_api_key TEXT DEFAULT NULL,
    p_model VARCHAR DEFAULT 'gpt-3.5-turbo',
    p_temperature DECIMAL DEFAULT 0.7,
    p_max_tokens INTEGER DEFAULT 1000,
    p_is_active BOOLEAN DEFAULT true,
    p_is_company_wide BOOLEAN DEFAULT false
) RETURNS UUID AS $$
DECLARE
    config_id UUID;
BEGIN
    -- Tentar inserir ou atualizar
    INSERT INTO ai_agent_configs (
        owner_id, company_id, name, description, personality, tone, language,
        api_key, model, temperature, max_tokens, is_active, is_company_wide
    ) VALUES (
        p_owner_id, p_company_id, p_name, p_description, p_personality, p_tone, p_language,
        p_api_key, p_model, p_temperature, p_max_tokens, p_is_active, p_is_company_wide
    )
    ON CONFLICT (owner_id) WHERE is_company_wide = false
    DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        personality = EXCLUDED.personality,
        tone = EXCLUDED.tone,
        language = EXCLUDED.language,
        api_key = EXCLUDED.api_key,
        model = EXCLUDED.model,
        temperature = EXCLUDED.temperature,
        max_tokens = EXCLUDED.max_tokens,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    RETURNING id INTO config_id;

    RETURN config_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Habilitar RLS
ALTER TABLE ai_agent_configs ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS
CREATE POLICY "Users can view their own AI configs" ON ai_agent_configs
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own AI configs" ON ai_agent_configs
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own AI configs" ON ai_agent_configs
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own AI configs" ON ai_agent_configs
    FOR DELETE USING (auth.uid() = owner_id);

-- 7. Inserir configuração padrão para o usuário
INSERT INTO ai_agent_configs (
    owner_id, 
    name, 
    description, 
    personality, 
    tone, 
    language, 
    api_key, 
    model, 
    temperature, 
    max_tokens, 
    is_active, 
    is_company_wide
) VALUES (
    '905b926a-785a-4f6d-9c3a-9455729500b3',
    'Configuração IA Padrão',
    'Configuração padrão do agente IA',
    'Você é um assistente virtual amigável e prestativo.',
    'Profissional',
    'pt-BR',
    NULL,
    'gpt-3.5-turbo',
    0.7,
    1000,
    true,
    false
);

-- 8. Verificar se foi criado
SELECT * FROM ai_agent_configs WHERE owner_id = '905b926a-785a-4f6d-9c3a-9455729500b3';
