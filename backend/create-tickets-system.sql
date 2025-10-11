-- Criar tabela de tickets/atendimentos
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atendimento_id VARCHAR(50) UNIQUE NOT NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed', 'cancelled')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    subject TEXT,
    description TEXT,
    assigned_to UUID REFERENCES profiles(id),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    
    -- Garantir que pelo menos contact_id ou lead_id seja fornecido
    CONSTRAINT check_ticket_contact_or_lead CHECK (
        (contact_id IS NOT NULL AND lead_id IS NULL) OR 
        (contact_id IS NULL AND lead_id IS NOT NULL)
    )
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_tickets_atendimento_id ON tickets(atendimento_id);
CREATE INDEX IF NOT EXISTS idx_tickets_contact_id ON tickets(contact_id);
CREATE INDEX IF NOT EXISTS idx_tickets_lead_id ON tickets(lead_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);

-- Função para gerar atendimento_id único
CREATE OR REPLACE FUNCTION generate_atendimento_id()
RETURNS VARCHAR(50) AS $$
DECLARE
    new_id VARCHAR(50);
    counter INTEGER := 1;
BEGIN
    LOOP
        new_id := 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
        
        -- Verificar se já existe
        IF NOT EXISTS (SELECT 1 FROM tickets WHERE atendimento_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        counter := counter + 1;
        
        -- Evitar loop infinito
        IF counter > 9999 THEN
            RAISE EXCEPTION 'Não foi possível gerar um atendimento_id único';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para criar ticket automaticamente quando lead é criado
CREATE OR REPLACE FUNCTION create_ticket_for_lead()
RETURNS TRIGGER AS $$
DECLARE
    new_atendimento_id VARCHAR(50);
BEGIN
    -- Gerar atendimento_id único
    new_atendimento_id := generate_atendimento_id();
    
    -- Criar ticket para o lead
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

-- Trigger para criar ticket automaticamente quando lead é criado
DROP TRIGGER IF EXISTS trigger_create_ticket_for_lead ON leads;
CREATE TRIGGER trigger_create_ticket_for_lead
    AFTER INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION create_ticket_for_lead();

-- Função para criar ticket manualmente para contato
CREATE OR REPLACE FUNCTION create_ticket_for_contact(
    p_contact_id UUID,
    p_subject TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_priority VARCHAR(10) DEFAULT 'medium',
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_ticket_id UUID;
    new_atendimento_id VARCHAR(50);
BEGIN
    -- Gerar atendimento_id único
    new_atendimento_id := generate_atendimento_id();
    
    -- Criar ticket
    INSERT INTO tickets (
        atendimento_id,
        contact_id,
        status,
        priority,
        subject,
        description,
        created_by
    ) VALUES (
        new_atendimento_id,
        p_contact_id,
        'open',
        p_priority,
        COALESCE(p_subject, 'Novo Atendimento'),
        COALESCE(p_description, 'Atendimento criado manualmente'),
        p_created_by
    ) RETURNING id INTO new_ticket_id;
    
    RETURN new_ticket_id;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE tickets IS 'Sistema de tickets/atendimentos do CRM';
COMMENT ON COLUMN tickets.id IS 'Identificador único do ticket';
COMMENT ON COLUMN tickets.atendimento_id IS 'ID do atendimento (formato: TKT-YYYYMMDD-XXXX)';
COMMENT ON COLUMN tickets.contact_id IS 'ID do contato (opcional se for lead)';
COMMENT ON COLUMN tickets.lead_id IS 'ID do lead (opcional se for contato)';
COMMENT ON COLUMN tickets.status IS 'Status do ticket: open, in_progress, closed, cancelled';
COMMENT ON COLUMN tickets.priority IS 'Prioridade: low, medium, high, urgent';
COMMENT ON COLUMN tickets.subject IS 'Assunto do ticket';
COMMENT ON COLUMN tickets.description IS 'Descrição detalhada';
COMMENT ON COLUMN tickets.assigned_to IS 'Usuário responsável pelo ticket';
COMMENT ON COLUMN tickets.created_by IS 'Usuário que criou o ticket';
COMMENT ON COLUMN tickets.created_at IS 'Data de criação';
COMMENT ON COLUMN tickets.updated_at IS 'Data da última atualização';
COMMENT ON COLUMN tickets.closed_at IS 'Data de fechamento (se aplicável)';
