-- Script de teste para verificar se a API key está sendo salva
-- Execute este script no Supabase para testar

-- 1. Verificar se as colunas existem
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'ai_agent_configs'
AND column_name IN ('api_key', 'selected_model')
ORDER BY ordinal_position;

-- 2. Inserir um registro de teste com API key
INSERT INTO ai_agent_configs (
  owner_id,
  name,
  function,
  personality,
  status,
  response_style,
  language,
  max_response_length,
  api_key,
  selected_model,
  is_connected,
  is_company_wide,
  is_active,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- ID de teste
  'Teste API Key',
  'Teste de função',
  'Personalidade de teste',
  'active',
  'friendly',
  'pt-BR',
  500,
  'sk-test123456789', -- API key de teste
  'gpt-4o-mini',
  true,
  false,
  true,
  NOW(),
  NOW()
);

-- 3. Verificar se o registro foi inserido
SELECT id, name, api_key, selected_model, created_at
FROM ai_agent_configs
WHERE name = 'Teste API Key'
ORDER BY created_at DESC
LIMIT 1;

-- 4. Limpar o registro de teste
DELETE FROM ai_agent_configs
WHERE name = 'Teste API Key';
