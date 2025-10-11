-- Migração para inserir dados de exemplo
-- Data: 2025-08-01

-- Inserir empresas de exemplo se não existirem
INSERT INTO public.companies (id, name, fantasy_name, email, phone, status)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tech Solutions', 'Tech Solutions Ltda', 'contato@techsolutions.com', '(11) 3456-7890', 'active'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Marketing Pro', 'Marketing Pro Comunicação', 'vendas@marketingpro.com', '(21) 2345-6789', 'active'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Logística Express', 'Logística Express S.A.', 'comercial@logexpress.com', '(31) 3456-7890', 'active')
ON CONFLICT (id) DO NOTHING;

-- Inserir usuário de exemplo se não existir
INSERT INTO public.user_profiles (id, name, email, role)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Usuário Teste', 'teste@exemplo.com', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Inserir etapas do funil se não existirem
INSERT INTO public.funnel_stages (id, name, order_index, color, company_id, created_by)
VALUES 
    ('stage-001-0000-0000-0000-000000000001', 'Contato Inicial', 1, '#3b82f6', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001'),
    ('stage-002-0000-0000-0000-000000000002', 'Proposta', 2, '#8b5cf6', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001'),
    ('stage-003-0000-0000-0000-000000000003', 'Reunião Meet', 3, '#f59e0b', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001'),
    ('stage-004-0000-0000-0000-000000000004', 'Fechamento', 4, '#ef4444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001'),
    ('stage-005-0000-0000-0000-000000000005', 'Boas Vindas', 5, '#10b981', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;
