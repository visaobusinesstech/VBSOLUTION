-- =====================================================
-- ISOLAMENTO INTELIGENTE POR EMPRESA
-- =====================================================
-- Script que verifica quais tabelas existem e aplica isolamento
-- apenas nas tabelas que realmente existem no sistema
-- =====================================================

-- =====================================================
-- 1. VERIFICAR TABELAS EXISTENTES
-- =====================================================

-- Mostrar todas as tabelas existentes no sistema
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('activities', 'companies', 'deals', 'employees', 'inventory', 'leads', 'products', 'projects') 
        THEN '✅ Tabela Principal'
        WHEN table_name IN ('suppliers', 'work_groups', 'customers', 'orders', 'payments', 'tasks', 'notes') 
        THEN '🆕 Tabela Adicional'
        WHEN table_name IN ('whatsapp_atendimentos', 'whatsapp_mensagens', 'files', 'documents', 'collaborations') 
        THEN '📱 Tabela Funcional'
        WHEN table_name IN ('messages', 'chat_rooms', 'events', 'company_settings', 'funnel_stages', 'profiles')
        THEN '⚙️ Tabela Sistema'
        ELSE '❓ Tabela Desconhecida'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name NOT LIKE 'pg_%'
  AND table_name NOT LIKE 'sql_%'
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
-- 4. APLICAR ISOLAMENTO EM TABELAS EXISTENTES
-- =====================================================

DO $$
DECLARE
    table_name text;
    policy_name text;
    company_id_column_exists boolean;
BEGIN
    -- Lista de todas as tabelas que podem existir
    FOR table_name IN 
        SELECT unnest(ARRAY[
            'profiles', 'companies', 'employees', 'products', 'inventory', 
            'activities', 'projects', 'leads', 'deals', 'funnel_stages',
            'suppliers', 'work_groups', 'customers', 'orders', 'payments', 
            'tasks', 'notes', 'whatsapp_atendimentos', 'whatsapp_mensagens',
            'files', 'documents', 'collaborations', 'messages', 'chat_rooms',
            'events', 'company_settings'
        ])
    LOOP
        -- Verificar se a tabela existe
        IF table_exists(table_name) THEN
            RAISE NOTICE 'Processando tabela: %', table_name;
            
            -- Verificar se a coluna company_id já existe
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = table_name 
                AND column_name = 'company_id'
            ) INTO company_id_column_exists;
            
            -- Adicionar company_id se não existir
            IF NOT company_id_column_exists THEN
                EXECUTE format('ALTER TABLE public.%I ADD COLUMN company_id UUID REFERENCES public.companies(id)', table_name);
                RAISE NOTICE 'Coluna company_id adicionada na tabela: %', table_name;
            END IF;
            
            -- Criar índice para company_id
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_company_id ON public.%I(company_id)', table_name, table_name);
            
            -- Habilitar RLS
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
            
            -- Remover políticas existentes
            FOR policy_name IN 
                SELECT policyname FROM pg_policies 
                WHERE schemaname = 'public' AND tablename = table_name
            LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
            END LOOP;
            
            -- Criar nova política RLS baseada no tipo de tabela
            IF table_name = 'profiles' THEN
                EXECUTE format('CREATE POLICY "company_isolation_%s" ON public.%I FOR ALL USING (auth.uid() = id OR company_id = (SELECT id FROM public.companies WHERE owner_id = auth.uid()))', table_name, table_name);
            ELSIF table_name = 'companies' THEN
                EXECUTE format('CREATE POLICY "company_isolation_%s" ON public.%I FOR ALL USING (auth.uid() = owner_id)', table_name, table_name);
            ELSIF table_name = 'whatsapp_mensagens' THEN
                EXECUTE format('CREATE POLICY "company_isolation_%s" ON public.%I FOR ALL USING (auth.uid() = owner_id OR EXISTS (SELECT 1 FROM public.whatsapp_atendimentos wa JOIN public.companies c ON c.id = wa.company_id WHERE wa.id = %I.atendimento_id AND c.owner_id = auth.uid()))', table_name, table_name, table_name);
            ELSIF table_name = 'inventory' THEN
                EXECUTE format('CREATE POLICY "company_isolation_%s" ON public.%I FOR ALL USING (auth.uid() = owner_id OR EXISTS (SELECT 1 FROM public.products p JOIN public.companies c ON c.id = p.company_id WHERE p.id = %I.product_id AND c.owner_id = auth.uid()))', table_name, table_name, table_name);
            ELSE
                EXECUTE format('CREATE POLICY "company_isolation_%s" ON public.%I FOR ALL USING (auth.uid() = owner_id OR EXISTS (SELECT 1 FROM public.companies c WHERE c.id = %I.company_id AND c.owner_id = auth.uid()))', table_name, table_name, table_name);
            END IF;
            
            RAISE NOTICE 'Política RLS criada para tabela: %', table_name;
            
        ELSE
            RAISE NOTICE 'Tabela não existe, pulando: %', table_name;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- 5. CRIAR EMPRESAS PARA USUÁRIOS EXISTENTES
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
-- 6. ATUALIZAR PROFILES COM COMPANY_ID
-- =====================================================

