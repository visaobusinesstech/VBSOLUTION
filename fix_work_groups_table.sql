-- Verificar estrutura atual da tabela work_groups
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'work_groups' 
ORDER BY ordinal_position;

-- Adicionar coluna settings se não existir
ALTER TABLE public.work_groups 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- Adicionar comentário
COMMENT ON COLUMN public.work_groups.settings IS 'Configurações e dados extras do grupo de trabalho (checklist, etc.)';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_work_groups_settings ON public.work_groups USING GIN (settings);

-- Verificar se foi adicionada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'work_groups' 
AND column_name = 'settings';