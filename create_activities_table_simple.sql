-- Script simples para criar/corrigir a tabela activities
-- Execute este script no SQL Editor do Supabase

-- 1. Dropar a tabela se existir (CUIDADO: isso apagará todos os dados!)
-- DROP TABLE IF EXISTS activities CASCADE;

-- 2. Criar a tabela activities com a estrutura correta
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'task',
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    due_date TIMESTAMP WITH TIME ZONE,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    responsible_id UUID,
    created_by UUID NOT NULL, -- Campo principal para identificar o proprietário
    company_id UUID,
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

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_activities_created_by ON activities(created_by);
CREATE INDEX IF NOT EXISTS idx_activities_responsible_id ON activities(responsible_id);
CREATE INDEX IF NOT EXISTS idx_activities_company_id ON activities(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_priority ON activities(priority);

-- 4. Habilitar RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS básicas
DROP POLICY IF EXISTS "Users can view their own activities" ON activities;
CREATE POLICY "Users can view their own activities" ON activities
    FOR SELECT USING (created_by = auth.uid());
    
DROP POLICY IF EXISTS "Users can insert their own activities" ON activities;
CREATE POLICY "Users can insert their own activities" ON activities
    FOR INSERT WITH CHECK (created_by = auth.uid());
    
DROP POLICY IF EXISTS "Users can update their own activities" ON activities;
CREATE POLICY "Users can update their own activities" ON activities
    FOR UPDATE USING (created_by = auth.uid());
    
DROP POLICY IF EXISTS "Users can delete their own activities" ON activities;
CREATE POLICY "Users can delete their own activities" ON activities
    FOR DELETE USING (created_by = auth.uid());

-- 6. Verificar estrutura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'activities'
ORDER BY ordinal_position;
