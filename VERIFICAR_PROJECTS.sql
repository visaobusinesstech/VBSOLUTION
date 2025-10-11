-- VERIFICAR E CORRIGIR TABELA PROJECTS
-- Execute este script no SQL Editor do Supabase

-- 1. VERIFICAR SE A TABELA EXISTE
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'projects';

-- 2. VERIFICAR ESTRUTURA DA TABELA (se existir)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'projects'
ORDER BY ordinal_position;

-- 3. VERIFICAR RLS (Row Level Security)
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'projects';

-- 4. VERIFICAR POLÍTICAS RLS
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
WHERE tablename = 'projects';

-- 5. VERIFICAR DADOS EXISTENTES
SELECT COUNT(*) as total_projects FROM public.projects;

-- 6. VERIFICAR PERFIL DO USUÁRIO
SELECT 
    id,
    email,
    created_at
FROM auth.users 
WHERE email = 'daviresende3322@gmail.com';

-- 7. VERIFICAR SE O PERFIL EXISTE (usando colunas corretas)
SELECT 
    id,
    email,
    created_at
FROM public.profiles 
WHERE email = 'daviresende3322@gmail.com';

-- 8. VERIFICAR ESTRUTURA DA TABELA PROFILES
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;
