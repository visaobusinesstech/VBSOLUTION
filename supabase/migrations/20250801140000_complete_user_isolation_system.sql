-- MIGRAÇÃO COMPLETA - SISTEMA DE ISOLAMENTO TOTAL POR USUÁRIO
-- Data: 2025-08-01 14:00:00
-- Objetivo: Criar sistema completo com isolamento total de dados por usuário

-- =====================================================
-- 1. LIMPEZA COMPLETA - REMOVER TABELAS ANTIGAS
-- =====================================================

-- Remover todas as tabelas antigas que podem ter dados misturados
DROP TABLE IF EXISTS public.user_activities CASCADE;
DROP TABLE IF EXISTS public.project_tasks CASCADE;
DROP TABLE IF EXISTS public.system_users CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.organizational_structure CASCADE;
DROP TABLE IF EXISTS public.activities CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.inventory_movements CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.funnel_stages CASCADE;
DROP TABLE IF EXISTS public.work_groups CASCADE;
DROP TABLE IF EXISTS public.work_group_members CASCADE;
DROP TABLE IF EXISTS public.calendar_events CASCADE;
DROP TABLE IF EXISTS public.files CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.company_settings CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.dashboard_configs CASCADE;

-- Remover todas as políticas RLS existentes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ALL ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- =====================================================
-- 2. CRIAR SISTEMA COMPLETO COM ISOLAMENTO TOTAL
-- =====================================================

-- 2.1 TABELA DE PERFIS DE USUÁRIO (BASE DO SISTEMA)
CREATE TABLE public.user_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID UNIQUE NOT NULL, -- ID do auth.users do Supabase
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    position TEXT,
    department TEXT,
    role TEXT DEFAULT 'user',
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'Brasil',
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    language TEXT DEFAULT 'pt-BR',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.2 TABELA DE EMPRESAS (ISOLADA POR USUÁRIO)
CREATE TABLE public.companies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    fantasy_name TEXT,
    cnpj TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    cep TEXT,
    country TEXT DEFAULT 'Brasil',
    logo_url TEXT,
    description TEXT,
    sector TEXT,
    status TEXT DEFAULT 'active',
    owner_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.3 TABELA DE ATIVIDADES (ISOLADA POR USUÁRIO)
CREATE TABLE public.activities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'task',
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    due_date TIMESTAMP WITH TIME ZONE,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    responsible_id UUID REFERENCES public.user_profiles(id),
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    company_id UUID REFERENCES public.companies(id),
    project_id UUID,
    tags TEXT[],
    notes TEXT,
    progress INTEGER DEFAULT 0,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    is_urgent BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.4 TABELA DE PROJETOS (ISOLADA POR USUÁRIO)
CREATE TABLE public.projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'planning',
    priority TEXT DEFAULT 'medium',
    start_date DATE,
    end_date DATE,
    due_date DATE,
    budget DECIMAL(12,2),
    responsible_id UUID REFERENCES public.user_profiles(id),
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    company_id UUID REFERENCES public.companies(id),
    tags TEXT[],
    progress INTEGER DEFAULT 0,
    notes TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.5 TABELA DE FUNCIONÁRIOS (ISOLADA POR USUÁRIO)
