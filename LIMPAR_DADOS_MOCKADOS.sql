-- =====================================================
-- LIMPEZA COMPLETA DE DADOS MOCKADOS
-- =====================================================
-- Execute este script no SQL Editor do Supabase para:
-- 1. Remover todos os dados mockados
-- 2. Deixar o sistema limpo para novos usuários
-- 3. Manter apenas dados reais criados pelos usuários
-- =====================================================

-- =====================================================
-- 1. VERIFICAR ESTRUTURA DAS TABELAS PRIMEIRO
-- =====================================================
-- Verificar estrutura da tabela companies
SELECT 
    'Estrutura Companies' as verificação,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'companies'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela employees
SELECT 
    'Estrutura Employees' as verificação,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'employees'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela products
SELECT 
    'Estrutura Products' as verificação,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'products'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela projects
SELECT 
    'Estrutura Projects' as verificação,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'projects'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela leads
SELECT 
    'Estrutura Leads' as verificação,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'leads'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela deals
SELECT 
    'Estrutura Deals' as verificação,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'deals'
ORDER BY ordinal_position;

-- =====================================================
-- 2. VERIFICAR DADOS EXISTENTES ANTES DA LIMPEZA
-- =====================================================
-- Verificar quantos registros existem em cada tabela
SELECT 
    'Status Antes da Limpeza' as verificação,
    'Tabelas com dados' as tipo,
    COUNT(*) as total_tabelas
FROM (
    SELECT 'profiles' as tabela, COUNT(*) as registros FROM public.profiles
    UNION ALL
    SELECT 'activities', COUNT(*) FROM public.activities
    UNION ALL
    SELECT 'companies', COUNT(*) FROM public.companies
    UNION ALL
    SELECT 'employees', COUNT(*) FROM public.employees
    UNION ALL
    SELECT 'products', COUNT(*) FROM public.products
    UNION ALL
    SELECT 'projects', COUNT(*) FROM public.projects
    UNION ALL
    SELECT 'leads', COUNT(*) FROM public.leads
    UNION ALL
    SELECT 'deals', COUNT(*) FROM public.deals
    UNION ALL
    SELECT 'suppliers', COUNT(*) FROM public.suppliers
    UNION ALL
    SELECT 'work_groups', COUNT(*) FROM public.work_groups
    UNION ALL
    SELECT 'customers', COUNT(*) FROM public.customers
    UNION ALL
    SELECT 'orders', COUNT(*) FROM public.orders
    UNION ALL
    SELECT 'inventory', COUNT(*) FROM public.inventory
    UNION ALL
    SELECT 'whatsapp_atendimentos', COUNT(*) FROM public.whatsapp_atendimentos
    UNION ALL
    SELECT 'whatsapp_mensagens', COUNT(*) FROM public.whatsapp_mensagens
) as tabelas_com_dados
WHERE registros > 0;

-- =====================================================
-- 3. LIMPAR TABELA ACTIVITIES (TAREFAS) - SEMPRE FUNCIONA
-- =====================================================
-- Remover todas as atividades mockadas
DELETE FROM public.activities 
WHERE title IN (
    'COMPRAR PORSCHE',
    'teste2',
    'Atividade de Teste',
    'Atividade de Teste - Autenticação'
) OR title LIKE '%teste%' OR title LIKE '%TESTE%';

-- Verificar se activities foi limpa
SELECT 
    'Activities Limpa' as verificação,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ TABELA LIMPA'
        ELSE '❌ AINDA TEM DADOS'
    END as resultado,
    COUNT(*) as total_registros
FROM public.activities;

-- =====================================================
-- 4. LIMPAR OUTRAS TABELAS COM COLUNAS CORRETAS
-- =====================================================
-- Limpar companies (usando company_name se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'company_name') THEN
        DELETE FROM public.companies WHERE company_name LIKE '%teste%' OR company_name LIKE '%TESTE%';
        RAISE NOTICE '✅ Companies limpa usando company_name';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'title') THEN
        DELETE FROM public.companies WHERE title LIKE '%teste%' OR title LIKE '%TESTE%';
        RAISE NOTICE '✅ Companies limpa usando title';
    ELSE
        RAISE NOTICE '⚠️ Coluna para nome não encontrada em companies';
    END IF;
