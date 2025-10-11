-- Script para corrigir a estrutura da tabela activities
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela activities existe e sua estrutura atual
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'activities'
ORDER BY ordinal_position;

-- 2. Se a tabela não existir ou estiver com estrutura incorreta, recriar
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
            status TEXT DEFAULT 'todo',
            due_date TIMESTAMP WITH TIME ZONE,
            start_date TIMESTAMP WITH TIME ZONE,
            end_date TIMESTAMP WITH TIME ZONE,
            responsible_id UUID,
            owner_id UUID NOT NULL,
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
        CREATE INDEX idx_activities_owner_id ON activities(owner_id);
        CREATE INDEX idx_activities_responsible_id ON activities(responsible_id);
        CREATE INDEX idx_activities_company_id ON activities(company_id);
        CREATE INDEX idx_activities_status ON activities(status);
        CREATE INDEX idx_activities_priority ON activities(priority);
        CREATE INDEX idx_activities_due_date ON activities(due_date);
        
        -- Habilitar RLS
        ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
        
        -- Criar políticas RLS
        CREATE POLICY "Users can view their own activities" ON activities
            FOR SELECT USING (auth.uid() = owner_id);
            
        CREATE POLICY "Users can insert their own activities" ON activities
            FOR INSERT WITH CHECK (auth.uid() = owner_id);
            
        CREATE POLICY "Users can update their own activities" ON activities
            FOR UPDATE USING (auth.uid() = owner_id);
            
        CREATE POLICY "Users can delete their own activities" ON activities
            FOR DELETE USING (auth.uid() = owner_id);
        
        RAISE NOTICE 'Tabela activities criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela activities já existe. Verificando estrutura...';
        
        -- Verificar se a coluna owner_id existe e tem a referência correta
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'activities' 
            AND column_name = 'owner_id' 
            AND table_schema = 'public'
        ) THEN
            RAISE NOTICE 'Adicionando coluna owner_id...';
            ALTER TABLE activities ADD COLUMN owner_id UUID NOT NULL REFERENCES auth.users(id);
        END IF;
        
        -- Verificar se o status padrão está correto
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'activities' 
            AND column_name = 'status' 
            AND column_default != '''todo''::text'
            AND table_schema = 'public'
        ) THEN
            RAISE NOTICE 'Atualizando valor padrão do status...';
            ALTER TABLE activities ALTER COLUMN status SET DEFAULT 'todo';
        END IF;
        
        -- Verificar se RLS está habilitado
        IF NOT EXISTS (
            SELECT 1 FROM pg_class 
            WHERE relname = 'activities' 
            AND relrowsecurity = true
        ) THEN
            RAISE NOTICE 'Habilitando RLS...';
            ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
        END IF;
        
        -- Verificar se as políticas RLS existem
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'activities' 
            AND policyname = 'Users can view their own activities'
        ) THEN
            RAISE NOTICE 'Criando políticas RLS...';
            
            CREATE POLICY "Users can view their own activities" ON activities
                FOR SELECT USING (auth.uid() = owner_id);
                
            CREATE POLICY "Users can insert their own activities" ON activities
                FOR INSERT WITH CHECK (auth.uid() = owner_id);
                
            CREATE POLICY "Users can update their own activities" ON activities
                FOR UPDATE USING (auth.uid() = owner_id);
                
            CREATE POLICY "Users can delete their own activities" ON activities
                FOR DELETE USING (auth.uid() = owner_id);
        END IF;
        
        RAISE NOTICE 'Estrutura da tabela activities verificada e corrigida!';
    END IF;
END $$;

-- 3. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'activities'
ORDER BY ordinal_position;

-- 4. Verificar políticas RLS
SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM pg_policies 
WHERE tablename = 'activities';

-- 5. Testar inserção de uma atividade de exemplo (comentado para não inserir dados desnecessários)
/*
INSERT INTO activities (title, description, owner_id) 
VALUES ('Teste de Atividade', 'Esta é uma atividade de teste', auth.uid());
*/

SELECT 'Estrutura da tabela activities verificada e corrigida com sucesso!' as status;
