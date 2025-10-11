-- =====================================================
-- VERIFICAÇÃO E CORREÇÃO DE AUTENTICAÇÃO
-- =====================================================
-- Execute este script para verificar:
-- 1. Status do usuário no auth.users
-- 2. Status do perfil na tabela profiles
-- 3. Corrigir problemas de autenticação
-- 4. Resolver loading eterno da página Activities
-- =====================================================

-- =====================================================
-- 1. VERIFICAR STATUS DO USUÁRIO NO AUTH.USERS
-- =====================================================
-- Verificar se o usuário daviresende3322@gmail.com existe
SELECT 
    'Status do Usuário Auth' as verificação,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ USUÁRIO EXISTE NO AUTH'
        ELSE '❌ USUÁRIO NÃO EXISTE NO AUTH'
    END as resultado,
    COUNT(*) as total_usuarios
FROM auth.users 
WHERE email = 'daviresende3322@gmail.com';

-- Verificar dados completos do usuário
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    raw_user_meta_data,
    aud,
    role
FROM auth.users 
WHERE email = 'daviresende3322@gmail.com';

-- =====================================================
-- 2. VERIFICAR STATUS DO PERFIL NA TABELA PROFILES
-- =====================================================
-- Verificar se o perfil existe
SELECT 
    'Status do Perfil' as verificação,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PERFIL EXISTE'
        ELSE '❌ PERFIL NÃO EXISTE'
    END as resultado,
    COUNT(*) as total_perfis
FROM public.profiles 
WHERE email = 'daviresende3322@gmail.com';

-- Verificar dados do perfil
SELECT 
    id,
    email,
    name,
    company,
    role,
    created_at,
    updated_at
FROM public.profiles 
WHERE email = 'daviresende3322@gmail.com';

-- =====================================================
-- 3. VERIFICAR SE O ID DO AUTH.USERS CORRESPONDE AO PROFILES
-- =====================================================
-- Verificar correspondência entre auth.users e profiles
SELECT 
    'Correspondência de IDs' as verificação,
    CASE 
        WHEN a.id = p.id THEN '✅ IDS CORRESPONDEM'
        ELSE '❌ IDS NÃO CORRESPONDEM'
    END as resultado,
    a.id as auth_user_id,
    p.id as profile_id,
    a.email as auth_email,
    p.email as profile_email
FROM auth.users a
LEFT JOIN public.profiles p ON a.id = p.id
WHERE a.email = 'daviresende3322@gmail.com';

-- =====================================================
-- 4. CRIAR PERFIL SE NÃO EXISTIR
-- =====================================================
-- Criar perfil para o usuário se não existir
DO $$
DECLARE
    user_id UUID;
    profile_exists BOOLEAN;
BEGIN
    -- Obter ID do usuário no auth.users
    SELECT id INTO user_id FROM auth.users WHERE email = 'daviresende3322@gmail.com';
    
    IF user_id IS NOT NULL THEN
        -- Verificar se o perfil já existe
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = user_id) INTO profile_exists;
        
        IF NOT profile_exists THEN
            -- Inserir perfil para o usuário
            INSERT INTO public.profiles (
                id,
                email,
                name,
                company,
                role,
                created_at,
                updated_at
            ) VALUES (
                user_id,
                'daviresende3322@gmail.com',
                'Davi Resende',
                'VBSolution',
                'admin',
                now(),
                now()
            );
            
            RAISE NOTICE '✅ Perfil criado com sucesso para o usuário: %', user_id;
        ELSE
            RAISE NOTICE 'ℹ️ Perfil já existe para o usuário: %', user_id;
        END IF;
    ELSE
        RAISE NOTICE '❌ Usuário não encontrado no auth.users';
    END IF;
END $$;

-- =====================================================
-- 5. VERIFICAR RESULTADO APÓS CRIAÇÃO
-- =====================================================
-- Verificar se o perfil foi criado
SELECT 
    'Status Final do Perfil' as verificação,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PERFIL CRIADO COM SUCESSO'
        ELSE '❌ PERFIL AINDA NÃO EXISTE'
    END as resultado,
    COUNT(*) as total_perfis
FROM public.profiles 
WHERE email = 'daviresende3322@gmail.com';

-- Verificar perfil específico
SELECT 
    id,
    email,
    name,
    company,
    role,
    created_at,
    updated_at
