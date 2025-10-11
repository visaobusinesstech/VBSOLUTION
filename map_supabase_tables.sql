-- =====================================================
-- MAPEAMENTO COMPLETO DAS TABELAS DO SUPABASE
-- =====================================================
-- Execute este script no Supabase SQL Editor para mapear
-- todas as tabelas existentes no seu sistema
-- =====================================================

-- =====================================================
-- 1. LISTAR TODAS AS TABELAS EXISTENTES
-- =====================================================

SELECT 
    table_name as "Nome da Tabela",
    table_type as "Tipo",
    CASE 
        WHEN table_name IN ('profiles', 'companies', 'employees', 'products', 'inventory', 'activities', 'projects', 'leads', 'deals', 'funnel_stages') 
        THEN '✅ Tabela Principal'
        WHEN table_name IN ('suppliers', 'work_groups', 'customers', 'orders', 'payments', 'tasks', 'notes') 
        THEN '🆕 Tabela Adicional'
        WHEN table_name IN ('whatsapp_atendimentos', 'whatsapp_mensagens', 'files', 'documents', 'collaborations') 
        THEN '📱 Tabela Funcional'
        WHEN table_name IN ('messages', 'chat_rooms', 'events', 'company_settings') 
        THEN '⚙️ Tabela Sistema'
        WHEN table_name LIKE 'pg_%' OR table_name LIKE 'sql_%'
        THEN '🔧 Tabela Sistema PostgreSQL'
        ELSE '❓ Tabela Desconhecida'
    END as "Status",
    CASE 
        WHEN table_name IN ('profiles', 'companies', 'employees', 'products', 'inventory', 'activities', 'projects', 'leads', 'deals', 'funnel_stages') 
        THEN 'SIM - Aplicar Isolamento'
        WHEN table_name IN ('suppliers', 'work_groups', 'customers', 'orders', 'payments', 'tasks', 'notes') 
        THEN 'SIM - Aplicar Isolamento'
        WHEN table_name IN ('whatsapp_atendimentos', 'whatsapp_mensagens', 'files', 'documents', 'collaborations') 
        THEN 'SIM - Aplicar Isolamento'
        WHEN table_name IN ('messages', 'chat_rooms', 'events', 'company_settings') 
        THEN 'SIM - Aplicar Isolamento'
        WHEN table_name LIKE 'pg_%' OR table_name LIKE 'sql_%'
        THEN 'NÃO - Tabela Sistema'
        ELSE 'VERIFICAR - Tabela Desconhecida'
    END as "Aplicar Isolamento?"
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY 
    CASE 
        WHEN table_name IN ('profiles', 'companies', 'employees', 'products', 'inventory', 'activities', 'projects', 'leads', 'deals', 'funnel_stages') THEN 1
        WHEN table_name IN ('suppliers', 'work_groups', 'customers', 'orders', 'payments', 'tasks', 'notes') THEN 2
        WHEN table_name IN ('whatsapp_atendimentos', 'whatsapp_mensagens', 'files', 'documents', 'collaborations') THEN 3
        WHEN table_name IN ('messages', 'chat_rooms', 'events', 'company_settings') THEN 4
        ELSE 5
    END,
    table_name;

-- =====================================================
-- 2. VERIFICAR ESTRUTURA DAS TABELAS PRINCIPAIS
-- =====================================================

-- Verificar se as tabelas principais existem e suas colunas
SELECT 
    'profiles' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') 
         THEN 'EXISTE' ELSE 'NÃO EXISTE' END as status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_id' AND table_schema = 'public') 
         THEN 'SIM' ELSE 'NÃO' END as tem_company_id
UNION ALL
SELECT 
    'companies' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies' AND table_schema = 'public') 
         THEN 'EXISTE' ELSE 'NÃO EXISTE' END as status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'company_id' AND table_schema = 'public') 
         THEN 'SIM' ELSE 'NÃO' END as tem_company_id
UNION ALL
SELECT 
    'employees' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees' AND table_schema = 'public') 
         THEN 'EXISTE' ELSE 'NÃO EXISTE' END as status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'company_id' AND table_schema = 'public') 
         THEN 'SIM' ELSE 'NÃO' END as tem_company_id
UNION ALL
SELECT 
    'products' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products' AND table_schema = 'public') 
         THEN 'EXISTE' ELSE 'NÃO EXISTE' END as status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'company_id' AND table_schema = 'public') 
         THEN 'SIM' ELSE 'NÃO' END as tem_company_id
UNION ALL
SELECT 
    'activities' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities' AND table_schema = 'public') 
         THEN 'EXISTE' ELSE 'NÃO EXISTE' END as status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'company_id' AND table_schema = 'public') 
         THEN 'SIM' ELSE 'NÃO' END as tem_company_id
UNION ALL
SELECT 
    'projects' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects' AND table_schema = 'public') 
         THEN 'EXISTE' ELSE 'NÃO EXISTE' END as status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'company_id' AND table_schema = 'public') 
         THEN 'SIM' ELSE 'NÃO' END as tem_company_id
UNION ALL
SELECT 
    'leads' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads' AND table_schema = 'public') 
         THEN 'EXISTE' ELSE 'NÃO EXISTE' END as status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'company_id' AND table_schema = 'public') 
         THEN 'SIM' ELSE 'NÃO' END as tem_company_id
