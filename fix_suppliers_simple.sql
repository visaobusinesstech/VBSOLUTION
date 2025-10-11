-- Correção simples das políticas RLS da tabela suppliers
-- Este arquivo deve ser executado diretamente no Supabase

-- 1. Remover políticas existentes (se houver) para evitar conflitos
DROP POLICY IF EXISTS "Usuários podem ver e editar apenas seus próprios fornecedores" ON public.suppliers;
DROP POLICY IF EXISTS "Usuários podem ver e editar fornecedores de suas empresas" ON public.suppliers;
DROP POLICY IF EXISTS "Allow all access to suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can view suppliers of their company" ON public.suppliers;
DROP POLICY IF EXISTS "Users can create suppliers in their company" ON public.suppliers;
DROP POLICY IF EXISTS "Users can update suppliers in their company" ON public.suppliers;
DROP POLICY IF EXISTS "Users can delete suppliers in their company" ON public.suppliers;

-- 2. Criar políticas RLS simples para suppliers
-- Política para visualização: permitir acesso total temporariamente
CREATE POLICY "Allow all access to suppliers temporarily" ON public.suppliers
    FOR ALL USING (true);

-- 3. Verificar se as políticas foram criadas
SELECT 'Políticas RLS para suppliers:' as info;
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'suppliers';
