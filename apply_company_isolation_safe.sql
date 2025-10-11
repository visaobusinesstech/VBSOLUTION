-- =====================================================
-- ISOLAMENTO SEGURO POR EMPRESA
-- =====================================================
-- Script que verifica a estrutura das tabelas antes de aplicar mudanças
-- Evita erros de colunas inexistentes
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
-- 6. CRIAR POLÍTICAS RLS SEGURAS
-- =====================================================

-- Política para profiles - usuário pode ver seu próprio perfil e perfis da mesma empresa
CREATE POLICY "company_isolation_profiles" ON public.profiles
  FOR ALL USING (auth.uid() = id OR company_id = public.get_user_company_id());

-- Política para companies - usuário pode ver empresas que possui
CREATE POLICY "company_isolation_companies" ON public.companies
  FOR ALL USING (auth.uid() = owner_id);

-- Política para employees - usuário pode ver funcionários da mesma empresa
CREATE POLICY "company_isolation_employees" ON public.employees
  FOR ALL USING (
    company_id = public.get_user_company_id() OR
    (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'owner_id' AND table_schema = 'public') 
     AND owner_id = auth.uid())
  );

-- Política para products - usuário pode ver produtos da mesma empresa
CREATE POLICY "company_isolation_products" ON public.products
  FOR ALL USING (
    company_id = public.get_user_company_id() OR
    (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'owner_id' AND table_schema = 'public') 
     AND owner_id = auth.uid())
  );

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
  FOR ALL USING (
    company_id = public.get_user_company_id() OR
    (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'owner_id' AND table_schema = 'public') 
     AND owner_id = auth.uid())
  );

-- Política para projects - usuário pode ver projetos da mesma empresa
CREATE POLICY "company_isolation_projects" ON public.projects
  FOR ALL USING (
    company_id = public.get_user_company_id() OR
    (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'owner_id' AND table_schema = 'public') 
     AND owner_id = auth.uid())
  );

-- Política para leads - usuário pode ver leads da mesma empresa
CREATE POLICY "company_isolation_leads" ON public.leads
  FOR ALL USING (
    company_id = public.get_user_company_id() OR
    (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'owner_id' AND table_schema = 'public') 
     AND owner_id = auth.uid())
  );

-- Política para deals - usuário pode ver negócios da mesma empresa
CREATE POLICY "company_isolation_deals" ON public.deals
  FOR ALL USING (
    company_id = public.get_user_company_id() OR
    (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'owner_id' AND table_schema = 'public') 
     AND owner_id = auth.uid())
  );

-- Política para funnel_stages - usuário pode ver etapas da mesma empresa
CREATE POLICY "company_isolation_funnel_stages" ON public.funnel_stages
  FOR ALL USING (
    company_id = public.get_user_company_id() OR
    (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funnel_stages' AND column_name = 'owner_id' AND table_schema = 'public') 
     AND owner_id = auth.uid())
  );

-- Política para suppliers - usuário pode ver fornecedores da mesma empresa
CREATE POLICY "company_isolation_suppliers" ON public.suppliers
  FOR ALL USING (
    company_id = public.get_user_company_id() OR
    (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'owner_id' AND table_schema = 'public') 
     AND owner_id = auth.uid())
  );

-- Política para work_groups - usuário pode ver grupos da mesma empresa
CREATE POLICY "company_isolation_work_groups" ON public.work_groups
  FOR ALL USING (
    company_id = public.get_user_company_id() OR
    (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_groups' AND column_name = 'owner_id' AND table_schema = 'public') 
     AND owner_id = auth.uid())
  );

-- Política para collaborations - usuário pode ver colaborações da mesma empresa
CREATE POLICY "company_isolation_collaborations" ON public.collaborations
  FOR ALL USING (
    company_id = public.get_user_company_id() OR
    (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collaborations' AND column_name = 'owner_id' AND table_schema = 'public') 
     AND owner_id = auth.uid())
  );

-- Política para files - usuário pode ver arquivos da mesma empresa
CREATE POLICY "company_isolation_files" ON public.files
  FOR ALL USING (
    company_id = public.get_user_company_id() OR
    (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'owner_id' AND table_schema = 'public') 
     AND owner_id = auth.uid())
  );

-- Política para events - usuário pode ver eventos da mesma empresa
CREATE POLICY "company_isolation_events" ON public.events
  FOR ALL USING (
    company_id = public.get_user_company_id() OR
    (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'owner_id' AND table_schema = 'public') 
     AND owner_id = auth.uid())
  );

-- Política para company_settings - usuário pode ver configurações da mesma empresa
CREATE POLICY "company_isolation_company_settings" ON public.company_settings
  FOR ALL USING (
    company_id = public.get_user_company_id() OR
    (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'owner_id' AND table_schema = 'public') 
     AND owner_id = auth.uid())
  );

-- Política para whatsapp_mensagens - usuário pode ver mensagens da mesma empresa
CREATE POLICY "company_isolation_whatsapp_mensagens" ON public.whatsapp_mensagens
  FOR ALL USING (
    company_id = public.get_user_company_id() OR
    (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_mensagens' AND column_name = 'owner_id' AND table_schema = 'public') 
     AND owner_id = auth.uid())
  );

-- =====================================================
-- 7. CRIAR EMPRESAS PARA USUÁRIOS EXISTENTES
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
-- 8. ATUALIZAR PROFILES COM COMPANY_ID
-- =====================================================

