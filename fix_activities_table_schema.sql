-- Script para corrigir a estrutura da tabela activities
-- Execute este script no SQL Editor do Supabase

-- Verificar estrutura atual da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'activities'
ORDER BY ordinal_position;

-- Adicionar coluna created_by se não existir
DO $$ 
BEGIN
    -- Verificar se a coluna created_by existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activities' 
        AND column_name = 'created_by'
    ) THEN
        -- Adicionar coluna created_by
        ALTER TABLE public.activities 
        ADD COLUMN created_by UUID;
        
        RAISE NOTICE 'Coluna created_by adicionada à tabela activities';
    ELSE
        RAISE NOTICE 'Coluna created_by já existe na tabela activities';
    END IF;
END $$;

-- Verificar se a coluna owner_id existe e remover se necessário
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activities' 
        AND column_name = 'owner_id'
    ) THEN
        -- Remover coluna owner_id se existir
        ALTER TABLE public.activities 
        DROP COLUMN IF EXISTS owner_id;
        
        RAISE NOTICE 'Coluna owner_id removida da tabela activities';
    ELSE
        RAISE NOTICE 'Coluna owner_id não existe na tabela activities';
    END IF;
END $$;

-- Verificar se a coluna company_id existe, se não, adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activities' 
        AND column_name = 'company_id'
    ) THEN
        -- Adicionar coluna company_id
        ALTER TABLE public.activities 
        ADD COLUMN company_id UUID;
        
        RAISE NOTICE 'Coluna company_id adicionada à tabela activities';
    ELSE
        RAISE NOTICE 'Coluna company_id já existe na tabela activities';
    END IF;
END $$;

-- Atualizar políticas RLS para usar created_by
DROP POLICY IF EXISTS "Users can view activities from their company" ON activities;
DROP POLICY IF EXISTS "Users can insert activities" ON activities;
DROP POLICY IF EXISTS "Users can update activities they created or are responsible for" ON activities;
DROP POLICY IF EXISTS "Users can delete activities they created" ON activities;

-- Recriar políticas RLS com created_by
CREATE POLICY "Users can view their own activities" ON activities
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own activities" ON activities
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own activities" ON activities
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own activities" ON activities
    FOR DELETE USING (created_by = auth.uid());

-- Verificar estrutura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'activities'
ORDER BY ordinal_position;
