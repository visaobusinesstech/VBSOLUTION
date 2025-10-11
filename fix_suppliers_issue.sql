-- =====================================================
-- CORREÇÃO DO PROBLEMA DE CRIAÇÃO DE FORNECEDORES
-- =====================================================
-- Execute este script no Supabase SQL Editor para corrigir o erro 403
-- =====================================================

-- 1. VERIFICAR ESTRUTURA ATUAL DA TABELA SUPPLIERS
SELECT '=== ESTRUTURA ATUAL DA TABELA SUPPLIERS ===' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'suppliers' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VERIFICAR POLÍTICAS RLS ATUAIS
SELECT '=== POLÍTICAS RLS ATUAIS ===' as info;

SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'suppliers';

-- 3. VERIFICAR SE RLS ESTÁ HABILITADO
SELECT '=== STATUS DO RLS ===' as info;

SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'suppliers';

-- 4. CORRIGIR ESTRUTURA DA TABELA SUPPLIERS
-- Adicionar colunas que podem estar faltando
DO $$
BEGIN
    -- Adicionar coluna owner_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'owner_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.suppliers ADD COLUMN owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Coluna owner_id adicionada à tabela suppliers';
    ELSE
        RAISE NOTICE '✅ Coluna owner_id já existe na tabela suppliers';
    END IF;

    -- Adicionar coluna fantasy_name se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'fantasy_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.suppliers ADD COLUMN fantasy_name TEXT;
        RAISE NOTICE '✅ Coluna fantasy_name adicionada à tabela suppliers';
    ELSE
        RAISE NOTICE '✅ Coluna fantasy_name já existe na tabela suppliers';
    END IF;

    -- Adicionar coluna notes se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'notes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.suppliers ADD COLUMN notes TEXT;
        RAISE NOTICE '✅ Coluna notes adicionada à tabela suppliers';
    ELSE
        RAISE NOTICE '✅ Coluna notes já existe na tabela suppliers';
    END IF;
END $$;

-- 5. REMOVER TODAS AS POLÍTICAS RLS EXISTENTES
DROP POLICY IF EXISTS "Users can view suppliers of their company" ON public.suppliers;
DROP POLICY IF EXISTS "Users can create suppliers in their company" ON public.suppliers;
DROP POLICY IF EXISTS "Users can update suppliers in their company" ON public.suppliers;
DROP POLICY IF EXISTS "Users can delete suppliers in their company" ON public.suppliers;
DROP POLICY IF EXISTS "Allow all access to suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Usuários podem ver e editar apenas seus próprios fornecedores" ON public.suppliers;

-- 6. CRIAR POLÍTICAS RLS SIMPLIFICADAS (BASEADAS EM owner_id)
-- Política para visualização
CREATE POLICY "Users can view their own suppliers" ON public.suppliers
    FOR SELECT USING (
        owner_id = (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    );

-- Política para criação
CREATE POLICY "Users can create suppliers" ON public.suppliers
    FOR INSERT WITH CHECK (
        owner_id = (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    );

-- Política para atualização
CREATE POLICY "Users can update their own suppliers" ON public.suppliers
    FOR UPDATE USING (
        owner_id = (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    );

-- Política para exclusão
CREATE POLICY "Users can delete their own suppliers" ON public.suppliers
    FOR DELETE USING (
        owner_id = (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    );

-- 7. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
SELECT '=== POLÍTICAS RLS CRIADAS ===' as info;

SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'suppliers'
ORDER BY policyname;

-- 8. TESTAR INSERÇÃO (substitua 'user_id_aqui' pelo ID real do usuário logado)
-- DESCOMENTE E EXECUTE ESTA PARTE PARA TESTAR:
/*
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Pegar o ID do usuário atual
    SELECT id INTO test_user_id FROM public.profiles WHERE auth_user_id = auth.uid();
    
    IF test_user_id IS NOT NULL THEN
        -- Inserir fornecedor de teste
        INSERT INTO public.suppliers (
            name,
            fantasy_name,
            cnpj,
            phone,
            city,
            state,
            notes,
            owner_id
        ) VALUES (
            'Fornecedor Teste',
            'Empresa Teste LTDA',
            '12.345.678/0001-90',
            '(11) 99999-9999',
            'São Paulo',
            'SP',
            'Fornecedor de teste criado automaticamente',
            test_user_id
        );
        
        RAISE NOTICE '✅ Fornecedor de teste criado com sucesso!';
        
        -- Verificar se foi criado
        IF EXISTS (SELECT 1 FROM public.suppliers WHERE name = 'Fornecedor Teste') THEN
            RAISE NOTICE '✅ Fornecedor encontrado na base de dados';
        ELSE
            RAISE NOTICE '❌ Fornecedor não foi encontrado na base de dados';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ Usuário não encontrado. Certifique-se de estar logado.';
    END IF;
END $$;
*/

-- 9. VERIFICAÇÃO FINAL
SELECT '=== VERIFICAÇÃO FINAL ===' as info;
SELECT 'Tabela suppliers existe:' as info, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') 
            THEN 'SIM' ELSE 'NÃO' END as status;
SELECT 'RLS habilitado:' as info, 
       CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'suppliers' AND rowsecurity = true) 
            THEN 'SIM' ELSE 'NÃO' END as status;
SELECT 'Total de políticas RLS:' as info, COUNT(*) as total FROM pg_policies WHERE tablename = 'suppliers';
SELECT 'Coluna owner_id existe:' as info,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'owner_id') 
            THEN 'SIM' ELSE 'NÃO' END as status;
