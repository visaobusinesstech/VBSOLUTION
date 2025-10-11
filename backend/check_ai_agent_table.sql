-- ===========================================
-- VERIFICAR ESTRUTURA DA TABELA AI_AGENT_CONFIGS
-- ===========================================

-- Verificar se a tabela existe
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'ai_agent_configs';

-- Verificar colunas da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'ai_agent_configs'
ORDER BY ordinal_position;

-- Verificar constraints da tabela
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'ai_agent_configs'
ORDER BY tc.constraint_name;

-- Verificar dados existentes
SELECT 
  id,
  owner_id,
  name,
  api_key,
  selected_model,
  is_active,
  created_at,
  updated_at
FROM ai_agent_configs
ORDER BY created_at DESC
LIMIT 5;

-- Verificar se há registros com API key
SELECT 
  COUNT(*) as total_records,
  COUNT(api_key) as records_with_api_key,
  COUNT(CASE WHEN api_key IS NOT NULL AND api_key != '' THEN 1 END) as non_empty_api_keys
FROM ai_agent_configs;
