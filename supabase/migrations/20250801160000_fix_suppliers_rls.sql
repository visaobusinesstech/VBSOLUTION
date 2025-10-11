-- Migração para corrigir as políticas RLS da tabela suppliers
-- Data: 2025-08-01
-- Problema: A tabela suppliers tem RLS habilitado mas não tem políticas definidas
-- Solução: Criar políticas RLS apropriadas para fornecedores

-- 1. Verificar se a tabela suppliers existe e tem RLS habilitado
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
        RAISE EXCEPTION 'Tabela suppliers não existe';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'suppliers' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE 'Habilitando RLS na tabela suppliers...';
        ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
    ELSE
        RAISE NOTICE '✅ RLS já está habilitado na tabela suppliers';
    END IF;
END $$;

-- 2. Remover políticas existentes (se houver) para evitar conflitos
DROP POLICY IF EXISTS "Usuários podem ver e editar apenas seus próprios fornecedores" ON public.suppliers;
DROP POLICY IF EXISTS "Usuários podem ver e editar fornecedores de suas empresas" ON public.suppliers;
DROP POLICY IF EXISTS "Allow all access to suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can view suppliers of their company" ON public.suppliers;
DROP POLICY IF EXISTS "Users can create suppliers in their company" ON public.suppliers;
DROP POLICY IF EXISTS "Users can update suppliers in their company" ON public.suppliers;
DROP POLICY IF EXISTS "Users can delete suppliers in their company" ON public.suppliers;

-- 3. Criar novas políticas RLS para suppliers
-- Política para visualização: usuários só podem ver fornecedores de suas empresas
CREATE POLICY "Users can view suppliers of their company" ON public.suppliers
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.companies 
            WHERE owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) OR
                  created_by = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())
        )
    );

-- Política para criação: usuários só podem criar fornecedores para suas empresas
CREATE POLICY "Users can create suppliers in their company" ON public.suppliers
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT id FROM public.companies 
            WHERE owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) OR
                  created_by = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())
        ) AND
        created_by = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())
    );

-- Política para atualização: usuários só podem atualizar fornecedores de suas empresas
CREATE POLICY "Users can update suppliers in their company" ON public.suppliers
    FOR UPDATE USING (
        company_id IN (
            SELECT id FROM public.companies 
            WHERE owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) OR
                  created_by = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())
        )
    );

-- Política para exclusão: usuários só podem excluir fornecedores de suas empresas
CREATE POLICY "Users can delete suppliers in their company" ON public.suppliers
    FOR DELETE USING (
        company_id IN (
            SELECT id FROM public.companies 
            WHERE owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) OR
                  created_by = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())
        )
    );

-- 4. Verificar se as políticas foram criadas corretamente
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'suppliers';
    
    RAISE NOTICE 'Verificando políticas RLS para suppliers...';
    
    IF policy_count >= 4 THEN
        RAISE NOTICE '✅ % políticas RLS criadas com sucesso para suppliers', policy_count;
    ELSE
        RAISE NOTICE '❌ Apenas % políticas RLS foram criadas (esperado: 4)', policy_count;
    END IF;
    
    -- Listar as políticas criadas
    RAISE NOTICE 'Políticas criadas:';
    FOR policy_rec IN 
        SELECT policyname, cmd, qual 
        FROM pg_policies 
        WHERE tablename = 'suppliers'
        ORDER BY policyname
    LOOP
        RAISE NOTICE '- %: %', policy_rec.policyname, policy_rec.cmd;
    END LOOP;
END $$;

-- 5. Verificar se a tabela suppliers tem as colunas necessárias
DO $$
BEGIN
    RAISE NOTICE 'Verificando estrutura da tabela suppliers...';
    
    -- Verificar colunas essenciais
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'company_id'
    ) THEN
        RAISE NOTICE '✅ Coluna company_id existe';
    ELSE
        RAISE NOTICE '❌ Coluna company_id não existe';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'created_by'
    ) THEN
        RAISE NOTICE '✅ Coluna created_by existe';
    ELSE
        RAISE NOTICE '❌ Coluna created_by não existe';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'responsible_id'
    ) THEN
        RAISE NOTICE '✅ Coluna responsible_id existe';
    ELSE
        RAISE NOTICE '❌ Coluna responsible_id não existe';
    END IF;
END $$;

-- 6. Adicionar comentários para documentação
COMMENT ON TABLE public.suppliers IS 'Tabela de fornecedores das empresas';
COMMENT ON COLUMN public.suppliers.company_id IS 'ID da empresa à qual o fornecedor pertence';
COMMENT ON COLUMN public.suppliers.created_by IS 'ID do usuário que criou o fornecedor';
COMMENT ON COLUMN public.suppliers.responsible_id IS 'ID do usuário responsável pelo fornecedor';

-- 7. Verificação final
SELECT '=== VERIFICAÇÃO FINAL - SUPPLIERS RLS ===' as info;
SELECT 'Tabela suppliers:' as info, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') 
            THEN 'EXISTE' ELSE 'NÃO EXISTE' END as status;
SELECT 'RLS habilitado:' as info, 
       CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'suppliers' AND rowsecurity = true) 
            THEN 'SIM' ELSE 'NÃO' END as status;
SELECT 'Políticas RLS:' as info, COUNT(*) as total FROM pg_policies WHERE tablename = 'suppliers';
