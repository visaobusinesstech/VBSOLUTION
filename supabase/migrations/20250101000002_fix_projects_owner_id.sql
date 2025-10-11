-- Corrigir problema de owner_id na tabela projects
-- Adicionar coluna owner_id se não existir, ou tornar manager_id obrigatório

-- Verificar se a coluna owner_id existe, se não, adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN owner_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Tornar owner_id obrigatório se manager_id estiver vazio
UPDATE public.projects 
SET owner_id = manager_id 
WHERE owner_id IS NULL AND manager_id IS NOT NULL;

-- Adicionar constraint NOT NULL para owner_id
ALTER TABLE public.projects ALTER COLUMN owner_id SET NOT NULL;

-- Atualizar o hook useProjects para usar owner_id em vez de manager_id
-- Isso será feito no código TypeScript
