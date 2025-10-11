-- Execute este SQL no Supabase Dashboard > SQL Editor
-- para corrigir os problemas de projetos

-- 1. Desabilitar RLS temporariamente
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view company projects" ON public.projects;
DROP POLICY IF EXISTS "Allow all access to projects" ON public.projects;

-- 3. Adicionar coluna owner_id se não existir
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

-- 4. Preencher owner_id com manager_id se owner_id estiver vazio
UPDATE public.projects 
SET owner_id = manager_id 
WHERE owner_id IS NULL AND manager_id IS NOT NULL;

-- 5. Tornar owner_id obrigatório
ALTER TABLE public.projects ALTER COLUMN owner_id SET NOT NULL;

-- 6. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