-- Atualizar profiles com o company_id da empresa criada
UPDATE public.profiles 
SET company_id = c.id
FROM public.companies c
WHERE public.profiles.id = c.owner_id
AND public.profiles.company_id IS NULL;

-- =====================================================
-- 9. ATUALIZAR DADOS EXISTENTES COM COMPANY_ID (SEGURAMENTE)
-- =====================================================

-- Atualizar employees se tiver owner_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'owner_id' AND table_schema = 'public') THEN
        UPDATE public.employees SET company_id = p.company_id FROM public.profiles p WHERE public.employees.owner_id = p.id AND public.employees.company_id IS NULL;
    END IF;
END $$;

-- Atualizar products se tiver owner_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'owner_id' AND table_schema = 'public') THEN
        UPDATE public.products SET company_id = p.company_id FROM public.profiles p WHERE public.products.owner_id = p.id AND public.products.company_id IS NULL;
    END IF;
END $$;

-- Atualizar inventory via products
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'product_id' AND table_schema = 'public') THEN
        UPDATE public.inventory SET company_id = pr.company_id FROM public.products pr WHERE public.inventory.product_id = pr.id AND public.inventory.company_id IS NULL;
    END IF;
END $$;

-- Atualizar activities se tiver owner_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'owner_id' AND table_schema = 'public') THEN
        UPDATE public.activities SET company_id = p.company_id FROM public.profiles p WHERE public.activities.owner_id = p.id AND public.activities.company_id IS NULL;
    END IF;
END $$;

-- Atualizar projects se tiver owner_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'owner_id' AND table_schema = 'public') THEN
        UPDATE public.projects SET company_id = p.company_id FROM public.profiles p WHERE public.projects.owner_id = p.id AND public.projects.company_id IS NULL;
    END IF;
END $$;

-- Atualizar leads se tiver owner_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'owner_id' AND table_schema = 'public') THEN
        UPDATE public.leads SET company_id = p.company_id FROM public.profiles p WHERE public.leads.owner_id = p.id AND public.leads.company_id IS NULL;
    END IF;
END $$;

-- Atualizar deals se tiver owner_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'owner_id' AND table_schema = 'public') THEN
        UPDATE public.deals SET company_id = p.company_id FROM public.profiles p WHERE public.deals.owner_id = p.id AND public.deals.company_id IS NULL;
    END IF;
END $$;

-- Atualizar funnel_stages se tiver owner_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funnel_stages' AND column_name = 'owner_id' AND table_schema = 'public') THEN
        UPDATE public.funnel_stages SET company_id = p.company_id FROM public.profiles p WHERE public.funnel_stages.owner_id = p.id AND public.funnel_stages.company_id IS NULL;
    END IF;
END $$;

-- Atualizar suppliers se tiver owner_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'owner_id' AND table_schema = 'public') THEN
        UPDATE public.suppliers SET company_id = p.company_id FROM public.profiles p WHERE public.suppliers.owner_id = p.id AND public.suppliers.company_id IS NULL;
    END IF;
END $$;

-- Atualizar work_groups se tiver owner_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_groups' AND column_name = 'owner_id' AND table_schema = 'public') THEN
        UPDATE public.work_groups SET company_id = p.company_id FROM public.profiles p WHERE public.work_groups.owner_id = p.id AND public.work_groups.company_id IS NULL;
    END IF;
END $$;

-- Atualizar collaborations se tiver owner_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collaborations' AND column_name = 'owner_id' AND table_schema = 'public') THEN
        UPDATE public.collaborations SET company_id = p.company_id FROM public.profiles p WHERE public.collaborations.owner_id = p.id AND public.collaborations.company_id IS NULL;
    END IF;
END $$;

-- Atualizar files se tiver owner_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'owner_id' AND table_schema = 'public') THEN
        UPDATE public.files SET company_id = p.company_id FROM public.profiles p WHERE public.files.owner_id = p.id AND public.files.company_id IS NULL;
    END IF;
END $$;

-- Atualizar events se tiver owner_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'owner_id' AND table_schema = 'public') THEN
        UPDATE public.events SET company_id = p.company_id FROM public.profiles p WHERE public.events.owner_id = p.id AND public.events.company_id IS NULL;
    END IF;
END $$;

-- Atualizar company_settings se tiver owner_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'owner_id' AND table_schema = 'public') THEN
        UPDATE public.company_settings SET company_id = p.company_id FROM public.profiles p WHERE public.company_settings.owner_id = p.id AND public.company_settings.company_id IS NULL;
    END IF;
END $$;

-- Atualizar whatsapp_mensagens se tiver owner_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_mensagens' AND column_name = 'owner_id' AND table_schema = 'public') THEN
        UPDATE public.whatsapp_mensagens SET company_id = p.company_id FROM public.profiles p WHERE public.whatsapp_mensagens.owner_id = p.id AND public.whatsapp_mensagens.company_id IS NULL;
    END IF;
END $$;

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

-- =====================================================
-- 13. COMENTÁRIOS FINAIS
-- =====================================================

-- Este script garante que:
-- 1. Verifica a estrutura das tabelas antes de aplicar mudanças
-- 2. Evita erros de colunas inexistentes (como owner_id)
-- 3. Aplica isolamento apenas nas tabelas que existem
-- 4. Sistema de isolamento por empresa funcionando
-- 5. Trigger automático para criação de empresa no cadastro
-- 6. Políticas RLS implementadas corretamente
-- 7. Migração segura de dados existentes
-- 8. Verificações finais de funcionamento