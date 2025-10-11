-- =========================================================
-- CORRIGIR POLÍTICAS RLS PARA TABELA TEMPLATES
-- Execute este script no SQL Editor do Supabase
-- =========================================================

-- 1. VERIFICAR STATUS DO RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'templates' AND schemaname = 'public';

-- 2. REMOVER POLÍTICAS EXISTENTES (se necessário)
DROP POLICY IF EXISTS "Users can view their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can insert their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.templates;

-- 3. CRIAR POLÍTICAS RLS CORRETAS
-- Política para SELECT
CREATE POLICY "Users can view their own templates" ON public.templates
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = owner_id
    );

-- Política para INSERT
CREATE POLICY "Users can insert their own templates" ON public.templates
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND 
        auth.uid() = owner_id
    );

-- Política para UPDATE
CREATE POLICY "Users can update their own templates" ON public.templates
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.uid() = owner_id
    ) WITH CHECK (
        auth.uid() = user_id OR 
        auth.uid() = owner_id
    );

-- Política para DELETE
CREATE POLICY "Users can delete their own templates" ON public.templates
    FOR DELETE USING (
        auth.uid() = user_id OR 
        auth.uid() = owner_id
    );

-- 4. VERIFICAR SE RLS ESTÁ HABILITADO
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- 5. VERIFICAR POLÍTICAS CRIADAS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'templates' AND schemaname = 'public'
ORDER BY policyname;

-- 6. TESTE DE PERMISSÕES
DO $$
DECLARE
    current_user_id UUID;
    test_result TEXT;
BEGIN
    -- Obter o usuário atual
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        -- Verificar se pode inserir
        BEGIN
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
                current_user_id,
                current_user_id,
                'Teste RLS',
                'Teste de permissões',
                'email',
                'ativo',
                '[]'::jsonb,
                '16px'
            );
            
            -- Limpar o teste
            DELETE FROM public.templates 
            WHERE nome = 'Teste RLS' AND user_id = current_user_id;
            
            test_result := '✅ Teste de INSERT bem-sucedido';
        EXCEPTION
            WHEN OTHERS THEN
                test_result := '❌ Erro no teste de INSERT: ' || SQLERRM;
        END;
        
        RAISE NOTICE '%', test_result;
    ELSE
        RAISE NOTICE '⚠️ Usuário não autenticado para teste';
    END IF;
END $$;

-- 7. VERIFICAR RESULTADO
SELECT '✅ Políticas RLS configuradas com sucesso!' as status;