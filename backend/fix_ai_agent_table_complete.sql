-- ===========================================
-- CORRIGIR COMPLETAMENTE A TABELA AI_AGENT_CONFIGS
-- ===========================================

-- 1. Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'ai_agent_configs'
) as table_exists;

-- 2. Criar tabela se não existir
CREATE TABLE IF NOT EXISTS ai_agent_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  company_id UUID,
  name TEXT,
  function TEXT,
  personality TEXT,
  status TEXT DEFAULT 'active',
  response_style TEXT,
  language TEXT,
  max_response_length INTEGER,
  response_speed TEXT,
  tone TEXT,
  rules TEXT,
  company_context TEXT,
  sector TEXT,
  company_description TEXT,
  knowledge_base JSONB,
  api_key TEXT,
  selected_model TEXT,
  creativity_temperature DECIMAL(3,2),
  max_tokens INTEGER,
  audio_transcription_enabled BOOLEAN,
  audio_transcription_language TEXT,
  is_connected BOOLEAN,
  is_company_wide BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Adicionar colunas que podem estar faltando
ALTER TABLE ai_agent_configs 
ADD COLUMN IF NOT EXISTS owner_id UUID,
ADD COLUMN IF NOT EXISTS company_id UUID,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS function TEXT,
ADD COLUMN IF NOT EXISTS personality TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS response_style TEXT,
ADD COLUMN IF NOT EXISTS language TEXT,
ADD COLUMN IF NOT EXISTS max_response_length INTEGER,
ADD COLUMN IF NOT EXISTS response_speed TEXT,
ADD COLUMN IF NOT EXISTS tone TEXT,
ADD COLUMN IF NOT EXISTS rules TEXT,
ADD COLUMN IF NOT EXISTS company_context TEXT,
ADD COLUMN IF NOT EXISTS sector TEXT,
ADD COLUMN IF NOT EXISTS company_description TEXT,
ADD COLUMN IF NOT EXISTS knowledge_base JSONB,
ADD COLUMN IF NOT EXISTS api_key TEXT,
ADD COLUMN IF NOT EXISTS selected_model TEXT,
ADD COLUMN IF NOT EXISTS creativity_temperature DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS max_tokens INTEGER,
ADD COLUMN IF NOT EXISTS audio_transcription_enabled BOOLEAN,
ADD COLUMN IF NOT EXISTS audio_transcription_language TEXT,
ADD COLUMN IF NOT EXISTS is_connected BOOLEAN,
ADD COLUMN IF NOT EXISTS is_company_wide BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_agent_configs_owner_id ON ai_agent_configs (owner_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_configs_company_id ON ai_agent_configs (company_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_configs_is_company_wide ON ai_agent_configs (is_company_wide);
CREATE INDEX IF NOT EXISTS idx_ai_agent_configs_is_active ON ai_agent_configs (is_active);

-- 5. Criar constraint única para owner_id + is_company_wide
DROP CONSTRAINT IF EXISTS ai_agent_configs_owner_company_unique;
ALTER TABLE ai_agent_configs 
ADD CONSTRAINT ai_agent_configs_owner_company_unique 
UNIQUE (owner_id, is_company_wide);

-- 6. Verificar estrutura final da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'ai_agent_configs'
ORDER BY ordinal_position;

-- 7. Testar inserção de dados
INSERT INTO ai_agent_configs (
  owner_id,
  name,
  function,
  personality,
  status,
  response_style,
  language,
  max_response_length,
  api_key,
  selected_model,
  creativity_temperature,
  max_tokens,
  is_connected,
  is_company_wide,
  is_active
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Teste Completo',
  'Atendimento ao cliente via WhatsApp',
  'Profissional e prestativo',
  'active',
  'friendly',
  'pt-BR',
  500,
  'sk-test123456789',
  'gpt-4o-mini',
  0.7,
  1000,
  true,
  false,
  true
) ON CONFLICT (owner_id, is_company_wide) DO UPDATE SET
  name = EXCLUDED.name,
  function = EXCLUDED.function,
  personality = EXCLUDED.personality,
  status = EXCLUDED.status,
  response_style = EXCLUDED.response_style,
  language = EXCLUDED.language,
  max_response_length = EXCLUDED.max_response_length,
  api_key = EXCLUDED.api_key,
  selected_model = EXCLUDED.selected_model,
  creativity_temperature = EXCLUDED.creativity_temperature,
  max_tokens = EXCLUDED.max_tokens,
  is_connected = EXCLUDED.is_connected,
  updated_at = NOW();

-- 8. Verificar se os dados foram inseridos
SELECT 
  id,
  owner_id,
  name,
  function,
  personality,
  api_key,
  selected_model,
  is_active,
  created_at,
  updated_at
FROM ai_agent_configs
WHERE owner_id = '11111111-1111-1111-1111-111111111111'
ORDER BY created_at DESC;

-- 9. Limpar dados de teste
DELETE FROM ai_agent_configs 
WHERE owner_id = '11111111-1111-1111-1111-111111111111';

-- ✅ Tabela ai_agent_configs corrigida e testada!
