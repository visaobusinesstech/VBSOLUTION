-- ===================================
-- TABELA COLLABORATIONS - VBSolution CRM
-- ===================================
-- Execute este SQL no painel do Supabase (SQL Editor)

-- Criar a tabela collaborations
CREATE TABLE collaborations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Informações básicas
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Informações da empresa parceira
  partner_company VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(100),
  
  -- Categorização
  collaboration_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  category VARCHAR(100),
  
  -- Cronograma e orçamento
  start_date DATE,
  expected_end_date DATE,
  actual_end_date DATE,
  budget_estimate DECIMAL(15,2),
  actual_budget DECIMAL(15,2),
  
  -- Detalhes adicionais
  objectives JSONB,
  deliverables JSONB,
  notes TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT collaborations_title_not_empty CHECK (title <> ''),
  CONSTRAINT collaborations_partner_company_not_empty CHECK (partner_company <> '')
);

-- Criar índices para melhor performance
CREATE INDEX idx_collaborations_status ON collaborations(status);
CREATE INDEX idx_collaborations_priority ON collaborations(priority);
CREATE INDEX idx_collaborations_category ON collaborations(category);
CREATE INDEX idx_collaborations_partner_company ON collaborations(partner_company);
CREATE INDEX idx_collaborations_created_at ON collaborations(created_at DESC);
CREATE INDEX idx_collaborations_start_date ON collaborations(start_date);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_collaborations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_collaborations_updated_at
    BEFORE UPDATE ON collaborations
    FOR EACH ROW
    EXECUTE FUNCTION update_collaborations_updated_at();

-- Configurar Row Level Security (RLS)
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuários autenticados
CREATE POLICY "Usuários podem visualizar colaborações"
ON collaborations FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem inserir colaborações"
ON collaborations FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem atualizar colaborações"
ON collaborations FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem deletar colaborações"
ON collaborations FOR DELETE
USING (auth.role() = 'authenticated');

-- Inserir alguns dados de exemplo (opcional)
INSERT INTO collaborations (
  title,
  description,
  partner_company,
  contact_person,
  contact_email,
  collaboration_type,
  status,
  priority,
  category,
  start_date,
  expected_end_date,
  budget_estimate,
  objectives,
  deliverables,
  notes
) VALUES 
(
  'Parceria Estratégica de Desenvolvimento',
  'Colaboração para desenvolvimento de nova plataforma tecnológica integrada',
  'TechPartner Solutions',
  'João Silva',
  'joao.silva@techpartner.com',
  'strategic_partnership',
  'planning',
  'high',
  'development',
  '2024-10-01',
  '2025-03-31',
  150000.00,
  '["Desenvolver arquitetura escalável", "Implementar APIs REST", "Criar documentação técnica"]',
  '["Prototipo funcional", "Documentação completa", "Testes automatizados", "Deploy em produção"]',
  'Projeto crítico para expansão da empresa. Reuniões semanais às quintas-feiras.'
),
(
  'Colaboração de Marketing Digital',
  'Campanha conjunta de marketing para aumentar visibilidade da marca',
  'Marketing Pro Agency',
  'Maria Santos',
  'maria@marketingpro.com',
  'marketing_collaboration',
  'active',
  'medium',
  'marketing',
  '2024-09-15',
  '2024-12-15',
  75000.00,
  '["Aumentar awareness da marca", "Gerar 500 leads qualificados", "Aumentar conversão em 25%"]',
  '["Estratégia de conteúdo", "Campanhas Google Ads", "Relatórios mensais", "Dashboard analytics"]',
  'Foco em público B2B. KPIs definidos para avaliação mensal.'
);

-- Comentários para documentação
COMMENT ON TABLE collaborations IS 'Tabela para gerenciar colaborações, parcerias e projetos conjuntos';
COMMENT ON COLUMN collaborations.title IS 'Título da colaboração';
COMMENT ON COLUMN collaborations.description IS 'Descrição detalhada da colaboração';
COMMENT ON COLUMN collaborations.partner_company IS 'Nome da empresa parceira';
COMMENT ON COLUMN collaborations.collaboration_type IS 'Tipo: strategic_partnership, joint_venture, supplier_collaboration, etc.';
COMMENT ON COLUMN collaborations.status IS 'Status: planning, active, on_hold, completed, cancelled';
COMMENT ON COLUMN collaborations.priority IS 'Prioridade: high, medium, low';
COMMENT ON COLUMN collaborations.objectives IS 'Array JSON com objetivos da colaboração';
COMMENT ON COLUMN collaborations.deliverables IS 'Array JSON com entregáveis esperados';

-- Verificar se a tabela foi criada corretamente
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'collaborations' 
ORDER BY ordinal_position;
