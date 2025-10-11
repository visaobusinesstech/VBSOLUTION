-- Script FINAL para corrigir os constraints da tabela ai_agent_configs
-- Execute este script no Supabase SQL Editor

-- 1. Primeiro, vamos ver o estado atual da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ai_agent_configs' 
ORDER BY ordinal_position;

-- 2. Verificar índices existentes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'ai_agent_configs';

-- 3. Dropar TODOS os índices únicos existentes
DROP INDEX IF EXISTS ai_agent_configs_owner_unique;
DROP INDEX IF EXISTS ai_agent_configs_company_unique;
DROP INDEX IF EXISTS ai_agent_configs_personal_unique;
DROP INDEX IF EXISTS ai_agent_configs_company_unique;

-- 4. Criar índice único SIMPLES para owner_id (configurações pessoais)
-- Isso vai permitir apenas uma configuração pessoal por usuário
CREATE UNIQUE INDEX ai_agent_configs_owner_unique 
ON ai_agent_configs(owner_id);

-- 5. Criar índice para company_id (para busca rápida)
CREATE INDEX IF NOT EXISTS ai_agent_configs_company_idx 
ON ai_agent_configs(company_id);

-- 6. Verificar os novos índices
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'ai_agent_configs'
ORDER BY indexname;

-- 7. Testar inserção
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
    '905b926a-785a-4f6d-9c3a-9455729500b3',
    'Configuração Teste Final',
    'Teste final da configuração',
    'Personalidade de teste',
    'Profissional',
    'pt-BR',
    'gpt-3.5-turbo',
    0.7,
    1000,
    true,
    false
) ON CONFLICT (owner_id) 
DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    personality = EXCLUDED.personality,
    tone = EXCLUDED.tone,
    language = EXCLUDED.language,
    model = EXCLUDED.model,
    temperature = EXCLUDED.temperature,
    max_tokens = EXCLUDED.max_tokens,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 8. Verificar se funcionou
SELECT * FROM ai_agent_configs 
WHERE owner_id = '905b926a-785a-4f6d-9c3a-9455729500b3';
