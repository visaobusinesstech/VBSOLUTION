-- Script para garantir que a tabela activities tenha a estrutura correta
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar estrutura atual da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'activities'
ORDER BY ordinal_position;

-- 2. Se a tabela não existir, criar com a estrutura correta
DO $$ 
BEGIN
    -- Verificar se a tabela existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activities' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabela activities não existe. Criando...';
        
        -- Criar tabela activities com estrutura correta
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
            owner_id UUID NOT NULL, -- Campo principal para identificar o proprietário
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
        CREATE INDEX IF NOT EXISTS idx_activities_owner_id ON activities(owner_id);
        CREATE INDEX IF NOT EXISTS idx_activities_responsible_id ON activities(responsible_id);
        CREATE INDEX IF NOT EXISTS idx_activities_company_id ON activities(company_id);
        CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
        CREATE INDEX IF NOT EXISTS idx_activities_priority ON activities(priority);
        
        -- Habilitar RLS
        ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
        
        -- Criar políticas RLS básicas
        CREATE POLICY "Users can view their own activities" ON activities
            FOR SELECT USING (owner_id = auth.uid());
            
        CREATE POLICY "Users can insert their own activities" ON activities
            FOR INSERT WITH CHECK (owner_id = auth.uid());
            
        CREATE POLICY "Users can update their own activities" ON activities
            FOR UPDATE USING (owner_id = auth.uid());
            
        CREATE POLICY "Users can delete their own activities" ON activities
            FOR DELETE USING (owner_id = auth.uid());
            
        RAISE NOTICE 'Tabela activities criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela activities já existe. Verificando estrutura...';
        
        -- Verificar se tem owner_id
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'activities' 
            AND column_name = 'owner_id'
        ) THEN
            -- Adicionar coluna owner_id se não existir
            ALTER TABLE activities ADD COLUMN owner_id UUID;
            RAISE NOTICE 'Coluna owner_id adicionada.';
        END IF;
        
        -- Verificar se tem created_by
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'activities' 
            AND column_name = 'created_by'
        ) THEN
            -- Adicionar coluna created_by se não existir
            ALTER TABLE activities ADD COLUMN created_by UUID;
            RAISE NOTICE 'Coluna created_by adicionada.';
        END IF;
        
        -- Copiar dados de created_by para owner_id se owner_id estiver vazio
        UPDATE activities 
        SET owner_id = created_by 
        WHERE owner_id IS NULL AND created_by IS NOT NULL;
        
        RAISE NOTICE 'Estrutura da tabela verificada e corrigida.';
    END IF;
END $$;

-- 3. Verificar estrutura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'activities'
ORDER BY ordinal_position;

-- 4. Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'activities';
