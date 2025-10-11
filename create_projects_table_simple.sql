-- Script simples para criar/corrigir tabela projects
-- Execute este script no SQL Editor do Supabase

-- 1. Dropar tabela existente se houver problemas (CUIDADO: apaga dados!)
-- DROP TABLE IF EXISTS projects CASCADE;

-- 2. Criar tabela com estrutura simples
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'planning',
    priority TEXT DEFAULT 'medium',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    budget DECIMAL(12,2),
    owner_id UUID NOT NULL,
    responsible_id UUID,
    company_id UUID,
    tags TEXT[],
    progress INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- 4. Habilitar RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS simples
DROP POLICY IF EXISTS "Users can manage their own projects" ON projects;
CREATE POLICY "Users can manage their own projects" ON projects
    FOR ALL USING (owner_id = auth.uid());

-- 6. Verificar estrutura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'projects'
ORDER BY ordinal_position;
