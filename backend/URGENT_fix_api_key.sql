-- URGENTE: Execute este script no Supabase SQL Editor AGORA
-- Este script vai corrigir definitivamente o problema da API key

-- 1. Verificar se as colunas existem
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ai_agent_configs' 
AND column_name IN ('api_key', 'selected_model')
ORDER BY column_name;

-- 2. Adicionar as colunas se não existirem
ALTER TABLE ai_agent_configs 
ADD COLUMN IF NOT EXISTS api_key TEXT,
ADD COLUMN IF NOT EXISTS selected_model TEXT DEFAULT 'gpt-4o-mini';

-- 3. Verificar se foram adicionadas
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'ai_agent_configs' 
AND column_name IN ('api_key', 'selected_model')
ORDER BY column_name;

-- 4. Mostrar dados atuais
SELECT id, name, api_key, selected_model, created_at, updated_at
FROM ai_agent_configs 
ORDER BY updated_at DESC 
LIMIT 3;
