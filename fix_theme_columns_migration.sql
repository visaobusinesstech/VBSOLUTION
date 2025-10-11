-- Script robusto para adicionar colunas de tema na tabela company_settings
-- Execute este script no SQL Editor do Supabase

-- Verificar se a tabela company_settings existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_settings') THEN
        RAISE EXCEPTION 'Tabela company_settings não existe!';
    END IF;
END $$;

-- Adicionar colunas de tema se não existirem
DO $$
BEGIN
    -- Adicionar sidebar_color
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_settings' 
        AND column_name = 'sidebar_color'
    ) THEN
        ALTER TABLE company_settings ADD COLUMN sidebar_color TEXT DEFAULT '#dee2e3';
        RAISE NOTICE 'Coluna sidebar_color adicionada';
    ELSE
        RAISE NOTICE 'Coluna sidebar_color já existe';
    END IF;

    -- Adicionar topbar_color
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_settings' 
        AND column_name = 'topbar_color'
    ) THEN
        ALTER TABLE company_settings ADD COLUMN topbar_color TEXT DEFAULT '#3F30F1';
        RAISE NOTICE 'Coluna topbar_color adicionada';
    ELSE
        RAISE NOTICE 'Coluna topbar_color já existe';
    END IF;

    -- Adicionar button_color
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_settings' 
        AND column_name = 'button_color'
    ) THEN
        ALTER TABLE company_settings ADD COLUMN button_color TEXT DEFAULT '#4A5477';
        RAISE NOTICE 'Coluna button_color adicionada';
    ELSE
        RAISE NOTICE 'Coluna button_color já existe';
    END IF;
END $$;

-- Atualizar registros existentes com valores padrão se as colunas estiverem vazias
UPDATE company_settings 
SET 
  sidebar_color = COALESCE(sidebar_color, '#dee2e3'),
  topbar_color = COALESCE(topbar_color, '#3F30F1'),
  button_color = COALESCE(button_color, '#4A5477')
WHERE sidebar_color IS NULL OR topbar_color IS NULL OR button_color IS NULL;

-- Verificar se as colunas foram criadas corretamente
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'company_settings' 
AND column_name IN ('sidebar_color', 'topbar_color', 'button_color')
ORDER BY column_name;

-- Mostrar dados de exemplo
SELECT 
  id, 
  company_id, 
  company_name, 
  sidebar_color, 
  topbar_color, 
  button_color,
  created_at,
  updated_at
FROM company_settings 
ORDER BY updated_at DESC 
LIMIT 3;
