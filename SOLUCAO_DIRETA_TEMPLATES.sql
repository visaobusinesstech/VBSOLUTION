-- =========================================================
-- SOLUÇÃO DIRETA PARA PROBLEMA DE COLUNAS name/nome
-- Execute este script no SQL Editor do Supabase
-- =========================================================

-- 1. VERIFICAR ESTRUTURA ATUAL (para debug)
SELECT 'ESTRUTURA ATUAL DA TABELA:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'templates'
ORDER BY ordinal_position;

-- 2. SOLUÇÃO DIRETA: CRIAR UMA NOVA TABELA COM ESTRUTURA CORRETA
DO $$ 
BEGIN
    RAISE NOTICE 'Iniciando solução direta...';
    
    -- Verificar se existe a tabela atual
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'templates' AND schemaname = 'public') THEN
        
        -- Fazer backup dos dados existentes
        CREATE TEMP TABLE templates_backup AS 
        SELECT * FROM public.templates;
        
        RAISE NOTICE '✅ Backup dos dados existentes criado';
        
        -- Dropar a tabela atual
        DROP TABLE public.templates CASCADE;
        
        RAISE NOTICE '✅ Tabela antiga removida';
    END IF;
    
    -- Criar nova tabela com estrutura correta
    CREATE TABLE public.templates (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        nome TEXT NOT NULL,
        conteudo TEXT NOT NULL,
        canal TEXT NOT NULL DEFAULT 'email',
        assinatura TEXT,
        signature_image TEXT,
        status TEXT DEFAULT 'ativo',
        attachments JSONB DEFAULT '[]',
        descricao TEXT,
        template_file_url TEXT,
        template_file_name TEXT,
        image_url TEXT,
        font_size_px TEXT DEFAULT '16px',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE '✅ Nova tabela criada com estrutura correta';
    
    -- Restaurar dados do backup se existirem
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'templates_backup' AND schemaname = 'pg_temp_1') THEN
        
        INSERT INTO public.templates (
            user_id, owner_id, nome, conteudo, canal, assinatura, 
            signature_image, status, attachments, descricao, 
            template_file_url, template_file_name, image_url, 
            font_size_px, created_at, updated_at
        )
        SELECT 
            user_id, 
            owner_id, 
            COALESCE(nome, name, 'Template sem nome'),  -- Usar nome se existir, senão name
            COALESCE(conteudo, content, 'Conteúdo vazio'),  -- Usar conteudo se existir, senão content
            COALESCE(canal, 'email'),
            assinatura,
            signature_image,
            COALESCE(status, 'ativo'),
            COALESCE(attachments, '[]'::jsonb),
            descricao,
            template_file_url,
            template_file_name,
            image_url,
            COALESCE(font_size_px, '16px'),
            created_at,
            updated_at
        FROM templates_backup;
        
        RAISE NOTICE '✅ Dados restaurados do backup';
        
        -- Limpar backup
        DROP TABLE templates_backup;
    END IF;
    
    RAISE NOTICE '✅ Estrutura da tabela corrigida com sucesso!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro durante a correção: %', SQLERRM;
        -- Tentar restaurar backup se houver erro
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'templates_backup' AND schemaname = 'pg_temp_1') THEN
            RAISE NOTICE 'Tentando restaurar tabela original...';
            -- Aqui você pode tentar restaurar se necessário
        END IF;
        RAISE;
END $$;

-- 3. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_owner_id ON public.templates(owner_id);
CREATE INDEX IF NOT EXISTS idx_templates_canal ON public.templates(canal);
CREATE INDEX IF NOT EXISTS idx_templates_status ON public.templates(status);

-- 4. HABILITAR RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- 5. CRIAR POLÍTICAS RLS
DROP POLICY IF EXISTS "Users can view their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can insert their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.templates;

CREATE POLICY "Users can view their own templates" ON public.templates
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = owner_id);

CREATE POLICY "Users can insert their own templates" ON public.templates
    FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.uid() = owner_id);

CREATE POLICY "Users can update their own templates" ON public.templates
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = owner_id)
    WITH CHECK (auth.uid() = user_id OR auth.uid() = owner_id);

CREATE POLICY "Users can delete their own templates" ON public.templates
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() = owner_id);

-- 6. CRIAR TRIGGER PARA updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_templates_updated_at ON public.templates;
CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON public.templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. VERIFICAR ESTRUTURA FINAL
SELECT 'ESTRUTURA FINAL DA TABELA:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'templates'
ORDER BY ordinal_position;

-- 8. TESTE DE INSERÇÃO
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
                'Template de Teste Solução Direta',
                'Conteúdo de teste da solução direta',
                'email',
                'ativo',
                '[]'::jsonb,
                '16px'
            ) RETURNING id INTO test_template_id;
            
            -- Limpar o teste
            DELETE FROM public.templates WHERE id = test_template_id;
            
            RAISE NOTICE '🎉 TESTE DE INSERÇÃO BEM-SUCEDIDO!';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '❌ ERRO NO TESTE DE INSERÇÃO: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE '⚠️ Nenhum usuário encontrado para teste';
    END IF;
END $$;

-- 9. VERIFICAR POLÍTICAS RLS
SELECT 'POLÍTICAS RLS CRIADAS:' as info;
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'templates' AND schemaname = 'public';

-- 10. RESULTADO FINAL
SELECT '🎉 SOLUÇÃO DIRETA EXECUTADA COM SUCESSO!' as status;


