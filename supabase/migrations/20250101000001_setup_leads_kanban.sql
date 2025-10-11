-- Configuração das tabelas para o sistema de Kanban de Leads
-- Esta migração configura as tabelas necessárias para o sistema de leads e vendas

-- =====================================================
-- TABELA DE LEADS
-- =====================================================

-- Criar tabela de leads se não existir
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  position TEXT,
  source TEXT DEFAULT 'website',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  stage_id UUID NOT NULL REFERENCES public.funnel_stages(id),
  responsible_id UUID REFERENCES public.employees(id),
  contact_id UUID REFERENCES public.contacts(id),
  product_id UUID REFERENCES public.products(id),
  product_quantity INTEGER DEFAULT 1,
  product_price DECIMAL(10,2),
  value DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  expected_close_date DATE,
  notes TEXT,
  status TEXT DEFAULT 'cold' CHECK (status IN ('hot', 'cold', 'won', 'lost')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELA DE PIPELINES (para futuras expansões)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.pipelines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- ATUALIZAR TABELA FUNNEL_STAGES
-- =====================================================

-- Adicionar colunas se não existirem
ALTER TABLE public.funnel_stages 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS probability INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stage_type TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES public.pipelines(id);

-- =====================================================
-- INSERIR DADOS PADRÃO
-- =====================================================

-- Inserir pipeline padrão
INSERT INTO public.pipelines (id, name, description, is_default) VALUES
('00000000-0000-0000-0000-000000000001', 'Pipeline Padrão', 'Pipeline padrão do sistema', true)
ON CONFLICT (id) DO NOTHING;

-- Inserir etapas padrão do funil de vendas
INSERT INTO public.funnel_stages (id, name, order_position, color, probability, is_default, pipeline_id) VALUES
('11111111-1111-1111-1111-111111111111', 'Novo Lead', 1, '#3b82f6', 10, true, '00000000-0000-0000-0000-000000000001'),
('22222222-2222-2222-2222-222222222222', 'Contato Inicial', 2, '#8b5cf6', 25, true, '00000000-0000-0000-0000-000000000001'),
('33333333-3333-3333-3333-333333333333', 'Proposta', 3, '#f59e0b', 50, true, '00000000-0000-0000-0000-000000000001'),
('44444444-4444-4444-4444-444444444444', 'Reunião', 4, '#ef4444', 75, true, '00000000-0000-0000-0000-000000000001'),
('55555555-5555-5555-5555-555555555555', 'Fechamento', 5, '#10b981', 100, true, '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para a tabela leads
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON public.leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage_id ON public.leads(stage_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON public.leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_contact_id ON public.leads(contact_id);
CREATE INDEX IF NOT EXISTS idx_leads_product_id ON public.leads(product_id);

-- Índices para a tabela funnel_stages
CREATE INDEX IF NOT EXISTS idx_funnel_stages_owner_id ON public.funnel_stages(owner_id);
CREATE INDEX IF NOT EXISTS idx_funnel_stages_pipeline_id ON public.funnel_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_funnel_stages_order ON public.funnel_stages(order_position);

-- Índices para a tabela pipelines
CREATE INDEX IF NOT EXISTS idx_pipelines_owner_id ON public.pipelines(owner_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_is_default ON public.pipelines(is_default);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;

-- Políticas para leads
DROP POLICY IF EXISTS "Usuários podem ver e editar seus próprios leads" ON public.leads;
CREATE POLICY "Usuários podem ver e editar seus próprios leads" ON public.leads
  FOR ALL USING (auth.uid() = owner_id);

-- Políticas para funnel_stages
DROP POLICY IF EXISTS "Usuários podem ver e editar suas próprias etapas" ON public.funnel_stages;
CREATE POLICY "Usuários podem ver e editar suas próprias etapas" ON public.funnel_stages
  FOR ALL USING (auth.uid() = owner_id OR is_default = true);

-- Políticas para pipelines
DROP POLICY IF EXISTS "Usuários podem ver e editar suas próprias pipelines" ON public.pipelines;
CREATE POLICY "Usuários podem ver e editar suas próprias pipelines" ON public.pipelines
  FOR ALL USING (auth.uid() = owner_id OR is_default = true);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_funnel_stages_updated_at ON public.funnel_stages;
CREATE TRIGGER update_funnel_stages_updated_at
    BEFORE UPDATE ON public.funnel_stages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pipelines_updated_at ON public.pipelines;
CREATE TRIGGER update_pipelines_updated_at
    BEFORE UPDATE ON public.pipelines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.leads IS 'Tabela de leads do sistema CRM';
COMMENT ON TABLE public.funnel_stages IS 'Etapas do funil de vendas';
COMMENT ON TABLE public.pipelines IS 'Pipelines de vendas (para futuras expansões)';

COMMENT ON COLUMN public.leads.priority IS 'Prioridade do lead: low, medium, high, urgent';
COMMENT ON COLUMN public.leads.status IS 'Status do lead: hot, cold, won, lost';
COMMENT ON COLUMN public.leads.source IS 'Origem do lead (website, whatsapp, etc.)';
COMMENT ON COLUMN public.funnel_stages.probability IS 'Probabilidade de fechamento em percentual (0-100)';
COMMENT ON COLUMN public.funnel_stages.is_default IS 'Se é uma etapa padrão do sistema';