-- Atualizar profiles com o company_id da empresa criada
UPDATE public.profiles 
SET company_id = c.id
FROM public.companies c
WHERE public.profiles.id = c.owner_id
AND public.profiles.company_id IS NULL;

-- =====================================================
-- 7. ATUALIZAR DADOS EXISTENTES COM COMPANY_ID
-- =====================================================

-- Função para atualizar dados de uma tabela específica
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT unnest(ARRAY[
            'employees', 'products', 'activities', 'projects', 'leads', 'deals', 
            'funnel_stages', 'suppliers', 'work_groups', 'customers', 'orders', 
            'payments', 'tasks', 'notes', 'whatsapp_atendimentos', 'files', 
            'documents', 'collaborations', 'messages', 'chat_rooms', 'events'
        ])
    LOOP
        IF table_exists(table_name) THEN
            -- Atualizar com company_id baseado no owner_id
            EXECUTE format('UPDATE public.%I SET company_id = p.company_id FROM public.profiles p WHERE public.%I.owner_id = p.id AND public.%I.company_id IS NULL', table_name, table_name, table_name);
            
            -- Para inventory, atualizar via product_id
            IF table_name = 'inventory' THEN
                EXECUTE format('UPDATE public.inventory SET company_id = pr.company_id FROM public.products pr WHERE public.inventory.product_id = pr.id AND public.inventory.company_id IS NULL');
            END IF;
            
            RAISE NOTICE 'Dados atualizados com company_id na tabela: %', table_name;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- 8. FUNÇÃO PARA CRIAR EMPRESA AUTOMATICAMENTE
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
-- 9. TRIGGER PARA CRIAR EMPRESA AUTOMATICAMENTE
-- =====================================================

-- Trigger para criar empresa automaticamente quando usuário se cadastra
DROP TRIGGER IF EXISTS create_company_on_user_signup ON auth.users;
CREATE TRIGGER create_company_on_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_company_for_new_user();

-- =====================================================
-- 10. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar RLS habilitado em todas as tabelas existentes
SELECT 
    tablename,
    rowsecurity as rls_habilitado,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS Habilitado'
        ELSE '❌ RLS DESABILITADO'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
ORDER BY tablename;

-- Verificar políticas criadas
SELECT 
    tablename,
    COUNT(*) as total_politicas,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Políticas Criadas'
        ELSE '❌ SEM Políticas'
    END as status
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename
ORDER BY tablename;

-- Verificar dados sem company_id
DO $$
DECLARE
    table_name text;
    count_result integer;
BEGIN
    RAISE NOTICE 'Verificando dados sem company_id...';
    
    FOR table_name IN 
        SELECT unnest(ARRAY[
            'profiles', 'employees', 'products', 'leads', 'deals', 
            'activities', 'projects', 'whatsapp_atendimentos'
        ])
    LOOP
        IF table_exists(table_name) THEN
            EXECUTE format('SELECT COUNT(*) FROM public.%I WHERE company_id IS NULL', table_name) INTO count_result;
            IF count_result > 0 THEN
                RAISE NOTICE 'Tabela %: % registros sem company_id', table_name, count_result;
            END IF;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- 11. COMENTÁRIOS FINAIS
-- =====================================================

-- Este script garante que:
-- 1. Verifica quais tabelas existem antes de aplicar mudanças
-- 2. Aplica isolamento apenas nas tabelas que existem
-- 3. Evita erros de tabelas inexistentes
-- 4. Sistema de isolamento por empresa funcionando
-- 5. Trigger automático para criação de empresa no cadastro
-- 6. Políticas RLS implementadas corretamente
-- 7. Migração de dados existentes
-- 8. Verificações finais de funcionamento
