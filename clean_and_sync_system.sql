-- =====================================================
-- LIMPEZA COMPLETA E SINCRONIZAÇÃO DO SISTEMA
-- =====================================================
-- Execute este script no SQL Editor do Supabase para:
-- 1. Limpar todos os dados mockados
-- 2. Sincronizar todas as páginas com suas tabelas
-- 3. Evitar erros de triggers duplicados
-- =====================================================

-- 1. LIMPEZA COMPLETA DE TODOS OS DADOS MOCKADOS
-- =====================================================
-- Limpar todas as tabelas (manter apenas estrutura)
TRUNCATE TABLE public.activities CASCADE;
TRUNCATE TABLE public.companies CASCADE;
TRUNCATE TABLE public.deals CASCADE;
TRUNCATE TABLE public.employees CASCADE;
TRUNCATE TABLE public.inventory CASCADE;
TRUNCATE TABLE public.leads CASCADE;
TRUNCATE TABLE public.products CASCADE;
TRUNCATE TABLE public.projects CASCADE;
TRUNCATE TABLE public.whatsapp_atendimentos CASCADE;
TRUNCATE TABLE public.whatsapp_mensagens CASCADE;

-- 2. REMOVER TRIGGERS EXISTENTES PARA EVITAR DUPLICAÇÃO
-- =====================================================
-- Remover todos os triggers de updated_at
DROP TRIGGER IF EXISTS update_activities_updated_at ON public.activities;
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
DROP TRIGGER IF EXISTS update_deals_updated_at ON public.deals;
DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;
DROP TRIGGER IF EXISTS update_inventory_updated_at ON public.inventory;
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
DROP TRIGGER IF EXISTS update_whatsapp_atendimentos_updated_at ON public.whatsapp_atendimentos;
DROP TRIGGER IF EXISTS update_whatsapp_mensagens_updated_at ON public.whatsapp_mensagens;

-- 3. CRIAR TABELAS FALTANDO (SUPPLIERS E WORK_GROUPS)
-- =====================================================
-- Criar tabela suppliers se não existir
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'Brasil',
  cnpj TEXT,
  contact_person TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  category TEXT,
  payment_terms TEXT,
  credit_limit DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela work_groups se não existir