CREATE TABLE public.employees (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    position TEXT,
    department TEXT,
    hire_date DATE,
    salary DECIMAL(10,2),
    status TEXT DEFAULT 'active',
    avatar_url TEXT,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.6 TABELA DE PRODUTOS/SERVIÇOS (ISOLADA POR USUÁRIO)
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'product', -- product, service
    sku TEXT,
    price DECIMAL(10,2),
    cost DECIMAL(10,2),
    category TEXT,
    brand TEXT,
    status TEXT DEFAULT 'active',
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.7 TABELA DE INVENTÁRIO (ISOLADA POR USUÁRIO)
CREATE TABLE public.inventory (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER DEFAULT 0,
    max_quantity INTEGER,
    location TEXT,
    notes TEXT,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.8 TABELA DE MOVIMENTAÇÕES DE INVENTÁRIO (ISOLADA POR USUÁRIO)
CREATE TABLE public.inventory_movements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- in, out, transfer, adjustment
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reason TEXT,
    reference TEXT,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.9 TABELA DE FORNECEDORES (ISOLADA POR USUÁRIO)
CREATE TABLE public.suppliers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    fantasy_name TEXT,
    cnpj TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    contact_person TEXT,
    notes TEXT,
    status TEXT DEFAULT 'active',
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.10 TABELA DE LEADS (ISOLADA POR USUÁRIO)
CREATE TABLE public.leads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    position TEXT,
    source TEXT,
    status TEXT DEFAULT 'new',
    priority TEXT DEFAULT 'medium',
    notes TEXT,
    assigned_to UUID REFERENCES public.user_profiles(id),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.11 TABELA DE ESTÁGIOS DO FUNIL (ISOLADA POR USUÁRIO)
CREATE TABLE public.funnel_stages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.12 TABELA DE GRUPOS DE TRABALHO (ISOLADA POR USUÁRIO)
CREATE TABLE public.work_groups (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.13 TABELA DE MEMBROS DOS GRUPOS (ISOLADA POR USUÁRIO)
CREATE TABLE public.work_group_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    work_group_id UUID NOT NULL REFERENCES public.work_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(work_group_id, user_id)
);

-- 2.14 TABELA DE EVENTOS DO CALENDÁRIO (ISOLADA POR USUÁRIO)
CREATE TABLE public.calendar_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    all_day BOOLEAN DEFAULT false,
    location TEXT,
    type TEXT DEFAULT 'meeting',
    status TEXT DEFAULT 'scheduled',
    attendees TEXT[],
    notes TEXT,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.15 TABELA DE ARQUIVOS (ISOLADA POR USUÁRIO)
CREATE TABLE public.files (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    description TEXT,
    tags TEXT[],
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.16 TABELA DE MENSAGENS (ISOLADA POR USUÁRIO)
CREATE TABLE public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    subject TEXT,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.17 TABELA DE NOTIFICAÇÕES (ISOLADA POR USUÁRIO)
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.18 TABELA DE CONFIGURAÇÕES DA EMPRESA (ISOLADA POR USUÁRIO)
CREATE TABLE public.company_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    setting_key TEXT NOT NULL,
    setting_value TEXT,
    setting_type TEXT DEFAULT 'string',
    description TEXT,
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(company_id, setting_key)
);

-- 2.19 TABELA DE RELATÓRIOS (ISOLADA POR USUÁRIO)
CREATE TABLE public.reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    parameters JSONB,
    schedule TEXT,
    last_run TIMESTAMP WITH TIME ZONE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.20 TABELA DE CONFIGURAÇÕES DO DASHBOARD (ISOLADA POR USUÁRIO)
CREATE TABLE public.dashboard_configs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    config_key TEXT NOT NULL,
    config_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, company_id, config_key)
);

-- =====================================================
-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para user_profiles
CREATE INDEX idx_user_profiles_auth_user_id ON public.user_profiles(auth_user_id);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);

-- Índices para companies
CREATE INDEX idx_companies_owner_id ON public.companies(owner_id);
CREATE INDEX idx_companies_created_by ON public.companies(created_by);

-- Índices para activities
CREATE INDEX idx_activities_created_by ON public.activities(created_by);
CREATE INDEX idx_activities_responsible_id ON public.activities(responsible_id);
CREATE INDEX idx_activities_company_id ON public.activities(company_id);
CREATE INDEX idx_activities_status ON public.activities(status);
CREATE INDEX idx_activities_due_date ON public.activities(due_date);

-- Índices para projects
CREATE INDEX idx_projects_created_by ON public.projects(created_by);
CREATE INDEX idx_projects_responsible_id ON public.projects(responsible_id);
CREATE INDEX idx_projects_company_id ON public.projects(company_id);
CREATE INDEX idx_projects_status ON public.projects(status);

-- Índices para employees
CREATE INDEX idx_employees_company_id ON public.employees(company_id);
CREATE INDEX idx_employees_created_by ON public.employees(created_by);

-- Índices para products
CREATE INDEX idx_products_company_id ON public.products(company_id);
CREATE INDEX idx_products_created_by ON public.products(created_by);

-- Índices para inventory
CREATE INDEX idx_inventory_product_id ON public.inventory(product_id);
CREATE INDEX idx_inventory_company_id ON public.inventory(company_id);

-- Índices para leads
CREATE INDEX idx_leads_company_id ON public.leads(company_id);
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX idx_leads_status ON public.leads(status);

-- Índices para calendar_events
CREATE INDEX idx_calendar_events_company_id ON public.calendar_events(company_id);
CREATE INDEX idx_calendar_events_created_by ON public.calendar_events(created_by);
CREATE INDEX idx_calendar_events_start_time ON public.calendar_events(start_time);

