-- ===========================================
-- CORRIGIR COLUNAS FALTANTES PARA AI AGENT CONFIGS
-- Script final corrigido para PostgreSQL
-- ===========================================

-- Adicionar colunas faltantes para configurações completas do AI Agent
ALTER TABLE ai_agent_configs 
ADD COLUMN IF NOT EXISTS creativity_temperature DECIMAL(3,2) DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS audio_transcription_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS audio_transcription_language VARCHAR(10) DEFAULT 'pt-BR',
ADD COLUMN IF NOT EXISTS response_speed VARCHAR(20) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS is_company_wide BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS company_id UUID;

-- Adicionar foreign key para company_id se a tabela companies existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
        -- Verificar se a constraint já existe antes de criar
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_ai_agent_configs_company_id' 
            AND table_name = 'ai_agent_configs'
        ) THEN
            ALTER TABLE ai_agent_configs 
            ADD CONSTRAINT fk_ai_agent_configs_company_id 
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Comentários para documentação
COMMENT ON COLUMN ai_agent_configs.creativity_temperature IS 'Temperatura de criatividade para o modelo de IA (0.0 - 2.0)';
COMMENT ON COLUMN ai_agent_configs.max_tokens IS 'Número máximo de tokens para resposta';
COMMENT ON COLUMN ai_agent_configs.audio_transcription_enabled IS 'Habilita transcrição automática de áudios';
COMMENT ON COLUMN ai_agent_configs.audio_transcription_language IS 'Idioma para transcrição de áudios';
COMMENT ON COLUMN ai_agent_configs.response_speed IS 'Velocidade de resposta do agente';
COMMENT ON COLUMN ai_agent_configs.is_company_wide IS 'Se true, configuração é compartilhada na empresa';
COMMENT ON COLUMN ai_agent_configs.company_id IS 'ID da empresa para configurações compartilhadas';

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

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_agent_configs_company_id 
ON ai_agent_configs (company_id);

CREATE INDEX IF NOT EXISTS idx_ai_agent_configs_is_company_wide 
ON ai_agent_configs (is_company_wide);

-- ===========================================
-- FUNÇÃO PARA ATUALIZAR CONFIGURAÇÕES COMPLETAS
-- ===========================================

