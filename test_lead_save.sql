-- SCRIPT PARA TESTAR CRIAÇÃO DE LEADS NO SUPABASE
-- Execute este script no Supabase SQL Editor

-- =====================================================
-- PARTE 1: VERIFICAR ESTRUTURA DAS TABELAS
-- =====================================================

-- Verificar se a tabela leads existe e tem a estrutura correta
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'leads' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se a tabela funnel_stages existe
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'funnel_stages' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- PARTE 2: VERIFICAR DADOS EXISTENTES
-- =====================================================

-- Verificar etapas disponíveis
SELECT id, name, order_index, color 
FROM public.funnel_stages 
ORDER BY order_index;

-- Verificar leads existentes
SELECT COUNT(*) as total_leads FROM public.leads;

-- =====================================================
-- PARTE 3: TESTAR CRIAÇÃO DE LEAD
-- =====================================================

-- Inserir lead de teste
INSERT INTO public.leads (
    name,
    email,
    phone,
    company,
    source,
    priority,
    stage_id,
    status,
    currency,
    value,
    notes
) VALUES (
    'Lead de Teste SQL',
    'teste@exemplo.com',
    '11999999999',
    'Empresa Teste SQL',
    'website',
    'medium',
    (SELECT id FROM public.funnel_stages ORDER BY order_index LIMIT 1),
    'cold',
    'BRL',
    1000,
    'Lead criado via script SQL'
);

-- =====================================================
-- PARTE 4: VERIFICAR LEAD CRIADO
-- =====================================================

-- Verificar se o lead foi criado
SELECT 
    l.id,
    l.name,
    l.email,
    l.phone,
    l.company,
    l.stage_id,
    fs.name as stage_name,
    l.status,
    l.priority,
    l.value,
    l.currency,
    l.created_at
FROM public.leads l
LEFT JOIN public.funnel_stages fs ON l.stage_id = fs.id
WHERE l.name = 'Lead de Teste SQL'
ORDER BY l.created_at DESC;

-- =====================================================
-- PARTE 5: TESTAR CRIAÇÃO COM DADOS PROBLEMÁTICOS
-- =====================================================

-- Tentar criar lead com nome igual ao telefone (problema identificado)
INSERT INTO public.leads (
    name,
    email,
    phone,
    company,
    source,
    priority,
    stage_id,
    status,
    currency,
    value
) VALUES (
    '554796643900',  -- Nome igual ao telefone
    'teste@exemplo.com',
    '554796643900',
    'Empresa Teste',
    'website',
    'medium',
    (SELECT id FROM public.funnel_stages ORDER BY order_index LIMIT 1),
    'cold',
    'BRL',
    1000
);

-- Verificar se foi criado (deve mostrar o problema)
SELECT 
    l.id,
    l.name,
    l.phone,
    CASE 
        WHEN l.name = l.phone THEN 'PROBLEMA: Nome igual ao telefone'
        ELSE 'OK: Nome diferente do telefone'
    END as status_validacao
FROM public.leads l
WHERE l.name = '554796643900' OR l.phone = '554796643900'
ORDER BY l.created_at DESC;

-- =====================================================
-- PARTE 6: LIMPEZA (OPCIONAL)
-- =====================================================

-- Remover leads de teste (descomente se quiser limpar)
-- DELETE FROM public.leads WHERE name IN ('Lead de Teste SQL', '554796643900');

-- =====================================================
-- MENSAGEM DE SUCESSO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TESTE DE CRIAÇÃO DE LEADS CONCLUÍDO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Estrutura das tabelas verificada';
    RAISE NOTICE '✅ Dados existentes verificados';
    RAISE NOTICE '✅ Lead de teste criado';
    RAISE NOTICE '✅ Lead problemático testado';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Verifique os resultados acima para';
    RAISE NOTICE 'identificar possíveis problemas.';
    RAISE NOTICE '========================================';
END $$;
