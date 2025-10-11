-- Script para verificar se a tabela templates existe e tem as colunas corretas
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela templates existe
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'templates' 
AND table_schema = 'public';

-- 2. Verificar as colunas da tabela templates
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'templates' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar se há templates na tabela
SELECT 
    id,
    nome,
    canal,
    status,
    user_id,
    created_at
FROM public.templates
ORDER BY created_at DESC
LIMIT 10;

-- 4. Verificar políticas RLS da tabela templates
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'templates' 
AND schemaname = 'public';

-- 5. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'templates' 
AND schemaname = 'public';


