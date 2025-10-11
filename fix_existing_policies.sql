-- =====================================================
-- SCRIPT PARA CORRIGIR POLÍTICAS RLS EXISTENTES
-- =====================================================
-- Execute este script se você já executou o script anterior
-- =====================================================

-- =====================================================
-- 1. REMOVER TODAS AS POLÍTICAS RLS EXISTENTES
-- =====================================================

-- Remover políticas antigas de profiles
DROP POLICY IF EXISTS "Usuários podem ver e editar apenas seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Isolamento por empresa - profiles" ON public.profiles;

-- Remover políticas antigas de companies
DROP POLICY IF EXISTS "Usuários podem ver e editar apenas suas próprias empresas" ON public.companies;
DROP POLICY IF EXISTS "Isolamento por empresa - companies" ON public.companies;

-- Remover políticas antigas de employees
DROP POLICY IF EXISTS "Usuários podem ver e editar funcionários de suas empresas" ON public.employees;
DROP POLICY IF EXISTS "Isolamento por empresa - employees" ON public.employees;

-- Remover políticas antigas de products
DROP POLICY IF EXISTS "Usuários podem ver e editar produtos de suas empresas" ON public.products;
DROP POLICY IF EXISTS "Isolamento por empresa - products" ON public.products;

-- Remover políticas antigas de leads
DROP POLICY IF EXISTS "Usuários podem ver e editar leads de suas empresas" ON public.leads;
DROP POLICY IF EXISTS "Isolamento por empresa - leads" ON public.leads;

-- Remover políticas antigas de deals
DROP POLICY IF EXISTS "Usuários podem ver e editar negócios de suas empresas" ON public.deals;
DROP POLICY IF EXISTS "Isolamento por empresa - deals" ON public.deals;

-- Remover políticas antigas de activities
DROP POLICY IF EXISTS "Usuários podem ver e editar suas próprias atividades" ON public.activities;
DROP POLICY IF EXISTS "Isolamento por empresa - activities" ON public.activities;

-- Remover políticas antigas de projects
DROP POLICY IF EXISTS "Usuários podem ver e editar projetos de suas empresas" ON public.projects;
DROP POLICY IF EXISTS "Isolamento por empresa - projects" ON public.projects;

-- =====================================================
-- 2. CRIAR NOVAS POLÍTICAS RLS COM ISOLAMENTO POR EMPRESA
-- =====================================================

-- Política para profiles - usuário pode ver seu próprio perfil e perfis da mesma empresa
CREATE POLICY "Isolamento por empresa - profiles" ON public.profiles
  FOR ALL USING (
    auth.uid() = id OR 
    company_id = public.get_user_company_id()
  );

-- Política para companies - usuário pode ver empresas que possui ou pertence
CREATE POLICY "Isolamento por empresa - companies" ON public.companies
  FOR ALL USING (
    owner_id = auth.uid() OR 
    id = public.get_user_company_id()
  );

-- Política para employees - usuário pode ver funcionários da mesma empresa
CREATE POLICY "Isolamento por empresa - employees" ON public.employees
  FOR ALL USING (
    owner_id = auth.uid() OR 
    company_id = public.get_user_company_id()
  );

-- Política para products - usuário pode ver produtos da mesma empresa
CREATE POLICY "Isolamento por empresa - products" ON public.products
  FOR ALL USING (
    owner_id = auth.uid() OR 
    company_id = public.get_user_company_id()
  );

-- Política para leads - usuário pode ver leads da mesma empresa
CREATE POLICY "Isolamento por empresa - leads" ON public.leads
  FOR ALL USING (
    owner_id = auth.uid() OR 
    company_id = public.get_user_company_id()
  );

-- Política para deals - usuário pode ver negócios da mesma empresa
CREATE POLICY "Isolamento por empresa - deals" ON public.deals
  FOR ALL USING (
    owner_id = auth.uid() OR 
    company_id = public.get_user_company_id()
  );

-- Política para activities - usuário pode ver atividades da mesma empresa
CREATE POLICY "Isolamento por empresa - activities" ON public.activities
  FOR ALL USING (
    owner_id = auth.uid() OR 
    company_id = public.get_user_company_id()
  );

-- Política para projects - usuário pode ver projetos da mesma empresa
CREATE POLICY "Isolamento por empresa - projects" ON public.projects
  FOR ALL USING (
    owner_id = auth.uid() OR 
    company_id = public.get_user_company_id()
  );

-- =====================================================
-- 3. COMENTÁRIOS FINAIS
-- =====================================================

-- Este script:
-- 1. Remove todas as políticas RLS existentes
-- 2. Cria as novas políticas com isolamento por empresa
-- 3. Resolve o erro de políticas duplicadas
-- 4. Mantém o sistema funcionando corretamente
