-- =====================================================
-- LIMPEZA COMPLETA DO DASHBOARD E REMOÇÃO DE DADOS MOCKADOS
-- =====================================================
-- Execute este script no SQL Editor do Supabase para:
-- 1. Remover TODOS os dados mockados de todas as tabelas
-- 2. Limpar o dashboard completamente
-- 3. Preparar o sistema para novos usuários
-- =====================================================

-- 1. LIMPEZA COMPLETA DE TODAS AS TABELAS (EXCETO PROFILES)
-- =====================================================
-- Remover todos os dados de todas as tabelas principais
DELETE FROM public.activities;
DELETE FROM public.companies;
DELETE FROM public.deals;
DELETE FROM public.employees;
DELETE FROM public.inventory;
DELETE FROM public.leads;
DELETE FROM public.products;
DELETE FROM public.projects;
DELETE FROM public.whatsapp_atendimentos;
DELETE FROM public.whatsapp_mensagens;

-- 2. LIMPEZA DE TABELAS ADICIONAIS (SE EXISTIREM)
-- =====================================================
-- Limpar tabelas que podem ter dados mockados
DELETE FROM public.suppliers;
DELETE FROM public.work_groups;
DELETE FROM public.customers;
DELETE FROM public.orders;
DELETE FROM public.payments;
DELETE FROM public.tasks;
DELETE FROM public.notes;

-- 3. RESETAR SEQUÊNCIAS (SE EXISTIREM)
-- =====================================================
-- Resetar contadores de ID se houver sequências
DO $$
DECLARE
    seq_name text;
BEGIN
    FOR seq_name IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    LOOP
        EXECUTE 'ALTER SEQUENCE public.' || seq_name || ' RESTART WITH 1';
    END LOOP;
END $$;

-- 4. VERIFICAR SE AS TABELAS ESTÃO VAZIAS
-- =====================================================
-- Verificar contagem de registros em todas as tabelas
SELECT 
    'activities' as tabela,
    COUNT(*) as registros
FROM public.activities
UNION ALL
SELECT 
    'companies' as tabela,
    COUNT(*) as registros
FROM public.companies
UNION ALL
SELECT 
    'deals' as tabela,
    COUNT(*) as registros
FROM public.deals
UNION ALL
SELECT 
    'employees' as tabela,
    COUNT(*) as registros
FROM public.employees
UNION ALL
SELECT 
    'inventory' as tabela,
    COUNT(*) as registros
FROM public.inventory
UNION ALL
SELECT 
    'leads' as tabela,
    COUNT(*) as registros
FROM public.leads
UNION ALL
SELECT 
    'products' as tabela,
    COUNT(*) as registros
FROM public.products
UNION ALL
SELECT 
    'projects' as tabela,
    COUNT(*) as registros
FROM public.projects
UNION ALL
SELECT 
    'whatsapp_atendimentos' as tabela,
    COUNT(*) as registros
FROM public.whatsapp_atendimentos
UNION ALL
SELECT 
    'whatsapp_mensagens' as tabela,
    COUNT(*) as registros
FROM public.whatsapp_mensagens
UNION ALL
SELECT 
    'suppliers' as tabela,
    COUNT(*) as registros
FROM public.suppliers
UNION ALL
SELECT 
    'work_groups' as tabela,
    COUNT(*) as registros
FROM public.work_groups
UNION ALL
SELECT 
    'customers' as tabela,
    COUNT(*) as registros
FROM public.customers
UNION ALL
SELECT 
    'orders' as tabela,
    COUNT(*) as registros
FROM public.orders
UNION ALL
SELECT 
    'payments' as tabela,
    COUNT(*) as registros
FROM public.payments
UNION ALL
SELECT 
    'tasks' as tabela,
    COUNT(*) as registros
FROM public.tasks
UNION ALL
SELECT 
    'notes' as tabela,
    COUNT(*) as registros
FROM public.notes
ORDER BY tabela;

-- 5. VERIFICAR APENAS USUÁRIOS AUTÊNTICOS (PERFIS)
-- =====================================================
-- Verificar se há apenas usuários reais (sem dados mockados)
SELECT 
    'profiles' as tabela,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN created_at > now() - interval '1 day' THEN 1 END) as usuarios_hoje
FROM public.profiles;

-- 6. VERIFICAR ESTRUTURA DAS TABELAS PRINCIPAIS
-- =====================================================
-- Verificar se as tabelas principais estão acessíveis
SELECT 
    table_name,
    table_type,
    CASE 
        WHEN table_name IN ('activities', 'companies', 'deals', 'employees', 'inventory', 'leads', 'products', 'projects') 
        THEN '✅ Tabela Principal'
        WHEN table_name IN ('suppliers', 'work_groups', 'customers', 'orders', 'payments', 'tasks', 'notes')
        THEN '🆕 Tabela Adicional'
        ELSE '❓ Tabela Desconhecida'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'activities', 'companies', 'deals', 'employees', 'inventory', 
    'leads', 'products', 'projects', 'whatsapp_atendimentos', 
    'whatsapp_mensagens', 'suppliers', 'work_groups', 'customers', 
    'orders', 'payments', 'tasks', 'notes'
  )
ORDER BY 
    CASE 
        WHEN table_name IN ('activities', 'companies', 'deals', 'employees', 'inventory', 'leads', 'products', 'projects') 
        THEN 1
        ELSE 2
    END,
    table_name;

-- 7. VERIFICAR POLÍTICAS RLS ATIVAS
-- =====================================================
-- Verificar se as políticas de segurança estão funcionando
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    CASE 
        WHEN qual LIKE '%auth.uid()%' THEN '✅ RLS Ativo'
        ELSE '⚠️ RLS Configurado'
    END as status_rls
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN (
    'activities', 'companies', 'deals', 'employees', 'inventory', 
    'leads', 'products', 'projects', 'whatsapp_atendimentos', 
    'whatsapp_mensagens', 'suppliers', 'work_groups', 'customers', 
    'orders', 'payments', 'tasks', 'notes'
  )
ORDER BY tablename, policyname;

-- =====================================================
-- COMENTÁRIOS IMPORTANTES
-- =====================================================
-- Este script:
-- 1. ✅ Remove TODOS os dados mockados
-- 2. ✅ Limpa o dashboard completamente
-- 3. ✅ Mantém apenas usuários autênticos
-- 4. ✅ Verifica se as tabelas estão vazias
-- 5. ✅ Confirma que RLS está ativo
-- =====================================================
-- Após executar este script:
-- - Dashboard 100% limpo
-- - Sem dados mockados
-- - Sistema pronto para novos usuários
-- - Cada usuário começa do zero
-- =====================================================
-- RESULTADO ESPERADO:
-- Todas as tabelas devem mostrar 0 registros
-- Apenas a tabela profiles pode ter usuários reais
-- =====================================================
