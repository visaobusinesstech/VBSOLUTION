-- =====================================================
-- VERIFICAR E CORRIGIR TABELA WORK_GROUPS
-- =====================================================

-- 1. Verificar estrutura atual da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'work_groups' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Adicionar colunas que podem estar faltando (forçar criação)
DO $$ 
BEGIN
    -- Adicionar description se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_groups' AND column_name = 'description') THEN
        ALTER TABLE public.work_groups ADD COLUMN description TEXT;
    END IF;
    
    -- Adicionar status se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_groups' AND column_name = 'status') THEN
        ALTER TABLE public.work_groups ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
    
    -- Adicionar color se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_groups' AND column_name = 'color') THEN
        ALTER TABLE public.work_groups ADD COLUMN color TEXT DEFAULT '#3B82F6';
    END IF;
    
    -- Adicionar photo se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_groups' AND column_name = 'photo') THEN
        ALTER TABLE public.work_groups ADD COLUMN photo TEXT;
    END IF;
    
    -- Adicionar sector se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_groups' AND column_name = 'sector') THEN
        ALTER TABLE public.work_groups ADD COLUMN sector TEXT;
    END IF;
    
    -- Adicionar tasks_count se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_groups' AND column_name = 'tasks_count') THEN
        ALTER TABLE public.work_groups ADD COLUMN tasks_count INTEGER DEFAULT 0;
    END IF;
    
    -- Adicionar completed_tasks se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_groups' AND column_name = 'completed_tasks') THEN
        ALTER TABLE public.work_groups ADD COLUMN completed_tasks INTEGER DEFAULT 0;
    END IF;
    
    -- Adicionar active_projects se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_groups' AND column_name = 'active_projects') THEN
        ALTER TABLE public.work_groups ADD COLUMN active_projects INTEGER DEFAULT 0;
    END IF;
    
    -- Adicionar created_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_groups' AND column_name = 'created_at') THEN
        ALTER TABLE public.work_groups ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
    END IF;
    
    -- Adicionar updated_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_groups' AND column_name = 'updated_at') THEN
        ALTER TABLE public.work_groups ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
    END IF;
    
END $$;

-- 3. Verificar estrutura final da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'work_groups' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Testar inserção de dados
INSERT INTO public.work_groups (name, description, owner_id, color, sector, status)
VALUES ('Grupo Teste', 'Descrição do grupo teste', '905b926a-785a-4f6d-9c3a-94557...', '#3B82F6', 'Desenvolvimento', 'active')
ON CONFLICT DO NOTHING;

-- 5. Verificar dados inseridos
SELECT * FROM public.work_groups ORDER BY created_at DESC LIMIT 5;
