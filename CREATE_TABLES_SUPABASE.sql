-- =====================================================
-- SISTEMA CRM COMPLETO - VBSOLUTION
-- =====================================================
-- Copie e cole este código no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- EXTENSÕES NECESSÁRIAS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABELAS DE AUTENTICAÇÃO E USUÁRIOS
-- =====================================================

-- Tabela de perfis de usuários (sincronizada com auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  avatar_url TEXT,
  position TEXT,
  department TEXT,
  role TEXT DEFAULT 'user',
  phone TEXT,
  address TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELAS DE EMPRESAS E ORGANIZAÇÃO
-- =====================================================

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
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
  logo_url TEXT,
  description TEXT,
  sector TEXT,
  status TEXT DEFAULT 'active',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELAS DE FUNCIONÁRIOS
-- =====================================================

-- Tabela de funcionários
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  company_id UUID REFERENCES public.companies(id),
  name TEXT NOT NULL,
  email TEXT,
  position TEXT,
  department TEXT,
  manager_id UUID REFERENCES public.employees(id),
  hire_date DATE,
  salary DECIMAL(10,2),
  status TEXT DEFAULT 'active',
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELAS DE PRODUTOS E SERVIÇOS
-- =====================================================

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  company_id UUID REFERENCES public.companies(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'product',
  sku TEXT,
  description TEXT,
  category TEXT,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  unit TEXT NOT NULL DEFAULT 'unidade',
  stock INTEGER,
  min_stock INTEGER DEFAULT 0,
  image_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELAS DE INVENTÁRIO
-- =====================================================

-- Tabela de inventário
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELAS DE VENDAS E FUNIL
-- =====================================================

-- Tabela de etapas do funil
CREATE TABLE IF NOT EXISTS public.funnel_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  order_position INTEGER NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  probability INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  company_id UUID REFERENCES public.companies(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  source TEXT,
  status TEXT DEFAULT 'new',
  assigned_to UUID REFERENCES public.employees(id),
  value DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de negócios/oportunidades
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  company_id UUID REFERENCES public.companies(id),
  product_id UUID REFERENCES public.products(id),
  stage_id UUID NOT NULL REFERENCES public.funnel_stages(id),
  responsible_id UUID REFERENCES public.employees(id),
  title TEXT NOT NULL,
  value DECIMAL(10,2) NOT NULL DEFAULT 0,
  probability INTEGER DEFAULT 50,
  expected_close_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELAS DE ATIVIDADES E TAREFAS
-- =====================================================

-- Tabela de atividades
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'task',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  responsible_id UUID REFERENCES public.employees(id),
  company_id UUID REFERENCES public.companies(id),
  project_id TEXT,
  work_group TEXT,
  department TEXT,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  tags TEXT[],
  attachments JSONB,
  comments JSONB,
  progress INTEGER DEFAULT 0,
  is_urgent BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELAS DE PROJETOS
-- =====================================================

-- Tabela de projetos
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  company_id UUID REFERENCES public.companies(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning',
  priority TEXT DEFAULT 'medium',
  start_date DATE,
  end_date DATE,
  budget DECIMAL(10,2),
  manager_id UUID REFERENCES public.employees(id),
  client_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELAS DE WHATSAPP
-- =====================================================

-- Tabela de atendimentos WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_atendimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  company_id UUID REFERENCES public.companies(id),
  numero_cliente TEXT NOT NULL,
  nome_cliente TEXT,
  status TEXT NOT NULL DEFAULT 'AGUARDANDO',
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_fim TIMESTAMP WITH TIME ZONE,
  ultima_mensagem TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atendente_id UUID REFERENCES public.employees(id),
  prioridade INTEGER DEFAULT 1,
  tags JSONB,
  observacoes TEXT,
  canal TEXT DEFAULT 'whatsapp',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de mensagens WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_mensagens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  atendimento_id UUID NOT NULL REFERENCES public.whatsapp_atendimentos(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'TEXTO',
  remetente TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  lida BOOLEAN DEFAULT FALSE,
  midia_url TEXT,
  midia_tipo TEXT,
  midia_nome TEXT,
  midia_tamanho INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles(company);

-- Índices para companies
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON public.companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_fantasy_name ON public.companies(fantasy_name);

-- Índices para employees
CREATE INDEX IF NOT EXISTS idx_employees_owner_id ON public.employees(owner_id);
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON public.employees(company_id);

-- Índices para products
CREATE INDEX IF NOT EXISTS idx_products_owner_id ON public.products(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);

-- Índices para leads
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON public.leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_company_id ON public.leads(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);

-- Índices para deals
CREATE INDEX IF NOT EXISTS idx_deals_owner_id ON public.deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_company_id ON public.deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage_id ON public.deals(stage_id);

-- Índices para activities
CREATE INDEX IF NOT EXISTS idx_activities_owner_id ON public.activities(owner_id);
CREATE INDEX IF NOT EXISTS idx_activities_company_id ON public.activities(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON public.activities(status);

-- Índices para WhatsApp
CREATE INDEX IF NOT EXISTS idx_whatsapp_atendimentos_owner_id ON public.whatsapp_atendimentos(owner_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_atendimentos_status ON public.whatsapp_atendimentos(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_atendimento_id ON public.whatsapp_mensagens(atendimento_id);

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para criar perfil de usuário automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'));
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_whatsapp_atendimentos_updated_at BEFORE UPDATE ON public.whatsapp_atendimentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- HABILITAR RLS E CRIAR POLÍTICAS
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_mensagens ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS - ISOLAMENTO POR USUÁRIO
-- =====================================================

-- Políticas para profiles (usuário só vê seu próprio perfil)
CREATE POLICY "Usuários podem ver e editar apenas seu próprio perfil" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Políticas para companies (usuário só vê suas próprias empresas)
CREATE POLICY "Usuários podem ver e editar apenas suas próprias empresas" ON public.companies
  FOR ALL USING (auth.uid() = owner_id);

-- Políticas para employees (usuário só vê funcionários de suas empresas)
CREATE POLICY "Usuários podem ver e editar funcionários de suas empresas" ON public.employees
  FOR ALL USING (auth.uid() = owner_id);

-- Políticas para products (usuário só vê produtos de suas empresas)
CREATE POLICY "Usuários podem ver e editar produtos de suas empresas" ON public.products
  FOR ALL USING (auth.uid() = owner_id);

-- Políticas para inventory (usuário só vê inventário de suas empresas)
CREATE POLICY "Usuários podem ver e editar inventário de suas empresas" ON public.inventory
  FOR ALL USING (auth.uid() = owner_id);

-- Políticas para funnel_stages (usuário só vê etapas de seu funil)
CREATE POLICY "Usuários podem ver e editar etapas de seu funil" ON public.funnel_stages
  FOR ALL USING (auth.uid() = owner_id);

-- Políticas para leads (usuário só vê leads de suas empresas)
CREATE POLICY "Usuários podem ver e editar leads de suas empresas" ON public.leads
  FOR ALL USING (auth.uid() = owner_id);

-- Políticas para deals (usuário só vê negócios de suas empresas)
CREATE POLICY "Usuários podem ver e editar negócios de suas empresas" ON public.deals
  FOR ALL USING (auth.uid() = owner_id);

-- Políticas para activities (usuário só vê suas próprias atividades)
CREATE POLICY "Usuários podem ver e editar suas próprias atividades" ON public.activities
  FOR ALL USING (auth.uid() = owner_id);

-- Políticas para projects (usuário só vê projetos de suas empresas)
CREATE POLICY "Usuários podem ver e editar projetos de suas empresas" ON public.projects
  FOR ALL USING (auth.uid() = owner_id);

-- Políticas para WhatsApp (usuário só vê dados de suas empresas)
CREATE POLICY "Usuários podem ver e editar atendimentos de suas empresas" ON public.whatsapp_atendimentos
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Usuários podem ver e editar mensagens de suas empresas" ON public.whatsapp_mensagens
  FOR ALL USING (auth.uid() = owner_id);

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================

-- Este esquema garante que:
-- 1. Cada usuário autenticado só vê seus próprios dados
-- 2. Todas as tabelas têm RLS habilitado
-- 3. O campo owner_id garante isolamento completo
-- 4. Não há dados mockados - cada usuário começa do zero
-- 5. Todas as funcionalidades do CRM estão disponíveis
-- 6. Sistema de autenticação completo e sincronizado
-- 7. O sistema está pronto para uso em produção
