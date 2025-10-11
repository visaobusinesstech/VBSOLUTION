-- Script para corrigir a estrutura da tabela activities
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a coluna created_by existe e é NOT NULL
DO $$ 
BEGIN
    -- Verificar se a coluna created_by existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activities' 
        AND column_name = 'created_by'
    ) THEN
        -- Adicionar coluna created_by se não existir
        ALTER TABLE activities ADD COLUMN created_by UUID;
        RAISE NOTICE 'Coluna created_by adicionada';
    END IF;
    
    -- Verificar se a coluna created_by permite NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activities' 
        AND column_name = 'created_by'
        AND is_nullable = 'YES'
    ) THEN
        -- Atualizar registros existentes com created_by NULL
        UPDATE activities 
        SET created_by = (
            SELECT id FROM auth.users 
            WHERE auth.users.id = activities.owner_id 
            LIMIT 1
        )
        WHERE created_by IS NULL AND owner_id IS NOT NULL;
        
        -- Alterar coluna para NOT NULL
        ALTER TABLE activities ALTER COLUMN created_by SET NOT NULL;
        RAISE NOTICE 'Coluna created_by definida como NOT NULL';
    END IF;
    
    -- Adicionar foreign key se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'activities' 
        AND constraint_name = 'activities_created_by_fkey'
    ) THEN
        ALTER TABLE activities 
        ADD CONSTRAINT activities_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES auth.users(id);
        RAISE NOTICE 'Foreign key created_by adicionada';
    END IF;
    
END $$;

-- 2. Verificar se a coluna owner_id ainda existe (pode ser removida se não for necessária)
SELECT column_name, is_nullable 
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'activities' 
AND column_name IN ('owner_id', 'created_by');

-- 3. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'activities'
ORDER BY ordinal_position;
