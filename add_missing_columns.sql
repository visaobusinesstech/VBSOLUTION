-- =====================================================
-- ADICIONAR COLUNAS FALTANTES NA TABELA WORK_GROUPS
-- =====================================================

-- Adicionar colunas que estão faltando na tabela work_groups
ALTER TABLE public.work_groups 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS photo TEXT,
ADD COLUMN IF NOT EXISTS sector TEXT,
ADD COLUMN IF NOT EXISTS tasks_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_tasks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS active_projects INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Comentários para documentação
COMMENT ON COLUMN public.work_groups.owner_id IS 'Usuário proprietário do grupo de trabalho';
COMMENT ON COLUMN public.work_groups.description IS 'Descrição do grupo de trabalho';
COMMENT ON COLUMN public.work_groups.status IS 'Status do grupo (active, inactive)';
COMMENT ON COLUMN public.work_groups.color IS 'Cor do grupo de trabalho em formato hexadecimal';
COMMENT ON COLUMN public.work_groups.photo IS 'URL da foto do grupo de trabalho';
COMMENT ON COLUMN public.work_groups.sector IS 'Setor/departamento do grupo de trabalho';
COMMENT ON COLUMN public.work_groups.tasks_count IS 'Número total de tarefas do grupo';
COMMENT ON COLUMN public.work_groups.completed_tasks IS 'Número de tarefas concluídas';
COMMENT ON COLUMN public.work_groups.active_projects IS 'Número de projetos ativos do grupo';