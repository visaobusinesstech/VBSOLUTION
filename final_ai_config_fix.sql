-- Script FINAL para corrigir definitivamente a tabela ai_agent_configs
-- Execute este script no Supabase SQL Editor

-- 1. Remover TODOS os índices únicos existentes
DROP INDEX IF EXISTS ai_agent_configs_owner_unique;
DROP INDEX IF EXISTS ai_agent_configs_company_unique;
DROP INDEX IF EXISTS ai_agent_configs_personal_unique;
DROP INDEX IF EXISTS ai_agent_configs_company_unique;

-- 2. Criar índice único simples para owner_id
-- Isso permite apenas uma configuração por usuário (pessoal ou da empresa)
CREATE UNIQUE INDEX ai_agent_configs_owner_unique 
ON ai_agent_configs(owner_id);

-- 3. Criar índice para company_id (para busca rápida)
CREATE INDEX IF NOT EXISTS ai_agent_configs_company_idx 
ON ai_agent_configs(company_id);

-- 4. Verificar os índices criados
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'ai_agent_configs'
ORDER BY indexname;

-- 5. Testar o upsert que o frontend usa
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
    'Configuração Final Teste',
    'Teste final da configuração',
    'Personalidade final',
    'Profissional',
    'pt-BR',
    'gpt-4',
    0.8,
    1500,
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

-- 6. Verificar se funcionou
SELECT * FROM ai_agent_configs 
WHERE owner_id = '905b926a-785a-4f6d-9c3a-9455729500b3';

-- 7. Mensagem de sucesso
SELECT 'Configuração da IA corrigida com sucesso! O frontend agora pode salvar sem erros.' as status;
