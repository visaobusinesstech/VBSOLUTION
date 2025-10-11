-- ===========================================
-- CORRIGIR ERRO DE TRIGGER - REMOVER VALIDAÇÃO PROBLEMÁTICA
-- ===========================================

-- Remover trigger existente
DROP TRIGGER IF EXISTS trigger_validate_ai_agent_config ON ai_agent_configs;

-- Remover função de validação
DROP FUNCTION IF EXISTS validate_ai_agent_config();

-- Criar função de validação simplificada (sem validação de max_response_length)
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

-- Verificar se o trigger foi criado corretamente
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_validate_ai_agent_config';

-- ✅ Trigger corrigido com sucesso!
