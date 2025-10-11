-- Migração completa do sistema VBSolution
-- Inclui todas as tabelas necessárias para todas as funcionalidades

-- =====================================================
-- TABELAS DE AUTENTICAÇÃO E USUÁRIOS
-- =====================================================

-- Tabela de perfis de usuários (estendida)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  position TEXT,
  department TEXT,
  role TEXT DEFAULT 'user', -- 'admin', 'manager', 'user'
  company_id UUID,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELAS DE EMPRESAS E ORGANIZAÇÃO
-- =====================================================

-- Tabela de empresas (já existe, mas vamos garantir)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fantasy_name TEXT NOT NULL,
  company_name TEXT,
  cnpj TEXT,
  reference TEXT,
  cep TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  email TEXT,
  phone TEXT,
  responsible_id UUID,
  logo_url TEXT,
  description TEXT,
  sector TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'inactive'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELAS DE FUNCIONÁRIOS
-- =====================================================

-- Tabela de funcionários
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT,
  position TEXT,
  department TEXT,
  manager_id UUID,
  hire_date DATE,
  salary DECIMAL(10,2),
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'terminated'
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELAS DE PRODUTOS E SERVIÇOS
-- =====================================================

-- Tabela de produtos (já existe, mas vamos garantir)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'product', -- 'product' ou 'service'
  sku TEXT,
  description TEXT,
  category TEXT,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  unit TEXT NOT NULL DEFAULT 'unidade',
  stock INTEGER,
  min_stock INTEGER DEFAULT 0,
  image_url TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'inactive'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELAS DE FORNECEDORES
-- =====================================================

-- Tabela de fornecedores
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  contact_person TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'inactive'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELAS DE INVENTÁRIO
-- =====================================================

-- Tabela de inventário
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de movimentações de estoque
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id),
  movement_type TEXT NOT NULL, -- 'in', 'out', 'adjustment'
  quantity INTEGER NOT NULL,
  reason TEXT,
  reference_id UUID, -- ID da ordem de compra, venda, etc.
  reference_type TEXT, -- 'purchase_order', 'sales_order', 'adjustment'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELAS DE VENDAS E FUNIL
-- =====================================================

-- Tabela de etapas do funil (já existe, mas vamos garantir)
CREATE TABLE IF NOT EXISTS public.funnel_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  order_position INTEGER NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  probability INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  source TEXT, -- 'website', 'referral', 'social_media', etc.
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'converted', 'lost'
  assigned_to UUID REFERENCES auth.users(id),
  value DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de negócios/oportunidades (já existe, mas vamos garantir)
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  product_id UUID REFERENCES public.products(id),
  stage_id UUID NOT NULL REFERENCES public.funnel_stages(id),
  responsible_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  value DECIMAL(10,2) NOT NULL DEFAULT 0,
  probability INTEGER DEFAULT 50,
  expected_close_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'won', 'lost'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELAS DE ATIVIDADES E TAREFAS
-- =====================================================

-- Tabela de atividades comerciais
CREATE TABLE IF NOT EXISTS public.commercial_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'call', 'meeting', 'email', 'visit', 'proposal'
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  company_id UUID REFERENCES public.companies(id),
  lead_id UUID REFERENCES public.leads(id),
  deal_id UUID REFERENCES public.deals(id),
  responsible_id UUID REFERENCES auth.users(id),
  start_datetime TIMESTAMP WITH TIME ZONE,
  end_datetime TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELAS DE PROJETOS
-- =====================================================

-- Tabela de projetos
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning', -- 'planning', 'active', 'completed', 'cancelled'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  start_date DATE,
  end_date DATE,
  budget DECIMAL(10,2),
  manager_id UUID REFERENCES auth.users(id),
  client_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de tarefas de projeto
CREATE TABLE IF NOT EXISTS public.project_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo', -- 'todo', 'in_progress', 'review', 'done'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  assigned_to UUID REFERENCES auth.users(id),
  due_date DATE,
  estimated_hours INTEGER,
  actual_hours INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELAS DE GRUPOS DE TRABALHO
-- =====================================================

-- Tabela de grupos de trabalho
CREATE TABLE IF NOT EXISTS public.work_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'active', -- 'active', 'inactive'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de membros dos grupos de trabalho
CREATE TABLE IF NOT EXISTS public.work_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_group_id UUID NOT NULL REFERENCES public.work_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT DEFAULT 'member', -- 'leader', 'member'
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(work_group_id, user_id)
);

-- =====================================================
-- TABELAS DE RELATÓRIOS E MÉTRICAS
-- =====================================================

-- Tabela de relatórios
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'sales', 'inventory', 'projects', 'activities'
  parameters JSONB,
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELAS DE ARQUIVOS E DOCUMENTOS
-- =====================================================

-- Tabela de arquivos
CREATE TABLE IF NOT EXISTS public.files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  entity_type TEXT, -- 'company', 'deal', 'project', 'activity'
  entity_id UUID,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELAS DE CONFIGURAÇÕES
