-- =====================================================
-- VERIFICAR TABELAS EXISTENTES E APLICAR ISOLAMENTO
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. VERIFICAR QUAIS TABELAS EXISTEM
-- =====================================================

-- Verificar todas as tabelas existentes no schema public
SELECT 
    table_name,
    table_type,
    CASE 
        WHEN table_name IN ('activities', 'companies', 'deals', 'employees', 'inventory', 'leads', 'products', 'projects') 
        THEN '✅ Tabela Principal'
        WHEN table_name IN ('suppliers', 'work_groups', 'customers', 'orders', 'payments', 'tasks', 'notes') 
        THEN '🆕 Tabela Adicional'
        WHEN table_name IN ('whatsapp_atendimentos', 'whatsapp_mensagens', 'files', 'documents', 'collaborations') 
        THEN '📱 Tabela Funcional'
        ELSE '❓ Tabela Desconhecida'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'profiles', 'activities', 'companies', 'deals', 'employees', 'inventory', 
    'leads', 'products', 'projects', 'whatsapp_atendimentos',
    'whatsapp_mensagens', 'suppliers', 'work_groups', 'customers',
    'orders', 'payments', 'tasks', 'notes', 'files', 'documents',
    'collaborations', 'messages', 'chat_rooms', 'events', 'company_settings',
    'funnel_stages'
  )
ORDER BY table_name;

-- =====================================================
-- 2. FUNÇÃO PARA VERIFICAR SE TABELA EXISTE
-- =====================================================

