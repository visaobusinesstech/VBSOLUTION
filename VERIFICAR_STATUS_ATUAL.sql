-- =====================================================
-- VERIFICAÇÃO DO STATUS ATUAL DO SISTEMA
-- =====================================================
-- Execute este script para verificar:
-- 1. Se o perfil foi criado
-- 2. Status das tabelas principais
-- 3. RLS e políticas
-- 4. Por que a página Activities está em loading eterno
-- =====================================================

-- =====================================================
-- 1. VERIFICAR SE O PERFIL FOI CRIADO
-- =====================================================
-- Verificar se o usuário daviresende3322@gmail.com tem perfil
SELECT 
    'Status do Perfil' as verificação,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PERFIL CRIADO'
        ELSE '❌ PERFIL NÃO CRIADO'
    END as resultado,
    COUNT(*) as total_perfis
FROM public.profiles 
WHERE email = 'daviresende3322@gmail.com';

-- Verificar todos os perfis existentes
SELECT 
    id,
    email,
    name,
    company,
    role,
    created_at
FROM public.profiles 
ORDER BY created_at DESC;

-- =====================================================
-- 2. VERIFICAR STATUS DAS TABELAS PRINCIPAIS
-- =====================================================
-- Verificar todas as tabelas principais e seus registros
SELECT 
    schemaname,
    relname as tablename,
    n_tup_ins as registros_inseridos,
    n_tup_upd as registros_atualizados,
    n_tup_del as registros_deletados
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
  AND relname IN ('profiles', 'activities', 'companies', 'employees', 'products', 'projects', 'leads', 'deals')
ORDER BY relname;

-- =====================================================
-- 3. VERIFICAR TABELA ACTIVITIES ESPECIFICAMENTE
-- =====================================================
-- Verificar se a tabela activities existe e tem dados
SELECT 
    'Tabela Activities' as tabela,
    COUNT(*) as total_registros,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ COM DADOS'
        ELSE '❌ SEM DADOS'
    END as status
FROM public.activities;

-- Verificar estrutura da tabela activities
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'activities'
ORDER BY ordinal_position;

-- =====================================================
-- 4. VERIFICAR RLS E POLÍTICAS
-- =====================================================
-- Verificar se RLS está ativo nas tabelas principais
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_ativo
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'activities', 'companies', 'employees', 'products', 'projects', 'leads', 'deals')
ORDER BY tablename;

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
-- 5. VERIFICAR USUÁRIO ATUAL NO AUTH.USERS
-- =====================================================
-- Verificar se o usuário existe no auth.users
SELECT 
    'Usuário Auth' as verificação,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ USUÁRIO EXISTE'
        ELSE '❌ USUÁRIO NÃO EXISTE'
    END as resultado,
    COUNT(*) as total_usuarios
FROM auth.users 
WHERE email = 'daviresende3322@gmail.com';

-- Verificar dados do usuário
SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'daviresende3322@gmail.com';

-- =====================================================
-- 6. VERIFICAR TRIGGER E FUNÇÃO
-- =====================================================
-- Verificar se o trigger está funcionando
SELECT 
    'Trigger Status' as verificação,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ TRIGGER ATIVO'
        ELSE '❌ TRIGGER NÃO ENCONTRADO'
    END as resultado,
    COUNT(*) as total_triggers
FROM information_schema.triggers
WHERE trigger_schema = 'auth' 
  AND trigger_name = 'on_auth_user_created';

-- Verificar se a função existe
SELECT 
    'Função Status' as verificação,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ FUNÇÃO EXISTE'
        ELSE '❌ FUNÇÃO NÃO ENCONTRADA'
    END as resultado,
    COUNT(*) as total_funcoes
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'handle_new_user';

-- =====================================================
-- 7. TESTAR INSERÇÃO MANUAL DE ATIVIDADE
-- =====================================================
-- Tentar inserir uma atividade de teste para verificar RLS
DO $$
DECLARE
    user_id UUID;
    activity_id UUID;
BEGIN
    -- Obter ID do usuário atual
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
            'Atividade de Teste',
            'Teste para verificar se RLS está funcionando',
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
-- 8. VERIFICAR RESULTADO DO TESTE
-- =====================================================
-- Verificar se a atividade foi criada temporariamente
SELECT 
    'Teste de Inserção' as verificação,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ INSERÇÃO FUNCIONOU'
        ELSE '❌ INSERÇÃO FALHOU'
    END as resultado,
    COUNT(*) as atividades_teste
FROM public.activities 
WHERE title = 'Atividade de Teste';

-- =====================================================
-- 9. DIAGNÓSTICO FINAL
-- =====================================================
-- Resumo do diagnóstico
SELECT 
    'DIAGNÓSTICO FINAL' as tipo,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.profiles WHERE email = 'daviresende3322@gmail.com') > 0 
             AND (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'auth' AND trigger_name = 'on_auth_user_created') > 0
             AND (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activities')
        THEN '✅ SISTEMA FUNCIONANDO - VERIFICAR FRONTEND'
        ELSE '❌ PROBLEMA NO BACKEND - VERIFICAR SUPABASE'
    END as status,
    'Verificar logs do frontend para identificar loading eterno' as recomendacao;

-- =====================================================
-- INSTRUÇÕES PARA RESOLVER LOADING ETERNO
-- =====================================================
/*
🎯 DIAGNÓSTICO COMPLETO EXECUTADO!

📊 RESULTADOS ESPERADOS:
1. ✅ Perfil deve estar criado
2. ✅ Trigger deve estar ativo
3. ✅ RLS deve estar configurado
4. ✅ Tabela activities deve estar vazia (normal)

🔍 SE AINDA ESTIVER EM LOADING ETERNO:
1. Verifique o console do navegador (F12)
2. Verifique se há erros de rede
3. Verifique se o Supabase está respondendo
4. Verifique se o usuário está autenticado

💡 PRÓXIMOS PASSOS:
1. Execute este script de diagnóstico
2. Verifique os resultados
3. Identifique o problema específico
4. Aplique a correção necessária
*/

-- =====================================================
-- COMENTÁRIOS IMPORTANTES
-- =====================================================
-- Este script:
-- 1. ✅ Verifica status completo do sistema
-- 2. ✅ Identifica problemas específicos
-- 3. ✅ Testa funcionalidades críticas
-- 4. ✅ Fornece diagnóstico detalhado
-- 5. ✅ Sugere próximos passos
-- =====================================================
-- Execute este script para identificar:
-- - Status do perfil do usuário
-- - Status das tabelas principais
-- - Configuração de RLS
-- - Funcionamento do trigger
-- - Problemas específicos
-- =====================================================
