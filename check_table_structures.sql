-- =====================================================
-- VERIFICAR ESTRUTURA DAS TABELAS
-- =====================================================
-- Script para verificar quais colunas existem em cada tabela
-- =====================================================

-- =====================================================
-- 1. VERIFICAR COLUNAS DE CADA TABELA
-- =====================================================

-- Verificar estrutura das tabelas principais
SELECT 
    'profiles' as tabela,
    string_agg(column_name, ', ') as colunas
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'

UNION ALL

SELECT 
    'companies' as tabela,
    string_agg(column_name, ', ') as colunas
FROM information_schema.columns 
WHERE table_name = 'companies' AND table_schema = 'public'

UNION ALL

SELECT 
    'employees' as tabela,
    string_agg(column_name, ', ') as colunas
FROM information_schema.columns 
WHERE table_name = 'employees' AND table_schema = 'public'

UNION ALL

SELECT 
    'products' as tabela,
    string_agg(column_name, ', ') as colunas
FROM information_schema.columns 
WHERE table_name = 'products' AND table_schema = 'public'

UNION ALL

SELECT 
    'activities' as tabela,
    string_agg(column_name, ', ') as colunas
FROM information_schema.columns 
WHERE table_name = 'activities' AND table_schema = 'public'

UNION ALL

SELECT 
    'projects' as tabela,
    string_agg(column_name, ', ') as colunas
FROM information_schema.columns 
WHERE table_name = 'projects' AND table_schema = 'public'

UNION ALL

SELECT 
    'leads' as tabela,
    string_agg(column_name, ', ') as colunas
FROM information_schema.columns 
WHERE table_name = 'leads' AND table_schema = 'public'

UNION ALL

SELECT 
    'deals' as tabela,
    string_agg(column_name, ', ') as colunas
FROM information_schema.columns 
WHERE table_name = 'deals' AND table_schema = 'public'

UNION ALL

SELECT 
    'suppliers' as tabela,
    string_agg(column_name, ', ') as colunas
FROM information_schema.columns 
WHERE table_name = 'suppliers' AND table_schema = 'public'

UNION ALL

SELECT 
    'work_groups' as tabela,
    string_agg(column_name, ', ') as colunas
FROM information_schema.columns 
WHERE table_name = 'work_groups' AND table_schema = 'public'

UNION ALL

SELECT 
    'collaborations' as tabela,
    string_agg(column_name, ', ') as colunas
FROM information_schema.columns 
WHERE table_name = 'collaborations' AND table_schema = 'public'

UNION ALL

SELECT 
    'files' as tabela,
    string_agg(column_name, ', ') as colunas
FROM information_schema.columns 
WHERE table_name = 'files' AND table_schema = 'public'

UNION ALL

SELECT 
    'events' as tabela,
    string_agg(column_name, ', ') as colunas
FROM information_schema.columns 
WHERE table_name = 'events' AND table_schema = 'public'

UNION ALL

SELECT 
    'company_settings' as tabela,
    string_agg(column_name, ', ') as colunas
FROM information_schema.columns 
WHERE table_name = 'company_settings' AND table_schema = 'public'

UNION ALL

SELECT 
    'whatsapp_mensagens' as tabela,
    string_agg(column_name, ', ') as colunas
FROM information_schema.columns 
WHERE table_name = 'whatsapp_mensagens' AND table_schema = 'public'

UNION ALL

SELECT 
    'inventory' as tabela,
    string_agg(column_name, ', ') as colunas
FROM information_schema.columns 
WHERE table_name = 'inventory' AND table_schema = 'public'

UNION ALL

SELECT 
    'funnel_stages' as tabela,
    string_agg(column_name, ', ') as colunas
FROM information_schema.columns 
WHERE table_name = 'funnel_stages' AND table_schema = 'public'

ORDER BY tabela;

-- =====================================================
-- 2. VERIFICAR QUAIS TABELAS TÊM OWNER_ID
-- =====================================================

SELECT 
    table_name as "Tabela",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = t.table_name 
            AND column_name = 'owner_id' 
            AND table_schema = 'public'
        ) THEN '✅ TEM owner_id'
        ELSE '❌ NÃO TEM owner_id'
    END as "Status owner_id",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = t.table_name 
            AND column_name = 'user_id' 
            AND table_schema = 'public'
        ) THEN '✅ TEM user_id'
        ELSE '❌ NÃO TEM user_id'
    END as "Status user_id",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = t.table_name 
            AND column_name = 'created_by' 
            AND table_schema = 'public'
        ) THEN '✅ TEM created_by'
        ELSE '❌ NÃO TEM created_by'
    END as "Status created_by"
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN (
    'profiles', 'companies', 'employees', 'products', 'inventory', 
    'activities', 'projects', 'leads', 'deals', 'funnel_stages',
    'suppliers', 'work_groups', 'collaborations', 'files', 'events', 
    'company_settings', 'whatsapp_mensagens'
  )
ORDER BY table_name;

-- =====================================================
-- 3. VERIFICAR QUAIS TABELAS TÊM COMPANY_ID
-- =====================================================

SELECT 
    table_name as "Tabela",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = t.table_name 
            AND column_name = 'company_id' 
            AND table_schema = 'public'
        ) THEN '✅ JÁ TEM company_id'
        ELSE '❌ NÃO TEM company_id'
    END as "Status company_id"
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN (
    'profiles', 'companies', 'employees', 'products', 'inventory', 
    'activities', 'projects', 'leads', 'deals', 'funnel_stages',
    'suppliers', 'work_groups', 'collaborations', 'files', 'events', 
    'company_settings', 'whatsapp_mensagens'
  )
ORDER BY table_name;

-- =====================================================
-- 4. VERIFICAR CHAVES ESTRANGEIRAS
-- =====================================================

SELECT 
    tc.table_name as "Tabela",
    kcu.column_name as "Coluna",
    ccu.table_name AS "Tabela Referenciada",
    ccu.column_name AS "Coluna Referenciada"
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
    'profiles', 'companies', 'employees', 'products', 'inventory', 
    'activities', 'projects', 'leads', 'deals', 'funnel_stages',
    'suppliers', 'work_groups', 'collaborations', 'files', 'events', 
    'company_settings', 'whatsapp_mensagens'
  )
ORDER BY tc.table_name, kcu.column_name;
