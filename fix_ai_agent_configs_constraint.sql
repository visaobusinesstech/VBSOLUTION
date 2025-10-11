-- Script para corrigir erro de constraint na tabela ai_agent_configs
-- Erro: "there is no unique or exclusion constraint matching the ON CONFLICT specification"

-- 1. Verificar se a tabela existe e sua estrutura
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'ai_agent_configs' 
ORDER BY ordinal_position;

-- 2. Verificar constraints existentes
SELECT constraint_name, constraint_type, table_name
FROM information_schema.table_constraints 
WHERE table_name = 'ai_agent_configs';

-- 3. Se a tabela não existir, criá-la
CREATE TABLE IF NOT EXISTS ai_agent_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
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

-- 4. Criar índice único para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS ai_agent_configs_owner_unique 
ON ai_agent_configs (owner_id) 
WHERE is_company_wide = false AND is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS ai_agent_configs_company_unique 
ON ai_agent_configs (company_id) 
WHERE is_company_wide = true AND is_active = true;

-- 5. Habilitar RLS
ALTER TABLE ai_agent_configs ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS
DROP POLICY IF EXISTS "Users can view their own AI configs" ON ai_agent_configs;
CREATE POLICY "Users can view their own AI configs" ON ai_agent_configs
    FOR SELECT USING (
        owner_id = auth.uid() OR 
        (is_company_wide = true AND company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS "Users can insert their own AI configs" ON ai_agent_configs;
CREATE POLICY "Users can insert their own AI configs" ON ai_agent_configs
    FOR INSERT WITH CHECK (
        owner_id = auth.uid() AND 
        (is_company_wide = false OR company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS "Users can update their own AI configs" ON ai_agent_configs;
CREATE POLICY "Users can update their own AI configs" ON ai_agent_configs
    FOR UPDATE USING (
        owner_id = auth.uid() OR 
        (is_company_wide = true AND company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS "Users can delete their own AI configs" ON ai_agent_configs;
CREATE POLICY "Users can delete their own AI configs" ON ai_agent_configs
    FOR DELETE USING (owner_id = auth.uid());

-- 7. Criar função para upsert (insert ou update)
CREATE OR REPLACE FUNCTION upsert_ai_agent_config(
    p_owner_id UUID,
    p_company_id UUID DEFAULT NULL,
    p_name VARCHAR DEFAULT 'Agente IA',
    p_description TEXT DEFAULT NULL,
    p_personality TEXT DEFAULT NULL,
    p_tone VARCHAR DEFAULT 'profissional',
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
    -- Tentar atualizar primeiro
    UPDATE ai_agent_configs 
    SET 
        name = p_name,
        description = p_description,
        personality = p_personality,
        tone = p_tone,
        language = p_language,
        api_key = p_api_key,
        model = p_model,
        temperature = p_temperature,
        max_tokens = p_max_tokens,
        is_active = p_is_active,
        is_company_wide = p_is_company_wide,
        updated_at = NOW()
    WHERE 
        (p_is_company_wide = false AND owner_id = p_owner_id) OR
        (p_is_company_wide = true AND company_id = p_company_id)
    RETURNING id INTO config_id;
    
    -- Se não atualizou, inserir novo
    IF config_id IS NULL THEN
        INSERT INTO ai_agent_configs (
            owner_id, company_id, name, description, personality, tone, 
            language, api_key, model, temperature, max_tokens, 
            is_active, is_company_wide
        ) VALUES (
            p_owner_id, p_company_id, p_name, p_description, p_personality, p_tone,
            p_language, p_api_key, p_model, p_temperature, p_max_tokens,
            p_is_active, p_is_company_wide
        ) RETURNING id INTO config_id;
    END IF;
    
    RETURN config_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Inserir configuração padrão para teste
INSERT INTO ai_agent_configs (
    owner_id, 
    name, 
    description, 
    personality, 
    tone, 
    language, 
    model, 
    temperature, 
    max_tokens, 
    is_active, 
    is_company_wide
) VALUES (
    '905b926a-785a-4f6d-9c3a-9455729500b3', -- User ID do teste
    'Agente IA Padrão',
    'Agente virtual inteligente para atendimento',
    'Você é um assistente virtual profissional e prestativo.',
    'profissional',
    'pt-BR',
    'gpt-3.5-turbo',
    0.7,
    1000,
    true,
    false
) ON CONFLICT DO NOTHING;

-- 9. Verificar se tudo foi criado corretamente
SELECT 'Tabela ai_agent_configs criada com sucesso!' as status;
SELECT COUNT(*) as total_configs FROM ai_agent_configs;