-- =====================================================

-- Tabela de usuários da empresa
CREATE TABLE IF NOT EXISTS public.company_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  birth_date DATE,
  phone TEXT,
  role_id UUID REFERENCES public.company_roles(id),
  area_id UUID REFERENCES public.company_areas(id),
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'inactive'
  last_login TIMESTAMP WITH TIME ZONE,
  last_login_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de configurações da empresa
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  company_name TEXT,
  default_language TEXT DEFAULT 'pt-BR',
  default_timezone TEXT DEFAULT 'America/Sao_Paulo',
  default_currency TEXT DEFAULT 'BRL',
  datetime_format TEXT DEFAULT 'DD/MM/YYYY HH:mm',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#021529',
  secondary_color TEXT DEFAULT '#ffffff',
  accent_color TEXT DEFAULT '#3b82f6',
  enable_2fa BOOLEAN DEFAULT false,
  password_policy JSONB DEFAULT '{"min_length": 8, "require_numbers": true, "require_uppercase": true, "require_special": true}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de áreas da empresa
CREATE TABLE IF NOT EXISTS public.company_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de cargos da empresa
CREATE TABLE IF NOT EXISTS public.company_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de permissões por cargo
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID REFERENCES public.company_roles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  permission_value BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission_key)
);

-- Tabela de tentativas de login
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.company_users(id),
  ip_address TEXT NOT NULL,
  success BOOLEAN DEFAULT false,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- HABILITAR RLS E CRIAR POLÍTICAS
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir acesso total por enquanto)
CREATE POLICY "Allow all access to user_profiles" ON public.user_profiles FOR ALL USING (true);
CREATE POLICY "Allow all access to employees" ON public.employees FOR ALL USING (true);
CREATE POLICY "Allow all access to suppliers" ON public.suppliers FOR ALL USING (true);
CREATE POLICY "Allow all access to inventory" ON public.inventory FOR ALL USING (true);
CREATE POLICY "Allow all access to inventory_movements" ON public.inventory_movements FOR ALL USING (true);
CREATE POLICY "Allow all access to leads" ON public.leads FOR ALL USING (true);
CREATE POLICY "Allow all access to commercial_activities" ON public.commercial_activities FOR ALL USING (true);
CREATE POLICY "Allow all access to projects" ON public.projects FOR ALL USING (true);
CREATE POLICY "Allow all access to project_tasks" ON public.project_tasks FOR ALL USING (true);
CREATE POLICY "Allow all access to work_groups" ON public.work_groups FOR ALL USING (true);
CREATE POLICY "Allow all access to work_group_members" ON public.work_group_members FOR ALL USING (true);
CREATE POLICY "Allow all access to reports" ON public.reports FOR ALL USING (true);
CREATE POLICY "Allow all access to files" ON public.files FOR ALL USING (true);
CREATE POLICY "Allow all access to company_settings" ON public.company_settings FOR ALL USING (true);
CREATE POLICY "Allow all access to company_areas" ON public.company_areas FOR ALL USING (true);
CREATE POLICY "Allow all access to company_roles" ON public.company_roles FOR ALL USING (true);
CREATE POLICY "Allow all access to role_permissions" ON public.role_permissions FOR ALL USING (true);
CREATE POLICY "Allow all access to company_users" ON public.company_users FOR ALL USING (true);
CREATE POLICY "Allow all access to login_attempts" ON public.login_attempts FOR ALL USING (true);
CREATE POLICY "Allow all access to system_settings" ON public.system_settings FOR ALL USING (true);

-- =====================================================
-- INSERIR DADOS INICIAIS
-- =====================================================

-- Inserir etapas padrão do funil
INSERT INTO public.funnel_stages (name, order_position, color, probability) VALUES
('Prospecção', 1, '#3b82f6', 10),
('Primeiro Contato', 2, '#8b5cf6', 25),
('Proposta', 3, '#f59e0b', 50),
('Negociação', 4, '#10b981', 75),
('Fechamento', 5, '#ef4444', 90);

-- Inserir configurações iniciais do sistema
INSERT INTO public.system_settings (key, value, description) VALUES
('company_info', '{"name": "VBSolution", "logo": "/logo.png"}', 'Informações da empresa'),
('default_currency', '"BRL"', 'Moeda padrão do sistema'),
('timezone', '"America/Sao_Paulo"', 'Fuso horário padrão');

-- =====================================================
-- CRIAR FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_commercial_activities_updated_at BEFORE UPDATE ON public.commercial_activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_project_tasks_updated_at BEFORE UPDATE ON public.project_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_work_groups_updated_at BEFORE UPDATE ON public.work_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON public.company_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_areas_updated_at BEFORE UPDATE ON public.company_areas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_roles_updated_at BEFORE UPDATE ON public.company_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_users_updated_at BEFORE UPDATE ON public.company_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar perfil de usuário automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.email);
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 