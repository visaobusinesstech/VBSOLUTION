-- Script para verificar a estrutura atual da tabela activities
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela activities existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'activities'
) as table_exists;

-- 2. Verificar estrutura atual da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'activities'
ORDER BY ordinal_position;

-- 3. Verificar se existe campo owner_id ou created_by
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'activities'
AND (column_name = 'owner_id' OR column_name = 'created_by');

-- 4. Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'activities';
