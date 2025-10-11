-- ===========================================
-- ADICIONAR COLUNAS DE CONFIGURAÇÃO DE MENSAGENS
-- ===========================================

-- Adicionar colunas de configuração de mensagens à tabela ai_agent_configs
ALTER TABLE ai_agent_configs 
ADD COLUMN IF NOT EXISTS message_debounce_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS message_debounce_time_ms INTEGER DEFAULT 30000,
ADD COLUMN IF NOT EXISTS message_chunk_size INTEGER DEFAULT 300,
ADD COLUMN IF NOT EXISTS message_chunk_delay_ms INTEGER DEFAULT 2000,
ADD COLUMN IF NOT EXISTS message_max_batch_size INTEGER DEFAULT 5;

-- Comentários para documentação
COMMENT ON COLUMN ai_agent_configs.message_debounce_enabled IS 'Habilita agrupamento de mensagens consecutivas';
COMMENT ON COLUMN ai_agent_configs.message_debounce_time_ms IS 'Tempo de espera para agrupar mensagens (milissegundos)';
COMMENT ON COLUMN ai_agent_configs.message_chunk_size IS 'Tamanho máximo de cada chunk de resposta (caracteres)';
COMMENT ON COLUMN ai_agent_configs.message_chunk_delay_ms IS 'Delay entre envio de chunks (milissegundos)';
COMMENT ON COLUMN ai_agent_configs.message_max_batch_size IS 'Máximo de mensagens por lote';

-- Atualizar configurações existentes com valores padrão
UPDATE ai_agent_configs 
SET 
  message_debounce_enabled = true,
  message_debounce_time_ms = 30000,
  message_chunk_size = 300,
  message_chunk_delay_ms = 2000,
  message_max_batch_size = 5
WHERE message_debounce_enabled IS NULL;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_agent_configs_message_settings 
ON ai_agent_configs (message_debounce_enabled, message_chunk_size);

-- ===========================================
-- FUNÇÃO PARA ATUALIZAR CONFIGURAÇÕES DE MENSAGENS
-- ===========================================

