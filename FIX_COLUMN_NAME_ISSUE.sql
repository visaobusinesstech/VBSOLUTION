-- =========================================================
-- CORRIGIR PROBLEMA DE NOMES DE COLUNAS NA TABELA TEMPLATES
-- Execute este script no SQL Editor do Supabase
-- =========================================================

-- 1. VERIFICAR ESTRUTURA REAL DA TABELA
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'templates'
ORDER BY ordinal_position;

-- 2. VERIFICAR SE EXISTEM COLUNAS DUPLICADAS (name E nome)
SELECT 
    column_name,
    COUNT(*) as count
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'templates'
  AND (column_name = 'name' OR column_name = 'nome')
GROUP BY column_name;

-- 3. CORRIGIR PROBLEMA DE COLUNAS DUPLICADAS
DO $$ 
BEGIN
    -- Se existe coluna 'name' mas não 'nome', renomear 'name' para 'nome'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'name' AND table_schema = 'public')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'nome' AND table_schema = 'public') THEN
        
        ALTER TABLE public.templates RENAME COLUMN name TO nome;
        RAISE NOTICE '✅ Coluna "name" renomeada para "nome"';
        
    -- Se existe coluna 'nome' mas também 'name', remover 'name'
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'nome' AND table_schema = 'public')
          AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'name' AND table_schema = 'public') THEN
        
        -- Primeiro, mover dados de 'name' para 'nome' se 'nome' estiver vazio
        UPDATE public.templates 
        SET nome = name 
        WHERE (nome IS NULL OR nome = '') AND name IS NOT NULL;
        
        -- Depois remover a coluna 'name'
        ALTER TABLE public.templates DROP COLUMN name;
        RAISE NOTICE '✅ Coluna "name" removida (dados preservados em "nome")';
        
    -- Se só existe 'nome', tudo OK
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'nome' AND table_schema = 'public')
          AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'name' AND table_schema = 'public') THEN
        
        RAISE NOTICE '✅ Estrutura correta: coluna "nome" existe';
        
    ELSE
        RAISE NOTICE '⚠️ Estrutura inesperada encontrada';
    END IF;
END $$;

-- 4. VERIFICAR OUTRAS COLUNAS QUE PODEM TER PROBLEMAS SIMILARES
-- Verificar se existe 'content' vs 'conteudo'
SELECT 
    column_name,
    COUNT(*) as count
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'templates'
  AND (column_name = 'content' OR column_name = 'conteudo')
GROUP BY column_name;

-- Corrigir content/conteudo se necessário
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'content' AND table_schema = 'public')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'conteudo' AND table_schema = 'public') THEN
        
        ALTER TABLE public.templates RENAME COLUMN content TO conteudo;
        RAISE NOTICE '✅ Coluna "content" renomeada para "conteudo"';
        
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'conteudo' AND table_schema = 'public')
          AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'content' AND table_schema = 'public') THEN
        
        UPDATE public.templates 
        SET conteudo = content 
        WHERE (conteudo IS NULL OR conteudo = '') AND content IS NOT NULL;
        
        ALTER TABLE public.templates DROP COLUMN content;
        RAISE NOTICE '✅ Coluna "content" removida (dados preservados em "conteudo")';
    END IF;
END $$;

-- 5. GARANTIR QUE CAMPOS OBRIGATÓRIOS TENHAM AS CONSTRAINTS CORRETAS
DO $$ 
BEGIN
    -- Garantir que nome seja NOT NULL
    ALTER TABLE public.templates ALTER COLUMN nome SET NOT NULL;
    
    -- Garantir que conteudo seja NOT NULL
    ALTER TABLE public.templates ALTER COLUMN conteudo SET NOT NULL;
    
    -- Garantir que canal seja NOT NULL com valor padrão
    ALTER TABLE public.templates ALTER COLUMN canal SET NOT NULL;
    ALTER TABLE public.templates ALTER COLUMN canal SET DEFAULT 'email';
    
    -- Garantir que status tenha valor padrão
    ALTER TABLE public.templates ALTER COLUMN status SET DEFAULT 'ativo';
    
    -- Garantir que font_size_px tenha valor padrão
    ALTER TABLE public.templates ALTER COLUMN font_size_px SET DEFAULT '16px';
    
    RAISE NOTICE '✅ Constraints de campos obrigatórios aplicadas';
END $$;

-- 6. CORRIGIR DADOS EXISTENTES QUE PODEM ESTAR NULL
UPDATE public.templates 
SET 
    nome = COALESCE(nome, 'Template sem nome'),
    conteudo = COALESCE(conteudo, 'Conteúdo vazio'),
    canal = COALESCE(canal, 'email'),
    status = COALESCE(status, 'ativo'),
    font_size_px = COALESCE(font_size_px, '16px')
WHERE 
    nome IS NULL 
    OR conteudo IS NULL 
    OR canal IS NULL 
    OR status IS NULL 
    OR font_size_px IS NULL;

-- 7. VERIFICAR ESTRUTURA FINAL
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'templates'
ORDER BY ordinal_position;

-- 8. TESTE DE INSERÇÃO CORRIGIDO
DO $$
DECLARE
    test_user_id UUID;
    test_template_id UUID;
BEGIN
    -- Usar um ID de usuário existente
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Tentar inserir um template de teste com nomes corretos
        INSERT INTO public.templates (
            user_id,
            owner_id,
            nome,           -- ✅ Usando 'nome' (não 'name')
            conteudo,       -- ✅ Usando 'conteudo' (não 'content')
            canal,
            status,
            attachments,
            font_size_px
        ) VALUES (
            test_user_id,
            test_user_id,
            'Template de Teste Corrigido',
            'Conteúdo de teste corrigido',
            'email',
            'ativo',
            '[]'::jsonb,
            '16px'
        ) RETURNING id INTO test_template_id;
        
        -- Limpar o teste
        DELETE FROM public.templates WHERE id = test_template_id;
        
        RAISE NOTICE '✅ Teste de inserção bem-sucedido com nomes corretos!';
    ELSE
        RAISE NOTICE '⚠️ Nenhum usuário encontrado para teste';
    END IF;
END $$;

-- 9. VERIFICAR RESULTADO
SELECT '✅ Script de correção de nomes de colunas executado com sucesso!' as status;


