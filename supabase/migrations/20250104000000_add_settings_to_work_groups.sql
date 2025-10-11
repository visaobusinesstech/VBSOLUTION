-- =====================================================
-- ADICIONAR COLUNA SETTINGS NA TABELA WORK_GROUPS
-- =====================================================

-- Adicionar coluna settings se não existir
ALTER TABLE public.work_groups 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.work_groups.settings IS 'Configurações e dados extras do grupo de trabalho (checklist, etc.)';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_work_groups_settings ON public.work_groups USING GIN (settings);
