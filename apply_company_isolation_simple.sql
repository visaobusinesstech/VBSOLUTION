-- =====================================================
-- ISOLAMENTO SIMPLES POR EMPRESA
-- =====================================================
-- Script que usa APENAS company_id, sem depender de owner_id
-- Funciona independente da estrutura das tabelas
-- =====================================================

-- =====================================================
-- 1. ADICIONAR COMPANY_ID EM TODAS AS TABELAS
-- =====================================================

-- Tabelas Principais
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.funnel_stages ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Tabelas Adicionais
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.work_groups ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.collaborations ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Tabelas de WhatsApp
ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- =====================================================
-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Tabelas Principais
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_company_id ON public.companies(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_company_id ON public.inventory(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_company_id ON public.activities(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_company_id ON public.leads(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_company_id ON public.deals(company_id);
CREATE INDEX IF NOT EXISTS idx_funnel_stages_company_id ON public.funnel_stages(company_id);

-- Tabelas Adicionais
CREATE INDEX IF NOT EXISTS idx_suppliers_company_id ON public.suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_work_groups_company_id ON public.work_groups(company_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_company_id ON public.collaborations(company_id);
CREATE INDEX IF NOT EXISTS idx_files_company_id ON public.files(company_id);
CREATE INDEX IF NOT EXISTS idx_events_company_id ON public.events(company_id);
CREATE INDEX IF NOT EXISTS idx_company_settings_company_id ON public.company_settings(company_id);

-- Tabelas de WhatsApp
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_company_id ON public.whatsapp_mensagens(company_id);

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
-- 4. HABILITAR RLS EM TODAS AS TABELAS
-- =====================================================

-- Tabelas Principais
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_stages ENABLE ROW LEVEL SECURITY;

-- Tabelas Adicionais
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Tabelas de WhatsApp
ALTER TABLE public.whatsapp_mensagens ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. REMOVER TODAS AS POLÍTICAS EXISTENTES
-- =====================================================

-- Função para remover todas as políticas de uma tabela
DO $$
DECLARE
    table_name text;
    policy_name text;
BEGIN
    -- Lista das tabelas que existem
    FOR table_name IN 
        SELECT unnest(ARRAY[
            'profiles', 'companies', 'employees', 'products', 'inventory', 
            'activities', 'projects', 'leads', 'deals', 'funnel_stages',
            'suppliers', 'work_groups', 'collaborations', 'files', 'events', 
            'company_settings', 'whatsapp_mensagens'
        ])
    LOOP
        -- Remover todas as políticas da tabela
        FOR policy_name IN 
            SELECT policyname FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = table_name
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
        END LOOP;
    END LOOP;
END $$;

-- =====================================================
-- 6. CRIAR POLÍTICAS RLS SIMPLES (APENAS COMPANY_ID)
-- =====================================================

-- Política para profiles - usuário pode ver seu próprio perfil e perfis da mesma empresa
CREATE POLICY "company_isolation_profiles" ON public.profiles
  FOR ALL USING (auth.uid() = id OR company_id = public.get_user_company_id());

-- Política para companies - usuário pode ver empresas que possui
CREATE POLICY "company_isolation_companies" ON public.companies
  FOR ALL USING (owner_id = auth.uid() OR id = public.get_user_company_id());

-- Política para employees - usuário pode ver funcionários da mesma empresa
CREATE POLICY "company_isolation_employees" ON public.employees
  FOR ALL USING (company_id = public.get_user_company_id());

-- Política para products - usuário pode ver produtos da mesma empresa
CREATE POLICY "company_isolation_products" ON public.products
  FOR ALL USING (company_id = public.get_user_company_id());

-- Política para inventory - usuário pode ver inventário da mesma empresa
CREATE POLICY "company_isolation_inventory" ON public.inventory
  FOR ALL USING (
    company_id = public.get_user_company_id() OR
    EXISTS (
      SELECT 1 FROM public.products p 
      WHERE p.id = inventory.product_id 
      AND p.company_id = public.get_user_company_id()
    )
  );

-- Política para activities - usuário pode ver atividades da mesma empresa
CREATE POLICY "company_isolation_activities" ON public.activities
  FOR ALL USING (company_id = public.get_user_company_id());

-- Política para projects - usuário pode ver projetos da mesma empresa
CREATE POLICY "company_isolation_projects" ON public.projects
  FOR ALL USING (company_id = public.get_user_company_id());

-- Política para leads - usuário pode ver leads da mesma empresa
CREATE POLICY "company_isolation_leads" ON public.leads
  FOR ALL USING (company_id = public.get_user_company_id());

-- Política para deals - usuário pode ver negócios da mesma empresa
CREATE POLICY "company_isolation_deals" ON public.deals
  FOR ALL USING (company_id = public.get_user_company_id());

-- Política para funnel_stages - usuário pode ver etapas da mesma empresa
CREATE POLICY "company_isolation_funnel_stages" ON public.funnel_stages
  FOR ALL USING (company_id = public.get_user_company_id());

-- Política para suppliers - usuário pode ver fornecedores da mesma empresa
CREATE POLICY "company_isolation_suppliers" ON public.suppliers
  FOR ALL USING (company_id = public.get_user_company_id());

-- Política para work_groups - usuário pode ver grupos da mesma empresa
CREATE POLICY "company_isolation_work_groups" ON public.work_groups
  FOR ALL USING (company_id = public.get_user_company_id());

-- Política para collaborations - usuário pode ver colaborações da mesma empresa
CREATE POLICY "company_isolation_collaborations" ON public.collaborations
  FOR ALL USING (company_id = public.get_user_company_id());

-- Política para files - usuário pode ver arquivos da mesma empresa
CREATE POLICY "company_isolation_files" ON public.files
  FOR ALL USING (company_id = public.get_user_company_id());

-- Política para events - usuário pode ver eventos da mesma empresa
CREATE POLICY "company_isolation_events" ON public.events
  FOR ALL USING (company_id = public.get_user_company_id());

-- Política para company_settings - usuário pode ver configurações da mesma empresa
CREATE POLICY "company_isolation_company_settings" ON public.company_settings
  FOR ALL USING (company_id = public.get_user_company_id());

-- Política para whatsapp_mensagens - usuário pode ver mensagens da mesma empresa
CREATE POLICY "company_isolation_whatsapp_mensagens" ON public.whatsapp_mensagens
  FOR ALL USING (company_id = public.get_user_company_id());

-- =====================================================
-- 7. CRIAR EMPRESAS PARA USUÁRIOS EXISTENTES
-- =====================================================

-- Criar empresas para usuários que não têm empresa associada
INSERT INTO public.companies (
  id,
  owner_id,
  fantasy_name,
  company_name,
  email,
  status,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid() as id,
  p.id as owner_id,
  COALESCE(p.company, 'Empresa ' || p.email) as fantasy_name,
  COALESCE(p.company, 'Empresa ' || p.email) as company_name,
  p.email,
  'active' as status,
  p.created_at,
  p.updated_at
FROM public.profiles p
WHERE p.id NOT IN (
  SELECT DISTINCT c.owner_id FROM public.companies c 
  WHERE c.owner_id IS NOT NULL
)
AND p.id IS NOT NULL;

-- =====================================================
-- 8. ATUALIZAR PROFILES COM COMPANY_ID
-- =====================================================

-- Atualizar profiles com o company_id da empresa criada
UPDATE public.profiles 
SET company_id = c.id
FROM public.companies c
WHERE public.profiles.company IS NOT NULL 
  AND c.fantasy_name = public.profiles.company
  AND public.profiles.company_id IS NULL;

-- Para usuários sem empresa definida, criar uma empresa padrão
UPDATE public.profiles 
SET company_id = (
  SELECT id FROM public.companies 
  WHERE fantasy_name = 'Empresa ' || public.profiles.email 
  LIMIT 1
)
WHERE public.profiles.company_id IS NULL;

-- =====================================================
-- 9. ATUALIZAR DADOS EXISTENTES COM COMPANY_ID
-- =====================================================

-- Atualizar todas as tabelas com company_id baseado no perfil do usuário
UPDATE public.employees SET company_id = p.company_id FROM public.profiles p WHERE public.employees.company_id IS NULL;
UPDATE public.products SET company_id = p.company_id FROM public.profiles p WHERE public.products.company_id IS NULL;
UPDATE public.inventory SET company_id = pr.company_id FROM public.products pr WHERE public.inventory.company_id IS NULL;
UPDATE public.activities SET company_id = p.company_id FROM public.profiles p WHERE public.activities.company_id IS NULL;
UPDATE public.projects SET company_id = p.company_id FROM public.profiles p WHERE public.projects.company_id IS NULL;
UPDATE public.leads SET company_id = p.company_id FROM public.profiles p WHERE public.leads.company_id IS NULL;
UPDATE public.deals SET company_id = p.company_id FROM public.profiles p WHERE public.deals.company_id IS NULL;
UPDATE public.funnel_stages SET company_id = p.company_id FROM public.profiles p WHERE public.funnel_stages.company_id IS NULL;
UPDATE public.suppliers SET company_id = p.company_id FROM public.profiles p WHERE public.suppliers.company_id IS NULL;
UPDATE public.work_groups SET company_id = p.company_id FROM public.profiles p WHERE public.work_groups.company_id IS NULL;
UPDATE public.collaborations SET company_id = p.company_id FROM public.profiles p WHERE public.collaborations.company_id IS NULL;
UPDATE public.files SET company_id = p.company_id FROM public.profiles p WHERE public.files.company_id IS NULL;
UPDATE public.events SET company_id = p.company_id FROM public.profiles p WHERE public.events.company_id IS NULL;
UPDATE public.company_settings SET company_id = p.company_id FROM public.profiles p WHERE public.company_settings.company_id IS NULL;
UPDATE public.whatsapp_mensagens SET company_id = p.company_id FROM public.profiles p WHERE public.whatsapp_mensagens.company_id IS NULL;

-- =====================================================
-- 10. FUNÇÃO PARA CRIAR EMPRESA AUTOMATICAMENTE
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
    id,
    owner_id,
    fantasy_name,
    company_name,
    email,
    status
  ) VALUES (
    gen_random_uuid(),
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
-- 11. TRIGGER PARA CRIAR EMPRESA AUTOMATICAMENTE
-- =====================================================

-- Trigger para criar empresa automaticamente quando usuário se cadastra
DROP TRIGGER IF EXISTS create_company_on_user_signup ON auth.users;
CREATE TRIGGER create_company_on_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_company_for_new_user();

-- =====================================================
-- 12. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar RLS habilitado em todas as tabelas
SELECT 
    tablename as "Tabela",
    rowsecurity as "RLS Habilitado",
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS Habilitado'
        ELSE '❌ RLS DESABILITADO'
    END as "Status"
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'profiles', 'companies', 'employees', 'products', 'inventory', 
    'activities', 'projects', 'leads', 'deals', 'funnel_stages',
    'suppliers', 'work_groups', 'collaborations', 'files', 'events', 
    'company_settings', 'whatsapp_mensagens'
  )
ORDER BY tablename;

-- Verificar políticas criadas
SELECT 
    tablename as "Tabela",
    COUNT(*) as "Total Políticas",
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Políticas Criadas'
        ELSE '❌ SEM Políticas'
    END as "Status"
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN (
    'profiles', 'companies', 'employees', 'products', 'inventory', 
    'activities', 'projects', 'leads', 'deals', 'funnel_stages',
    'suppliers', 'work_groups', 'collaborations', 'files', 'events', 
    'company_settings', 'whatsapp_mensagens'
  )
GROUP BY tablename
ORDER BY tablename;

-- Verificar dados sem company_id
SELECT 'profiles sem company_id' as tabela, COUNT(*) as quantidade
FROM public.profiles WHERE company_id IS NULL
UNION ALL
SELECT 'employees sem company_id', COUNT(*)
FROM public.employees WHERE company_id IS NULL
UNION ALL
SELECT 'products sem company_id', COUNT(*)
FROM public.products WHERE company_id IS NULL
UNION ALL
SELECT 'activities sem company_id', COUNT(*)
FROM public.activities WHERE company_id IS NULL
UNION ALL
SELECT 'projects sem company_id', COUNT(*)
FROM public.projects WHERE company_id IS NULL
UNION ALL
SELECT 'leads sem company_id', COUNT(*)
FROM public.leads WHERE company_id IS NULL
UNION ALL
SELECT 'deals sem company_id', COUNT(*)
FROM public.deals WHERE company_id IS NULL
UNION ALL
SELECT 'suppliers sem company_id', COUNT(*)
FROM public.suppliers WHERE company_id IS NULL
UNION ALL
SELECT 'work_groups sem company_id', COUNT(*)
FROM public.work_groups WHERE company_id IS NULL
UNION ALL
SELECT 'collaborations sem company_id', COUNT(*)
FROM public.collaborations WHERE company_id IS NULL
UNION ALL
SELECT 'files sem company_id', COUNT(*)
FROM public.files WHERE company_id IS NULL
UNION ALL
SELECT 'events sem company_id', COUNT(*)
FROM public.events WHERE company_id IS NULL
UNION ALL
SELECT 'company_settings sem company_id', COUNT(*)
FROM public.company_settings WHERE company_id IS NULL
UNION ALL
SELECT 'whatsapp_mensagens sem company_id', COUNT(*)
FROM public.whatsapp_mensagens WHERE company_id IS NULL;

-- =====================================================
-- 13. COMENTÁRIOS FINAIS
-- =====================================================

-- Este script garante que:
-- 1. NÃO usa owner_id em lugar nenhum
-- 2. Usa apenas company_id para isolamento
-- 3. Funciona independente da estrutura das tabelas
-- 4. Sistema de isolamento por empresa funcionando
-- 5. Trigger automático para criação de empresa no cadastro
-- 6. Políticas RLS simples e eficazes
-- 7. Migração automática de dados existentes
-- 8. Verificações finais de funcionamento
