
-- Inserir dados de demonstração para funnel_stages
INSERT INTO public.funnel_stages (id, name, order_position, color) VALUES
('11111111-1111-1111-1111-111111111111', 'Prospecção', 1, '#3b82f6'),
('22222222-2222-2222-2222-222222222222', 'Qualificação', 2, '#f59e0b'),
('33333333-3333-3333-3333-333333333333', 'Proposta', 3, '#8b5cf6'),
('44444444-4444-4444-4444-444444444444', 'Negociação', 4, '#ef4444'),
('55555555-5555-5555-5555-555555555555', 'Fechamento', 5, '#10b981')
ON CONFLICT (id) DO NOTHING;

-- Inserir dados de demonstração para team_members
INSERT INTO public.team_members (id, name, email, position) VALUES
('66666666-6666-6666-6666-666666666666', 'Ana Silva', 'ana.silva@empresa.com', 'Vendedora Sênior'),
('77777777-7777-7777-7777-777777777777', 'Carlos Santos', 'carlos.santos@empresa.com', 'Gerente de Vendas'),
('88888888-8888-8888-8888-888888888888', 'Mariana Costa', 'mariana.costa@empresa.com', 'Representante Comercial'),
('99999999-9999-9999-9999-999999999999', 'Roberto Lima', 'roberto.lima@empresa.com', 'Consultor de Vendas')
ON CONFLICT (id) DO NOTHING;

-- Inserir dados de demonstração para companies
INSERT INTO public.companies (id, fantasy_name, company_name, cnpj, email, phone, city, state, sector) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tech Solutions', 'Tech Solutions Ltda', '12.345.678/0001-90', 'contato@techsolutions.com', '(11) 3456-7890', 'São Paulo', 'SP', 'Tecnologia'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Marketing Pro', 'Marketing Pro Comunicação', '23.456.789/0001-01', 'vendas@marketingpro.com', '(21) 2345-6789', 'Rio de Janeiro', 'RJ', 'Marketing'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Logística Express', 'Logística Express S.A.', '34.567.890/0001-12', 'comercial@logexpress.com', '(31) 3456-7890', 'Belo Horizonte', 'MG', 'Logística'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Construtora Ideal', 'Construtora Ideal Ltda', '45.678.901/0001-23', 'projetos@construtoraideal.com', '(41) 3456-7890', 'Curitiba', 'PR', 'Construção'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Saúde & Vida', 'Centro Médico Saúde & Vida', '56.789.012/0001-34', 'atendimento@saudevida.com', '(85) 3456-7890', 'Fortaleza', 'CE', 'Saúde'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'EduTech', 'EduTech Educação Digital', '67.890.123/0001-45', 'contato@edutech.com', '(61) 3456-7890', 'Brasília', 'DF', 'Educação')
ON CONFLICT (id) DO NOTHING;

-- Inserir dados de demonstração para leads
INSERT INTO public.leads (id, name, company_id, value, currency, stage_id, responsible_id, priority, source, status, expected_close_date, conversion_rate, notes) VALUES
('lead0001-0001-0001-0001-000000000001', 'Sistema de CRM Personalizado', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 45000.00, 'BRL', '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'high', 'Website', 'open', '2024-08-15', 75, 'Cliente interessado em solução completa de CRM'),
('lead0002-0002-0002-0002-000000000002', 'Campanha de Marketing Digital', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 25000.00, 'BRL', '33333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', 'medium', 'Indicação', 'open', '2024-08-20', 60, 'Proposta enviada para aprovação'),
('lead0003-0003-0003-0003-000000000003', 'Software de Gestão Logística', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 80000.00, 'BRL', '44444444-4444-4444-4444-444444444444', '88888888-8888-8888-8888-888888888888', 'high', 'LinkedIn', 'open', '2024-08-10', 85, 'Em fase final de negociação'),
('lead0004-0004-0004-0004-000000000004', 'Consultoria em Processos', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 35000.00, 'BRL', '11111111-1111-1111-1111-111111111111', '99999999-9999-9999-9999-999999999999', 'low', 'Cold Call', 'open', '2024-09-01', 40, 'Primeiro contato realizado'),
('lead0005-0005-0005-0005-000000000005', 'Sistema de Gestão Hospitalar', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 120000.00, 'BRL', '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'high', 'Evento', 'open', '2024-08-25', 70, 'Demonstração agendada para próxima semana'),
('lead0006-0006-0006-0006-000000000006', 'Plataforma E-learning', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 60000.00, 'BRL', '33333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', 'medium', 'Website', 'open', '2024-08-30', 65, 'Aguardando feedback da proposta técnica'),
('lead0007-0007-0007-0007-000000000007', 'Sistema de Automação Industrial', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 95000.00, 'BRL', '55555555-5555-5555-5555-555555555555', 'NULL', 'high', 'Parceiro', 'won', '2024-07-15', 100, 'Deal fechado com sucesso!'),
('lead0008-0008-0008-0008-000000000008', 'App Mobile para Delivery', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 30000.00, 'BRL', '44444444-4444-4444-4444-444444444444', '88888888-8888-8888-8888-888888888888', 'medium', 'Indicação', 'lost', '2024-07-20', 0, 'Cliente optou por solução concorrente')
ON CONFLICT (id) DO NOTHING;

-- Inserir algumas atividades comerciais de demonstração
INSERT INTO public.commercial_activities (id, title, description, type, datetime, lead_id, company_id, responsible_id, status) VALUES
('act00001-0001-0001-0001-000000000001', 'Reunião de apresentação', 'Apresentação da solução CRM para o cliente', 'meeting', '2024-07-28 14:00:00', 'lead0001-0001-0001-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '66666666-6666-6666-6666-666666666666', 'completed'),
('act00002-0002-0002-0002-000000000002', 'Follow-up telefônico', 'Ligação para acompanhar interesse do cliente', 'call', '2024-07-29 10:30:00', 'lead0002-0002-0002-0002-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '77777777-7777-7777-7777-777777777777', 'completed'),
('act00003-0003-0003-0003-000000000003', 'Envio de proposta', 'Elaboração e envio da proposta comercial', 'email', '2024-07-30 16:45:00', 'lead0003-0003-0003-0003-000000000003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '88888888-8888-8888-8888-888888888888', 'completed'),
('act00004-0004-0004-0004-000000000004', 'Demonstração do produto', 'Demo técnica agendada', 'meeting', '2024-08-05 15:00:00', 'lead0005-0005-0005-0005-000000000005', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '66666666-6666-6666-6666-666666666666', 'pending')
ON CONFLICT (id) DO NOTHING;