CREATE TABLE IF NOT EXISTS public.work_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  members JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. CRIAR TABELAS ADICIONAIS PARA FUNCIONALIDADES COMPLETAS
-- =====================================================
-- Tabela para clientes
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'Brasil',
  cpf_cnpj TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para pedidos
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded')),
  order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivery_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para pagamentos
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para tarefas
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para notas
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'general' CHECK (type IN ('general', 'task', 'project', 'customer', 'deal')),
  related_id UUID, -- ID da entidade relacionada (task, project, etc.)
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================
-- Índices para suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_owner_id ON public.suppliers(owner_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON public.suppliers(category);

-- Índices para work_groups
CREATE INDEX IF NOT EXISTS idx_work_groups_owner_id ON public.work_groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_work_groups_leader_id ON public.work_groups(leader_id);
CREATE INDEX IF NOT EXISTS idx_work_groups_status ON public.work_groups(status);

-- Índices para customers
CREATE INDEX IF NOT EXISTS idx_customers_owner_id ON public.customers(owner_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);

-- Índices para orders
CREATE INDEX IF NOT EXISTS idx_orders_owner_id ON public.orders(owner_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Índices para payments
CREATE INDEX IF NOT EXISTS idx_payments_owner_id ON public.payments(owner_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);

-- Índices para tasks
CREATE INDEX IF NOT EXISTS idx_tasks_owner_id ON public.tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- Índices para notes
CREATE INDEX IF NOT EXISTS idx_notes_owner_id ON public.notes(owner_id);
CREATE INDEX IF NOT EXISTS idx_notes_type ON public.notes(type);

-- 6. HABILITAR ROW LEVEL SECURITY EM TODAS AS TABELAS
-- =====================================================
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- 7. CRIAR POLÍTICAS RLS PARA TODAS AS TABELAS
-- =====================================================
-- Políticas para suppliers
DROP POLICY IF EXISTS "Usuários podem ver e editar apenas seus próprios fornecedores" ON public.suppliers;
CREATE POLICY "Usuários podem ver e editar apenas seus próprios fornecedores" ON public.suppliers
  FOR ALL USING (auth.uid() = owner_id);

-- Políticas para work_groups
DROP POLICY IF EXISTS "Usuários podem ver e editar apenas seus próprios grupos de trabalho" ON public.work_groups;
CREATE POLICY "Usuários podem ver e editar apenas seus próprios grupos de trabalho" ON public.work_groups
  FOR ALL USING (auth.uid() = owner_id);

-- Políticas para customers
DROP POLICY IF EXISTS "Usuários podem ver e editar apenas seus próprios clientes" ON public.customers;
CREATE POLICY "Usuários podem ver e editar apenas seus próprios clientes" ON public.customers
  FOR ALL USING (auth.uid() = owner_id);

-- Políticas para orders
DROP POLICY IF EXISTS "Usuários podem ver e editar apenas seus próprios pedidos" ON public.orders;
CREATE POLICY "Usuários podem ver e editar apenas seus próprios pedidos" ON public.orders
  FOR ALL USING (auth.uid() = owner_id);

-- Políticas para payments
DROP POLICY IF EXISTS "Usuários podem ver e editar apenas seus próprios pagamentos" ON public.payments;
CREATE POLICY "Usuários podem ver e editar apenas seus próprios pagamentos" ON public.payments
  FOR ALL USING (auth.uid() = owner_id);

-- Políticas para tasks
DROP POLICY IF EXISTS "Usuários podem ver e editar apenas suas próprias tarefas" ON public.tasks;
CREATE POLICY "Usuários podem ver e editar apenas suas próprias tarefas" ON public.tasks
  FOR ALL USING (auth.uid() = owner_id);

-- Políticas para notes
DROP POLICY IF EXISTS "Usuários podem ver e editar apenas suas próprias notas" ON public.notes;
CREATE POLICY "Usuários podem ver e editar apenas suas próprias notas" ON public.notes
  FOR ALL USING (auth.uid() = owner_id);

-- 8. RECRIAR TRIGGERS PARA ATUALIZAR updated_at (SEM DUPLICAÇÃO)
-- =====================================================
-- Recriar todos os triggers de updated_at (usando IF NOT EXISTS)
DO $$
BEGIN
  -- Triggers para tabelas existentes
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_activities_updated_at') THEN
    CREATE TRIGGER update_activities_updated_at
      BEFORE UPDATE ON public.activities
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_companies_updated_at') THEN
    CREATE TRIGGER update_companies_updated_at
      BEFORE UPDATE ON public.companies
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_deals_updated_at') THEN
    CREATE TRIGGER update_deals_updated_at
      BEFORE UPDATE ON public.deals
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_employees_updated_at') THEN
    CREATE TRIGGER update_employees_updated_at
      BEFORE UPDATE ON public.employees
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_inventory_updated_at') THEN
    CREATE TRIGGER update_inventory_updated_at
      BEFORE UPDATE ON public.inventory
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_leads_updated_at') THEN
    CREATE TRIGGER update_leads_updated_at
      BEFORE UPDATE ON public.leads
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at') THEN
    CREATE TRIGGER update_products_updated_at
      BEFORE UPDATE ON public.products
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_projects_updated_at') THEN
    CREATE TRIGGER update_projects_updated_at
      BEFORE UPDATE ON public.projects
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_whatsapp_atendimentos_updated_at') THEN
    CREATE TRIGGER update_whatsapp_atendimentos_updated_at
      BEFORE UPDATE ON public.whatsapp_atendimentos
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_whatsapp_mensagens_updated_at') THEN
    CREATE TRIGGER update_whatsapp_mensagens_updated_at
      BEFORE UPDATE ON public.whatsapp_mensagens
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  -- Triggers para novas tabelas
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_suppliers_updated_at') THEN
    CREATE TRIGGER update_suppliers_updated_at
      BEFORE UPDATE ON public.suppliers
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_work_groups_updated_at') THEN
    CREATE TRIGGER update_work_groups_updated_at
      BEFORE UPDATE ON public.work_groups
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_customers_updated_at') THEN
    CREATE TRIGGER update_customers_updated_at
      BEFORE UPDATE ON public.customers
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_updated_at') THEN
    CREATE TRIGGER update_orders_updated_at
      BEFORE UPDATE ON public.orders
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payments_updated_at') THEN
    CREATE TRIGGER update_payments_updated_at
      BEFORE UPDATE ON public.payments
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tasks_updated_at') THEN
    CREATE TRIGGER update_tasks_updated_at
      BEFORE UPDATE ON public.tasks
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_notes_updated_at') THEN
    CREATE TRIGGER update_notes_updated_at
      BEFORE UPDATE ON public.notes
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 9. CONCEDER PERMISSÕES PARA TODAS AS TABELAS
-- =====================================================
GRANT ALL ON public.suppliers TO authenticated;
GRANT ALL ON public.work_groups TO authenticated;
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.payments TO authenticated;
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON public.notes TO authenticated;

-- 10. VERIFICAR TABELAS CRIADAS
-- =====================================================
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'suppliers', 'work_groups', 'customers', 'orders', 
    'payments', 'tasks', 'notes'
  )
ORDER BY table_name;

-- 11. VERIFICAR POLÍTICAS RLS
-- =====================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN (
  'suppliers', 'work_groups', 'customers', 'orders', 
  'payments', 'tasks', 'notes'
)
ORDER BY tablename, policyname;

-- =====================================================
-- COMENTÁRIOS IMPORTANTES
-- =====================================================
-- Este script:
-- 1. ✅ Remove TODOS os dados mockados
-- 2. ✅ Cria tabelas faltando (suppliers, work_groups)
-- 3. ✅ Adiciona tabelas extras (customers, orders, payments, tasks, notes)
-- 4. ✅ Evita erros de triggers duplicados
-- 5. ✅ Habilita RLS em todas as tabelas
-- 6. ✅ Cria políticas de segurança
-- 7. ✅ Concede permissões corretas
-- =====================================================
-- Após executar este script:
-- - Sistema 100% sincronizado
-- - Sem dados mockados
-- - Todas as páginas funcionando
-- - Cada usuário com seus próprios dados
-- =====================================================