-- =====================================================
-- 4. FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas que têm updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_funnel_stages_updated_at BEFORE UPDATE ON public.funnel_stages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_work_groups_updated_at BEFORE UPDATE ON public.work_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON public.company_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dashboard_configs_updated_at BEFORE UPDATE ON public.dashboard_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar perfil de usuário automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (auth_user_id, name, email)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.email);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 5. HABILITAR RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_configs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. POLÍTICAS RLS PARA ISOLAMENTO TOTAL
-- =====================================================

-- Política para user_profiles (usuário só vê seu próprio perfil)
CREATE POLICY "Usuários só veem seu próprio perfil" ON public.user_profiles
    FOR ALL USING (auth.uid() = auth_user_id);

-- Política para companies (usuário só vê empresas que criou ou é dono)
CREATE POLICY "Usuários só veem suas próprias empresas" ON public.companies
    FOR ALL USING (
        created_by = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) OR
        owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())
    );

-- Política para activities (usuário só vê atividades que criou ou é responsável)
CREATE POLICY "Usuários só veem suas próprias atividades" ON public.activities
    FOR ALL USING (
        created_by = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) OR
        responsible_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) OR
        company_id IN (
            SELECT id FROM public.companies 
            WHERE owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) OR
                  created_by = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())
        )
    );

-- Política para projects (usuário só vê projetos que criou ou é responsável)
CREATE POLICY "Usuários só veem seus próprios projetos" ON public.projects
    FOR ALL USING (
        created_by = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) OR
        responsible_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) OR
        company_id IN (
            SELECT id FROM public.companies 
            WHERE owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) OR
                  created_by = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())
        )
    );

-- Política para employees (usuário só vê funcionários de suas empresas)
CREATE POLICY "Usuários só veem funcionários de suas empresas" ON public.employees
    FOR ALL USING (
        company_id IN (
            SELECT id FROM public.companies 
            WHERE owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) OR
                  created_by = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())
        )
    );

-- Política para products (usuário só vê produtos de suas empresas)
CREATE POLICY "Usuários só veem produtos de suas empresas" ON public.products
    FOR ALL USING (
        company_id IN (
            SELECT id FROM public.companies 
            WHERE owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) OR
                  created_by = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())
        )
    );

-- Política para inventory (usuário só vê inventário de suas empresas)
CREATE POLICY "Usuários só veem inventário de suas empresas" ON public.inventory
    FOR ALL USING (
        company_id IN (
            SELECT id FROM public.companies 
            WHERE owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) OR
                  created_by = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())
        )
    );

-- Política para leads (usuário só vê leads de suas empresas)
CREATE POLICY "Usuários só veem leads de suas empresas" ON public.leads
    FOR ALL USING (
        company_id IN (
            SELECT id FROM public.companies 
            WHERE owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) OR
                  created_by = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())
        )
    );

-- Política para calendar_events (usuário só vê eventos de suas empresas)
CREATE POLICY "Usuários só veem eventos de suas empresas" ON public.calendar_events
    FOR ALL USING (
        company_id IN (
            SELECT id FROM public.companies 
            WHERE owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) OR
                  created_by = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())
        )
    );

-- Política para dashboard_configs (usuário só vê suas próprias configurações)
CREATE POLICY "Usuários só veem suas próprias configurações" ON public.dashboard_configs
    FOR ALL USING (
        user_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())
    );

-- =====================================================
-- 7. DADOS INICIAIS ESSENCIAIS
-- =====================================================

-- Inserir estágios padrão do funil
INSERT INTO public.funnel_stages (name, description, order_index, color, company_id, created_by)
SELECT 
    'Novo Lead',
    'Leads recém-cadastrados no sistema',
    1,
    '#10B981',
    c.id,
    up.id
FROM public.companies c
CROSS JOIN public.user_profiles up
WHERE c.name = 'Empresa Padrão' AND up.email = 'admin@empresa.com'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se todas as tabelas foram criadas
SELECT '=== VERIFICAÇÃO FINAL ===' as info;
SELECT 'Tabelas criadas:' as info, COUNT(*) as total FROM information_schema.tables WHERE table_schema = 'public';
SELECT 'Políticas RLS:' as info, COUNT(*) as total FROM pg_policies WHERE schemaname = 'public';
SELECT 'Índices criados:' as info, COUNT(*) as total FROM pg_indexes WHERE schemaname = 'public';

-- Verificar estrutura das principais tabelas
SELECT 'user_profiles:' as tabela, COUNT(*) as total FROM public.user_profiles;
SELECT 'companies:' as tabela, COUNT(*) as total FROM public.companies;
SELECT 'activities:' as tabela, COUNT(*) as total FROM public.activities;
SELECT 'projects:' as tabela, COUNT(*) as total FROM public.projects;
