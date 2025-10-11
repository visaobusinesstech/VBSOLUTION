-- Script simplificado para criar a tabela ai_agent_configs e corrigir o erro de constraint

-- 1. Criar tabela ai_agent_configs se não existir
CREATE TABLE IF NOT EXISTS ai_agent_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID,
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

-- 2. Criar índices únicos para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS ai_agent_configs_owner_unique 
ON ai_agent_configs (owner_id) 
WHERE is_company_wide = false AND is_active = true;

-- 3. Habilitar RLS
ALTER TABLE ai_agent_configs ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS básicas
DROP POLICY IF EXISTS "Users can view their own AI configs" ON ai_agent_configs;
CREATE POLICY "Users can view their own AI configs" ON ai_agent_configs
    FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own AI configs" ON ai_agent_configs;
CREATE POLICY "Users can insert their own AI configs" ON ai_agent_configs
    FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own AI configs" ON ai_agent_configs;
CREATE POLICY "Users can update their own AI configs" ON ai_agent_configs
    FOR UPDATE USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own AI configs" ON ai_agent_configs;
CREATE POLICY "Users can delete their own AI configs" ON ai_agent_configs
    FOR DELETE USING (owner_id = auth.uid());

-- 5. Inserir configuração padrão para o usuário de teste
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
) ON CONFLICT (owner_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    personality = EXCLUDED.personality,
    tone = EXCLUDED.tone,
    updated_at = NOW();

-- 6. Verificar se tudo foi criado corretamente
SELECT 'Tabela ai_agent_configs criada com sucesso!' as status;
SELECT COUNT(*) as total_configs FROM ai_agent_configs;