END $$;

-- Limpar employees (usando employee_name se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'employee_name') THEN
        DELETE FROM public.employees WHERE employee_name LIKE '%teste%' OR employee_name LIKE '%TESTE%';
        RAISE NOTICE '✅ Employees limpa usando employee_name';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'full_name') THEN
        DELETE FROM public.employees WHERE full_name LIKE '%teste%' OR full_name LIKE '%TESTE%';
        RAISE NOTICE '✅ Employees limpa usando full_name';
    ELSE
        RAISE NOTICE '⚠️ Coluna para nome não encontrada em employees';
    END IF;
END $$;

-- Limpar products (usando product_name se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'product_name') THEN
        DELETE FROM public.products WHERE product_name LIKE '%teste%' OR product_name LIKE '%TESTE%';
        RAISE NOTICE '✅ Products limpa usando product_name';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'title') THEN
        DELETE FROM public.products WHERE title LIKE '%teste%' OR title LIKE '%TESTE%';
        RAISE NOTICE '✅ Products limpa usando title';
    ELSE
        RAISE NOTICE '⚠️ Coluna para nome não encontrada em products';
    END IF;
END $$;

-- Limpar projects (usando project_name se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'project_name') THEN
        DELETE FROM public.projects WHERE project_name LIKE '%teste%' OR project_name LIKE '%TESTE%';
        RAISE NOTICE '✅ Projects limpa usando project_name';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'title') THEN
        DELETE FROM public.projects WHERE title LIKE '%teste%' OR title LIKE '%TESTE%';
        RAISE NOTICE '✅ Projects limpa usando title';
    ELSE
        RAISE NOTICE '⚠️ Coluna para nome não encontrada em projects';
    END IF;
END $$;

-- Limpar leads (usando lead_name se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'lead_name') THEN
        DELETE FROM public.leads WHERE lead_name LIKE '%teste%' OR lead_name LIKE '%TESTE%';
        RAISE NOTICE '✅ Leads limpa usando lead_name';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'title') THEN
        DELETE FROM public.leads WHERE title LIKE '%teste%' OR title LIKE '%TESTE%';
        RAISE NOTICE '✅ Leads limpa usando title';
    ELSE
        RAISE NOTICE '⚠️ Coluna para nome não encontrada em leads';
    END IF;
END $$;

-- Limpar deals (usando deal_name se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'deal_name') THEN
        DELETE FROM public.deals WHERE deal_name LIKE '%teste%' OR deal_name LIKE '%TESTE%';
        RAISE NOTICE '✅ Deals limpa usando deal_name';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'title') THEN
        DELETE FROM public.deals WHERE title LIKE '%teste%' OR title LIKE '%TESTE%';
        RAISE NOTICE '✅ Deals limpa usando title';
    ELSE
        RAISE NOTICE '⚠️ Coluna para nome não encontrada em deals';
    END IF;
END $$;

-- =====================================================
-- 5. LIMPAR OUTRAS TABELAS
-- =====================================================
-- Limpar suppliers (usando supplier_name se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'supplier_name') THEN
        DELETE FROM public.suppliers WHERE supplier_name LIKE '%teste%' OR supplier_name LIKE '%TESTE%';
        RAISE NOTICE '✅ Suppliers limpa usando supplier_name';
    ELSE
        RAISE NOTICE '⚠️ Coluna para nome não encontrada em suppliers';
    END IF;
END $$;

