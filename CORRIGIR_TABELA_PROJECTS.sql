-- CORRIGIR TABELA PROJECTS NO SUPABASE
-- Execute este script no SQL Editor do Supabase

-- 1. VERIFICAR ESTRUTURA ATUAL DA TABELA PROJECTS
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'projects'
ORDER BY ordinal_position;

-- 2. VERIFICAR SE A TABELA EXISTE
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'projects';

-- 3. VERIFICAR RLS ATUAL
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'projects';

-- 4. VERIFICAR POLÍTICAS ATUAIS
SELECT 
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'projects';

-- 5. VERIFICAR DADOS EXISTENTES
SELECT COUNT(*) as total_projects FROM public.projects;

-- 6. ADICIONAR COLUNAS FALTANTES (se necessário)
DO $$ 
BEGIN
    -- Adicionar coluna due_date se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'due_date') THEN
        ALTER TABLE public.projects ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Coluna due_date adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna due_date já existe!';
    END IF;

    -- Adicionar coluna start_date se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'start_date') THEN
        ALTER TABLE public.projects ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Coluna start_date adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna start_date já existe!';
    END IF;

    -- Adicionar coluna end_date se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'end_date') THEN
        ALTER TABLE public.projects ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Coluna end_date adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna end_date já existe!';
    END IF;

    -- Adicionar coluna budget se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'budget') THEN
        ALTER TABLE public.projects ADD COLUMN budget DECIMAL(15,2);
        RAISE NOTICE 'Coluna budget adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna budget já existe!';
    END IF;

    -- Adicionar coluna currency se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'currency') THEN
        ALTER TABLE public.projects ADD COLUMN currency VARCHAR(10) DEFAULT 'BRL';
        RAISE NOTICE 'Coluna currency adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna currency já existe!';
    END IF;

    -- Adicionar coluna progress se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'progress') THEN
        ALTER TABLE public.projects ADD COLUMN progress INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna progress adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna progress já existe!';
    END IF;

    -- Adicionar coluna tags se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'tags') THEN
        ALTER TABLE public.projects ADD COLUMN tags TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Coluna tags adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna tags já existe!';
    END IF;

    -- Adicionar coluna notes se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'notes') THEN
        ALTER TABLE public.projects ADD COLUMN notes TEXT;
        RAISE NOTICE 'Coluna notes adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna notes já existe!';
    END IF;

    -- Adicionar coluna updated_at se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'updated_at') THEN
        ALTER TABLE public.projects ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Coluna updated_at adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna updated_at já existe!';
    END IF;
END $$;

-- 7. HABILITAR RLS (se não estiver habilitado)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 8. CRIAR/ATUALIZAR POLÍTICAS RLS
-- Política para SELECT (usuários só veem seus próprios projetos)
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
CREATE POLICY "Users can view own projects" ON public.projects
    FOR SELECT USING (auth.uid() = owner_id);

-- Política para INSERT (usuários só podem criar projetos para si mesmos)
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
CREATE POLICY "Users can insert own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Política para UPDATE (usuários só podem atualizar seus próprios projetos)
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = owner_id);

-- Política para DELETE (usuários só podem deletar seus próprios projetos)
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
CREATE POLICY "Users can delete own projects" ON public.projects
    FOR DELETE USING (auth.uid() = owner_id);

-- 9. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON public.projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_due_date ON public.projects(due_date);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON public.projects(company_id);

-- 10. CRIAR TRIGGER PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_projects_updated_at();

-- 11. VERIFICAR ESTRUTURA FINAL
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'projects'
ORDER BY ordinal_position;

-- 12. VERIFICAR RLS FINAL
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'projects';

-- 13. VERIFICAR POLÍTICAS FINAIS
SELECT 
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'projects';
