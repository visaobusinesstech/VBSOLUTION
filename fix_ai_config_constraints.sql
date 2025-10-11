-- Script para corrigir os constraints da tabela ai_agent_configs
-- Execute este script no Supabase SQL Editor

-- 1. Remover índices únicos existentes
DROP INDEX IF EXISTS ai_agent_configs_owner_unique;
DROP INDEX IF EXISTS ai_agent_configs_company_unique;

-- 2. Criar novo índice único composto para configurações pessoais
-- (owner_id + is_company_wide=false deve ser único)
CREATE UNIQUE INDEX ai_agent_configs_personal_unique 
ON ai_agent_configs(owner_id) 
WHERE is_company_wide = false;

-- 3. Criar novo índice único composto para configurações da empresa
-- (company_id + is_company_wide=true deve ser único)
CREATE UNIQUE INDEX ai_agent_configs_company_unique 
ON ai_agent_configs(company_id) 
WHERE is_company_wide = true AND company_id IS NOT NULL;

-- 4. Criar índice para busca rápida por owner_id
CREATE INDEX IF NOT EXISTS ai_agent_configs_owner_idx 
ON ai_agent_configs(owner_id);

-- 5. Criar índice para busca rápida por company_id
CREATE INDEX IF NOT EXISTS ai_agent_configs_company_idx 
ON ai_agent_configs(company_id);

-- 6. Verificar os índices criados
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'ai_agent_configs'
ORDER BY indexname;
