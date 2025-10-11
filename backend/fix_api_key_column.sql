-- ===========================================
-- CORRIGIR COLUNA API_KEY NA TABELA AI_AGENT_CONFIGS
-- ===========================================

-- Verificar se a coluna api_key existe e seu tipo
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'ai_agent_configs' 
  AND column_name = 'api_key';

-- Se a coluna não existir, criá-la
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_agent_configs' 
        AND column_name = 'api_key'
    ) THEN
        ALTER TABLE ai_agent_configs 
        ADD COLUMN api_key TEXT;
        
        COMMENT ON COLUMN ai_agent_configs.api_key IS 'Chave de API do OpenAI para integração';
        
        RAISE NOTICE 'Coluna api_key criada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna api_key já existe';
    END IF;
END $$;

-- Verificar se a coluna selected_model existe
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'ai_agent_configs' 
  AND column_name = 'selected_model';

-- Se a coluna selected_model não existir, criá-la
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_agent_configs' 
        AND column_name = 'selected_model'
    ) THEN
        ALTER TABLE ai_agent_configs 
        ADD COLUMN selected_model TEXT DEFAULT 'gpt-4o-mini';
        
        COMMENT ON COLUMN ai_agent_configs.selected_model IS 'Modelo de IA selecionado para uso';
        
        RAISE NOTICE 'Coluna selected_model criada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna selected_model já existe';
    END IF;
END $$;

-- Verificar estrutura final da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'ai_agent_configs'
ORDER BY ordinal_position;

-- Testar inserção de dados de exemplo
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
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Teste API Key',
  'Teste',
  'Teste',
  'active',
  'friendly',
  'pt-BR',
  500,
  'sk-test123456789',
  'gpt-4o-mini',
  true
) ON CONFLICT (owner_id, is_company_wide) DO UPDATE SET
  api_key = EXCLUDED.api_key,
  selected_model = EXCLUDED.selected_model,
  updated_at = NOW();

-- Verificar se os dados foram inseridos
SELECT 
  id,
  owner_id,
  name,
  api_key,
  selected_model,
  is_active,
  created_at,
  updated_at
FROM ai_agent_configs
WHERE owner_id = '00000000-0000-0000-0000-000000000000'
ORDER BY created_at DESC;

-- Limpar dados de teste
DELETE FROM ai_agent_configs 
WHERE owner_id = '00000000-0000-0000-0000-000000000000';

-- ✅ Script executado com sucesso!