FROM public.profiles 
WHERE email = 'daviresende3322@gmail.com';

-- =====================================================
-- 6. VERIFICAR RLS E POLÍTICAS
-- =====================================================
-- Verificar se RLS está ativo na tabela profiles
SELECT 
    'RLS Profiles' as verificação,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ATIVO'
        ELSE '❌ RLS INATIVO'
    END as resultado
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- Verificar políticas RLS da tabela profiles
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- =====================================================
-- 7. VERIFICAR TABELA ACTIVITIES
-- =====================================================
-- Verificar se a tabela activities tem RLS ativo
SELECT 
    'RLS Activities' as verificação,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ATIVO'
        ELSE '❌ RLS INATIVO'
    END as resultado
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'activities';

-- Verificar políticas RLS da tabela activities
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'activities';

-- =====================================================
-- 8. TESTAR INSERÇÃO DE ATIVIDADE
-- =====================================================
-- Tentar inserir uma atividade de teste
DO $$
DECLARE
    user_id UUID;
    activity_id UUID;
BEGIN
    -- Obter ID do usuário
    SELECT id INTO user_id FROM auth.users WHERE email = 'daviresende3322@gmail.com';
    
    IF user_id IS NOT NULL THEN
        -- Tentar inserir uma atividade de teste
        INSERT INTO public.activities (
            title,
            description,
            type,
            status,
            priority,
            due_date,
            owner_id,
            created_at,
            updated_at
        ) VALUES (
            'Atividade de Teste - Autenticação',
            'Teste para verificar se a autenticação está funcionando',
            'task',
            'pending',
            'medium',
            now() + interval '7 days',
            user_id,
            now(),
            now()
        ) RETURNING id INTO activity_id;
        
        RAISE NOTICE '✅ Atividade de teste criada com ID: %', activity_id;
        
        -- Limpar a atividade de teste
        DELETE FROM public.activities WHERE id = activity_id;
        RAISE NOTICE '🧹 Atividade de teste removida';
        
    ELSE
        RAISE NOTICE '❌ Usuário não encontrado no auth.users';
    END IF;
END $$;

-- =====================================================
-- 9. DIAGNÓSTICO FINAL
-- =====================================================
-- Resumo do diagnóstico de autenticação
SELECT 
    'DIAGNÓSTICO DE AUTENTICAÇÃO' as tipo,
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users WHERE email = 'daviresende3322@gmail.com') > 0 
             AND (SELECT COUNT(*) FROM public.profiles WHERE email = 'daviresende3322@gmail.com') > 0
             AND (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles')
             AND (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activities')
        THEN '✅ AUTENTICAÇÃO FUNCIONANDO - VERIFICAR FRONTEND'
        ELSE '❌ PROBLEMA DE AUTENTICAÇÃO - VERIFICAR SUPABASE'
    END as status,
    'Após executar este script, teste a página Activities novamente' as recomendacao;

-- =====================================================
-- INSTRUÇÕES PARA TESTE
-- =====================================================
/*
🎯 APÓS EXECUTAR ESTE SCRIPT:

1. ✅ O perfil do usuário será criado (se não existir)
2. ✅ A autenticação será verificada
3. ✅ RLS será verificado
4. ✅ Uma atividade de teste será criada e removida

💡 PARA TESTAR:
1. Execute este script no Supabase
2. Verifique se o perfil foi criado
3. Acesse a página Activities no frontend
4. O loading eterno deve ser resolvido

🚨 IMPORTANTE:
- O usuário deve estar logado no sistema
- O perfil deve ser criado automaticamente
- RLS deve estar configurado corretamente
- A página Activities deve funcionar
*/

-- =====================================================
-- COMENTÁRIOS IMPORTANTES
-- =====================================================
-- Este script:
-- 1. ✅ Verifica status completo da autenticação
-- 2. ✅ Cria perfil se não existir
-- 3. ✅ Verifica RLS e políticas
-- 4. ✅ Testa funcionalidades críticas
-- 5. ✅ Fornece diagnóstico detalhado
-- =====================================================
-- Execute este script para resolver:
-- - Problemas de autenticação
-- - Perfil não criado
-- - Loading eterno na página Activities
-- - Problemas de RLS
-- =====================================================
