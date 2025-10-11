
-- Execute este script no SQL Editor do Supabase para corrigir o problema:

-- 1. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can insert suppliers for their company" ON public.suppliers;
DROP POLICY IF EXISTS "Users can update their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can delete their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.suppliers;

-- 2. Criar política permissiva para desenvolvimento
CREATE POLICY "Allow all operations for authenticated users" ON public.suppliers
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 3. Alternativa: Desabilitar RLS temporariamente (não recomendado para produção)
-- ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;
        