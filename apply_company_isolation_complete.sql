-- =====================================================
-- SCRIPT COMPLETO PARA ISOLAMENTO DE DADOS POR EMPRESA
-- =====================================================
-- Execute este script no Supabase SQL Editor para implementar
-- o sistema completo de isolamento por empresa
-- =====================================================

-- =====================================================
-- 1. ADICIONAR COLUNA COMPANY_ID EM TODAS AS TABELAS
-- =====================================================

-- Adicionar company_id na tabela profiles (se não existir)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Adicionar company_id na tabela employees (se não existir)
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Adicionar company_id na tabela products (se não existir)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Adicionar company_id na tabela inventory (se não existir)
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Adicionar company_id na tabela funnel_stages (se não existir)
ALTER TABLE public.funnel_stages 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Adicionar company_id na tabela leads (se não existir)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Adicionar company_id na tabela deals (se não existir)
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Adicionar company_id na tabela activities (se não existir)
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Adicionar company_id na tabela projects (se não existir)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Adicionar company_id na tabela whatsapp_atendimentos (se não existir)
ALTER TABLE public.whatsapp_atendimentos 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Adicionar company_id na tabela whatsapp_mensagens (se não existir)
ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- =====================================================
-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para company_id em todas as tabelas
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_company_id ON public.inventory(company_id);
CREATE INDEX IF NOT EXISTS idx_funnel_stages_company_id ON public.funnel_stages(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_company_id ON public.leads(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_company_id ON public.deals(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_company_id ON public.activities(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_atendimentos_company_id ON public.whatsapp_atendimentos(company_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_company_id ON public.whatsapp_mensagens(company_id);

-- =====================================================
-- 3. FUNÇÃO PARA OBTER COMPANY_ID DO USUÁRIO
-- =====================================================

-- Função para obter o company_id do usuário logado
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
-- 4. CRIAR EMPRESAS PARA USUÁRIOS EXISTENTES SEM EMPRESA
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

-- Atualizar inventory com company_id (via products)
UPDATE public.inventory 
SET company_id = pr.company_id
FROM public.products pr
WHERE public.inventory.product_id = pr.id
AND public.inventory.company_id IS NULL;

-- Atualizar funnel_stages com company_id
UPDATE public.funnel_stages 
SET company_id = p.company_id
FROM public.profiles p
WHERE public.funnel_stages.owner_id = p.id
AND public.funnel_stages.company_id IS NULL;

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

-- Atualizar whatsapp_atendimentos com company_id
UPDATE public.whatsapp_atendimentos 
SET company_id = p.company_id
FROM public.profiles p
WHERE public.whatsapp_atendimentos.owner_id = p.id
AND public.whatsapp_atendimentos.company_id IS NULL;

-- =====================================================
-- 7. REMOVER POLÍTICAS RLS ANTIGAS
-- =====================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Usuários podem ver e editar apenas seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver e editar apenas suas próprias empresas" ON public.companies;
DROP POLICY IF EXISTS "Usuários podem ver e editar funcionários de suas empresas" ON public.employees;
DROP POLICY IF EXISTS "Usuários podem ver e editar produtos de suas empresas" ON public.products;
DROP POLICY IF EXISTS "Usuários podem ver e editar inventário de suas empresas" ON public.inventory;
DROP POLICY IF EXISTS "Usuários podem ver e editar etapas de seu funil" ON public.funnel_stages;
DROP POLICY IF EXISTS "Usuários podem ver e editar leads de suas empresas" ON public.leads;
DROP POLICY IF EXISTS "Usuários podem ver e editar negócios de suas empresas" ON public.deals;
DROP POLICY IF EXISTS "Usuários podem ver e editar suas próprias atividades" ON public.activities;
DROP POLICY IF EXISTS "Usuários podem ver e editar projetos de suas empresas" ON public.projects;
DROP POLICY IF EXISTS "Usuários podem ver e editar atendimentos de suas empresas" ON public.whatsapp_atendimentos;
DROP POLICY IF EXISTS "Usuários podem ver e editar mensagens de suas empresas" ON public.whatsapp_mensagens;

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

-- Política para inventory - usuário pode ver inventário da mesma empresa
CREATE POLICY "Isolamento por empresa - inventory" ON public.inventory
  FOR ALL USING (
    owner_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.products p 
      WHERE p.id = inventory.product_id 
      AND p.company_id = public.get_user_company_id()
    )
  );

-- Política para funnel_stages - usuário pode ver etapas da mesma empresa
CREATE POLICY "Isolamento por empresa - funnel_stages" ON public.funnel_stages
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

-- Política para whatsapp_atendimentos - usuário pode ver atendimentos da mesma empresa
CREATE POLICY "Isolamento por empresa - whatsapp_atendimentos" ON public.whatsapp_atendimentos
  FOR ALL USING (
    owner_id = auth.uid() OR 
    company_id = public.get_user_company_id()
  );

-- Política para whatsapp_mensagens - usuário pode ver mensagens da mesma empresa
CREATE POLICY "Isolamento por empresa - whatsapp_mensagens" ON public.whatsapp_mensagens
  FOR ALL USING (
    owner_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.whatsapp_atendimentos wa 
      WHERE wa.id = whatsapp_mensagens.atendimento_id 
      AND wa.company_id = public.get_user_company_id()
    )
  );

-- =====================================================
-- 9. FUNÇÃO PARA CRIAR EMPRESA AUTOMATICAMENTE
-- =====================================================

-- Função para criar empresa automaticamente quando usuário se cadastra
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
FROM public.projects WHERE company_id IS NULL
UNION ALL
SELECT 'whatsapp_atendimentos sem company_id', COUNT(*)
FROM public.whatsapp_atendimentos WHERE company_id IS NULL;

-- =====================================================
-- 12. COMENTÁRIOS FINAIS
-- =====================================================

-- Este script garante que:
-- 1. Todas as tabelas têm a coluna company_id
-- 2. As políticas RLS filtram dados por empresa
-- 3. Quando um usuário se cadastra, uma empresa é criada automaticamente
-- 4. O usuário é automaticamente associado à empresa criada
-- 5. Todos os dados ficam isolados por empresa
-- 6. O sistema mantém compatibilidade com dados existentes
-- 7. Migração automática de dados existentes
-- 8. Performance otimizada com índices apropriados