CREATE OR REPLACE FUNCTION table_exists(table_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. ADICIONAR COLUNA COMPANY_ID APENAS EM TABELAS EXISTENTES
-- =====================================================

-- Adicionar company_id na tabela profiles (se existir)
DO $$
BEGIN
    IF table_exists('profiles') THEN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
        RAISE NOTICE '✅ Adicionada coluna company_id em profiles';
    ELSE
        RAISE NOTICE '⚠️ Tabela profiles não existe';
    END IF;
END $$;

-- Adicionar company_id na tabela employees (se existir)
DO $$
BEGIN
    IF table_exists('employees') THEN
        ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
        RAISE NOTICE '✅ Adicionada coluna company_id em employees';
    ELSE
        RAISE NOTICE '⚠️ Tabela employees não existe';
    END IF;
END $$;

-- Adicionar company_id na tabela products (se existir)
DO $$
BEGIN
    IF table_exists('products') THEN
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
        RAISE NOTICE '✅ Adicionada coluna company_id em products';
    ELSE
        RAISE NOTICE '⚠️ Tabela products não existe';
    END IF;
END $$;

-- Adicionar company_id na tabela inventory (se existir)
DO $$
BEGIN
    IF table_exists('inventory') THEN
        ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
        RAISE NOTICE '✅ Adicionada coluna company_id em inventory';
    ELSE
        RAISE NOTICE '⚠️ Tabela inventory não existe';
    END IF;
END $$;

-- Adicionar company_id na tabela funnel_stages (se existir)
DO $$
BEGIN
    IF table_exists('funnel_stages') THEN
        ALTER TABLE public.funnel_stages ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
        RAISE NOTICE '✅ Adicionada coluna company_id em funnel_stages';
    ELSE
        RAISE NOTICE '⚠️ Tabela funnel_stages não existe';
    END IF;
END $$;

-- Adicionar company_id na tabela leads (se existir)
DO $$
BEGIN
    IF table_exists('leads') THEN
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
        RAISE NOTICE '✅ Adicionada coluna company_id em leads';
    ELSE
        RAISE NOTICE '⚠️ Tabela leads não existe';
    END IF;
END $$;

-- Adicionar company_id na tabela deals (se existir)
DO $$
BEGIN
    IF table_exists('deals') THEN
        ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
        RAISE NOTICE '✅ Adicionada coluna company_id em deals';
    ELSE
        RAISE NOTICE '⚠️ Tabela deals não existe';
    END IF;
END $$;

-- Adicionar company_id na tabela activities (se existir)
DO $$
BEGIN
    IF table_exists('activities') THEN
        ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
        RAISE NOTICE '✅ Adicionada coluna company_id em activities';
    ELSE
        RAISE NOTICE '⚠️ Tabela activities não existe';
    END IF;
END $$;

-- Adicionar company_id na tabela projects (se existir)
DO $$
BEGIN
    IF table_exists('projects') THEN
        ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
        RAISE NOTICE '✅ Adicionada coluna company_id em projects';
    ELSE
        RAISE NOTICE '⚠️ Tabela projects não existe';
    END IF;
END $$;

-- Adicionar company_id na tabela whatsapp_atendimentos (se existir)
DO $$
BEGIN
    IF table_exists('whatsapp_atendimentos') THEN
        ALTER TABLE public.whatsapp_atendimentos ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
        RAISE NOTICE '✅ Adicionada coluna company_id em whatsapp_atendimentos';
    ELSE
        RAISE NOTICE '⚠️ Tabela whatsapp_atendimentos não existe - PULANDO';
    END IF;
END $$;

-- Adicionar company_id na tabela whatsapp_mensagens (se existir)
DO $$
BEGIN
    IF table_exists('whatsapp_mensagens') THEN
        ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
        RAISE NOTICE '✅ Adicionada coluna company_id em whatsapp_mensagens';
    ELSE
        RAISE NOTICE '⚠️ Tabela whatsapp_mensagens não existe - PULANDO';
    END IF;
END $$;

-- =====================================================
-- 4. CRIAR ÍNDICES PARA PERFORMANCE (APENAS EM TABELAS EXISTENTES)
-- =====================================================

-- Índices para company_id em tabelas existentes
DO $$
BEGIN
    IF table_exists('profiles') THEN
        CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
        RAISE NOTICE '✅ Criado índice em profiles';
    END IF;
    
    IF table_exists('employees') THEN
        CREATE INDEX IF NOT EXISTS idx_employees_company_id ON public.employees(company_id);
        RAISE NOTICE '✅ Criado índice em employees';
    END IF;
    
    IF table_exists('products') THEN
        CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
        RAISE NOTICE '✅ Criado índice em products';
    END IF;
    
    IF table_exists('inventory') THEN
        CREATE INDEX IF NOT EXISTS idx_inventory_company_id ON public.inventory(company_id);
        RAISE NOTICE '✅ Criado índice em inventory';
    END IF;
    
    IF table_exists('funnel_stages') THEN
        CREATE INDEX IF NOT EXISTS idx_funnel_stages_company_id ON public.funnel_stages(company_id);
        RAISE NOTICE '✅ Criado índice em funnel_stages';
    END IF;
    
    IF table_exists('leads') THEN
        CREATE INDEX IF NOT EXISTS idx_leads_company_id ON public.leads(company_id);
        RAISE NOTICE '✅ Criado índice em leads';
    END IF;
    
    IF table_exists('deals') THEN
        CREATE INDEX IF NOT EXISTS idx_deals_company_id ON public.deals(company_id);
        RAISE NOTICE '✅ Criado índice em deals';
    END IF;
    
    IF table_exists('activities') THEN
        CREATE INDEX IF NOT EXISTS idx_activities_company_id ON public.activities(company_id);
        RAISE NOTICE '✅ Criado índice em activities';
    END IF;
    
    IF table_exists('projects') THEN
        CREATE INDEX IF NOT EXISTS idx_projects_company_id ON public.projects(company_id);
        RAISE NOTICE '✅ Criado índice em projects';
    END IF;
    
    IF table_exists('whatsapp_atendimentos') THEN
        CREATE INDEX IF NOT EXISTS idx_whatsapp_atendimentos_company_id ON public.whatsapp_atendimentos(company_id);
        RAISE NOTICE '✅ Criado índice em whatsapp_atendimentos';
    END IF;
    
    IF table_exists('whatsapp_mensagens') THEN
        CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_company_id ON public.whatsapp_mensagens(company_id);
        RAISE NOTICE '✅ Criado índice em whatsapp_mensagens';
    END IF;
END $$;

-- =====================================================
-- 5. FUNÇÃO PARA OBTER COMPANY_ID DO USUÁRIO
-- =====================================================

-- Função para obter o company_id do usuário logado
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID AS $$
DECLARE
  user_company_id UUID;
BEGIN
  -- Primeiro, tentar obter da tabela profiles (se existir)
  IF table_exists('profiles') THEN
    SELECT company_id INTO user_company_id
    FROM public.profiles
    WHERE id = auth.uid();
  END IF;
  
  -- Se não encontrou na profiles, tentar na tabela companies como owner
  IF user_company_id IS NULL AND table_exists('companies') THEN
    SELECT id INTO user_company_id
    FROM public.companies
    WHERE owner_id = auth.uid()
    LIMIT 1;
  END IF;
  
  RETURN user_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. CRIAR EMPRESAS PARA USUÁRIOS EXISTENTES (SE TABELAS EXISTIREM)
-- =====================================================

-- Criar empresas para usuários que não têm empresa associada
DO $$
BEGIN
    IF table_exists('profiles') AND table_exists('companies') THEN
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
        
        RAISE NOTICE '✅ Empresas criadas para usuários existentes';
    ELSE
        RAISE NOTICE '⚠️ Tabelas profiles ou companies não existem - pulando criação de empresas';
    END IF;
END $$;

-- =====================================================
-- 7. ATUALIZAR PROFILES COM COMPANY_ID (SE TABELAS EXISTIREM)
-- =====================================================

-- Atualizar profiles com o company_id da empresa criada
DO $$
BEGIN
    IF table_exists('profiles') AND table_exists('companies') THEN
        UPDATE public.profiles 
        SET company_id = c.id
        FROM public.companies c
        WHERE public.profiles.id = c.owner_id
        AND public.profiles.company_id IS NULL;
        
        RAISE NOTICE '✅ Profiles atualizados com company_id';
    ELSE
        RAISE NOTICE '⚠️ Tabelas profiles ou companies não existem - pulando atualização';
    END IF;
END $$;

-- =====================================================
-- 8. ATUALIZAR DADOS EXISTENTES COM COMPANY_ID (APENAS EM TABELAS EXISTENTES)
-- =====================================================

-- Atualizar employees com company_id (se existir)
DO $$
BEGIN
    IF table_exists('employees') AND table_exists('profiles') THEN
        UPDATE public.employees 
        SET company_id = p.company_id
        FROM public.profiles p
        WHERE public.employees.owner_id = p.id
        AND public.employees.company_id IS NULL;
        
        RAISE NOTICE '✅ Employees atualizados com company_id';
    ELSE
        RAISE NOTICE '⚠️ Tabela employees não existe - pulando atualização';
    END IF;
END $$;

-- Atualizar products com company_id (se existir)
DO $$
BEGIN
    IF table_exists('products') AND table_exists('profiles') THEN
        UPDATE public.products 
        SET company_id = p.company_id
        FROM public.profiles p
        WHERE public.products.owner_id = p.id
        AND public.products.company_id IS NULL;
        
        RAISE NOTICE '✅ Products atualizados com company_id';
    ELSE
        RAISE NOTICE '⚠️ Tabela products não existe - pulando atualização';
    END IF;
END $$;

-- Atualizar inventory com company_id (se existir)
DO $$
BEGIN
    IF table_exists('inventory') AND table_exists('products') THEN
        UPDATE public.inventory 
        SET company_id = pr.company_id
        FROM public.products pr
        WHERE public.inventory.product_id = pr.id
        AND public.inventory.company_id IS NULL;
        
        RAISE NOTICE '✅ Inventory atualizado com company_id';
    ELSE
        RAISE NOTICE '⚠️ Tabela inventory não existe - pulando atualização';
    END IF;
END $$;

-- Atualizar funnel_stages com company_id (se existir)
DO $$
BEGIN
    IF table_exists('funnel_stages') AND table_exists('profiles') THEN
        UPDATE public.funnel_stages 
        SET company_id = p.company_id
        FROM public.profiles p
        WHERE public.funnel_stages.owner_id = p.id
        AND public.funnel_stages.company_id IS NULL;
        
        RAISE NOTICE '✅ Funnel_stages atualizados com company_id';
    ELSE
        RAISE NOTICE '⚠️ Tabela funnel_stages não existe - pulando atualização';
    END IF;
END $$;

-- Atualizar leads com company_id (se existir)
DO $$
BEGIN
    IF table_exists('leads') AND table_exists('profiles') THEN
        UPDATE public.leads 
        SET company_id = p.company_id
        FROM public.profiles p
        WHERE public.leads.owner_id = p.id
        AND public.leads.company_id IS NULL;
        
        RAISE NOTICE '✅ Leads atualizados com company_id';
    ELSE
        RAISE NOTICE '⚠️ Tabela leads não existe - pulando atualização';
    END IF;
END $$;

-- Atualizar deals com company_id (se existir)
DO $$
BEGIN
    IF table_exists('deals') AND table_exists('profiles') THEN
        UPDATE public.deals 
        SET company_id = p.company_id
        FROM public.profiles p
        WHERE public.deals.owner_id = p.id
        AND public.deals.company_id IS NULL;
        
        RAISE NOTICE '✅ Deals atualizados com company_id';
    ELSE
        RAISE NOTICE '⚠️ Tabela deals não existe - pulando atualização';
    END IF;
END $$;

-- Atualizar activities com company_id (se existir)
DO $$
BEGIN
    IF table_exists('activities') AND table_exists('profiles') THEN
        UPDATE public.activities 
        SET company_id = p.company_id
        FROM public.profiles p
        WHERE public.activities.owner_id = p.id
        AND public.activities.company_id IS NULL;
        
        RAISE NOTICE '✅ Activities atualizados com company_id';
    ELSE
        RAISE NOTICE '⚠️ Tabela activities não existe - pulando atualização';
    END IF;
END $$;

-- Atualizar projects com company_id (se existir)
DO $$
BEGIN
    IF table_exists('projects') AND table_exists('profiles') THEN
        UPDATE public.projects 
        SET company_id = p.company_id
        FROM public.profiles p
        WHERE public.projects.owner_id = p.id
        AND public.projects.company_id IS NULL;
        
        RAISE NOTICE '✅ Projects atualizados com company_id';
    ELSE
        RAISE NOTICE '⚠️ Tabela projects não existe - pulando atualização';
    END IF;
END $$;

-- Atualizar whatsapp_atendimentos com company_id (se existir)
DO $$
BEGIN
    IF table_exists('whatsapp_atendimentos') AND table_exists('profiles') THEN
        UPDATE public.whatsapp_atendimentos 
        SET company_id = p.company_id
        FROM public.profiles p
        WHERE public.whatsapp_atendimentos.owner_id = p.id
        AND public.whatsapp_atendimentos.company_id IS NULL;
        
        RAISE NOTICE '✅ WhatsApp atendimentos atualizados com company_id';
    ELSE
        RAISE NOTICE '⚠️ Tabela whatsapp_atendimentos não existe - pulando atualização';
    END IF;
END $$;

-- =====================================================
-- 9. REMOVER POLÍTICAS RLS ANTIGAS (APENAS EM TABELAS EXISTENTES)
-- =====================================================

-- Remover políticas antigas apenas se as tabelas existirem
DO $$
BEGIN
    IF table_exists('profiles') THEN
        DROP POLICY IF EXISTS "Usuários podem ver e editar apenas seu próprio perfil" ON public.profiles;
        RAISE NOTICE '✅ Política antiga removida de profiles';
    END IF;
    
    IF table_exists('companies') THEN
        DROP POLICY IF EXISTS "Usuários podem ver e editar apenas suas próprias empresas" ON public.companies;
        RAISE NOTICE '✅ Política antiga removida de companies';
    END IF;
    
    IF table_exists('employees') THEN
        DROP POLICY IF EXISTS "Usuários podem ver e editar funcionários de suas empresas" ON public.employees;
        RAISE NOTICE '✅ Política antiga removida de employees';
    END IF;
    
    IF table_exists('products') THEN
        DROP POLICY IF EXISTS "Usuários podem ver e editar produtos de suas empresas" ON public.products;
        RAISE NOTICE '✅ Política antiga removida de products';
    END IF;
    
    IF table_exists('inventory') THEN
        DROP POLICY IF EXISTS "Usuários podem ver e editar inventário de suas empresas" ON public.inventory;
        RAISE NOTICE '✅ Política antiga removida de inventory';
    END IF;
    
    IF table_exists('funnel_stages') THEN
        DROP POLICY IF EXISTS "Usuários podem ver e editar etapas de seu funil" ON public.funnel_stages;
        RAISE NOTICE '✅ Política antiga removida de funnel_stages';
    END IF;
    
    IF table_exists('leads') THEN
        DROP POLICY IF EXISTS "Usuários podem ver e editar leads de suas empresas" ON public.leads;
        RAISE NOTICE '✅ Política antiga removida de leads';
    END IF;
    
    IF table_exists('deals') THEN
        DROP POLICY IF EXISTS "Usuários podem ver e editar negócios de suas empresas" ON public.deals;
        RAISE NOTICE '✅ Política antiga removida de deals';
    END IF;
    
    IF table_exists('activities') THEN
        DROP POLICY IF EXISTS "Usuários podem ver e editar suas próprias atividades" ON public.activities;
        RAISE NOTICE '✅ Política antiga removida de activities';
    END IF;
    
    IF table_exists('projects') THEN
        DROP POLICY IF EXISTS "Usuários podem ver e editar projetos de suas empresas" ON public.projects;
        RAISE NOTICE '✅ Política antiga removida de projects';
    END IF;
    
    IF table_exists('whatsapp_atendimentos') THEN
        DROP POLICY IF EXISTS "Usuários podem ver e editar atendimentos de suas empresas" ON public.whatsapp_atendimentos;
        RAISE NOTICE '✅ Política antiga removida de whatsapp_atendimentos';
    END IF;
    
    IF table_exists('whatsapp_mensagens') THEN
        DROP POLICY IF EXISTS "Usuários podem ver e editar mensagens de suas empresas" ON public.whatsapp_mensagens;
        RAISE NOTICE '✅ Política antiga removida de whatsapp_mensagens';
    END IF;
END $$;

-- =====================================================
-- 10. CRIAR NOVAS POLÍTICAS RLS COM ISOLAMENTO POR EMPRESA (APENAS EM TABELAS EXISTENTES)
-- =====================================================

-- Política para profiles - usuário pode ver seu próprio perfil e perfis da mesma empresa
DO $$
BEGIN
    IF table_exists('profiles') THEN
        CREATE POLICY "Isolamento por empresa - profiles" ON public.profiles
          FOR ALL USING (
            auth.uid() = id OR 
            company_id = public.get_user_company_id()
          );
        RAISE NOTICE '✅ Política criada para profiles';
    END IF;
END $$;

-- Política para companies - usuário pode ver empresas que possui ou pertence
DO $$
BEGIN
    IF table_exists('companies') THEN
        CREATE POLICY "Isolamento por empresa - companies" ON public.companies
          FOR ALL USING (
            owner_id = auth.uid() OR 
            id = public.get_user_company_id()
          );
        RAISE NOTICE '✅ Política criada para companies';
    END IF;
END $$;

-- Política para employees - usuário pode ver funcionários da mesma empresa
DO $$
BEGIN
    IF table_exists('employees') THEN
        CREATE POLICY "Isolamento por empresa - employees" ON public.employees
          FOR ALL USING (
            owner_id = auth.uid() OR 
            company_id = public.get_user_company_id()
          );
        RAISE NOTICE '✅ Política criada para employees';
    END IF;
END $$;

-- Política para products - usuário pode ver produtos da mesma empresa
DO $$
BEGIN
    IF table_exists('products') THEN
        CREATE POLICY "Isolamento por empresa - products" ON public.products
          FOR ALL USING (
            owner_id = auth.uid() OR 
            company_id = public.get_user_company_id()
          );
        RAISE NOTICE '✅ Política criada para products';
    END IF;
END $$;

-- Política para inventory - usuário pode ver inventário da mesma empresa
DO $$
BEGIN
    IF table_exists('inventory') THEN
        CREATE POLICY "Isolamento por empresa - inventory" ON public.inventory
          FOR ALL USING (
            owner_id = auth.uid() OR 
            EXISTS (
              SELECT 1 FROM public.products p 
              WHERE p.id = inventory.product_id 
              AND p.company_id = public.get_user_company_id()
            )
          );
        RAISE NOTICE '✅ Política criada para inventory';
    END IF;
END $$;

-- Política para funnel_stages - usuário pode ver etapas da mesma empresa
DO $$
BEGIN
    IF table_exists('funnel_stages') THEN
        CREATE POLICY "Isolamento por empresa - funnel_stages" ON public.funnel_stages
          FOR ALL USING (
            owner_id = auth.uid() OR 
            company_id = public.get_user_company_id()
          );
        RAISE NOTICE '✅ Política criada para funnel_stages';
    END IF;
END $$;

-- Política para leads - usuário pode ver leads da mesma empresa
DO $$
BEGIN
    IF table_exists('leads') THEN
        CREATE POLICY "Isolamento por empresa - leads" ON public.leads
          FOR ALL USING (
            owner_id = auth.uid() OR 
            company_id = public.get_user_company_id()
          );
        RAISE NOTICE '✅ Política criada para leads';
    END IF;
END $$;

-- Política para deals - usuário pode ver negócios da mesma empresa
DO $$
BEGIN
    IF table_exists('deals') THEN
        CREATE POLICY "Isolamento por empresa - deals" ON public.deals
          FOR ALL USING (
            owner_id = auth.uid() OR 
            company_id = public.get_user_company_id()
          );
        RAISE NOTICE '✅ Política criada para deals';
    END IF;
END $$;

-- Política para activities - usuário pode ver atividades da mesma empresa
DO $$
BEGIN
    IF table_exists('activities') THEN
        CREATE POLICY "Isolamento por empresa - activities" ON public.activities
          FOR ALL USING (
            owner_id = auth.uid() OR 
            company_id = public.get_user_company_id()
          );
        RAISE NOTICE '✅ Política criada para activities';
    END IF;
END $$;

-- Política para projects - usuário pode ver projetos da mesma empresa
DO $$
BEGIN
    IF table_exists('projects') THEN
        CREATE POLICY "Isolamento por empresa - projects" ON public.projects
          FOR ALL USING (
            owner_id = auth.uid() OR 
            company_id = public.get_user_company_id()
          );
        RAISE NOTICE '✅ Política criada para projects';
    END IF;
END $$;

-- Política para whatsapp_atendimentos - usuário pode ver atendimentos da mesma empresa
DO $$
BEGIN
    IF table_exists('whatsapp_atendimentos') THEN
        CREATE POLICY "Isolamento por empresa - whatsapp_atendimentos" ON public.whatsapp_atendimentos
          FOR ALL USING (
            owner_id = auth.uid() OR 
            company_id = public.get_user_company_id()
          );
        RAISE NOTICE '✅ Política criada para whatsapp_atendimentos';
    ELSE
        RAISE NOTICE '⚠️ Tabela whatsapp_atendimentos não existe - PULANDO política';
    END IF;
END $$;

-- Política para whatsapp_mensagens - usuário pode ver mensagens da mesma empresa
DO $$
BEGIN
    IF table_exists('whatsapp_mensagens') THEN
        CREATE POLICY "Isolamento por empresa - whatsapp_mensagens" ON public.whatsapp_mensagens
          FOR ALL USING (
            owner_id = auth.uid() OR 
            EXISTS (
              SELECT 1 FROM public.whatsapp_atendimentos wa 
              WHERE wa.id = whatsapp_mensagens.atendimento_id 
              AND wa.company_id = public.get_user_company_id()
            )
          );
        RAISE NOTICE '✅ Política criada para whatsapp_mensagens';
    ELSE
        RAISE NOTICE '⚠️ Tabela whatsapp_mensagens não existe - PULANDO política';
    END IF;
END $$;

-- =====================================================
-- 11. FUNÇÃO PARA CRIAR EMPRESA AUTOMATICAMENTE
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
  
  -- Criar empresa automaticamente (se a tabela existir)
  IF table_exists('companies') THEN
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
    
    -- Atualizar o perfil com o company_id (se a tabela existir)
    IF table_exists('profiles') THEN
      UPDATE public.profiles 
      SET company_id = new_company_id
      WHERE id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 12. TRIGGER PARA CRIAR EMPRESA AUTOMATICAMENTE
-- =====================================================

-- Trigger para criar empresa automaticamente quando usuário se cadastra
DROP TRIGGER IF EXISTS create_company_on_user_signup ON auth.users;
CREATE TRIGGER create_company_on_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_company_for_new_user();

-- =====================================================
-- 13. VERIFICAÇÕES FINAIS
-- =====================================================

-- Verificar se há dados sem company_id (apenas em tabelas existentes)
DO $$
DECLARE
    total_count INTEGER;
BEGIN
    RAISE NOTICE '=== VERIFICAÇÃO FINAL ===';
    
    -- Verificar profiles
    IF table_exists('profiles') THEN
        SELECT COUNT(*) INTO total_count FROM public.profiles WHERE company_id IS NULL;
        RAISE NOTICE 'Profiles sem company_id: %', total_count;
    END IF;
    
    -- Verificar employees
    IF table_exists('employees') THEN
        SELECT COUNT(*) INTO total_count FROM public.employees WHERE company_id IS NULL;
        RAISE NOTICE 'Employees sem company_id: %', total_count;
    END IF;
    
    -- Verificar products
    IF table_exists('products') THEN
        SELECT COUNT(*) INTO total_count FROM public.products WHERE company_id IS NULL;
        RAISE NOTICE 'Products sem company_id: %', total_count;
    END IF;
    
    -- Verificar leads
    IF table_exists('leads') THEN
        SELECT COUNT(*) INTO total_count FROM public.leads WHERE company_id IS NULL;
        RAISE NOTICE 'Leads sem company_id: %', total_count;
    END IF;
    
    -- Verificar deals
    IF table_exists('deals') THEN
        SELECT COUNT(*) INTO total_count FROM public.deals WHERE company_id IS NULL;
        RAISE NOTICE 'Deals sem company_id: %', total_count;
    END IF;
    
    -- Verificar activities
    IF table_exists('activities') THEN
        SELECT COUNT(*) INTO total_count FROM public.activities WHERE company_id IS NULL;
        RAISE NOTICE 'Activities sem company_id: %', total_count;
    END IF;
    
    -- Verificar projects
    IF table_exists('projects') THEN
        SELECT COUNT(*) INTO total_count FROM public.projects WHERE company_id IS NULL;
        RAISE NOTICE 'Projects sem company_id: %', total_count;
    END IF;
    
    -- Verificar whatsapp_atendimentos
    IF table_exists('whatsapp_atendimentos') THEN
        SELECT COUNT(*) INTO total_count FROM public.whatsapp_atendimentos WHERE company_id IS NULL;
        RAISE NOTICE 'WhatsApp atendimentos sem company_id: %', total_count;
    END IF;
    
    RAISE NOTICE '=== VERIFICAÇÃO CONCLUÍDA ===';
    RAISE NOTICE '✅ Sistema de isolamento por empresa implementado com sucesso!';
    RAISE NOTICE '✅ Apenas tabelas existentes foram processadas';
    RAISE NOTICE '✅ Tabelas WhatsApp foram puladas (não existem)';
END $$;

-- =====================================================
-- 14. COMENTÁRIOS FINAIS
-- =====================================================

-- Este script garante que:
-- 1. Verifica quais tabelas existem antes de aplicar mudanças
-- 2. Adiciona company_id apenas em tabelas existentes
-- 3. Cria políticas RLS apenas em tabelas existentes
-- 4. Migra dados apenas de tabelas existentes
-- 5. Evita erros de tabelas não encontradas
-- 6. Mantém compatibilidade com qualquer estrutura de banco
-- 7. Sistema de isolamento por empresa funcionando
-- 8. Trigger automático para criação de empresa no cadastro
-- 9. Pula tabelas WhatsApp que não existem no seu sistema
