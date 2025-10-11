
-- Adicionar campos necessários à tabela funnel_stages para suportar customização
ALTER TABLE funnel_stages ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE funnel_stages ADD COLUMN IF NOT EXISTS stage_type TEXT DEFAULT 'active';

-- Criar tabela para atividades comerciais relacionadas aos leads
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'call', 'email', 'meeting', 'task', 'note'
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  created_by UUID REFERENCES team_members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para lead_activities
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to lead_activities" ON lead_activities
  FOR ALL USING (true);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_scheduled_date ON lead_activities(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_lead_activities_status ON lead_activities(status);

-- Adicionar campos extras necessários à tabela leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE leads ADD COLUMN IF NOT EXISTS won_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_reason TEXT;

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas relevantes
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lead_activities_updated_at ON lead_activities;
CREATE TRIGGER update_lead_activities_updated_at
    BEFORE UPDATE ON lead_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir algumas etapas padrão se não existirem
INSERT INTO funnel_stages (name, order_position, color, is_default, stage_type)
SELECT 'Contato Inicial', 1, '#3b82f6', true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM funnel_stages WHERE name = 'Contato Inicial');

INSERT INTO funnel_stages (name, order_position, color, is_default, stage_type)
SELECT 'Qualificação', 2, '#8b5cf6', true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM funnel_stages WHERE name = 'Qualificação');

INSERT INTO funnel_stages (name, order_position, color, is_default, stage_type)
SELECT 'Proposta', 3, '#f59e0b', true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM funnel_stages WHERE name = 'Proposta');

INSERT INTO funnel_stages (name, order_position, color, is_default, stage_type)
SELECT 'Negociação', 4, '#ef4444', true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM funnel_stages WHERE name = 'Negociação');

INSERT INTO funnel_stages (name, order_position, color, is_default, stage_type)
SELECT 'Fechamento', 5, '#10b981', true, 'closing'
WHERE NOT EXISTS (SELECT 1 FROM funnel_stages WHERE name = 'Fechamento');
