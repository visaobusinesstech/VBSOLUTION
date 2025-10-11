-- Script para corrigir a tabela contacts e adicionar coluna status se não existir
-- Execute este script no Supabase SQL Editor

-- Verificar se a coluna status existe e adicionar se necessário
DO $$ 
BEGIN
    -- Verificar se a coluna 'status' existe na tabela 'contacts'
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'contacts' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        -- Adicionar a coluna status se não existir
        ALTER TABLE contacts ADD COLUMN status VARCHAR(50) DEFAULT 'active';
        RAISE NOTICE 'Coluna status adicionada à tabela contacts';
    ELSE
        RAISE NOTICE 'Coluna status já existe na tabela contacts';
    END IF;
END $$;

-- Verificar a estrutura atual da tabela contacts
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contacts' 
AND table_schema = 'public'
ORDER BY ordinal_position;
