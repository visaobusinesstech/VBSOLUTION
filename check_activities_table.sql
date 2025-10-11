-- Script para verificar e corrigir a tabela activities
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela activities existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'activities'
) as table_exists;

-- 2. Verificar estrutura atual da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'activities'
ORDER BY ordinal_position;

-- 3. Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'activities';

-- 4. Se a tabela não existir ou estiver incorreta, executar:
-- (Descomente as linhas abaixo se necessário)

/*
-- Dropar tabela existente se houver problemas
DROP TABLE IF EXISTS activities CASCADE;

-- Recriar tabela com estrutura correta
CREATE TABLE public.activities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'task',
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    due_date TIMESTAMP WITH TIME ZONE,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    responsible_id UUID REFERENCES public.user_profiles(id),
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    company_id UUID REFERENCES public.companies(id),
    project_id VARCHAR(255),
    work_group VARCHAR(255),
    department VARCHAR(255),
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    tags TEXT[],
    attachments JSONB,
    comments JSONB,
    progress INTEGER DEFAULT 0,
    is_urgent BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_activities_created_by ON activities(created_by);
CREATE INDEX IF NOT EXISTS idx_activities_responsible_id ON activities(responsible_id);
CREATE INDEX IF NOT EXISTS idx_activities_company_id ON activities(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);

-- Habilitar RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS simplificadas
CREATE POLICY "Users can view activities from their company" ON activities
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_profiles WHERE id = auth.uid()
            UNION
            SELECT company_id FROM company_users WHERE id = auth.uid()
        )
        OR created_by = auth.uid()
        OR responsible_id = auth.uid()
    );

CREATE POLICY "Users can insert activities" ON activities
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        (
            company_id IS NULL OR
            company_id IN (
                SELECT company_id FROM user_profiles WHERE id = auth.uid()
                UNION
                SELECT company_id FROM company_users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update activities they created or are responsible for" ON activities
    FOR UPDATE USING (
        created_by = auth.uid() OR 
        responsible_id = auth.uid()
    );

CREATE POLICY "Users can delete activities they created" ON activities
    FOR DELETE USING (created_by = auth.uid());
*/
