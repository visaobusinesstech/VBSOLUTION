-- =====================================================
-- ADICIONAR COLUNAS FALTANTES NA TABELA WORK_GROUPS
-- =====================================================

-- Adicionar colunas necessárias para o funcionamento completo dos grupos de trabalho
ALTER TABLE public.work_groups 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS photo TEXT,
ADD COLUMN IF NOT EXISTS sector TEXT,
ADD COLUMN IF NOT EXISTS tasks_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_tasks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS active_projects INTEGER DEFAULT 0;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.work_groups.color IS 'Cor do grupo de trabalho em formato hexadecimal';
COMMENT ON COLUMN public.work_groups.photo IS 'URL da foto do grupo de trabalho';
COMMENT ON COLUMN public.work_groups.sector IS 'Setor/departamento do grupo de trabalho';
COMMENT ON COLUMN public.work_groups.tasks_count IS 'Número total de tarefas do grupo';
COMMENT ON COLUMN public.work_groups.completed_tasks IS 'Número de tarefas concluídas';
COMMENT ON COLUMN public.work_groups.active_projects IS 'Número de projetos ativos do grupo';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_work_groups_color ON public.work_groups(color);
CREATE INDEX IF NOT EXISTS idx_work_groups_sector ON public.work_groups(sector);
CREATE INDEX IF NOT EXISTS idx_work_groups_status ON public.work_groups(status);
