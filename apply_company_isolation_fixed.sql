-- =====================================================
-- CORREÇÃO RÁPIDA DO ISOLAMENTO POR EMPRESA
-- =====================================================

-- 1. HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS AS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Usuários podem ver e editar apenas seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Isolamento por empresa - profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all operations on profiles" ON public.profiles;

DROP POLICY IF EXISTS "Usuários podem ver e editar apenas suas próprias empresas" ON public.companies;
DROP POLICY IF EXISTS "Isolamento por empresa - companies" ON public.companies;
DROP POLICY IF EXISTS "Allow all operations on companies" ON public.companies;

DROP POLICY IF EXISTS "Usuários podem ver e editar funcionários de suas empresas" ON public.employees;
DROP POLICY IF EXISTS "Isolamento por empresa - employees" ON public.employees;
DROP POLICY IF EXISTS "Allow all operations on employees" ON public.employees;

DROP POLICY IF EXISTS "Usuários podem ver e editar produtos de suas empresas" ON public.products;
DROP POLICY IF EXISTS "Isolamento por empresa - products" ON public.products;
DROP POLICY IF EXISTS "Allow all operations on products" ON public.products;

DROP POLICY IF EXISTS "Usuários podem ver e editar leads de suas empresas" ON public.leads;
DROP POLICY IF EXISTS "Isolamento por empresa - leads" ON public.leads;
DROP POLICY IF EXISTS "Allow all operations on leads" ON public.leads;

DROP POLICY IF EXISTS "Usuários podem ver e editar negócios de suas empresas" ON public.deals;
DROP POLICY IF EXISTS "Isolamento por empresa - deals" ON public.deals;
DROP POLICY IF EXISTS "Allow all operations on deals" ON public.deals;

DROP POLICY IF EXISTS "Usuários podem ver e editar suas próprias atividades" ON public.activities;
DROP POLICY IF EXISTS "Isolamento por empresa - activities" ON public.activities;
DROP POLICY IF EXISTS "Allow all operations on activities" ON public.activities;

DROP POLICY IF EXISTS "Usuários podem ver e editar projetos de suas empresas" ON public.projects;
DROP POLICY IF EXISTS "Isolamento por empresa - projects" ON public.projects;
DROP POLICY IF EXISTS "Allow all operations on projects" ON public.projects;

-- 3. CRIAR POLÍTICAS SIMPLES E EFETIVAS
-- Política para profiles - apenas usuário logado vê seu perfil
CREATE POLICY "profile_owner_only" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Política para companies - apenas owner vê sua empresa
CREATE POLICY "company_owner_only" ON public.companies
  FOR ALL USING (auth.uid() = owner_id);

-- Política para employees - apenas owner da empresa vê funcionários
CREATE POLICY "employee_company_only" ON public.employees
  FOR ALL USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM public.companies c 
      WHERE c.id = employees.company_id 
      AND c.owner_id = auth.uid()
    )
  );

-- Política para products - apenas owner da empresa vê produtos
CREATE POLICY "product_company_only" ON public.products
  FOR ALL USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM public.companies c 
      WHERE c.id = products.company_id 
      AND c.owner_id = auth.uid()
    )
  );

-- Política para leads - apenas owner da empresa vê leads
CREATE POLICY "lead_company_only" ON public.leads
  FOR ALL USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM public.companies c 
      WHERE c.id = leads.company_id 
      AND c.owner_id = auth.uid()
    )
  );

-- Política para deals - apenas owner da empresa vê negócios
CREATE POLICY "deal_company_only" ON public.deals
  FOR ALL USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM public.companies c 
      WHERE c.id = deals.company_id 
      AND c.owner_id = auth.uid()
    )
  );

-- Política para activities - apenas owner da empresa vê atividades
CREATE POLICY "activity_company_only" ON public.activities
  FOR ALL USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM public.companies c 
      WHERE c.id = activities.company_id 
      AND c.owner_id = auth.uid()
    )
  );

-- Política para projects - apenas owner da empresa vê projetos
CREATE POLICY "project_company_only" ON public.projects
  FOR ALL USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM public.companies c 
      WHERE c.id = projects.company_id 
      AND c.owner_id = auth.uid()
    )
  );

-- 4. VERIFICAR SE RLS ESTÁ FUNCIONANDO
SELECT 
    tablename,
    rowsecurity as rls_habilitado,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS Habilitado'
        ELSE '❌ RLS DESABILITADO'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('activities', 'companies', 'employees', 'products', 'projects', 'leads', 'deals', 'profiles')
ORDER BY tablename;
