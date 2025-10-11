-- Script para adicionar coluna tags na tabela leads
-- Execute este script no Supabase SQL Editor

-- Verificar se a coluna tags já existe
DO $$
BEGIN
    -- Tentar adicionar a coluna tags se ela não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'tags'
    ) THEN
        -- Adicionar coluna tags como array de texto
        ALTER TABLE leads 
        ADD COLUMN tags TEXT[] DEFAULT '{}';
        
        -- Adicionar comentário na coluna
        COMMENT ON COLUMN leads.tags IS 'Array de tags associadas ao lead';
        
        RAISE NOTICE 'Coluna tags adicionada com sucesso na tabela leads';
    ELSE
        RAISE NOTICE 'Coluna tags já existe na tabela leads';
    END IF;
END $$;

-- Verificar a estrutura da tabela leads
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'leads' 
ORDER BY ordinal_position;
