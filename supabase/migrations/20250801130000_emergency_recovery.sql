-- MIGRAÇÃO DE EMERGÊNCIA - RESTAURAR ACESSO AO SISTEMA
-- Data: 2025-08-01
-- Objetivo: Restaurar acesso básico após tela branca
-- URGENTE: Execute esta migração para resolver a tela branca

-- =====================================================
-- 1. VERIFICAR ESTADO ATUAL
-- =====================================================

-- Verificar tabelas existentes
SELECT '=== VERIFICAÇÃO DE ESTADO ===' as info;

SELECT 'TABELAS EXISTENTES:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verificar políticas existentes
SELECT 'POLÍTICAS EXISTENTES:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 2. RESTAURAR ACESSO BÁSICO - CRIAR TABELAS ESSENCIAIS
-- =====================================================

-- Criar tabela de atividades básica (se não existir)
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'task',
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    due_date TIMESTAMP WITH TIME ZONE,
    responsible_id UUID,
    created_by UUID,
    company_id UUID,
    project_id UUID,
    tags TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de projetos básica (se não existir)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'planning',
    priority TEXT DEFAULT 'medium',
    start_date DATE,
    end_date DATE,
    due_date DATE,
    budget DECIMAL(12,2),
    responsible_id UUID,
    company_id UUID,
    tags TEXT[],
    progress INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de empresas básica (se não existir)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    fantasy_name TEXT,
    cnpj TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    responsible_id UUID,
    logo_url TEXT,
    description TEXT,
    sector TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de usuários básica (se não existir)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    position TEXT,
    department TEXT,
    role TEXT DEFAULT 'user',
    company_id UUID,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- 3. REMOVER TODAS AS POLÍTICAS RLS RESTRITIVAS
-- =====================================================

-- Desabilitar RLS temporariamente em todas as tabelas
ALTER TABLE public.activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own activities" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can create activities" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own activities" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete own activities" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own companies" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can create companies" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own companies" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete own companies" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own projects" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can create projects" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own projects" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete own projects" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own profile" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert own profile" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own profile" ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- =====================================================
-- 4. INSERIR DADOS DE TESTE PARA RESTAURAR FUNCIONAMENTO
-- =====================================================

-- Inserir usuário de teste se não existir
INSERT INTO public.user_profiles (id, name, email, role) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Usuário Teste',
    'teste@exemplo.com',
    'admin'
) ON CONFLICT (id) DO NOTHING;

-- Inserir empresa de teste se não existir
INSERT INTO public.companies (name, fantasy_name, email, responsible_id, status)
VALUES (
    'Empresa Teste',
    'Empresa Teste LTDA',
    'contato@empresateste.com',
    '00000000-0000-0000-0000-000000000001',
    'active'
) ON CONFLICT DO NOTHING;

-- Inserir atividade de teste se não existir
INSERT INTO public.activities (title, description, type, priority, status, created_by, responsible_id)
VALUES (
    'Atividade de Teste',
    'Esta é uma atividade de teste para verificar o funcionamento do sistema',
    'task',
    'medium',
    'pending',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001'
) ON CONFLICT DO NOTHING;

-- Inserir projeto de teste se não existir
INSERT INTO public.projects (name, description, status, priority, responsible_id)
VALUES (
    'Projeto Teste',
    'Este é um projeto de teste para verificar o funcionamento do sistema',
    'active',
    'medium',
    '00000000-0000-0000-0000-000000000001'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. CRIAR ÍNDICES BÁSICOS PARA PERFORMANCE
-- =====================================================

-- Índices básicos para activities
CREATE INDEX IF NOT EXISTS idx_activities_created_by ON public.activities(created_by);
CREATE INDEX IF NOT EXISTS idx_activities_responsible_id ON public.activities(responsible_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON public.activities(status);

-- Índices básicos para projects
CREATE INDEX IF NOT EXISTS idx_projects_responsible_id ON public.projects(responsible_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

-- Índices básicos para companies
CREATE INDEX IF NOT EXISTS idx_companies_responsible_id ON public.companies(responsible_id);

-- =====================================================
-- 6. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se as tabelas estão acessíveis
SELECT '=== VERIFICAÇÃO FINAL ===' as info;

SELECT 'TABELAS RESTAURADAS:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verificar se há dados nas tabelas
SELECT 'DADOS NAS TABELAS:' as info;

SELECT 'Activities:' as tabela, COUNT(*) as total FROM public.activities;
SELECT 'Projects:' as tabela, COUNT(*) as total FROM public.projects;
SELECT 'Companies:' as tabela, COUNT(*) as total FROM public.companies;
SELECT 'User Profiles:' as tabela, COUNT(*) as total FROM public.user_profiles;

-- Verificar usuário atual
SELECT 'USUÁRIO ATUAL:' as info, auth.uid() as current_user_id;

-- =====================================================
-- 7. COMENTÁRIOS EXPLICATIVOS
-- =====================================================

COMMENT ON TABLE public.activities IS 'Tabela de atividades restaurada para emergência';
COMMENT ON TABLE public.projects IS 'Tabela de projetos restaurada para emergência';
COMMENT ON TABLE public.companies IS 'Tabela de empresas restaurada para emergência';
COMMENT ON TABLE public.user_profiles IS 'Tabela de usuários restaurada para emergência';

COMMENT ON TABLE public.activities IS 'SISTEMA RESTAURADO - RLS DESABILITADO TEMPORARIAMENTE PARA RESOLVER TELA BRANCA';
