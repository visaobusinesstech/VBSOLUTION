-- Migração para corrigir a foreign key da tabela leads
-- Esta migração adiciona a foreign key stage_id na tabela leads

-- =====================================================
-- VERIFICAR E CORRIGIR TABELA LEADS
-- =====================================================

-- Primeiro, verificar se a coluna stage_id existe na tabela leads
-- Se não existir, adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'stage_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN stage_id UUID;
    END IF;
END $$;

-- Adicionar foreign key constraint se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'leads_stage_id_fkey'
        AND table_name = 'leads'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.leads 
        ADD CONSTRAINT leads_stage_id_fkey 
        FOREIGN KEY (stage_id) REFERENCES public.funnel_stages(id) ON DELETE SET NULL;
    END IF;
END $$;

-- =====================================================
-- GARANTIR DADOS PADRÃO EM FUNNEL_STAGES
-- =====================================================

-- Inserir etapas padrão se não existirem
INSERT INTO public.funnel_stages (id, name, order_position, color, probability, is_default) VALUES
('11111111-1111-1111-1111-111111111111', 'Novo Lead', 1, '#3b82f6', 10, true),
('22222222-2222-2222-2222-222222222222', 'Contato Inicial', 2, '#8b5cf6', 25, true),
('33333333-3333-3333-3333-333333333333', 'Proposta', 3, '#f59e0b', 50, true),
('44444444-4444-4444-4444-444444444444', 'Reunião', 4, '#ef4444', 75, true),
('55555555-5555-5555-5555-555555555555', 'Fechamento', 5, '#10b981', 100, true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ATUALIZAR LEADS SEM STAGE_ID
-- =====================================================

-- Atualizar leads que não têm stage_id para o primeiro estágio padrão
UPDATE public.leads 
SET stage_id = '11111111-1111-1111-1111-111111111111'
WHERE stage_id IS NULL;

-- =====================================================
-- CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice para stage_id na tabela leads
CREATE INDEX IF NOT EXISTS idx_leads_stage_id ON public.leads(stage_id);

-- Índice para order_position na tabela funnel_stages
CREATE INDEX IF NOT EXISTS idx_funnel_stages_order ON public.funnel_stages(order_position);

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON COLUMN public.leads.stage_id IS 'Referência para a etapa do funil de vendas';
COMMENT ON CONSTRAINT leads_stage_id_fkey ON public.leads IS 'Foreign key para funnel_stages';

