-- Script para verificar as atividades no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar estrutura da tabela activities
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'activities'
ORDER BY ordinal_position;

-- 2. Verificar se existem atividades
SELECT COUNT(*) as total_activities FROM activities;

-- 3. Verificar atividades do usuário daviresende3322@gmail.com
SELECT 
    a.id,
    a.title,
    a.created_by,
    a.company_id,
    a.status,
    a.created_at,
    p.email as creator_email
FROM activities a
LEFT JOIN auth.users u ON a.created_by = u.id
LEFT JOIN profiles p ON a.created_by = p.id
WHERE u.email = 'daviresende3322@gmail.com' 
   OR p.email = 'daviresende3322@gmail.com'
ORDER BY a.created_at DESC;

-- 4. Verificar todas as atividades (últimas 10)
SELECT 
    a.id,
    a.title,
    a.created_by,
    a.company_id,
    a.status,
    a.created_at,
    u.email as creator_email
FROM activities a
LEFT JOIN auth.users u ON a.created_by = u.id
ORDER BY a.created_at DESC
LIMIT 10;

-- 5. Verificar políticas RLS da tabela activities
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'activities';
