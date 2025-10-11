-- Script FINAL para corrigir definitivamente o problema da API Key
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estrutura atual da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'ai_agent_configs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Adicionar colunas essenciais se não existirem
DO $$
BEGIN
    -- Adicionar api_key se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_agent_configs' 
        AND column_name = 'api_key'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE ai_agent_configs ADD COLUMN api_key TEXT;
        RAISE NOTICE 'Coluna api_key adicionada';
    ELSE
        RAISE NOTICE 'Coluna api_key já existe';
    END IF;

    -- Adicionar selected_model se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_agent_configs' 
        AND column_name = 'selected_model'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE ai_agent_configs ADD COLUMN selected_model TEXT DEFAULT 'gpt-4o-mini';
        RAISE NOTICE 'Coluna selected_model adicionada';
    ELSE
        RAISE NOTICE 'Coluna selected_model já existe';
    END IF;

    -- Adicionar creativity_temperature se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_agent_configs' 
        AND column_name = 'creativity_temperature'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE ai_agent_configs ADD COLUMN creativity_temperature DECIMAL(3,2) DEFAULT 0.7;
        RAISE NOTICE 'Coluna creativity_temperature adicionada';
    ELSE
        RAISE NOTICE 'Coluna creativity_temperature já existe';
    END IF;

    -- Adicionar max_tokens se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_agent_configs' 
        AND column_name = 'max_tokens'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE ai_agent_configs ADD COLUMN max_tokens INTEGER DEFAULT 1000;
        RAISE NOTICE 'Coluna max_tokens adicionada';
    ELSE
        RAISE NOTICE 'Coluna max_tokens já existe';
    END IF;

    -- Adicionar is_connected se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_agent_configs' 
        AND column_name = 'is_connected'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE ai_agent_configs ADD COLUMN is_connected BOOLEAN DEFAULT false;
        RAISE NOTICE 'Coluna is_connected adicionada';
    ELSE
        RAISE NOTICE 'Coluna is_connected já existe';
    END IF;

    -- Adicionar is_company_wide se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_agent_configs' 
        AND column_name = 'is_company_wide'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE ai_agent_configs ADD COLUMN is_company_wide BOOLEAN DEFAULT false;
        RAISE NOTICE 'Coluna is_company_wide adicionada';
    ELSE
        RAISE NOTICE 'Coluna is_company_wide já existe';
    END IF;

    -- Adicionar company_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_agent_configs' 
        AND column_name = 'company_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE ai_agent_configs ADD COLUMN company_id UUID;
        RAISE NOTICE 'Coluna company_id adicionada';
    ELSE
        RAISE NOTICE 'Coluna company_id já existe';
    END IF;

    -- Adicionar is_active se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_agent_configs' 
        AND column_name = 'is_active'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE ai_agent_configs ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Coluna is_active adicionada';
    ELSE
        RAISE NOTICE 'Coluna is_active já existe';
    END IF;

    -- Adicionar created_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_agent_configs' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE ai_agent_configs ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Coluna created_at adicionada';
    ELSE
        RAISE NOTICE 'Coluna created_at já existe';
    END IF;

    -- Adicionar updated_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_agent_configs' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE ai_agent_configs ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Coluna updated_at adicionada';
    ELSE
        RAISE NOTICE 'Coluna updated_at já existe';
    END IF;
END $$;

-- 3. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'ai_agent_configs' 
AND table_schema = 'public'
AND column_name IN ('api_key', 'selected_model', 'creativity_temperature', 'max_tokens', 'is_connected', 'is_company_wide', 'company_id', 'is_active', 'created_at', 'updated_at')
ORDER BY column_name;

-- 4. Mostrar dados atuais
SELECT 
    id, 
    owner_id, 
    name, 
    api_key, 
    selected_model, 
    creativity_temperature, 
    max_tokens,
    is_connected,
    is_company_wide,
    is_active,
    created_at, 
    updated_at
FROM ai_agent_configs 
ORDER BY updated_at DESC 
LIMIT 3;

-- 5. Teste de inserção (opcional - descomente se quiser testar)
/*
INSERT INTO ai_agent_configs (
    owner_id, 
    name, 
    function, 
    personality, 
    api_key, 
    selected_model, 
    creativity_temperature, 
    max_tokens,
    is_connected,
    is_company_wide,
    is_active
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- Substitua por um owner_id real
    'Teste API Key',
    'Teste de função',
    'Personalidade de teste',
    'sk-test123456789',
    'gpt-4o-mini',
    0.7,
    1000,
    true,
    false,
    true
);
*/
