-- ===========================================
-- VERIFICAR E CORRIGIR PROBLEMA DA API_KEY
-- ===========================================

-- 1. Verificar se a tabela ai_agent_configs existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'ai_agent_configs'
) as table_exists;

-- 2. Verificar todas as colunas da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'ai_agent_configs'
ORDER BY ordinal_position;

-- 3. Adicionar colunas se não existirem
ALTER TABLE ai_agent_configs 
ADD COLUMN IF NOT EXISTS api_key TEXT,
ADD COLUMN IF NOT EXISTS selected_model TEXT DEFAULT 'gpt-4o-mini';

-- 4. Verificar se as colunas foram criadas
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'ai_agent_configs'
  AND column_name IN ('api_key', 'selected_model')
ORDER BY column_name;

-- 5. Verificar dados existentes
SELECT 
  id,
  owner_id,
  name,
  api_key,
  selected_model,
  is_active,
  created_at
FROM ai_agent_configs
ORDER BY created_at DESC
LIMIT 5;

-- 6. Testar inserção de dados
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
  is_active
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Teste API Key',
  'Teste',
  'Teste',
  'active',
  'friendly',
  'pt-BR',
  500,
  'sk-test123456789',
  'gpt-4o-mini',
  true
) ON CONFLICT (owner_id, is_company_wide) DO UPDATE SET
  api_key = EXCLUDED.api_key,
  selected_model = EXCLUDED.selected_model,
  updated_at = NOW();

-- 7. Verificar se os dados foram inseridos
SELECT 
  id,
  owner_id,
  name,
  api_key,
  selected_model,
  is_active,
  created_at
FROM ai_agent_configs
WHERE owner_id = '11111111-1111-1111-1111-111111111111'
ORDER BY created_at DESC;

-- 8. Limpar dados de teste
DELETE FROM ai_agent_configs 
WHERE owner_id = '11111111-1111-1111-1111-111111111111';

-- ✅ Script executado!
