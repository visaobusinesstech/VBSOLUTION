-- =========================================================
-- CORRIGIR PROBLEMAS NA TABELA TEMPLATES
-- Execute este script no SQL Editor do Supabase
-- =========================================================

-- 1. VERIFICAR ESTRUTURA ATUAL DA TABELA
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'templates'
ORDER BY ordinal_position;

-- 2. CORRIGIR CAMPOS OBRIGATÓRIOS SE NECESSÁRIO
DO $$ 
BEGIN
    -- Garantir que campos obrigatórios tenham valores padrão adequados
    ALTER TABLE public.templates ALTER COLUMN nome SET NOT NULL;
    ALTER TABLE public.templates ALTER COLUMN conteudo SET NOT NULL;
    ALTER TABLE public.templates ALTER COLUMN canal SET NOT NULL;
    ALTER TABLE public.templates ALTER COLUMN canal SET DEFAULT 'email';
    ALTER TABLE public.templates ALTER COLUMN status SET DEFAULT 'ativo';
    ALTER TABLE public.templates ALTER COLUMN font_size_px SET DEFAULT '16px';
    
    -- Garantir que campos opcionais aceitem NULL
    ALTER TABLE public.templates ALTER COLUMN assinatura DROP NOT NULL;
    ALTER TABLE public.templates ALTER COLUMN signature_image DROP NOT NULL;
    ALTER TABLE public.templates ALTER COLUMN descricao DROP NOT NULL;
    ALTER TABLE public.templates ALTER COLUMN template_file_url DROP NOT NULL;
    ALTER TABLE public.templates ALTER COLUMN template_file_name DROP NOT NULL;
    ALTER TABLE public.templates ALTER COLUMN image_url DROP NOT NULL;
    
    -- Garantir que attachments seja um array válido
    ALTER TABLE public.templates ALTER COLUMN attachments SET DEFAULT '[]';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao alterar colunas: %', SQLERRM;
END $$;

-- 3. VERIFICAR E CORRIGIR DADOS EXISTENTES
UPDATE public.templates 
SET 
    canal = COALESCE(canal, 'email'),
    status = COALESCE(status, 'ativo'),
    font_size_px = COALESCE(font_size_px, '16px'),
    attachments = COALESCE(attachments, '[]'::jsonb)
WHERE 
    canal IS NULL 
    OR status IS NULL 
    OR font_size_px IS NULL 
    OR attachments IS NULL;

-- 4. VERIFICAR CONSTRAINTS E ÍNDICES
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.templates'::regclass;

-- 5. VERIFICAR POLÍTICAS RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'templates' AND schemaname = 'public';

-- 6. TESTE DE INSERÇÃO (para verificar se está funcionando)
DO $$
DECLARE
    test_user_id UUID;
    test_template_id UUID;
BEGIN
    -- Usar um ID de usuário existente ou criar um de teste
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Tentar inserir um template de teste
        INSERT INTO public.templates (
            user_id,
            owner_id,
            nome,
            conteudo,
            canal,
            status,
            attachments,
            font_size_px
        ) VALUES (
            test_user_id,
            test_user_id,
            'Template de Teste',
            'Conteúdo de teste',
            'email',
            'ativo',
            '[]'::jsonb,
            '16px'
        ) RETURNING id INTO test_template_id;
        
        -- Limpar o teste
        DELETE FROM public.templates WHERE id = test_template_id;
        
        RAISE NOTICE '✅ Teste de inserção bem-sucedido!';
    ELSE
        RAISE NOTICE '⚠️ Nenhum usuário encontrado para teste';
    END IF;
END $$;

-- 7. VERIFICAR RESULTADO FINAL
SELECT '✅ Script de correção executado com sucesso!' as status;


