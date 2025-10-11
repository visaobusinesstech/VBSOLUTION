-- =====================================================
-- LIMPEZA DE CONTATOS MOCKADOS
-- =====================================================
-- Execute este script no SQL Editor do Supabase para:
-- 1. Remover contatos mockados específicos (Thiago, Bruna Silva, Manoel Martins)
-- 2. Limpar todos os contatos de teste
-- 3. Manter apenas contatos reais do usuário
-- =====================================================

-- 1. VERIFICAR CONTATOS EXISTENTES ANTES DA LIMPEZA
-- =====================================================
SELECT 
    'Status Antes da Limpeza' as verificação,
    COUNT(*) as total_contatos
FROM public.contacts;

-- Listar todos os contatos existentes
SELECT 
    id,
    name,
    phone,
    email,
    company,
    status,
    pipeline,
    created_at
FROM public.contacts
ORDER BY created_at DESC;

-- 2. REMOVER CONTATOS MOCKADOS ESPECÍFICOS
-- =====================================================
-- Remover os contatos que aparecem na interface (dados mockados)
DELETE FROM public.contacts 
WHERE name IN ('Thiago', 'Bruna Silva', 'Manoel Martins')
   OR phone IN ('55863566664', '5511987654321', '5516999888777')
   OR email IN ('thiago@email.com', 'bruna@empresa.com', 'manoel@startup.com')
   OR company IN ('Tech Corp', 'Marketing Plus', 'StartupXYZ');

-- 3. REMOVER OUTROS CONTATOS DE TESTE (SE EXISTIREM)
-- =====================================================
-- Remover contatos que contenham palavras de teste
DELETE FROM public.contacts 
WHERE name ILIKE '%teste%' 
   OR name ILIKE '%test%'
   OR name ILIKE '%mock%'
   OR name ILIKE '%demo%'
   OR email ILIKE '%teste%'
   OR email ILIKE '%test%'
   OR email ILIKE '%mock%'
   OR email ILIKE '%demo%'
   OR company ILIKE '%teste%'
   OR company ILIKE '%test%'
   OR company ILIKE '%mock%'
   OR company ILIKE '%demo%';

-- 4. VERIFICAR CONTATOS RESTANTES APÓS LIMPEZA
-- =====================================================
SELECT 
    'Status Após Limpeza' as verificação,
    COUNT(*) as total_contatos
FROM public.contacts;

-- Listar contatos restantes (se houver)
SELECT 
    id,
    name,
    phone,
    email,
    company,
    status,
    pipeline,
    created_at
FROM public.contacts
ORDER BY created_at DESC;

-- 5. LIMPEZA COMPLETA (OPCIONAL - DESCOMENTE SE QUISER REMOVER TODOS)
-- =====================================================
-- ATENÇÃO: Descomente as linhas abaixo apenas se quiser remover TODOS os contatos
-- TRUNCATE TABLE public.contacts CASCADE;

-- 6. VERIFICAÇÃO FINAL
-- =====================================================
-- Verificar se a tabela está vazia ou com dados reais
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Tabela de contatos está vazia - pronta para uso'
        ELSE 'ℹ️ Tabela contém ' || COUNT(*) || ' contato(s) real(is)'
    END as status_final
FROM public.contacts;