UNION ALL
SELECT 
    'deals' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deals' AND table_schema = 'public') 
         THEN 'EXISTE' ELSE 'NÃO EXISTE' END as status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'company_id' AND table_schema = 'public') 
         THEN 'SIM' ELSE 'NÃO' END as tem_company_id;

-- =====================================================
-- 3. VERIFICAR TABELAS DE CHAT E WHATSAPP
-- =====================================================

-- Verificar tabelas de chat e WhatsApp
SELECT 
    'whatsapp_atendimentos' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_atendimentos' AND table_schema = 'public') 
         THEN 'EXISTE' ELSE 'NÃO EXISTE' END as status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_atendimentos' AND column_name = 'company_id' AND table_schema = 'public') 
         THEN 'SIM' ELSE 'NÃO' END as tem_company_id
UNION ALL
SELECT 
    'whatsapp_mensagens' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_mensagens' AND table_schema = 'public') 
         THEN 'EXISTE' ELSE 'NÃO EXISTE' END as status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_mensagens' AND column_name = 'company_id' AND table_schema = 'public') 
         THEN 'SIM' ELSE 'NÃO' END as tem_company_id
UNION ALL
SELECT 
    'messages' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') 
         THEN 'EXISTE' ELSE 'NÃO EXISTE' END as status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'company_id' AND table_schema = 'public') 
         THEN 'SIM' ELSE 'NÃO' END as tem_company_id
UNION ALL
SELECT 
    'chat_rooms' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_rooms' AND table_schema = 'public') 
         THEN 'EXISTE' ELSE 'NÃO EXISTE' END as status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_rooms' AND column_name = 'company_id' AND table_schema = 'public') 
         THEN 'SIM' ELSE 'NÃO' END as tem_company_id;

-- =====================================================
-- 4. VERIFICAR OUTRAS TABELAS
-- =====================================================

-- Verificar outras tabelas que podem existir
SELECT 
    'suppliers' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers' AND table_schema = 'public') 
         THEN 'EXISTE' ELSE 'NÃO EXISTE' END as status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'company_id' AND table_schema = 'public') 
         THEN 'SIM' ELSE 'NÃO' END as tem_company_id
UNION ALL
SELECT 
    'customers' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers' AND table_schema = 'public') 
         THEN 'EXISTE' ELSE 'NÃO EXISTE' END as status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'company_id' AND table_schema = 'public') 
         THEN 'SIM' ELSE 'NÃO' END as tem_company_id
UNION ALL
SELECT 
    'inventory' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory' AND table_schema = 'public') 
         THEN 'EXISTE' ELSE 'NÃO EXISTE' END as status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'company_id' AND table_schema = 'public') 
         THEN 'SIM' ELSE 'NÃO' END as tem_company_id
UNION ALL
SELECT 
    'funnel_stages' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'funnel_stages' AND table_schema = 'public') 
         THEN 'EXISTE' ELSE 'NÃO EXISTE' END as status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funnel_stages' AND column_name = 'company_id' AND table_schema = 'public') 
         THEN 'SIM' ELSE 'NÃO' END as tem_company_id;

-- =====================================================
-- 5. VERIFICAR RLS E POLÍTICAS EXISTENTES
-- =====================================================

-- Verificar quais tabelas têm RLS habilitado
SELECT 
    tablename as "Tabela",
    rowsecurity as "RLS Habilitado",
    CASE 
        WHEN rowsecurity = true THEN '✅ SIM'
        ELSE '❌ NÃO'
    END as "Status RLS"
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
ORDER BY tablename;

-- Verificar políticas RLS existentes
SELECT 
    tablename as "Tabela",
    policyname as "Nome da Política",
    cmd as "Comando",
    CASE 
        WHEN cmd = 'SELECT' THEN '👁️ Leitura'
        WHEN cmd = 'INSERT' THEN '➕ Inserção'
        WHEN cmd = 'UPDATE' THEN '✏️ Atualização'
        WHEN cmd = 'DELETE' THEN '🗑️ Exclusão'
        WHEN cmd = 'ALL' THEN '🔄 Todos'
        ELSE cmd
    END as "Tipo"
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 6. RESUMO PARA IMPLEMENTAÇÃO
-- =====================================================

-- Gerar lista de tabelas para aplicar isolamento
SELECT 
    'Tabelas para aplicar isolamento:' as info,
    string_agg(table_name, ', ') as tabelas
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name NOT LIKE 'pg_%'
  AND table_name NOT LIKE 'sql_%'
  AND table_name IN (
    'profiles', 'companies', 'employees', 'products', 'inventory', 
    'activities', 'projects', 'leads', 'deals', 'funnel_stages',
    'suppliers', 'work_groups', 'customers', 'orders', 'payments', 
    'tasks', 'notes', 'whatsapp_atendimentos', 'whatsapp_mensagens',
    'files', 'documents', 'collaborations', 'messages', 'chat_rooms',
    'events', 'company_settings'
  );

-- =====================================================
-- 7. INSTRUÇÕES FINAIS
-- =====================================================

-- Este script mapeia todas as tabelas existentes no seu Supabase
-- Execute este script primeiro para ver quais tabelas você tem
-- Depois use o resultado para criar um script personalizado de isolamento
