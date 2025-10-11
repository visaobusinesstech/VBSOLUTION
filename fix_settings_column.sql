-- Verificar se a coluna settings existe
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'work_groups' 
AND column_name = 'settings';

-- Se não existir, adicionar a coluna
ALTER TABLE public.work_groups 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- Verificar se foi adicionada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'work_groups' 
AND column_name = 'settings';