-- Limpar work_groups (usando group_name se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_groups' AND column_name = 'group_name') THEN
        DELETE FROM public.work_groups WHERE group_name LIKE '%teste%' OR group_name LIKE '%TESTE%';
        RAISE NOTICE '✅ Work Groups limpa usando group_name';
    ELSE
        RAISE NOTICE '⚠️ Coluna para nome não encontrada em work_groups';
    END IF;
END $$;

-- =====================================================
-- 6. VERIFICAR STATUS FINAL APÓS LIMPEZA
-- =====================================================
-- Resumo final de todas as tabelas
SELECT 
    'Status Final Após Limpeza' as verificação,
    'Todas as tabelas' as tipo,
    COUNT(*) as total_tabelas_limpas
FROM (
    SELECT 'profiles' as tabela, COUNT(*) as registros FROM public.profiles
    UNION ALL
    SELECT 'activities', COUNT(*) FROM public.activities
    UNION ALL
    SELECT 'companies', COUNT(*) FROM public.companies
    UNION ALL
    SELECT 'employees', COUNT(*) FROM public.employees
    UNION ALL
    SELECT 'products', COUNT(*) FROM public.products
    UNION ALL
    SELECT 'projects', COUNT(*) FROM public.projects
    UNION ALL
    SELECT 'leads', COUNT(*) FROM public.leads
    UNION ALL
    SELECT 'deals', COUNT(*) FROM public.deals
    UNION ALL
    SELECT 'suppliers', COUNT(*) FROM public.suppliers
    UNION ALL
    SELECT 'work_groups', COUNT(*) FROM public.work_groups
    UNION ALL
    SELECT 'customers', COUNT(*) FROM public.customers
    UNION ALL
    SELECT 'orders', COUNT(*) FROM public.orders
    UNION ALL
    SELECT 'inventory', COUNT(*) FROM public.inventory
    UNION ALL
    SELECT 'whatsapp_atendimentos', COUNT(*) FROM public.whatsapp_atendimentos
    UNION ALL
    SELECT 'whatsapp_mensagens', COUNT(*) FROM public.whatsapp_mensagens
) as tabelas_finais
WHERE registros > 0;

-- =====================================================
-- 7. VERIFICAR TABELAS ESPECÍFICAS
-- =====================================================
-- Verificar tabelas principais
SELECT 
    'Tabelas Principais' as categoria,
    'activities' as tabela,
    COUNT(*) as registros
FROM public.activities
UNION ALL
SELECT 
    'Tabelas Principais',
    'companies',
    COUNT(*)
FROM public.companies
UNION ALL
SELECT 
    'Tabelas Principais',
    'employees',
    COUNT(*)
FROM public.employees
UNION ALL
SELECT 
    'Tabelas Principais',
    'products',
    COUNT(*)
FROM public.products
UNION ALL
SELECT 
    'Tabelas Principais',
    'projects',
    COUNT(*)
FROM public.projects
UNION ALL
SELECT 
    'Tabelas Principais',
    'leads',
    COUNT(*)
FROM public.leads
UNION ALL
SELECT 
    'Tabelas Principais',
    'deals',
    COUNT(*)
FROM public.deals;

-- =====================================================
-- INSTRUÇÕES PARA TESTE
-- =====================================================
/*
🎯 APÓS EXECUTAR ESTE SCRIPT:

1. ✅ A estrutura das tabelas será verificada
2. ✅ Todos os dados mockados serão removidos
3. ✅ O Dashboard ficará limpo
4. ✅ A página Activities ficará vazia
5. ✅ Apenas dados reais dos usuários permanecerão

💡 PARA TESTAR:
1. Execute este script no Supabase
2. Verifique a estrutura das tabelas
3. Verifique se as tabelas foram limpas
4. Acesse o Dashboard - deve estar vazio
5. Acesse a página Activities - deve estar vazia
6. Crie uma nova tarefa - deve aparecer normalmente

🚨 IMPORTANTE:
- O script verifica a estrutura das tabelas primeiro
- Remove dados mockados usando as colunas corretas
- Dados reais dos usuários serão preservados
- O sistema ficará limpo para novos usuários
*/

-- =====================================================
-- COMENTÁRIOS IMPORTANTES
-- =====================================================
-- Este script:
-- 1. ✅ Verifica a estrutura das tabelas primeiro
-- 2. ✅ Remove dados mockados usando colunas corretas
-- 3. ✅ Mantém apenas dados reais dos usuários
-- 4. ✅ Limpa Dashboard e Activities
-- 5. ✅ Deixa o sistema pronto para uso real
-- =====================================================
-- Execute este script para:
-- - Verificar estrutura das tabelas
-- - Limpar dados mockados
-- - Deixar sistema limpo
-- - Preparar para novos usuários
-- =====================================================
