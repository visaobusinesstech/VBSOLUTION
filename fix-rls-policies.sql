-- Script para corrigir políticas RLS
-- Execute este script no Supabase Dashboard

-- 1. Verificar políticas RLS existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('leads', 'atendimentos', 'tickets')
ORDER BY tablename, policyname;

-- 2. Remover políticas existentes
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.leads;
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.atendimentos;
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.tickets;

-- 3. Criar políticas RLS mais permissivas para desenvolvimento
CREATE POLICY "Enable all operations for all users" ON public.leads 
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for all users" ON public.atendimentos 
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for all users" ON public.tickets 
FOR ALL USING (true) WITH CHECK (true);

-- 4. Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('leads', 'atendimentos', 'tickets')
AND schemaname = 'public';

-- 5. Se RLS não estiver habilitado, habilitar
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 6. Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('leads', 'atendimentos', 'tickets')
ORDER BY tablename, policyname;

-- 7. Testar inserção de lead
INSERT INTO public.leads (name, email, phone, company, source, status, priority, value, currency, notes) VALUES
('Teste RLS', 'teste@rls.com', '(11) 99999-9999', 'Empresa Teste RLS', 'test', 'new', 'medium', 1000, 'BRL', 'Teste de políticas RLS');

-- 8. Verificar se foi inserido
SELECT COUNT(*) as total_leads FROM public.leads;
SELECT id, name, email, status FROM public.leads ORDER BY created_at DESC LIMIT 5;
