-- Script para verificar e corrigir colunas da API Key na tabela ai_agent_configs

-- Verificar se as colunas existem
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'ai_agent_configs' 
AND column_name IN ('api_key', 'selected_model', 'creativity_temperature', 'max_tokens')
ORDER BY column_name;

-- Adicionar colunas se não existirem
ALTER TABLE ai_agent_configs 
ADD COLUMN IF NOT EXISTS api_key TEXT,
ADD COLUMN IF NOT EXISTS selected_model TEXT DEFAULT 'gpt-4o-mini',
ADD COLUMN IF NOT EXISTS creativity_temperature DECIMAL(3,2) DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 1000;

-- Verificar novamente após adicionar
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'ai_agent_configs' 
AND column_name IN ('api_key', 'selected_model', 'creativity_temperature', 'max_tokens')
ORDER BY column_name;

-- Mostrar uma amostra dos dados atuais
SELECT id, owner_id, name, api_key, selected_model, creativity_temperature, max_tokens, created_at, updated_at
FROM ai_agent_configs 
ORDER BY updated_at DESC 
LIMIT 5;
