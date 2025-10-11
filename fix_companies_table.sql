-- =====================================================
-- CORREÇÃO DA TABELA COMPANIES - VBSOLUTION
-- =====================================================
-- Este script corrige problemas comuns na tabela companies
-- Execute no SQL Editor do Supabase

-- =====================================================
-- 1. VERIFICAR E CRIAR TABELAS NECESSÁRIAS
-- =====================================================

-- Verificar se a tabela profiles existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        CREATE TABLE public.profiles (
            id UUID REFERENCES auth.users(id) PRIMARY KEY,
            email TEXT NOT NULL,
            name TEXT NOT NULL,
            company TEXT,
            avatar_url TEXT,
            position TEXT,
            department TEXT,
            role TEXT DEFAULT 'user',
            phone TEXT,
            address TEXT,
            preferences JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
    END IF;
END $$;

-- Verificar se a tabela companies existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies') THEN
        CREATE TABLE public.companies (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            owner_id UUID NOT NULL REFERENCES public.profiles(id),
            fantasy_name TEXT NOT NULL,
            company_name TEXT,
            cnpj TEXT,
            reference TEXT,
            cep TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            email TEXT,
            phone TEXT,
            logo_url TEXT,
            description TEXT,
            sector TEXT,
            status TEXT DEFAULT 'active',
            settings JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
    END IF;
END $$;

-- =====================================================
-- 2. CORRIGIR ESTRUTURA DA TABELA COMPANIES
-- =====================================================

-- Adicionar coluna owner_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'owner_id') THEN
        ALTER TABLE public.companies ADD COLUMN owner_id UUID REFERENCES public.profiles(id);
    END IF;
    
    -- Adicionar coluna fantasy_name se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'fantasy_name') THEN
        ALTER TABLE public.companies ADD COLUMN fantasy_name TEXT;
    END IF;
    
    -- Adicionar coluna company_name se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'company_name') THEN
        ALTER TABLE public.companies ADD COLUMN company_name TEXT;
    END IF;
    
    -- Adicionar outras colunas necessárias
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'cnpj') THEN
        ALTER TABLE public.companies ADD COLUMN cnpj TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'email') THEN
        ALTER TABLE public.companies ADD COLUMN email TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'phone') THEN
        ALTER TABLE public.companies ADD COLUMN phone TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'address') THEN
        ALTER TABLE public.companies ADD COLUMN address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'city') THEN
        ALTER TABLE public.companies ADD COLUMN city TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'state') THEN
        ALTER TABLE public.companies ADD COLUMN state TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'cep') THEN
        ALTER TABLE public.companies ADD COLUMN cep TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'logo_url') THEN
        ALTER TABLE public.companies ADD COLUMN logo_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'description') THEN
        ALTER TABLE public.companies ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'sector') THEN
        ALTER TABLE public.companies ADD COLUMN sector TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'status') THEN
        ALTER TABLE public.companies ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'settings') THEN
        ALTER TABLE public.companies ADD COLUMN settings JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'created_at') THEN
        ALTER TABLE public.companies ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'updated_at') THEN
        ALTER TABLE public.companies ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
    END IF;
END $$;

-- =====================================================
-- 3. HABILITAR ROW LEVEL SECURITY
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CRIAR POLÍTICAS RLS
-- =====================================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários só veem seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários só veem suas próprias empresas" ON public.companies;
DROP POLICY IF EXISTS "Usuários podem criar empresas" ON public.companies;
DROP POLICY IF EXISTS "Usuários podem editar suas empresas" ON public.companies;
DROP POLICY IF EXISTS "Usuários podem excluir suas empresas" ON public.companies;

-- Política para profiles (usuário só vê seu próprio perfil)
CREATE POLICY "Usuários só veem seu próprio perfil" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- Política para companies (usuário só vê empresas que criou)
CREATE POLICY "Usuários só veem suas próprias empresas" ON public.companies
    FOR SELECT USING (owner_id = auth.uid());

-- Política para inserção de companies
CREATE POLICY "Usuários podem criar empresas" ON public.companies
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Política para atualização de companies
CREATE POLICY "Usuários podem editar suas empresas" ON public.companies
    FOR UPDATE USING (owner_id = auth.uid());

-- Política para exclusão de companies
CREATE POLICY "Usuários podem excluir suas empresas" ON public.companies
    FOR DELETE USING (owner_id = auth.uid());

-- =====================================================
-- 5. CRIAR FUNÇÃO DE TRIGGER PARA ATUALIZAR updated_at
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para companies se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_companies_updated_at') THEN
        CREATE TRIGGER update_companies_updated_at
            BEFORE UPDATE ON public.companies
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =====================================================
-- 6. VERIFICAR E CORRIGIR DADOS EXISTENTES
-- =====================================================

-- Verificar se há empresas sem owner_id
DO $$
DECLARE
    companies_without_owner INTEGER;
BEGIN
    SELECT COUNT(*) INTO companies_without_owner 
    FROM public.companies 
    WHERE owner_id IS NULL;
    
    IF companies_without_owner > 0 THEN
        -- Atualizar empresas sem owner_id
        UPDATE public.companies 
        SET owner_id = (SELECT id FROM public.profiles LIMIT 1) 
        WHERE owner_id IS NULL;
    END IF;
END $$;

-- =====================================================
-- 7. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar estrutura final
SELECT 
    'companies' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'companies' 
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'companies')
ORDER BY tablename, policyname;

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'companies');

-- Verificar se as tabelas foram criadas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('profiles', 'companies')
AND table_schema = 'public';
