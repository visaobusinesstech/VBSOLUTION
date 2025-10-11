-- SCRIPT FINAL PARA RESOLVER TODOS OS PROBLEMAS
-- Execute este script no Supabase Dashboard

-- ========================================
-- PARTE 1: FORÇAR DESABILITAÇÃO DO RLS
-- ========================================

-- Desabilitar RLS em todas as tabelas
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendimentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.leads;
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.atendimentos;
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.tickets;

-- ========================================
-- PARTE 2: VERIFICAR E CRIAR TABELAS
-- ========================================

-- Verificar se a tabela leads existe e tem a estrutura correta
DO $$
BEGIN
    -- Se a tabela leads não existir, criar
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads' AND table_schema = 'public') THEN
        CREATE TABLE public.leads (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            company TEXT,
            position TEXT,
            source TEXT DEFAULT 'manual',
            status TEXT DEFAULT 'new',
            priority TEXT DEFAULT 'medium',
            stage_id UUID,
            value DECIMAL(10,2) DEFAULT 0,
            currency TEXT DEFAULT 'BRL',
            expected_close_date DATE,
            responsible_id UUID,
            product_id UUID,
            whatsapp_contact_id TEXT,
            company_id UUID,
            created_by UUID,
            owner_id UUID,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
    END IF;
END $$;

-- Criar tabela atendimentos se não existir
CREATE TABLE IF NOT EXISTS public.atendimentos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id),
    status TEXT DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela tickets se não existir
CREATE TABLE IF NOT EXISTS public.tickets (
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

CREATE INDEX IF NOT EXISTS idx_atendimentos_lead_id ON public.atendimentos(lead_id);
CREATE INDEX IF NOT EXISTS idx_tickets_atendimento_id ON public.tickets(atendimento_id);
CREATE INDEX IF NOT EXISTS idx_tickets_lead_id ON public.tickets(lead_id);

-- ========================================
-- PARTE 4: CRIAR FUNÇÃO E TRIGGER
-- ========================================

-- Remover função e trigger existentes
DROP TRIGGER IF EXISTS trigger_create_ticket_for_lead ON public.leads;
DROP FUNCTION IF EXISTS create_ticket_for_lead();

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
-- PARTE 5: INSERIR DADOS DE TESTE
-- ========================================

-- Limpar dados existentes
DELETE FROM public.tickets;
DELETE FROM public.atendimentos;
DELETE FROM public.leads;

-- Inserir leads de teste
INSERT INTO public.leads (name, email, phone, company, source, status, priority, value, currency, notes) VALUES
('João Silva', 'joao@email.com', '(11) 99999-9999', 'Empresa ABC', 'website', 'new', 'high', 5000.00, 'BRL', 'Lead de teste'),
('Maria Santos', 'maria@email.com', '(11) 88888-8888', 'Empresa XYZ', 'referral', 'contacted', 'medium', 3000.00, 'BRL', 'Lead em contato inicial'),
('Pedro Costa', 'pedro@email.com', '(11) 77777-7777', 'Empresa DEF', 'social_media', 'qualified', 'high', 7500.00, 'BRL', 'Lead qualificado'),
('Ana Oliveira', 'ana@email.com', '(11) 66666-6666', 'Empresa GHI', 'website', 'new', 'low', 2000.00, 'BRL', 'Lead de baixa prioridade'),
('Carlos Pereira', 'carlos@email.com', '(11) 55555-5555', 'Empresa JKL', 'referral', 'won', 'high', 10000.00, 'BRL', 'Lead convertido');

-- ========================================
-- PARTE 6: VERIFICAÇÃO FINAL
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

-- Verificar se RLS está desabilitado
SELECT 'Status do RLS:' as status;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('leads', 'atendimentos', 'tickets')
AND schemaname = 'public';

SELECT '✅ SCRIPT FINAL EXECUTADO COM SUCESSO!' as status;
