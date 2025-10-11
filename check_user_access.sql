-- =====================================================
-- VERIFICAÇÃO DE ACESSO DO USUÁRIO
-- =====================================================
-- Execute este script no Supabase SQL Editor para verificar
-- se o usuário atual tem acesso às tabelas necessárias
-- =====================================================

-- 1. VERIFICAR USUÁRIO ATUAL
SELECT '=== USUÁRIO ATUAL ===' as info;
SELECT 
    auth.uid() as user_id,
    auth.role() as user_role;

-- 2. VERIFICAR SE O USUÁRIO EXISTE NA TABELA PROFILES
SELECT '=== PERFIL DO USUÁRIO ===' as info;
SELECT 
    id,
    auth_user_id,
    name,
    email,
    created_at
FROM public.profiles 
WHERE auth_user_id = auth.uid();

-- 3. VERIFICAR ESTRUTURA DA TABELA PROFILES
SELECT '=== ESTRUTURA DA TABELA PROFILES ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. VERIFICAR POLÍTICAS RLS DA TABELA PROFILES
SELECT '=== POLÍTICAS RLS DA TABELA PROFILES ===' as info;
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 5. TESTAR ACESSO À TABELA SUPPLIERS
SELECT '=== TESTE DE ACESSO À TABELA SUPPLIERS ===' as info;

-- Tentar fazer um SELECT simples
SELECT COUNT(*) as total_suppliers 
FROM public.suppliers;

-- Tentar fazer um SELECT com filtro por owner_id
SELECT COUNT(*) as suppliers_do_usuario
FROM public.suppliers 
WHERE owner_id = (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
);

-- 6. VERIFICAR SE EXISTEM DADOS DE TESTE
SELECT '=== DADOS EXISTENTES ===' as info;
SELECT 
    id,
    name,
    owner_id,
    created_at
FROM public.suppliers 
LIMIT 5;

-- 7. VERIFICAR FUNÇÃO DE INSERÇÃO (SEM EXECUTAR)
SELECT '=== TESTE DE PERMISSÃO DE INSERÇÃO ===' as info;

-- Verificar se o usuário tem permissão para INSERT
SELECT 
    has_table_privilege(auth.uid(), 'public.suppliers', 'INSERT') as can_insert,
    has_table_privilege(auth.uid(), 'public.suppliers', 'SELECT') as can_select,
    has_table_privilege(auth.uid(), 'public.suppliers', 'UPDATE') as can_update,
    has_table_privilege(auth.uid(), 'public.suppliers', 'DELETE') as can_delete;

-- 8. VERIFICAR RLS STATUS
SELECT '=== STATUS DO RLS ===' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename IN ('suppliers', 'profiles');

-- 9. INFORMAÇÕES DO USUÁRIO PARA DEBUG
SELECT '=== INFORMAÇÕES PARA DEBUG ===' as info;
SELECT 
    current_user as current_db_user,
    session_user as session_user,
    current_database() as current_database,
    version() as postgres_version;
