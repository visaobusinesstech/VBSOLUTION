-- Script de teste para verificar se a API key está sendo salva corretamente
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se as colunas existem
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'ai_agent_configs' 
AND table_schema = 'public'
AND column_name IN ('api_key', 'selected_model', 'creativity_temperature', 'max_tokens', 'is_connected', 'is_company_wide', 'is_active', 'created_at', 'updated_at')
ORDER BY column_name;

-- 2. Verificar dados atuais na tabela
SELECT 
    id,
    owner_id,
    name,
    api_key,
    selected_model,
    creativity_temperature,
    max_tokens,
    is_connected,
    is_company_wide,
    is_active,
    created_at,
    updated_at
FROM ai_agent_configs 
ORDER BY updated_at DESC 
LIMIT 5;

-- 3. Teste de inserção de uma API key
INSERT INTO ai_agent_configs (
    owner_id,
    name,
    function,
    personality,
    api_key,
    selected_model,
    creativity_temperature,
    max_tokens,
    is_connected,
    is_company_wide,
    is_active
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- Substitua por um owner_id real do seu sistema
    'Teste API Key',
    'Função de teste',
    'Personalidade de teste',
    'sk-test123456789abcdef',
    'gpt-4o-mini',
    0.7,
    1000,
    true,
    false,
    true
) RETURNING id, api_key, selected_model, created_at;

-- 4. Verificar se a inserção funcionou
SELECT 
    id,
    name,
    api_key,
    selected_model,
    created_at
FROM ai_agent_configs 
WHERE name = 'Teste API Key'
ORDER BY created_at DESC 
LIMIT 1;

-- 5. Teste de atualização da API key
UPDATE ai_agent_configs 
SET 
    api_key = 'sk-updated123456789',
    selected_model = 'gpt-4',
    updated_at = NOW()
WHERE name = 'Teste API Key'
RETURNING id, api_key, selected_model, updated_at;

-- 6. Verificar se a atualização funcionou
SELECT 
    id,
    name,
    api_key,
    selected_model,
    updated_at
FROM ai_agent_configs 
WHERE name = 'Teste API Key'
ORDER BY updated_at DESC 
LIMIT 1;

-- 7. Limpar dados de teste (opcional)
-- DELETE FROM ai_agent_configs WHERE name = 'Teste API Key';
