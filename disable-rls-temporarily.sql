-- Script para desabilitar RLS temporariamente para desenvolvimento
-- Execute este script no Supabase Dashboard

-- 1. Desabilitar RLS temporariamente
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendimentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se RLS foi desabilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('leads', 'atendimentos', 'tickets')
AND schemaname = 'public';

-- 3. Testar inserção de lead
INSERT INTO public.leads (name, email, phone, company, source, status, priority, value, currency, notes) VALUES
('Teste Sem RLS', 'teste@semrls.com', '(11) 99999-9999', 'Empresa Teste Sem RLS', 'test', 'new', 'medium', 1000, 'BRL', 'Teste sem RLS');

-- 4. Verificar se foi inserido
SELECT COUNT(*) as total_leads FROM public.leads;
SELECT id, name, email, status FROM public.leads ORDER BY created_at DESC LIMIT 5;

-- 5. Inserir mais dados de teste
INSERT INTO public.leads (name, email, phone, company, source, status, priority, value, currency, notes) VALUES
('João Silva', 'joao@email.com', '(11) 99999-9999', 'Empresa ABC', 'website', 'new', 'high', 5000.00, 'BRL', 'Lead de teste'),
('Maria Santos', 'maria@email.com', '(11) 88888-8888', 'Empresa XYZ', 'referral', 'contacted', 'medium', 3000.00, 'BRL', 'Lead em contato inicial'),
('Pedro Costa', 'pedro@email.com', '(11) 77777-7777', 'Empresa DEF', 'social_media', 'qualified', 'high', 7500.00, 'BRL', 'Lead qualificado');

-- 6. Verificar total de leads
SELECT 'Total de leads após inserção:' as status;
SELECT COUNT(*) as total_leads FROM public.leads;

-- 7. Verificar relacionamentos (atendimentos e tickets)
SELECT 'Verificação dos relacionamentos:' as status;
SELECT 
    l.id as lead_id,
    l.name as lead_name,
    l.status as lead_status,
    a.id as atendimento_id,
    a.status as atendimento_status,
    t.id as ticket_id,
    t.subject as ticket_subject
FROM public.leads l
LEFT JOIN public.atendimentos a ON a.lead_id = l.id
LEFT JOIN public.tickets t ON t.atendimento_id = a.id
ORDER BY l.created_at DESC;

SELECT '✅ RLS DESABILITADO E DADOS INSERIDOS COM SUCESSO!' as status;
