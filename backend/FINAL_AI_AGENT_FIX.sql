-- SCRIPT FINAL PARA CORRIGIR AI AGENT
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se as colunas existem
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'ai_agent_configs'
AND column_name IN ('api_key', 'selected_model')
ORDER BY ordinal_position;

-- 2. Adicionar colunas se não existirem
ALTER TABLE ai_agent_configs
ADD COLUMN IF NOT EXISTS api_key TEXT,
ADD COLUMN IF NOT EXISTS selected_model TEXT DEFAULT 'gpt-4o-mini';

-- 3. Verificar se foram adicionadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'ai_agent_configs'
AND column_name IN ('api_key', 'selected_model')
ORDER BY ordinal_position;

-- 4. Verificar dados existentes
SELECT id, name, api_key, selected_model, created_at, updated_at
FROM ai_agent_configs
ORDER BY created_at DESC
LIMIT 5;