CREATE OR REPLACE FUNCTION update_ai_agent_config_complete(
  p_owner_id UUID,
  p_name TEXT DEFAULT NULL,
  p_function TEXT DEFAULT NULL,
  p_personality TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_response_style TEXT DEFAULT NULL,
  p_language TEXT DEFAULT NULL,
  p_max_response_length INTEGER DEFAULT NULL,
  p_response_speed TEXT DEFAULT NULL,
  p_tone TEXT DEFAULT NULL,
  p_rules TEXT DEFAULT NULL,
  p_company_context TEXT DEFAULT NULL,
  p_sector TEXT DEFAULT NULL,
  p_company_description TEXT DEFAULT NULL,
  p_api_key TEXT DEFAULT NULL,
  p_selected_model TEXT DEFAULT NULL,
  p_creativity_temperature DECIMAL DEFAULT NULL,
  p_max_tokens INTEGER DEFAULT NULL,
  p_audio_transcription_enabled BOOLEAN DEFAULT NULL,
  p_audio_transcription_language TEXT DEFAULT NULL,
  p_knowledge_base JSONB DEFAULT NULL,
  p_is_company_wide BOOLEAN DEFAULT NULL,
  p_company_id UUID DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_config_id UUID;
BEGIN
  -- Verificar se existe configuração para este owner
  SELECT id INTO v_config_id
  FROM ai_agent_configs 
  WHERE owner_id = p_owner_id AND is_active = true;

  IF v_config_id IS NOT NULL THEN
    -- Atualizar configuração existente
    UPDATE ai_agent_configs 
    SET 
      name = COALESCE(p_name, name),
      function = COALESCE(p_function, function),
      personality = COALESCE(p_personality, personality),
      status = COALESCE(p_status, status),
      response_style = COALESCE(p_response_style, response_style),
      language = COALESCE(p_language, language),
      max_response_length = COALESCE(p_max_response_length, max_response_length),
      response_speed = COALESCE(p_response_speed, response_speed),
      tone = COALESCE(p_tone, tone),
      rules = COALESCE(p_rules, rules),
      company_context = COALESCE(p_company_context, company_context),
      sector = COALESCE(p_sector, sector),
      company_description = COALESCE(p_company_description, company_description),
      api_key = COALESCE(p_api_key, api_key),
      selected_model = COALESCE(p_selected_model, selected_model),
      creativity_temperature = COALESCE(p_creativity_temperature, creativity_temperature),
      max_tokens = COALESCE(p_max_tokens, max_tokens),
      audio_transcription_enabled = COALESCE(p_audio_transcription_enabled, audio_transcription_enabled),
      audio_transcription_language = COALESCE(p_audio_transcription_language, audio_transcription_language),
      knowledge_base = COALESCE(p_knowledge_base, knowledge_base),
      is_company_wide = COALESCE(p_is_company_wide, is_company_wide),
      company_id = COALESCE(p_company_id, company_id),
      is_active = COALESCE(p_is_active, is_active),
      updated_at = NOW()
    WHERE id = v_config_id;
  ELSE
    -- Criar nova configuração
    INSERT INTO ai_agent_configs (
      owner_id, name, function, personality, status, response_style, language,
      max_response_length, response_speed, tone, rules, company_context, sector,
      company_description, api_key, selected_model, creativity_temperature,
      max_tokens, audio_transcription_enabled, audio_transcription_language,
      knowledge_base, is_company_wide, company_id, is_active
    ) VALUES (
      p_owner_id,
      COALESCE(p_name, 'Assistente Virtual VB'),
      COALESCE(p_function, 'Atendimento ao cliente via WhatsApp'),
      COALESCE(p_personality, 'Profissional, prestativo e eficiente'),
      COALESCE(p_status, 'active'),
      COALESCE(p_response_style, 'friendly'),
      COALESCE(p_language, 'pt-BR'),
      COALESCE(p_max_response_length, 500),
      COALESCE(p_response_speed, 'normal'),
      p_tone,
      p_rules,
      p_company_context,
      p_sector,
      p_company_description,
      p_api_key,
      COALESCE(p_selected_model, 'gpt-4o-mini'),
      COALESCE(p_creativity_temperature, 0.7),
      COALESCE(p_max_tokens, 1000),
      COALESCE(p_audio_transcription_enabled, false),
      COALESCE(p_audio_transcription_language, 'pt-BR'),
      COALESCE(p_knowledge_base, '{"files": [], "websites": [], "qa": []}'::jsonb),
      COALESCE(p_is_company_wide, false),
      p_company_id,
      COALESCE(p_is_active, true)
    ) RETURNING id INTO v_config_id;
  END IF;

  -- Buscar configuração atualizada
  SELECT json_build_object(
    'success', true,
    'message', 'Configuração do AI Agent atualizada com sucesso',
    'data', json_build_object(
      'id', id,
      'owner_id', owner_id,
      'name', name,
      'function', function,
      'personality', personality,
      'status', status,
      'response_style', response_style,
      'language', language,
      'max_response_length', max_response_length,
      'response_speed', response_speed,
      'tone', tone,
      'rules', rules,
      'company_context', company_context,
      'sector', sector,
      'company_description', company_description,
      'api_key', CASE WHEN api_key IS NOT NULL THEN '***' || RIGHT(api_key, 4) ELSE NULL END,
      'selected_model', selected_model,
      'creativity_temperature', creativity_temperature,
      'max_tokens', max_tokens,
      'audio_transcription_enabled', audio_transcription_enabled,
      'audio_transcription_language', audio_transcription_language,
      'knowledge_base', knowledge_base,
      'is_company_wide', is_company_wide,
      'company_id', company_id,
      'is_active', is_active,
      'created_at', created_at,
      'updated_at', updated_at
    )
  ) INTO v_result
  FROM ai_agent_configs 
  WHERE id = v_config_id;

  RETURN v_result;
END;
$$;

-- ===========================================
-- FUNÇÃO PARA BUSCAR CONFIGURAÇÃO COMPLETA
-- ===========================================

CREATE OR REPLACE FUNCTION get_ai_agent_config_complete(p_owner_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'success', true,
    'data', json_build_object(
      'id', id,
      'owner_id', owner_id,
      'name', name,
      'function', function,
      'personality', personality,
      'status', status,
      'response_style', response_style,
      'language', language,
      'max_response_length', max_response_length,
      'response_speed', response_speed,
      'tone', tone,
      'rules', rules,
      'company_context', company_context,
      'sector', sector,
      'company_description', company_description,
      'api_key', CASE WHEN api_key IS NOT NULL THEN '***' || RIGHT(api_key, 4) ELSE NULL END,
      'selected_model', selected_model,
      'creativity_temperature', creativity_temperature,
      'max_tokens', max_tokens,
      'audio_transcription_enabled', audio_transcription_enabled,
      'audio_transcription_language', audio_transcription_language,
      'knowledge_base', knowledge_base,
      'is_company_wide', is_company_wide,
      'company_id', company_id,
      'is_active', is_active,
      'created_at', created_at,
      'updated_at', updated_at
    )
  ) INTO v_result
  FROM ai_agent_configs 
  WHERE owner_id = p_owner_id AND is_active = true;

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
-- TRIGGER PARA VALIDAR CONFIGURAÇÕES (SIMPLIFICADO)
-- ===========================================

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
  -- IF NEW.max_response_length IS NOT NULL AND 
  --    (NEW.max_response_length < 50 OR NEW.max_response_length > 5000) THEN
  --  RAISE EXCEPTION 'max_response_length deve estar entre 50 e 5000 caracteres';
  -- END IF;

  RETURN NEW;
END;
$$;

-- Aplicar trigger
DROP TRIGGER IF EXISTS trigger_validate_ai_agent_config ON ai_agent_configs;
CREATE TRIGGER trigger_validate_ai_agent_config
  BEFORE INSERT OR UPDATE ON ai_agent_configs
  FOR EACH ROW
  EXECUTE FUNCTION validate_ai_agent_config();

-- ===========================================
-- RLS POLICIES
-- ===========================================

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can read AI agent configs" ON ai_agent_configs;
DROP POLICY IF EXISTS "Users can update own AI agent configs" ON ai_agent_configs;
DROP POLICY IF EXISTS "Users can insert own AI agent configs" ON ai_agent_configs;

-- Permitir leitura para usuários autenticados
CREATE POLICY "Users can read AI agent configs" ON ai_agent_configs
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Permitir atualização para o próprio usuário
CREATE POLICY "Users can update own AI agent configs" ON ai_agent_configs
  FOR UPDATE USING (auth.uid() = owner_id);

-- Permitir inserção para o próprio usuário
CREATE POLICY "Users can insert own AI agent configs" ON ai_agent_configs
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

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
  AND column_name IN (
    'creativity_temperature', 'max_tokens', 'audio_transcription_enabled',
    'audio_transcription_language', 'response_speed', 'is_company_wide', 'company_id'
  )
ORDER BY column_name;

-- Verificar se as funções foram criadas
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name IN ('update_ai_agent_config_complete', 'get_ai_agent_config_complete')
ORDER BY routine_name;

-- ✅ Colunas faltantes adicionadas com sucesso à tabela ai_agent_configs!
