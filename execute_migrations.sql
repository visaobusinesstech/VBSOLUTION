-- =====================================================
-- MIGRAÇÕES AUTOMÁTICAS PARA CORRIGIR TABELA COMPANIES
-- =====================================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- Este script corrige todos os problemas automaticamente

-- =====================================================
-- 1. DESABILITAR RLS TEMPORARIAMENTE
-- =====================================================
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. CORRIGIR ESTRUTURA DA TABELA COMPANIES
-- =====================================================

-- Adicionar colunas que podem estar faltando
DO $$
BEGIN
    -- Adicionar coluna owner_id se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'owner_id') THEN
        ALTER TABLE public.companies ADD COLUMN owner_id UUID;
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
-- 3. CRIAR EMPRESA DE TESTE
-- =====================================================

-- Inserir empresa de teste se não existir
INSERT INTO public.companies (
    owner_id,
    fantasy_name,
    company_name,
    email,
    status,
    created_at,
    updated_at
) VALUES (
    'd237e6f7-34dd-4db5-a01d-3415d815a6ad',
    'Empresa Teste Automática',
    'Empresa Teste Automática LTDA',
    'teste@empresa.com',
    'active',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. VERIFICAR DADOS
-- =====================================================

-- Verificar total de empresas
SELECT COUNT(*) as total_companies FROM public.companies;

-- Verificar total de perfis
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Verificar empresas do usuário específico
SELECT * FROM public.companies WHERE owner_id = 'd237e6f7-34dd-4db5-a01d-3415d815a6ad';

-- =====================================================
-- 5. CONFIGURAR RLS CORRETAMENTE
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários só veem seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários só veem suas próprias empresas" ON public.companies;
DROP POLICY IF EXISTS "Usuários podem criar empresas" ON public.companies;
DROP POLICY IF EXISTS "Usuários podem editar suas empresas" ON public.companies;
DROP POLICY IF EXISTS "Usuários podem excluir suas empresas" ON public.companies;

-- Criar políticas corretas
CREATE POLICY "Usuários só veem seu próprio perfil" ON public.profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Usuários só veem suas próprias empresas" ON public.companies
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Usuários podem criar empresas" ON public.companies
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Usuários podem editar suas empresas" ON public.companies
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Usuários podem excluir suas empresas" ON public.companies
    FOR DELETE USING (owner_id = auth.uid());

-- =====================================================
-- 6. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'companies');

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

-- Verificar estrutura final da tabela companies
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'companies' 
ORDER BY ordinal_position;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- ✅ RLS desabilitado temporariamente
-- ✅ Estrutura da tabela corrigida
-- ✅ Empresa de teste criada
-- ✅ RLS configurado corretamente
-- ✅ Políticas de acesso criadas
-- ✅ Usuário pode criar, editar e excluir empresas
-- ✅ Empresas aparecem na lista da página

-- =====================================================
-- APÓS EXECUTAR ESTE SCRIPT:
-- =====================================================
-- 1. Volte para a página /companies
-- 2. Clique em "Tentar novamente"
-- 3. Tente criar uma nova empresa
-- 4. Verifique se aparece na lista
-- =====================================================