CREATE OR REPLACE FUNCTION update_message_settings(
  p_owner_id UUID,
  p_debounce_enabled BOOLEAN DEFAULT NULL,
  p_debounce_time_ms INTEGER DEFAULT NULL,
  p_chunk_size INTEGER DEFAULT NULL,
  p_chunk_delay_ms INTEGER DEFAULT NULL,
  p_max_batch_size INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Atualizar configurações de mensagens
  UPDATE ai_agent_configs 
  SET 
    message_debounce_enabled = COALESCE(p_debounce_enabled, message_debounce_enabled),
    message_debounce_time_ms = COALESCE(p_debounce_time_ms, message_debounce_time_ms),
    message_chunk_size = COALESCE(p_chunk_size, message_chunk_size),
    message_chunk_delay_ms = COALESCE(p_chunk_delay_ms, message_chunk_delay_ms),
    message_max_batch_size = COALESCE(p_max_batch_size, message_max_batch_size),
    updated_at = NOW()
  WHERE owner_id = p_owner_id;

  -- Verificar se a atualização foi bem-sucedida
  IF FOUND THEN
    -- Buscar configurações atualizadas
    SELECT json_build_object(
      'success', true,
      'message', 'Configurações de mensagens atualizadas com sucesso',
      'settings', json_build_object(
        'debounceEnabled', message_debounce_enabled,
        'debounceTimeMs', message_debounce_time_ms,
        'chunkSize', message_chunk_size,
        'chunkDelayMs', message_chunk_delay_ms,
        'maxBatchSize', message_max_batch_size
      )
    ) INTO v_result
    FROM ai_agent_configs 
    WHERE owner_id = p_owner_id;
  ELSE
    v_result := json_build_object(
      'success', false,
      'message', 'Configuração não encontrada para o owner_id fornecido'
    );
  END IF;

  RETURN v_result;
END;
$$;

-- ===========================================
-- FUNÇÃO PARA BUSCAR CONFIGURAÇÕES DE MENSAGENS
-- ===========================================

CREATE OR REPLACE FUNCTION get_message_settings(p_owner_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'success', true,
    'settings', json_build_object(
      'debounceEnabled', COALESCE(message_debounce_enabled, true),
      'debounceTimeMs', COALESCE(message_debounce_time_ms, 30000),
      'chunkSize', COALESCE(message_chunk_size, 300),
      'chunkDelayMs', COALESCE(message_chunk_delay_ms, 2000),
      'maxBatchSize', COALESCE(message_max_batch_size, 5)
    )
  ) INTO v_result
  FROM ai_agent_configs 
  WHERE owner_id = p_owner_id;

  IF v_result IS NULL THEN
    v_result := json_build_object(
      'success', false,
      'message', 'Configuração não encontrada'
    );
  END IF;

  RETURN v_result;
END;
$$;

-- ===========================================
-- TRIGGER PARA VALIDAR CONFIGURAÇÕES
-- ===========================================

CREATE OR REPLACE FUNCTION validate_message_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validar debounce_time_ms (5s - 2min)
  IF NEW.message_debounce_time_ms IS NOT NULL AND 
     (NEW.message_debounce_time_ms < 5000 OR NEW.message_debounce_time_ms > 120000) THEN
    RAISE EXCEPTION 'message_debounce_time_ms deve estar entre 5000 e 120000 milissegundos';
  END IF;

  -- Validar chunk_size (100 - 1000)
  IF NEW.message_chunk_size IS NOT NULL AND 
     (NEW.message_chunk_size < 100 OR NEW.message_chunk_size > 1000) THEN
    RAISE EXCEPTION 'message_chunk_size deve estar entre 100 e 1000 caracteres';
  END IF;

  -- Validar chunk_delay_ms (500ms - 10s)
  IF NEW.message_chunk_delay_ms IS NOT NULL AND 
     (NEW.message_chunk_delay_ms < 500 OR NEW.message_chunk_delay_ms > 10000) THEN
    RAISE EXCEPTION 'message_chunk_delay_ms deve estar entre 500 e 10000 milissegundos';
  END IF;

  -- Validar max_batch_size (1 - 20)
  IF NEW.message_max_batch_size IS NOT NULL AND 
     (NEW.message_max_batch_size < 1 OR NEW.message_max_batch_size > 20) THEN
    RAISE EXCEPTION 'message_max_batch_size deve estar entre 1 e 20 mensagens';
  END IF;

  RETURN NEW;
END;
$$;

-- Aplicar trigger
DROP TRIGGER IF EXISTS trigger_validate_message_settings ON ai_agent_configs;
CREATE TRIGGER trigger_validate_message_settings
  BEFORE INSERT OR UPDATE ON ai_agent_configs
  FOR EACH ROW
  EXECUTE FUNCTION validate_message_settings();

-- ===========================================
-- RLS POLICIES
-- ===========================================

-- Permitir leitura para usuários autenticados
CREATE POLICY IF NOT EXISTS "Users can read message settings" ON ai_agent_configs
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Permitir atualização para o próprio usuário
CREATE POLICY IF NOT EXISTS "Users can update own message settings" ON ai_agent_configs
  FOR UPDATE USING (auth.uid() = owner_id);

-- ===========================================
-- DADOS DE EXEMPLO
-- ===========================================

-- Inserir configurações padrão se não existirem
INSERT INTO ai_agent_configs (
  owner_id,
  name,
  function,
  personality,
  message_debounce_enabled,
  message_debounce_time_ms,
  message_chunk_size,
  message_chunk_delay_ms,
  message_max_batch_size
)
SELECT 
  auth.uid(),
  'Configuração Padrão',
  'assistente',
  'Assistente virtual amigável e prestativo',
  true,
  30000,
  300,
  2000,
  5
WHERE NOT EXISTS (
  SELECT 1 FROM ai_agent_configs WHERE owner_id = auth.uid()
);

-- ===========================================
-- VERIFICAÇÃO FINAL
-- ===========================================

-- Verificar se as colunas foram criadas
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'ai_agent_configs' 
  AND column_name LIKE 'message_%'
ORDER BY column_name;

-- Verificar se as funções foram criadas
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name IN ('update_message_settings', 'get_message_settings')
ORDER BY routine_name;

PRINT '✅ Colunas de configuração de mensagens adicionadas com sucesso!';
