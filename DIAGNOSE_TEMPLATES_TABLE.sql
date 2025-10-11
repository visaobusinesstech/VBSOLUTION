-- =========================================================
-- DIAGNÓSTICO COMPLETO DA TABELA TEMPLATES
-- Execute este script no SQL Editor do Supabase
-- =========================================================

-- 1. VERIFICAR TODAS AS COLUNAS DA TABELA
SELECT 
    'COLUNAS DA TABELA' as info,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'templates'
ORDER BY ordinal_position;

-- 2. VERIFICAR CONSTRAINTS DA TABELA
SELECT 
    'CONSTRAINTS' as info,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.templates'::regclass;

-- 3. VERIFICAR SE EXISTEM COLUNAS DUPLICADAS OU CONFLITANTES
SELECT 
    'COLUNAS CONFLITANTES' as info,
    column_name,
    COUNT(*) as count
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'templates'
  AND (column_name IN ('name', 'nome', 'content', 'conteudo', 'description', 'descricao'))
GROUP BY column_name
HAVING COUNT(*) > 0;

-- 4. VERIFICAR DADOS EXISTENTES NA TABELA
SELECT 
    'DADOS EXISTENTES' as info,
    COUNT(*) as total_registros,
    COUNT(nome) as registros_com_nome,
    COUNT(conteudo) as registros_com_conteudo,
    COUNT(canal) as registros_com_canal
FROM public.templates;

-- 5. VERIFICAR SE EXISTEM REGISTROS COM CAMPOS NULL
SELECT 
    'REGISTROS COM CAMPOS NULL' as info,
    COUNT(*) as total,
    COUNT(CASE WHEN nome IS NULL THEN 1 END) as nome_null,
    COUNT(CASE WHEN conteudo IS NULL THEN 1 END) as conteudo_null,
    COUNT(CASE WHEN canal IS NULL THEN 1 END) as canal_null
FROM public.templates;

-- 6. VERIFICAR POLÍTICAS RLS
SELECT 
    'POLÍTICAS RLS' as info,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'templates' AND schemaname = 'public';

-- 7. VERIFICAR SE RLS ESTÁ HABILITADO
SELECT 
    'STATUS RLS' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'templates' AND schemaname = 'public';

-- 8. VERIFICAR ÍNDICES
SELECT 
    'ÍNDICES' as info,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'templates' AND schemaname = 'public';

-- 9. VERIFICAR TRIGGERS
SELECT 
    'TRIGGERS' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'templates' AND event_object_schema = 'public';

-- 10. TESTE DE ESTRUTURA ESPECÍFICA
DO $$
DECLARE
    col_record RECORD;
    col_count INTEGER;
BEGIN
    RAISE NOTICE '=== VERIFICAÇÃO DETALHADA DAS COLUNAS ===';
    
    -- Contar total de colunas
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'templates';
    
    RAISE NOTICE 'Total de colunas na tabela templates: %', col_count;
    
    -- Listar todas as colunas com detalhes
    FOR col_record IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'templates'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Coluna: % | Tipo: % | Nullable: % | Default: %', 
            col_record.column_name, 
            col_record.data_type, 
            col_record.is_nullable,
            col_record.column_default;
    END LOOP;
    
    -- Verificar colunas específicas que podem estar causando problemas
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'name' AND table_schema = 'public') THEN
        RAISE NOTICE '⚠️ PROBLEMA: Coluna "name" encontrada (deveria ser "nome")';
    ELSE
        RAISE NOTICE '✅ Coluna "name" não encontrada';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'nome' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ Coluna "nome" encontrada';
    ELSE
        RAISE NOTICE '❌ PROBLEMA: Coluna "nome" não encontrada';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'content' AND table_schema = 'public') THEN
        RAISE NOTICE '⚠️ PROBLEMA: Coluna "content" encontrada (deveria ser "conteudo")';
    ELSE
        RAISE NOTICE '✅ Coluna "content" não encontrada';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'conteudo' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ Coluna "conteudo" encontrada';
    ELSE
        RAISE NOTICE '❌ PROBLEMA: Coluna "conteudo" não encontrada';
    END IF;
    
END $$;

-- 11. RESULTADO FINAL
SELECT '✅ Diagnóstico completo executado!' as status;


