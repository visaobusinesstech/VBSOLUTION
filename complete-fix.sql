-- SCRIPT COMPLETO PARA CORRIGIR TODOS OS PROBLEMAS
-- Execute este script no Supabase Dashboard

-- ========================================
-- PARTE 1: LIMPEZA E PREPARAÇÃO
-- ========================================

-- Remover triggers e funções existentes
DROP TRIGGER IF EXISTS trigger_create_ticket_for_lead ON public.leads;
DROP FUNCTION IF EXISTS create_ticket_for_lead();

-- Dropar tabelas dependentes
DROP TABLE IF EXISTS public.tickets CASCADE;
DROP TABLE IF EXISTS public.atendimentos CASCADE;

-- ========================================
-- PARTE 2: CRIAR TABELAS COM TIPOS CORRETOS
-- ========================================

-- Criar tabela atendimentos
CREATE TABLE public.atendimentos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id),
    status TEXT DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela tickets
CREATE TABLE public.tickets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    atendimento_id UUID REFERENCES public.atendimentos(id),
    lead_id UUID REFERENCES public.leads(id),
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'medium',
    subject TEXT NOT NULL,
    description TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ========================================
-- PARTE 3: CRIAR ÍNDICES
-- ========================================

CREATE INDEX idx_atendimentos_lead_id ON public.atendimentos(lead_id);
CREATE INDEX idx_tickets_atendimento_id ON public.tickets(atendimento_id);
CREATE INDEX idx_tickets_lead_id ON public.tickets(lead_id);

-- ========================================
-- PARTE 4: CONFIGURAR RLS
-- ========================================

-- Habilitar RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.leads;
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.atendimentos;
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.tickets;

-- Criar políticas RLS permissivas
CREATE POLICY "Enable all operations for all users" ON public.leads 
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for all users" ON public.atendimentos 
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for all users" ON public.tickets 
FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- PARTE 5: CRIAR FUNÇÃO E TRIGGER
-- ========================================

-- Criar função create_ticket_for_lead
CREATE OR REPLACE FUNCTION create_ticket_for_lead()
RETURNS TRIGGER AS $$
DECLARE
    new_atendimento_id UUID;
BEGIN
    -- Criar um novo atendimento
    INSERT INTO atendimentos (lead_id, status, created_at, updated_at)
    VALUES (NEW.id, 'open', NOW(), NOW())
    RETURNING id INTO new_atendimento_id;
    
    -- Criar um ticket para o atendimento
    INSERT INTO tickets (
        atendimento_id,
        lead_id,
        status,
        priority,
        subject,
        description,
        created_by
    ) VALUES (
        new_atendimento_id,
        NEW.id,
        'open',
        'medium',
        'Novo Lead: ' || COALESCE(NEW.name, 'Sem nome'),
        'Lead criado automaticamente',
        NEW.created_by
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
CREATE TRIGGER trigger_create_ticket_for_lead
    AFTER INSERT ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION create_ticket_for_lead();

-- ========================================
-- PARTE 6: INSERIR DADOS DE TESTE
-- ========================================

-- Inserir leads de teste
INSERT INTO public.leads (name, email, phone, company, source, status, priority, value, currency, notes) VALUES
('João Silva', 'joao@email.com', '(11) 99999-9999', 'Empresa ABC', 'website', 'new', 'high', 5000.00, 'BRL', 'Lead de teste'),
('Maria Santos', 'maria@email.com', '(11) 88888-8888', 'Empresa XYZ', 'referral', 'contacted', 'medium', 3000.00, 'BRL', 'Lead em contato inicial'),
('Pedro Costa', 'pedro@email.com', '(11) 77777-7777', 'Empresa DEF', 'social_media', 'qualified', 'high', 7500.00, 'BRL', 'Lead qualificado'),
('Ana Oliveira', 'ana@email.com', '(11) 66666-6666', 'Empresa GHI', 'website', 'new', 'low', 2000.00, 'BRL', 'Lead de baixa prioridade'),
('Carlos Pereira', 'carlos@email.com', '(11) 55555-5555', 'Empresa JKL', 'referral', 'won', 'high', 10000.00, 'BRL', 'Lead convertido');

-- ========================================
-- PARTE 7: VERIFICAÇÃO FINAL
-- ========================================

-- Verificar tabelas criadas
SELECT 'Tabelas criadas:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('leads', 'atendimentos', 'tickets')
ORDER BY table_name;

-- Verificar leads inseridos
SELECT 'Leads inseridos:' as status;
SELECT COUNT(*) as total_leads FROM public.leads;

-- Verificar atendimentos criados
SELECT 'Atendimentos criados:' as status;
SELECT COUNT(*) as total_atendimentos FROM public.atendimentos;

-- Verificar tickets criados
SELECT 'Tickets criados:' as status;
SELECT COUNT(*) as total_tickets FROM public.tickets;

-- Verificar relacionamentos
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

-- Verificar políticas RLS
SELECT 'Políticas RLS criadas:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('leads', 'atendimentos', 'tickets')
ORDER BY tablename, policyname;

SELECT '✅ SCRIPT EXECUTADO COM SUCESSO!' as status;
