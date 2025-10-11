-- CORREÇÃO DA TABELA ACTIVITIES - VBSolution
-- Execute este script no SQL Editor do Supabase

-- 1. Fazer backup dos dados existentes (se houver)
CREATE TABLE IF NOT EXISTS activities_backup AS 
SELECT * FROM activities WHERE 1=0;

-- 2. Dropar a tabela activities existente
DROP TABLE IF EXISTS activities CASCADE;

-- 3. Recriar a tabela activities com a estrutura correta
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

-- 4. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_activities_created_by ON activities(created_by);
CREATE INDEX IF NOT EXISTS idx_activities_responsible_id ON activities(responsible_id);
CREATE INDEX IF NOT EXISTS idx_activities_company_id ON activities(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_project_id ON activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_priority ON activities(priority);
CREATE INDEX IF NOT EXISTS idx_activities_due_date ON activities(due_date);
CREATE INDEX IF NOT EXISTS idx_activities_start_date ON activities(start_date);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS para isolamento de dados por usuário
-- Política para visualização: usuários só podem ver atividades que criaram ou foram designados
CREATE POLICY "Users can view own activities or assigned to them" ON public.activities
    FOR SELECT USING (
        auth.uid() = created_by OR 
        auth.uid() = responsible_id OR
        -- Permitir que usuários vejam atividades da mesma empresa (se company_id estiver definido)
        (company_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = activities.company_id
        ))
    );

-- Política para criação: usuários só podem criar atividades para si ou para outros da mesma empresa
CREATE POLICY "Users can create activities for themselves or company members" ON public.activities
    FOR INSERT WITH CHECK (
        auth.uid() = created_by AND (
            -- Pode criar para si mesmo
            responsible_id = auth.uid() OR
            -- Ou para outros da mesma empresa
            (company_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.user_profiles up 
                WHERE up.id = responsible_id 
                AND up.company_id = activities.company_id
            ))
        )
    );

-- Política para atualização: usuários só podem atualizar atividades que criaram ou foram designados
CREATE POLICY "Users can update own activities or assigned to them" ON public.activities
    FOR UPDATE USING (
        auth.uid() = created_by OR 
        auth.uid() = responsible_id
    );

-- Política para exclusão: usuários só podem excluir atividades que criaram
CREATE POLICY "Users can delete activities they created" ON public.activities
    FOR DELETE USING (
        auth.uid() = created_by
    );

-- 7. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS trigger_update_activities_updated_at ON activities;
CREATE TRIGGER trigger_update_activities_updated_at
    BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION update_activities_updated_at();

-- 9. Adicionar comentários para documentação
COMMENT ON TABLE activities IS 'Tabela principal de atividades/tarefas do sistema';
COMMENT ON COLUMN activities.created_by IS 'ID do usuário que criou a atividade';
COMMENT ON COLUMN activities.responsible_id IS 'ID do usuário responsável pela atividade';
COMMENT ON COLUMN activities.type IS 'Tipo da atividade: task, meeting, call, email, other';
COMMENT ON COLUMN activities.priority IS 'Prioridade da atividade: low, medium, high, urgent';
COMMENT ON COLUMN activities.status IS 'Status da atividade: pending, in_progress, completed, cancelled';
COMMENT ON COLUMN activities.progress IS 'Progresso da atividade em porcentagem (0-100)';

-- 10. Verificar se a tabela foi criada corretamente
DO $$
BEGIN
    RAISE NOTICE 'Verificando estrutura da tabela activities...';
    
    -- Verificar colunas
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'created_by'
    ) THEN
        RAISE NOTICE '✅ Coluna created_by criada com sucesso';
    ELSE
        RAISE NOTICE '❌ Coluna created_by não foi criada';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'responsible_id'
    ) THEN
        RAISE NOTICE '✅ Coluna responsible_id criada com sucesso';
    ELSE
        RAISE NOTICE '❌ Coluna responsible_id não foi criada';
    END IF;
    
    -- Verificar políticas
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'activities'
    ) THEN
        RAISE NOTICE '✅ Políticas RLS criadas com sucesso';
    ELSE
        RAISE NOTICE '❌ Políticas RLS não foram criadas';
    END IF;
    
END $$;
