-- Script para corrigir configurações que podem estar causando TimeoutOverflowWarning
-- O problema ocorre quando valores em segundos são multiplicados por 1000 incorretamente

-- 1. Verificar configurações atuais que podem estar causando o problema
SELECT 
    owner_id,
    name,
    message_debounce_time_ms,
    message_chunk_delay_ms,
    message_min_delay_ms,
    message_max_delay_ms
FROM ai_agent_configs 
WHERE message_debounce_time_ms > 2147483647  -- 2^31 - 1 (máximo seguro para setTimeout)
   OR message_debounce_time_ms < 0
   OR message_chunk_delay_ms > 2147483647
   OR message_chunk_delay_ms < 0
   OR message_min_delay_ms > 2147483647
   OR message_min_delay_ms < 0
   OR message_max_delay_ms > 2147483647
   OR message_max_delay_ms < 0;

-- 2. Corrigir valores inválidos
UPDATE ai_agent_configs 
SET 
    message_debounce_time_ms = CASE 
        WHEN message_debounce_time_ms > 2147483647 THEN 30000  -- 30 segundos em ms
        WHEN message_debounce_time_ms < 0 THEN 30000
        ELSE message_debounce_time_ms
    END,
    message_chunk_delay_ms = CASE 
        WHEN message_chunk_delay_ms > 2147483647 THEN 2000  -- 2 segundos em ms
        WHEN message_chunk_delay_ms < 0 THEN 2000
        ELSE message_chunk_delay_ms
    END,
    message_min_delay_ms = CASE 
        WHEN message_min_delay_ms > 2147483647 THEN 3000  -- 3 segundos em ms
        WHEN message_min_delay_ms < 0 THEN 3000
        ELSE message_min_delay_ms
    END,
    message_max_delay_ms = CASE 
        WHEN message_max_delay_ms > 2147483647 THEN 5000  -- 5 segundos em ms
        WHEN message_max_delay_ms < 0 THEN 5000
        ELSE message_max_delay_ms
    END,
    updated_at = NOW()
WHERE message_debounce_time_ms > 2147483647 
   OR message_debounce_time_ms < 0
   OR message_chunk_delay_ms > 2147483647
   OR message_chunk_delay_ms < 0
   OR message_min_delay_ms > 2147483647
   OR message_min_delay_ms < 0
   OR message_max_delay_ms > 2147483647
   OR message_max_delay_ms < 0;

-- 3. Verificar se há valores que podem estar sendo convertidos incorretamente
-- Valores em segundos que podem estar sendo multiplicados por 1000 incorretamente
SELECT 
    owner_id,
    name,
    message_debounce_time_ms,
    CASE 
        WHEN message_debounce_time_ms = 3600 THEN 'POSSÍVEL PROBLEMA: 3600 segundos = 1 hora, pode estar sendo convertido para 3600000000ms'
        WHEN message_debounce_time_ms = 7200 THEN 'POSSÍVEL PROBLEMA: 7200 segundos = 2 horas, pode estar sendo convertido para 7200000000ms'
        WHEN message_debounce_time_ms = 36000 THEN 'POSSÍVEL PROBLEMA: 36000 segundos = 10 horas, pode estar sendo convertido para 36000000000ms'
        ELSE 'OK'
    END as status
FROM ai_agent_configs 
WHERE message_debounce_time_ms IN (3600, 7200, 36000);

-- 4. Corrigir valores suspeitos que podem estar causando o problema
UPDATE ai_agent_configs 
SET 
    message_debounce_time_ms = CASE 
        WHEN message_debounce_time_ms = 3600 THEN 30000   -- Converter 1 hora (3600s) para 30s em ms
        WHEN message_debounce_time_ms = 7200 THEN 30000   -- Converter 2 horas (7200s) para 30s em ms
        WHEN message_debounce_time_ms = 36000 THEN 30000  -- Converter 10 horas (36000s) para 30s em ms
        ELSE message_debounce_time_ms
    END,
    updated_at = NOW()
WHERE message_debounce_time_ms IN (3600, 7200, 36000);

-- 5. Verificar configurações finais
SELECT 
    owner_id,
    name,
    message_debounce_time_ms,
    message_chunk_delay_ms,
    message_min_delay_ms,
    message_max_delay_ms,
    'Configurações corrigidas' as status
FROM ai_agent_configs 
ORDER BY updated_at DESC;

-- 6. Adicionar trigger para prevenir valores inválidos no futuro
CREATE OR REPLACE FUNCTION validate_timeout_values()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Validar debounce_time_ms (máximo 2 minutos = 120000ms)
    IF NEW.message_debounce_time_ms > 120000 OR NEW.message_debounce_time_ms < 1000 THEN
        RAISE EXCEPTION 'message_debounce_time_ms deve estar entre 1000 e 120000 milissegundos (1s a 2min)';
    END IF;

    -- Validar chunk_delay_ms (máximo 10 segundos = 10000ms)
    IF NEW.message_chunk_delay_ms > 10000 OR NEW.message_chunk_delay_ms < 100 THEN
        RAISE EXCEPTION 'message_chunk_delay_ms deve estar entre 100 e 10000 milissegundos (100ms a 10s)';
    END IF;

    -- Validar min_delay_ms (máximo 10 segundos = 10000ms)
    IF NEW.message_min_delay_ms > 10000 OR NEW.message_min_delay_ms < 100 THEN
        RAISE EXCEPTION 'message_min_delay_ms deve estar entre 100 e 10000 milissegundos (100ms a 10s)';
    END IF;

    -- Validar max_delay_ms (máximo 10 segundos = 10000ms)
    IF NEW.message_max_delay_ms > 10000 OR NEW.message_max_delay_ms < 100 THEN
        RAISE EXCEPTION 'message_max_delay_ms deve estar entre 100 e 10000 milissegundos (100ms a 10s)';
    END IF;

    RETURN NEW;
END;
$$;

-- Aplicar trigger
DROP TRIGGER IF EXISTS validate_timeout_values_trigger ON ai_agent_configs;
CREATE TRIGGER validate_timeout_values_trigger
    BEFORE INSERT OR UPDATE ON ai_agent_configs
    FOR EACH ROW
    EXECUTE FUNCTION validate_timeout_values();

-- 7. Log da correção
INSERT INTO system_logs (level, message, context, created_at)
VALUES (
    'info',
    'TimeoutOverflowWarning fix applied - corrected invalid timeout values in ai_agent_configs',
    json_build_object(
        'action', 'fix_timeout_overflow',
        'affected_rows', (SELECT COUNT(*) FROM ai_agent_configs WHERE updated_at > NOW() - INTERVAL '1 minute'),
        'max_safe_value', 2147483647,
        'recommended_values', json_build_object(
            'debounce_time_ms', '30000',
            'chunk_delay_ms', '2000',
            'min_delay_ms', '3000',
            'max_delay_ms', '5000'
        )
    ),
    NOW()
);
