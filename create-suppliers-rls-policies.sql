-- Políticas RLS para a tabela suppliers
-- Execute este script no SQL Editor do Supabase

-- 1. Habilitar RLS na tabela suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- 2. Política para SELECT - usuários podem ver apenas seus próprios fornecedores
CREATE POLICY "Users can view their own suppliers" ON public.suppliers
    FOR SELECT USING (
        auth.uid() = owner_id OR 
        auth.uid() IN (
            SELECT id FROM public.user_profiles 
            WHERE company_id = suppliers.company_id
        )
    );

-- 3. Política para INSERT - usuários podem inserir fornecedores para sua empresa
CREATE POLICY "Users can insert suppliers for their company" ON public.suppliers
    FOR INSERT WITH CHECK (
        auth.uid() = owner_id AND
        (
            company_id IN (
                SELECT company_id FROM public.user_profiles 
                WHERE id = auth.uid()
            ) OR
            company_id IN (
                SELECT company_id FROM public.company_users 
                WHERE id = auth.uid()
            )
        )
    );

-- 4. Política para UPDATE - usuários podem atualizar seus próprios fornecedores
CREATE POLICY "Users can update their own suppliers" ON public.suppliers
    FOR UPDATE USING (
        auth.uid() = owner_id
    ) WITH CHECK (
        auth.uid() = owner_id
    );

-- 5. Política para DELETE - usuários podem deletar seus próprios fornecedores
CREATE POLICY "Users can delete their own suppliers" ON public.suppliers
    FOR DELETE USING (
        auth.uid() = owner_id
    );

-- 6. Política alternativa mais permissiva para desenvolvimento
-- (Descomente se as políticas acima não funcionarem)
/*
DROP POLICY IF EXISTS "Users can view their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can insert suppliers for their company" ON public.suppliers;
DROP POLICY IF EXISTS "Users can update their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can delete their own suppliers" ON public.suppliers;

-- Política mais permissiva para desenvolvimento
CREATE POLICY "Allow all operations for authenticated users" ON public.suppliers
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
*/
