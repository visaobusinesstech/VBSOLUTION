-- =====================================================
-- CORREÇÃO DO ISOLAMENTO DE DADOS - FORNECEDORES
-- =====================================================
-- Este script corrige o problema de fornecedores aparecendo entre contas diferentes

-- 1. VERIFICAR E HABILITAR RLS NA TABELA SUPPLIERS
-- =====================================================
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- 2. REMOVER POLÍTICAS EXISTENTES (se houver)
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can insert suppliers for their company" ON public.suppliers;
DROP POLICY IF EXISTS "Users can update their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can delete their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "company_isolation_suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can view suppliers of their company" ON public.suppliers;
DROP POLICY IF EXISTS "Users can create suppliers in their company" ON public.suppliers;
DROP POLICY IF EXISTS "Users can update suppliers in their company" ON public.suppliers;
DROP POLICY IF EXISTS "Users can delete suppliers in their company" ON public.suppliers;

-- 3. CRIAR POLÍTICAS CORRETAS PARA ISOLAMENTO POR EMPRESA
-- =====================================================

-- Política para SELECT - usuários só podem ver seus próprios fornecedores
CREATE POLICY "suppliers_select_policy" ON public.suppliers
    FOR SELECT USING (auth.uid() = owner_id);

-- Política para INSERT - usuários só podem criar fornecedores para si mesmos
CREATE POLICY "suppliers_insert_policy" ON public.suppliers
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Política para UPDATE - usuários só podem atualizar seus próprios fornecedores
CREATE POLICY "suppliers_update_policy" ON public.suppliers
    FOR UPDATE USING (auth.uid() = owner_id);

-- Política para DELETE - usuários só podem excluir seus próprios fornecedores
CREATE POLICY "suppliers_delete_policy" ON public.suppliers
    FOR DELETE USING (auth.uid() = owner_id);

-- 4. MIGRAR DADOS EXISTENTES PARA INCLUIR COMPANY_ID
-- =====================================================
-- Atualizar fornecedores existentes que não têm company_id
UPDATE public.suppliers 
SET company_id = (
    SELECT p.company_id 
    FROM public.profiles p 
    WHERE p.id = suppliers.owner_id
    LIMIT 1
)
WHERE company_id IS NULL;

-- 5. VERIFICAR SE A MIGRAÇÃO FUNCIONOU
-- =====================================================
DO $$
DECLARE
    suppliers_without_company INTEGER;
    total_suppliers INTEGER;
BEGIN
    SELECT COUNT(*) INTO suppliers_without_company 
    FROM public.suppliers 
    WHERE company_id IS NULL;
    
    SELECT COUNT(*) INTO total_suppliers 
    FROM public.suppliers;
    
    RAISE NOTICE 'Total de fornecedores: %', total_suppliers;
    RAISE NOTICE 'Fornecedores sem company_id: %', suppliers_without_company;
    
    IF suppliers_without_company = 0 THEN
        RAISE NOTICE '✅ Migração concluída com sucesso! Todos os fornecedores têm company_id.';
    ELSE
        RAISE NOTICE '⚠️ Ainda existem % fornecedores sem company_id.', suppliers_without_company;
    END IF;
END $$;

-- 6. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_suppliers_company_id ON public.suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_owner_id ON public.suppliers(owner_id);

-- 7. VERIFICAR POLÍTICAS CRIADAS
-- =====================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'suppliers' 
ORDER BY policyname;
