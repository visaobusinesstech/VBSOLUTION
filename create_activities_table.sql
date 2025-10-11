-- Script para criar a tabela activities no Supabase
-- Execute este script no SQL Editor do Supabase

-- Verificar se a tabela já existe
DO $$ 
BEGIN
    -- Se a tabela não existir, criar
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activities') THEN
        
        -- Criar tabela activities
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
            responsible_id UUID,
            created_by UUID NOT NULL,
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

        -- Criar índices
        CREATE INDEX idx_activities_created_by ON activities(created_by);
        CREATE INDEX idx_activities_responsible_id ON activities(responsible_id);
        CREATE INDEX idx_activities_company_id ON activities(company_id);
        CREATE INDEX idx_activities_status ON activities(status);
        CREATE INDEX idx_activities_priority ON activities(priority);

        -- Habilitar RLS
        ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

        -- Criar políticas RLS básicas
        CREATE POLICY "Users can view their own activities" ON activities
            FOR SELECT USING (created_by = auth.uid());

        CREATE POLICY "Users can insert their own activities" ON activities
            FOR INSERT WITH CHECK (created_by = auth.uid());

        CREATE POLICY "Users can update their own activities" ON activities
            FOR UPDATE USING (created_by = auth.uid());

        CREATE POLICY "Users can delete their own activities" ON activities
            FOR DELETE USING (created_by = auth.uid());

        RAISE NOTICE 'Tabela activities criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela activities já existe.';
    END IF;
END $$;

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'activities'
ORDER BY ordinal_position;
