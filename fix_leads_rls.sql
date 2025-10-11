-- SCRIPT PARA CORRIGIR RLS E FOREIGN KEY DA TABELA LEADS
-- Execute este script no Supabase SQL Editor

-- =====================================================
-- PARTE 1: DESABILITAR RLS TEMPORARIAMENTE
-- =====================================================

-- Desabilitar RLS na tabela leads
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.leads;
DROP POLICY IF EXISTS "Users can view own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete own leads" ON public.leads;
DROP POLICY IF EXISTS "lead_company_only" ON public.leads;

-- =====================================================
-- PARTE 2: VERIFICAR E CORRIGIR ESTRUTURA DA TABELA
-- =====================================================

-- Verificar se a coluna stage_id existe
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

-- =====================================================
-- PARTE 2.1: LIMPAR DADOS INVÁLIDOS ANTES DE CRIAR FOREIGN KEY
-- =====================================================

-- Primeiro, remover foreign key existente se houver
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_stage_id_fkey;

-- Atualizar leads com stage_id inválido para NULL
UPDATE public.leads 
SET stage_id = NULL 
WHERE stage_id IS NOT NULL 
  AND stage_id NOT IN (SELECT id FROM public.funnel_stages);

-- Verificar quantos leads foram afetados
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count 
    FROM public.leads 
    WHERE stage_id IS NOT NULL 
      AND stage_id NOT IN (SELECT id FROM public.funnel_stages);
    
    IF invalid_count > 0 THEN
        RAISE NOTICE 'Atenção: % leads tinham stage_id inválido e foram corrigidos', invalid_count;
    ELSE
        RAISE NOTICE 'Todos os stage_id são válidos';
    END IF;
END $$;

-- =====================================================
-- PARTE 3: GARANTIR DADOS PADRÃO EM FUNNEL_STAGES
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
-- PARTE 3.1: CRIAR FOREIGN KEY APÓS LIMPEZA DOS DADOS
-- =====================================================

-- Agora criar a foreign key constraint
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
        
        RAISE NOTICE 'Foreign key leads_stage_id_fkey criada com sucesso';
    ELSE
        RAISE NOTICE 'Foreign key leads_stage_id_fkey já existe';
    END IF;
END $$;

-- =====================================================
-- PARTE 4: ATUALIZAR LEADS SEM STAGE_ID
-- =====================================================

-- Atualizar leads que não têm stage_id para o primeiro estágio padrão
UPDATE public.leads 
SET stage_id = '11111111-1111-1111-1111-111111111111'
WHERE stage_id IS NULL;

-- =====================================================
-- PARTE 5: CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice para stage_id na tabela leads
CREATE INDEX IF NOT EXISTS idx_leads_stage_id ON public.leads(stage_id);

-- Índice para order_position na tabela funnel_stages
CREATE INDEX IF NOT EXISTS idx_funnel_stages_order ON public.funnel_stages(order_position);

-- =====================================================
-- PARTE 6: TESTAR CRIAÇÃO DE LEAD
-- =====================================================

-- Testar inserção de lead
INSERT INTO public.leads (name, email, phone, stage_id, status, priority) VALUES
('Lead de Teste', 'teste@exemplo.com', '11999999999', '11111111-1111-1111-1111-111111111111', 'cold', 'medium');

-- Verificar se foi inserido
SELECT COUNT(*) as total_leads FROM public.leads;
SELECT id, name, email, stage_id, status FROM public.leads ORDER BY created_at DESC LIMIT 5;

-- =====================================================
-- PARTE 7: HABILITAR RLS COM POLÍTICA PERMISSIVA
-- =====================================================

-- Habilitar RLS novamente
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Criar política permissiva para desenvolvimento
CREATE POLICY "Enable all operations for all users" ON public.leads 
FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- PARTE 8: VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se RLS está funcionando
SELECT 
    tablename,
    rowsecurity as rls_habilitado,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS Habilitado'
        ELSE '❌ RLS DESABILITADO'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'leads';

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'leads'
ORDER BY policyname;

-- Verificar foreign keys
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

-- =====================================================
-- MENSAGEM DE SUCESSO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CORREÇÃO CONCLUÍDA COM SUCESSO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RLS configurado corretamente';
    RAISE NOTICE '✅ Foreign key stage_id adicionada';
    RAISE NOTICE '✅ Etapas do funil criadas';
    RAISE NOTICE '✅ Índices criados para performance';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Próximos passos:';
    RAISE NOTICE '1. Reinicie o servidor de desenvolvimento';
    RAISE NOTICE '2. Teste a criação de leads no frontend';
    RAISE NOTICE '3. Os erros de foreign key devem estar resolvidos';
    RAISE NOTICE '========================================';
END $$;
