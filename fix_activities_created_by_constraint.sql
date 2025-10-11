-- Script para corrigir o problema de constraint na tabela activities
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar estrutura atual da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'activities'
AND column_name IN ('created_by', 'owner_id')
ORDER BY ordinal_position;

-- 2. Verificar se há registros com created_by NULL
SELECT COUNT(*) as total_activities,
       COUNT(created_by) as activities_with_created_by,
       COUNT(*) - COUNT(created_by) as activities_with_null_created_by
FROM activities;

-- 3. Se houver registros com created_by NULL, atualizar com owner_id
UPDATE activities 
SET created_by = owner_id 
WHERE created_by IS NULL AND owner_id IS NOT NULL;

-- 4. Verificar se ainda há registros com created_by NULL
SELECT COUNT(*) as remaining_null_created_by
FROM activities 
WHERE created_by IS NULL;

-- 5. Se não houver mais registros com created_by NULL, alterar coluna para NOT NULL
DO $$ 
BEGIN
    -- Verificar se ainda há registros com created_by NULL
    IF (SELECT COUNT(*) FROM activities WHERE created_by IS NULL) = 0 THEN
        -- Alterar coluna para NOT NULL
        ALTER TABLE activities ALTER COLUMN created_by SET NOT NULL;
        RAISE NOTICE 'Coluna created_by definida como NOT NULL';
    ELSE
        RAISE NOTICE 'Ainda há registros com created_by NULL. Execute a atualização primeiro.';
    END IF;
END $$;

-- 6. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'activities'
AND column_name IN ('created_by', 'owner_id')
ORDER BY ordinal_position;

-- 7. Verificar constraints da tabela
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
AND tc.table_name = 'activities'
AND kcu.column_name = 'created_by';
