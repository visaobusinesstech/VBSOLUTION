-- SCRIPT SIMPLES PARA CORRIGIR FOREIGN KEY
-- Execute este script no Supabase SQL Editor

-- =====================================================
-- PARTE 1: LIMPAR DADOS INVÁLIDOS
-- =====================================================

-- Remover foreign key existente se houver
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_stage_id_fkey;

-- Verificar leads com stage_id inválido
SELECT 
    COUNT(*) as total_leads,
    COUNT(CASE WHEN stage_id IS NULL THEN 1 END) as leads_sem_stage,
    COUNT(CASE WHEN stage_id IS NOT NULL AND stage_id NOT IN (SELECT id FROM public.funnel_stages) THEN 1 END) as leads_stage_invalido
FROM public.leads;

-- Atualizar leads com stage_id inválido para NULL
UPDATE public.leads 
SET stage_id = NULL 
WHERE stage_id IS NOT NULL 
  AND stage_id NOT IN (SELECT id FROM public.funnel_stages);

-- =====================================================
-- PARTE 2: GARANTIR ETAPAS PADRÃO
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
-- PARTE 3: ATUALIZAR LEADS SEM STAGE_ID
-- =====================================================

-- Atualizar leads que não têm stage_id para o primeiro estágio padrão
UPDATE public.leads 
SET stage_id = '11111111-1111-1111-1111-111111111111'
WHERE stage_id IS NULL;

-- =====================================================
-- PARTE 4: CRIAR FOREIGN KEY
-- =====================================================

-- Criar foreign key constraint
ALTER TABLE public.leads 
ADD CONSTRAINT leads_stage_id_fkey 
FOREIGN KEY (stage_id) REFERENCES public.funnel_stages(id) ON DELETE SET NULL;

-- =====================================================
-- PARTE 5: CRIAR ÍNDICES
-- =====================================================

-- Índice para stage_id na tabela leads
CREATE INDEX IF NOT EXISTS idx_leads_stage_id ON public.leads(stage_id);

-- Índice para order_position na tabela funnel_stages
CREATE INDEX IF NOT EXISTS idx_funnel_stages_order ON public.funnel_stages(order_position);

-- =====================================================
-- PARTE 6: VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se a foreign key foi criada
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='leads';

-- Verificar leads e suas etapas
SELECT 
    l.id,
    l.name,
    l.stage_id,
    fs.name as stage_name
FROM public.leads l
LEFT JOIN public.funnel_stages fs ON l.stage_id = fs.id
LIMIT 10;

-- =====================================================
-- MENSAGEM DE SUCESSO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CORREÇÃO DA FOREIGN KEY CONCLUÍDA!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Dados inválidos limpos';
    RAISE NOTICE '✅ Etapas padrão criadas';
    RAISE NOTICE '✅ Foreign key criada com sucesso';
    RAISE NOTICE '✅ Índices criados para performance';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Agora você pode criar leads normalmente!';
    RAISE NOTICE '========================================';
END $$;

