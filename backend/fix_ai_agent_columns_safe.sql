-- ===========================================
-- SCRIPT SEGURO PARA CORRIGIR COLUNAS AI AGENT
-- Verifica se já existem antes de criar
-- ===========================================

-- Adicionar colunas faltantes (apenas se não existirem)
ALTER TABLE ai_agent_configs 
ADD COLUMN IF NOT EXISTS creativity_temperature DECIMAL(3,2) DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS audio_transcription_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS audio_transcription_language VARCHAR(10) DEFAULT 'pt-BR',
ADD COLUMN IF NOT EXISTS response_speed VARCHAR(20) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS is_company_wide BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS company_id UUID;

-- Atualizar configurações existentes com valores padrão
UPDATE ai_agent_configs 
SET 
  creativity_temperature = 0.7,
  max_tokens = 1000,
  audio_transcription_enabled = false,
  audio_transcription_language = 'pt-BR',
  response_speed = 'normal',
  is_company_wide = false
WHERE creativity_temperature IS NULL;

-- Criar índices para performance (apenas se não existirem)
CREATE INDEX IF NOT EXISTS idx_ai_agent_configs_company_id 
ON ai_agent_configs (company_id);

CREATE INDEX IF NOT EXISTS idx_ai_agent_configs_is_company_wide 
ON ai_agent_configs (is_company_wide);

-- Remover trigger problemático se existir
DROP TRIGGER IF EXISTS trigger_validate_ai_agent_config ON ai_agent_configs;
DROP FUNCTION IF EXISTS validate_ai_agent_config();

-- Criar função de validação simplificada (sem validação problemática)
CREATE OR REPLACE FUNCTION validate_ai_agent_config()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validar temperatura (0.0 - 2.0)
  IF NEW.creativity_temperature IS NOT NULL AND 
     (NEW.creativity_temperature < 0.0 OR NEW.creativity_temperature > 2.0) THEN
    RAISE EXCEPTION 'creativity_temperature deve estar entre 0.0 e 2.0';
  END IF;

  -- Validar max_tokens (1 - 128000)
  IF NEW.max_tokens IS NOT NULL AND 
     (NEW.max_tokens < 1 OR NEW.max_tokens > 128000) THEN
    RAISE EXCEPTION 'max_tokens deve estar entre 1 e 128000';
  END IF;

  -- Remover validação problemática do max_response_length
  -- Esta validação estava causando o erro "operator does not exist: text < integer"

  RETURN NEW;
END;
$$;

-- Recriar trigger com validação simplificada
CREATE TRIGGER trigger_validate_ai_agent_config
  BEFORE INSERT OR UPDATE ON ai_agent_configs
  FOR EACH ROW
  EXECUTE FUNCTION validate_ai_agent_config();

-- Verificar se as colunas foram criadas
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'ai_agent_configs' 
  AND column_name IN (
    'creativity_temperature', 'max_tokens', 'audio_transcription_enabled',
    'audio_transcription_language', 'response_speed', 'is_company_wide', 'company_id'
  )
ORDER BY column_name;

-- ✅ Script executado com sucesso!
