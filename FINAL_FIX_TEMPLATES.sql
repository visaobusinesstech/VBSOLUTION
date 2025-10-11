-- =========================================================
-- CORREÇÃO DEFINITIVA PARA TABELA TEMPLATES
-- Execute este script no SQL Editor do Supabase
-- =========================================================

-- 1. PRIMEIRO: VERIFICAR ESTRUTURA ATUAL
SELECT 'ESTRUTURA ATUAL:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'templates'
ORDER BY ordinal_position;

-- 2. CORRIGIR PROBLEMAS DE NOMES DE COLUNAS
DO $$ 
BEGIN
    RAISE NOTICE 'Iniciando correção de nomes de colunas...';
    
    -- Se existe 'name' mas não 'nome', renomear
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'name' AND table_schema = 'public')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'nome' AND table_schema = 'public') THEN
        
        ALTER TABLE public.templates RENAME COLUMN name TO nome;
        RAISE NOTICE '✅ Coluna "name" renomeada para "nome"';
    END IF;
    
    -- Se existe 'content' mas não 'conteudo', renomear
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'content' AND table_schema = 'public')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'conteudo' AND table_schema = 'public') THEN
        
        ALTER TABLE public.templates RENAME COLUMN content TO conteudo;
        RAISE NOTICE '✅ Coluna "content" renomeada para "conteudo"';
    END IF;
    
    -- Se existe 'description' mas não 'descricao', renomear
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'description' AND table_schema = 'public')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'descricao' AND table_schema = 'public') THEN
        
        ALTER TABLE public.templates RENAME COLUMN description TO descricao;
        RAISE NOTICE '✅ Coluna "description" renomeada para "descricao"';
    END IF;
    
    RAISE NOTICE 'Correção de nomes de colunas concluída.';
END $$;

-- 3. GARANTIR QUE TODAS AS COLUNAS NECESSÁRIAS EXISTAM
DO $$ 
BEGIN
    RAISE NOTICE 'Verificando e criando colunas necessárias...';
    
    -- Adicionar colunas se não existirem
    ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
    ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS nome TEXT;
    ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS conteudo TEXT;
    ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS canal TEXT DEFAULT 'email';
    ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS assinatura TEXT;
    ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS signature_image TEXT;
    ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo';
    ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
    ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS descricao TEXT;
    ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS template_file_url TEXT;
    ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS template_file_name TEXT;
    ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS image_url TEXT;
    ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS font_size_px TEXT DEFAULT '16px';
    ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    RAISE NOTICE 'Colunas verificadas/criadas.';
END $$;

-- 4. CORRIGIR CONSTRAINTS E VALORES PADRÃO
DO $$ 
BEGIN
    RAISE NOTICE 'Aplicando constraints e valores padrão...';
    
    -- Aplicar constraints NOT NULL apenas se a coluna existir
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'nome' AND table_schema = 'public') THEN
        ALTER TABLE public.templates ALTER COLUMN nome SET NOT NULL;
        RAISE NOTICE '✅ Constraint NOT NULL aplicada em "nome"';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'conteudo' AND table_schema = 'public') THEN
        ALTER TABLE public.templates ALTER COLUMN conteudo SET NOT NULL;
        RAISE NOTICE '✅ Constraint NOT NULL aplicada em "conteudo"';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'canal' AND table_schema = 'public') THEN
        ALTER TABLE public.templates ALTER COLUMN canal SET NOT NULL;
        ALTER TABLE public.templates ALTER COLUMN canal SET DEFAULT 'email';
        RAISE NOTICE '✅ Constraint NOT NULL e DEFAULT aplicados em "canal"';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'status' AND table_schema = 'public') THEN
        ALTER TABLE public.templates ALTER COLUMN status SET DEFAULT 'ativo';
        RAISE NOTICE '✅ DEFAULT aplicado em "status"';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'font_size_px' AND table_schema = 'public') THEN
        ALTER TABLE public.templates ALTER COLUMN font_size_px SET DEFAULT '16px';
        RAISE NOTICE '✅ DEFAULT aplicado em "font_size_px"';
    END IF;
    
    RAISE NOTICE 'Constraints aplicadas.';
END $$;

-- 5. CORRIGIR DADOS EXISTENTES
UPDATE public.templates 
SET 
    nome = CASE 
        WHEN nome IS NULL OR nome = '' THEN 'Template sem nome'
        ELSE nome 
    END,
    conteudo = CASE 
        WHEN conteudo IS NULL OR conteudo = '' THEN 'Conteúdo vazio'
        ELSE conteudo 
    END,
    canal = COALESCE(canal, 'email'),
    status = COALESCE(status, 'ativo'),
    font_size_px = COALESCE(font_size_px, '16px'),
    attachments = COALESCE(attachments, '[]'::jsonb)
WHERE 
    nome IS NULL 
    OR conteudo IS NULL 
    OR canal IS NULL 
    OR status IS NULL 
    OR font_size_px IS NULL 
    OR attachments IS NULL;

-- 6. VERIFICAR ESTRUTURA APÓS CORREÇÃO
SELECT 'ESTRUTURA APÓS CORREÇÃO:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'templates'
ORDER BY ordinal_position;

-- 7. TESTE FINAL DE INSERÇÃO
DO $$
DECLARE
    test_user_id UUID;
    test_template_id UUID;
BEGIN
    RAISE NOTICE 'Executando teste de inserção...';
    
    -- Obter um usuário existente
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        BEGIN
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
                'Template de Teste Final',
                'Conteúdo de teste final',
                'email',
                'ativo',
                '[]'::jsonb,
                '16px'
            ) RETURNING id INTO test_template_id;
            
            -- Limpar o teste
            DELETE FROM public.templates WHERE id = test_template_id;
            
            RAISE NOTICE '✅ TESTE DE INSERÇÃO BEM-SUCEDIDO!';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '❌ ERRO NO TESTE DE INSERÇÃO: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE '⚠️ Nenhum usuário encontrado para teste';
    END IF;
END $$;

-- 8. VERIFICAR POLÍTICAS RLS
DO $$ 
BEGIN
    RAISE NOTICE 'Verificando políticas RLS...';
    
    -- Habilitar RLS
    ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
    
    -- Remover políticas existentes
    DROP POLICY IF EXISTS "Users can view their own templates" ON public.templates;
    DROP POLICY IF EXISTS "Users can insert their own templates" ON public.templates;
    DROP POLICY IF EXISTS "Users can update their own templates" ON public.templates;
    DROP POLICY IF EXISTS "Users can delete their own templates" ON public.templates;
    
    -- Criar novas políticas
    CREATE POLICY "Users can view their own templates" ON public.templates
        FOR SELECT USING (auth.uid() = user_id OR auth.uid() = owner_id);
    
    CREATE POLICY "Users can insert their own templates" ON public.templates
        FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.uid() = owner_id);
    
    CREATE POLICY "Users can update their own templates" ON public.templates
        FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = owner_id)
        WITH CHECK (auth.uid() = user_id OR auth.uid() = owner_id);
    
    CREATE POLICY "Users can delete their own templates" ON public.templates
        FOR DELETE USING (auth.uid() = user_id OR auth.uid() = owner_id);
    
    RAISE NOTICE '✅ Políticas RLS configuradas';
END $$;

-- 9. RESULTADO FINAL
SELECT '🎉 CORREÇÃO DEFINITIVA CONCLUÍDA COM SUCESSO!' as status;


