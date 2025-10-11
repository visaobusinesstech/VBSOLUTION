-- =====================================================
-- CORREÇÃO FINAL COMPLETA DA TABELA COMPANIES
-- =====================================================
-- Este script resolve TODOS os problemas restantes
-- Execute no SQL Editor do Supabase

-- =====================================================
-- 1. DESABILITAR RLS TEMPORARIAMENTE
-- =====================================================
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. ADICIONAR CAMPOS QUE ESTÃO FALTANDO
-- =====================================================

-- Adicionar campo is_supplier se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'is_supplier') THEN
        ALTER TABLE public.companies ADD COLUMN is_supplier BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Adicionar campo activity_data se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'activity_data') THEN
        ALTER TABLE public.companies ADD COLUMN activity_data JSONB DEFAULT '{}';
    END IF;
END $$;

-- =====================================================
-- 3. CORRIGIR DADOS EXISTENTES
-- =====================================================

-- Atualizar empresas sem owner_id
UPDATE public.companies 
SET owner_id = 'd237e6f7-34dd-4db5-a01d-3415d815a6ad' 
WHERE owner_id IS NULL;

-- Definir valores padrão para campos obrigatórios
UPDATE public.companies 
SET 
    fantasy_name = COALESCE(fantasy_name, 'Empresa sem nome'),
    status = COALESCE(status, 'active'),
    is_supplier = COALESCE(is_supplier, false),
    activity_data = COALESCE(activity_data, '{}')
WHERE 
    fantasy_name IS NULL 
    OR status IS NULL 
    OR is_supplier IS NULL 
    OR activity_data IS NULL;

-- =====================================================
-- 4. CRIAR EMPRESA DE TESTE ATUALIZADA
-- =====================================================

-- Inserir empresa de teste com todos os campos
INSERT INTO public.companies (
    owner_id,
    fantasy_name,
    company_name,
    email,
    status,
    is_supplier,
    activity_data,
    created_at,
    updated_at
) VALUES (
    'd237e6f7-34dd-4db5-a01d-3415d815a6ad',
    'Empresa Teste Completa',
    'Empresa Teste Completa LTDA',
    'teste@empresa.com',
    'active',
    false,
    '{"name": "Atividade de teste", "responsible": "Sistema", "description": "Atividade criada automaticamente"}',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5. VERIFICAR ESTRUTURA FINAL
-- =====================================================

-- Verificar todas as colunas da tabela companies
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'companies' 
ORDER BY ordinal_position;

-- Verificar dados das empresas
SELECT 
    id,
    fantasy_name,
    company_name,
    email,
    status,
    is_supplier,
    owner_id
FROM public.companies 
ORDER BY created_at DESC;

-- =====================================================
-- 6. CONFIGURAR RLS CORRETAMENTE
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
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
-- 7. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se RLS está funcionando
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

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- ✅ RLS desabilitado temporariamente
-- ✅ Campo is_supplier adicionado
-- ✅ Campo activity_data adicionado
-- ✅ Dados existentes corrigidos
-- ✅ Empresa de teste criada
-- ✅ RLS configurado corretamente
-- ✅ Todas as políticas criadas
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
