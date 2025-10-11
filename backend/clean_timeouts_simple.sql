-- Script simples para limpar configurações de timeout desnecessárias
-- Executar diretamente no Supabase SQL Editor

-- 1. Atualizar todas as configurações para remover valores problemáticos
UPDATE ai_agent_configs 
SET 
    message_debounce_time_ms = NULL,
    message_chunk_delay_ms = NULL,
    message_min_delay_ms = NULL,
    message_max_delay_ms = NULL,
    updated_at = NOW()
WHERE 
    message_debounce_time_ms IS NOT NULL 
    OR message_chunk_delay_ms IS NOT NULL 
    OR message_min_delay_ms IS NOT NULL 
    OR message_max_delay_ms IS NOT NULL;

-- 2. Verificar quantas configurações foram limpas
SELECT COUNT(*) as configs_cleaned FROM ai_agent_configs 
WHERE message_debounce_time_ms IS NULL 
  AND message_chunk_delay_ms IS NULL 
  AND message_min_delay_ms IS NULL 
  AND message_max_delay_ms IS NULL;

-- 3. Mostrar configurações restantes (se houver)
SELECT id, name, created_at FROM ai_agent_configs 
ORDER BY created_at DESC 
LIMIT 5;
