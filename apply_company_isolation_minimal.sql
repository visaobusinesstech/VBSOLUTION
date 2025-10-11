-- =====================================================
-- SCRIPT MÍNIMO PARA ISOLAMENTO DE DADOS POR EMPRESA
-- =====================================================
-- Aplica isolamento apenas nas tabelas principais que certamente existem
-- =====================================================

-- =====================================================
-- 1. ADICIONAR COLUNA COMPANY_ID NAS TABELAS PRINCIPAIS
-- =====================================================

-- Adicionar company_id na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Adicionar company_id na tabela companies (se não existir)
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Adicionar company_id na tabela employees
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Adicionar company_id na tabela products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Adicionar company_id na tabela activities
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Adicionar company_id na tabela projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Adicionar company_id na tabela leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Adicionar company_id na tabela deals
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- =====================================================
-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_company_id ON public.companies(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_company_id ON public.activities(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_company_id ON public.leads(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_company_id ON public.deals(company_id);

-- =====================================================
-- 3. FUNÇÃO PARA OBTER COMPANY_ID DO USUÁRIO
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID AS $$
DECLARE
  user_company_id UUID;
BEGIN
  -- Primeiro, tentar obter da tabela profiles
  SELECT company_id INTO user_company_id
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Se não encontrou na profiles, tentar na tabela companies como owner
  IF user_company_id IS NULL THEN
    SELECT id INTO user_company_id
    FROM public.companies
    WHERE owner_id = auth.uid()
    LIMIT 1;
  END IF;
  
  RETURN user_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. CRIAR EMPRESAS PARA USUÁRIOS EXISTENTES
-- =====================================================

-- Criar empresas para usuários que não têm empresa associada
INSERT INTO public.companies (
  owner_id,
  fantasy_name,
  company_name,
  email,
  status,
  created_at,
  updated_at
)
SELECT 
  p.id as owner_id,
  COALESCE(p.company, 'Empresa ' || p.email) as fantasy_name,
  COALESCE(p.company, 'Empresa ' || p.email) as company_name,
  p.email,
  'active' as status,
  p.created_at,
  p.updated_at
FROM public.profiles p
WHERE p.id NOT IN (
  SELECT DISTINCT owner_id FROM public.companies WHERE owner_id IS NOT NULL
)
AND p.id IS NOT NULL;

-- =====================================================
-- 5. ATUALIZAR PROFILES COM COMPANY_ID
-- =====================================================

-- Atualizar profiles com o company_id da empresa criada
UPDATE public.profiles 
SET company_id = c.id
FROM public.companies c
WHERE public.profiles.id = c.owner_id
AND public.profiles.company_id IS NULL;

-- =====================================================
-- 6. ATUALIZAR DADOS EXISTENTES COM COMPANY_ID
-- =====================================================

-- Atualizar employees com company_id
UPDATE public.employees 
SET company_id = p.company_id
FROM public.profiles p
WHERE public.employees.owner_id = p.id
AND public.employees.company_id IS NULL;

-- Atualizar products com company_id
UPDATE public.products 
SET company_id = p.company_id
FROM public.profiles p
WHERE public.products.owner_id = p.id
AND public.products.company_id IS NULL;

-- Atualizar leads com company_id
UPDATE public.leads 
SET company_id = p.company_id
FROM public.profiles p
WHERE public.leads.owner_id = p.id
AND public.leads.company_id IS NULL;

-- Atualizar deals com company_id
UPDATE public.deals 
SET company_id = p.company_id
FROM public.profiles p
WHERE public.deals.owner_id = p.id
AND public.deals.company_id IS NULL;

-- Atualizar activities com company_id
UPDATE public.activities 
SET company_id = p.company_id
FROM public.profiles p
WHERE public.activities.owner_id = p.id
AND public.activities.company_id IS NULL;

-- Atualizar projects com company_id
UPDATE public.projects 
SET company_id = p.company_id
FROM public.profiles p
WHERE public.projects.owner_id = p.id
AND public.projects.company_id IS NULL;

-- =====================================================
-- 7. REMOVER POLÍTICAS RLS ANTIGAS
-- =====================================================

DROP POLICY IF EXISTS "Usuários podem ver e editar apenas seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver e editar apenas suas próprias empresas" ON public.companies;
DROP POLICY IF EXISTS "Usuários podem ver e editar funcionários de suas empresas" ON public.employees;
DROP POLICY IF EXISTS "Usuários podem ver e editar produtos de suas empresas" ON public.products;
DROP POLICY IF EXISTS "Usuários podem ver e editar leads de suas empresas" ON public.leads;
DROP POLICY IF EXISTS "Usuários podem ver e editar negócios de suas empresas" ON public.deals;
DROP POLICY IF EXISTS "Usuários podem ver e editar suas próprias atividades" ON public.activities;
DROP POLICY IF EXISTS "Usuários podem ver e editar projetos de suas empresas" ON public.projects;

-- =====================================================
-- 8. CRIAR NOVAS POLÍTICAS RLS COM ISOLAMENTO POR EMPRESA
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
-- 9. FUNÇÃO PARA CRIAR EMPRESA AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_company_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  company_name TEXT;
  new_company_id UUID;
BEGIN
  -- Obter nome da empresa dos metadados do usuário
  company_name := COALESCE(NEW.raw_user_meta_data->>'company', 'Empresa ' || NEW.email);
  
  -- Criar empresa automaticamente
  INSERT INTO public.companies (
    owner_id,
    fantasy_name,
    company_name,
    email,
    status
  ) VALUES (
    NEW.id,
    company_name,
    company_name,
    NEW.email,
    'active'
  ) RETURNING id INTO new_company_id;
  
  -- Atualizar o perfil com o company_id
  UPDATE public.profiles 
  SET company_id = new_company_id
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. TRIGGER PARA CRIAR EMPRESA AUTOMATICAMENTE
-- =====================================================

-- Trigger para criar empresa automaticamente quando usuário se cadastra
DROP TRIGGER IF EXISTS create_company_on_user_signup ON auth.users;
CREATE TRIGGER create_company_on_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_company_for_new_user();

-- =====================================================
-- 11. VERIFICAÇÕES FINAIS
-- =====================================================

-- Verificar se há dados sem company_id
SELECT 'profiles sem company_id' as tabela, COUNT(*) as quantidade
FROM public.profiles WHERE company_id IS NULL
UNION ALL
SELECT 'employees sem company_id', COUNT(*)
FROM public.employees WHERE company_id IS NULL
UNION ALL
SELECT 'products sem company_id', COUNT(*)
FROM public.products WHERE company_id IS NULL
UNION ALL
SELECT 'leads sem company_id', COUNT(*)
FROM public.leads WHERE company_id IS NULL
UNION ALL
SELECT 'deals sem company_id', COUNT(*)
FROM public.deals WHERE company_id IS NULL
UNION ALL
SELECT 'activities sem company_id', COUNT(*)
FROM public.activities WHERE company_id IS NULL
UNION ALL
SELECT 'projects sem company_id', COUNT(*)
FROM public.projects WHERE company_id IS NULL;

-- =====================================================
-- 12. COMENTÁRIOS FINAIS
-- =====================================================

-- Este script garante que:
-- 1. Aplica isolamento apenas nas tabelas principais que existem
-- 2. Evita erros de tabelas não encontradas
-- 3. Sistema de isolamento por empresa funcionando
-- 4. Trigger automático para criação de empresa no cadastro
-- 5. Políticas RLS implementadas
-- 6. Migração de dados existentes
