-- MIGRAÇÃO COMPLETA - RECONSTRUÇÃO TOTAL DO SISTEMA
-- Data: 2025-08-01
-- Objetivo: Criar sistema completo com isolamento total por usuário
-- Esta migração remove tabelas antigas e cria estrutura nova e segura

-- =====================================================
-- 1. LIMPEZA - REMOVER TABELAS ANTIGAS E INÚTEIS
-- =====================================================

-- Remover tabelas antigas que não são necessárias
DROP TABLE IF EXISTS public.user_activities CASCADE;
DROP TABLE IF EXISTS public.project_tasks CASCADE;
DROP TABLE IF EXISTS public.system_users CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.organizational_structure CASCADE;

-- Remover todas as políticas existentes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Users can view all activities" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own activities or assigned to them" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can create activities for themselves or company members" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can update activities they created or are assigned to" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete activities they created" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can ONLY view their own activities" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can ONLY create activities for themselves" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can ONLY update their own activities" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can ONLY delete their own activities" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Temporary access for system recovery" ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- =====================================================
-- 2. CRIAÇÃO DAS TABELAS PRINCIPAIS DO SISTEMA
-- =====================================================

-- Tabela de usuários (perfis estendidos)
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
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    language TEXT DEFAULT 'pt-BR',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS public.companies (
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
    responsible_id UUID REFERENCES public.user_profiles(id),
    logo_url TEXT,
    description TEXT,
    sector TEXT,
    status TEXT DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de atividades (tarefas)
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'task' CHECK (type IN ('task', 'meeting', 'call', 'email', 'other')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')),
    due_date TIMESTAMP WITH TIME ZONE,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    responsible_id UUID REFERENCES public.user_profiles(id),
    created_by UUID REFERENCES public.user_profiles(id) NOT NULL,
    company_id UUID REFERENCES public.companies(id),
    project_id UUID,
    lead_id UUID,
    tags TEXT[],
    attachments JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de projetos
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    start_date DATE,
    end_date DATE,
    due_date DATE,
    budget DECIMAL(12,2),
    currency TEXT DEFAULT 'BRL',
    responsible_id UUID REFERENCES public.user_profiles(id),
    company_id UUID REFERENCES public.companies(id),
    tags TEXT[],
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    notes TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de funcionários
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id),
    name TEXT NOT NULL,
    email TEXT,
    position TEXT,
    department TEXT,
    manager_id UUID REFERENCES public.employees(id),
    hire_date DATE,
    salary DECIMAL(10,2),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    avatar_url TEXT,
    phone TEXT,
    address TEXT,
    company_id UUID REFERENCES public.companies(id),
    skills TEXT[],
    performance_rating DECIMAL(3,2) CHECK (performance_rating >= 0 AND performance_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de produtos e serviços
CREATE TABLE IF NOT EXISTS public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'product' CHECK (type IN ('product', 'service')),
    sku TEXT UNIQUE,
    description TEXT,
    category TEXT,
    subcategory TEXT,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'BRL',
    unit TEXT NOT NULL DEFAULT 'unidade',
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    max_stock INTEGER,
    image_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    company_id UUID REFERENCES public.companies(id),
    supplier_id UUID,
    tags TEXT[],
    specifications JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de inventário
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id),
    location TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER DEFAULT 0,
    max_quantity INTEGER,
    unit_cost DECIMAL(10,2),
    total_value DECIMAL(12,2),
    last_count_date DATE,
    next_count_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    company_id UUID REFERENCES public.companies(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de movimentações de inventário
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_id UUID REFERENCES public.inventory(id),
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'transfer')),
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(12,2),
    reference TEXT,
    notes TEXT,
    user_id UUID REFERENCES public.user_profiles(id),
    company_id UUID REFERENCES public.companies(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de fornecedores
CREATE TABLE IF NOT EXISTS public.suppliers (
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
    contact_person TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    company_id UUID REFERENCES public.companies(id),
    rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de leads
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company_name TEXT,
    position TEXT,
    source TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    stage_id UUID,
    responsible_id UUID REFERENCES public.user_profiles(id),
    company_id UUID REFERENCES public.companies(id),
    budget DECIMAL(12,2),
    expected_close_date DATE,
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de etapas do funil de vendas
CREATE TABLE IF NOT EXISTS public.funnel_stages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    order_position INTEGER NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    probability DECIMAL(5,2) DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    company_id UUID REFERENCES public.companies(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de grupos de trabalho
CREATE TABLE IF NOT EXISTS public.work_groups (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    sector TEXT,
    department TEXT,
    manager_id UUID REFERENCES public.user_profiles(id),
    company_id UUID REFERENCES public.companies(id),
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de membros dos grupos de trabalho
CREATE TABLE IF NOT EXISTS public.work_group_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    work_group_id UUID REFERENCES public.work_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id),
    role TEXT DEFAULT 'member' CHECK (role IN ('manager', 'member', 'viewer')),
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);

-- Tabela de eventos do calendário
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    event_type TEXT DEFAULT 'event' CHECK (event_type IN ('event', 'meeting', 'task', 'reminder')),
    color TEXT DEFAULT '#3b82f6',
    icon TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern TEXT,
    responsible_id UUID REFERENCES public.user_profiles(id),
    company_id UUID REFERENCES public.companies(id),
    attendees TEXT[],
    location TEXT,
    is_all_day BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de arquivos
CREATE TABLE IF NOT EXISTS public.files (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    file_url TEXT,
    thumbnail_url TEXT,
    uploaded_by UUID REFERENCES public.user_profiles(id),
    company_id UUID REFERENCES public.companies(id),
    folder_path TEXT DEFAULT '/',
    tags TEXT[],
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de mensagens/chat
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    file_url TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    company_id UUID REFERENCES public.companies(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    company_id UUID REFERENCES public.companies(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de configurações da empresa
CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(company_id, setting_key)
);

-- Tabela de relatórios
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    report_type TEXT NOT NULL CHECK (report_type IN ('sales', 'inventory', 'employees', 'projects', 'activities', 'custom')),
    parameters JSONB DEFAULT '{}',
    created_by UUID REFERENCES public.user_profiles(id),
    company_id UUID REFERENCES public.companies(id),
    is_public BOOLEAN DEFAULT false,
    schedule TEXT, -- Cron expression for scheduled reports
    last_generated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de configurações do dashboard
CREATE TABLE IF NOT EXISTS public.dashboard_configs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id),
    dashboard_type TEXT DEFAULT 'main' CHECK (dashboard_type IN ('main', 'projects', 'sales', 'inventory')),
    layout JSONB NOT NULL DEFAULT '[]',
    widgets JSONB NOT NULL DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON public.user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- Índices para activities
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(created_by);
CREATE INDEX IF NOT EXISTS idx_activities_responsible_id ON public.activities(responsible_id);
CREATE INDEX IF NOT EXISTS idx_activities_company_id ON public.activities(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_project_id ON public.activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON public.activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_due_date ON public.activities(due_date);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(type);

-- Índices para projects
CREATE INDEX IF NOT EXISTS idx_projects_responsible_id ON public.projects(responsible_id);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_due_date ON public.projects(due_date);

-- Índices para employees
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);

-- Índices para products
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);

-- Índices para inventory
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON public.inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_company_id ON public.inventory(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_location ON public.inventory(location);

-- Índices para leads
CREATE INDEX IF NOT EXISTS idx_leads_company_id ON public.leads(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_responsible_id ON public.leads(responsible_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_stage_id ON public.leads(stage_id);

-- Índices para work_groups
CREATE INDEX IF NOT EXISTS idx_work_groups_company_id ON public.work_groups(company_id);
CREATE INDEX IF NOT EXISTS idx_work_groups_manager_id ON public.work_groups(manager_id);

-- Índices para calendar_events
CREATE INDEX IF NOT EXISTS idx_calendar_events_responsible_id ON public.calendar_events(responsible_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_company_id ON public.calendar_events(company_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_datetime ON public.calendar_events(start_datetime);

-- Índices para files
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON public.files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_company_id ON public.files(company_id);
CREATE INDEX IF NOT EXISTS idx_files_folder_path ON public.files(folder_path);

-- Índices para messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_company_id ON public.messages(company_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- =====================================================
-- 4. HABILITAR RLS EM TODAS AS TABELAS
-- =====================================================

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
-- 5. CRIAR POLÍTICAS DE SEGURANÇA COMPLETAS
-- =====================================================

-- Políticas para user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para companies
CREATE POLICY "Users can view own companies" ON public.companies
    FOR SELECT USING (
        auth.uid() = responsible_id OR
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = companies.id
        )
    );

CREATE POLICY "Users can create companies" ON public.companies
    FOR INSERT WITH CHECK (auth.uid() = responsible_id);

CREATE POLICY "Users can update own companies" ON public.companies
    FOR UPDATE USING (auth.uid() = responsible_id);

CREATE POLICY "Users can delete own companies" ON public.companies
    FOR DELETE USING (auth.uid() = responsible_id);

-- Políticas para activities
CREATE POLICY "Users can view own activities" ON public.activities
    FOR SELECT USING (
        auth.uid() = created_by OR 
        auth.uid() = responsible_id OR
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = activities.company_id
        )
    );

CREATE POLICY "Users can create activities" ON public.activities
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own activities" ON public.activities
    FOR UPDATE USING (
        auth.uid() = created_by OR 
        auth.uid() = responsible_id
    );

CREATE POLICY "Users can delete own activities" ON public.activities
    FOR DELETE USING (auth.uid() = created_by);

-- Políticas para projects
CREATE POLICY "Users can view own projects" ON public.projects
    FOR SELECT USING (
        auth.uid() = responsible_id OR
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = projects.company_id
        )
    );

CREATE POLICY "Users can create projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = responsible_id);

CREATE POLICY "Users can update own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = responsible_id);

CREATE POLICY "Users can delete own projects" ON public.projects
    FOR DELETE USING (auth.uid() = responsible_id);

-- Políticas para employees
CREATE POLICY "Users can view company employees" ON public.employees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = employees.company_id
        )
    );

CREATE POLICY "Users can manage company employees" ON public.employees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = employees.company_id
            AND up.role IN ('admin', 'manager')
        )
    );

-- Políticas para products
CREATE POLICY "Users can view company products" ON public.products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = products.company_id
        )
    );

CREATE POLICY "Users can manage company products" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = products.company_id
        )
    );

-- Políticas para inventory
CREATE POLICY "Users can view company inventory" ON public.inventory
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = inventory.company_id
        )
    );

CREATE POLICY "Users can manage company inventory" ON public.inventory
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = inventory.company_id
        )
    );

-- Políticas para leads
CREATE POLICY "Users can view own leads" ON public.leads
    FOR SELECT USING (
        auth.uid() = responsible_id OR
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = leads.company_id
        )
    );

CREATE POLICY "Users can create leads" ON public.leads
    FOR INSERT WITH CHECK (auth.uid() = responsible_id);

CREATE POLICY "Users can update own leads" ON public.leads
    FOR UPDATE USING (auth.uid() = responsible_id);

CREATE POLICY "Users can delete own leads" ON public.leads
    FOR DELETE USING (auth.uid() = responsible_id);

-- Políticas para work_groups
CREATE POLICY "Users can view company work groups" ON public.work_groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = work_groups.company_id
        )
    );

CREATE POLICY "Users can manage company work groups" ON public.work_groups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = work_groups.company_id
        )
    );

-- Políticas para calendar_events
CREATE POLICY "Users can view own events" ON public.calendar_events
    FOR SELECT USING (
        auth.uid() = responsible_id OR
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = calendar_events.company_id
        )
    );

CREATE POLICY "Users can create events" ON public.calendar_events
    FOR INSERT WITH CHECK (auth.uid() = responsible_id);

CREATE POLICY "Users can update own events" ON public.calendar_events
    FOR UPDATE USING (auth.uid() = responsible_id);

CREATE POLICY "Users can delete own events" ON public.calendar_events
    FOR DELETE USING (auth.uid() = responsible_id);

-- Políticas para files
CREATE POLICY "Users can view company files" ON public.files
    FOR SELECT USING (
        auth.uid() = uploaded_by OR
        is_public = true OR
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = files.company_id
        )
    );

CREATE POLICY "Users can upload files" ON public.files
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can manage own files" ON public.files
    FOR ALL USING (auth.uid() = uploaded_by);

-- Políticas para messages
CREATE POLICY "Users can view own messages" ON public.messages
    FOR SELECT USING (
        auth.uid() = sender_id OR 
        auth.uid() = receiver_id
    );

CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages" ON public.messages
    FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete own messages" ON public.messages
    FOR DELETE USING (auth.uid() = sender_id);

-- Políticas para notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para dashboard_configs
CREATE POLICY "Users can view own dashboard configs" ON public.dashboard_configs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own dashboard configs" ON public.dashboard_configs
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 6. CRIAR FUNÇÕES E TRIGGERS
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
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_work_groups_updated_at BEFORE UPDATE ON public.work_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON public.files FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON public.company_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dashboard_configs_updated_at BEFORE UPDATE ON public.dashboard_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar perfil de usuário automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), NEW.email);
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 7. INSERIR DADOS INICIAIS
-- =====================================================

-- Inserir etapas padrão do funil
INSERT INTO public.funnel_stages (name, order_position, color, probability) VALUES
('Prospecção', 1, '#3b82f6', 10),
('Primeiro Contato', 2, '#8b5cf6', 25),
('Proposta', 3, '#f59e0b', 50),
('Negociação', 4, '#10b981', 75),
('Fechamento', 5, '#ef4444', 90);

-- =====================================================
-- 8. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar todas as tabelas criadas
SELECT '=== VERIFICAÇÃO FINAL ===' as info;

SELECT 'TABELAS CRIADAS:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verificar políticas aplicadas
SELECT 'POLÍTICAS APLICADAS:' as info;
SELECT 
    schemaname,
    tablename,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Verificar usuário atual
SELECT 'USUÁRIO ATUAL:' as info, auth.uid() as current_user_id;

-- =====================================================
-- 9. COMENTÁRIOS EXPLICATIVOS
-- =====================================================

COMMENT ON TABLE public.user_profiles IS 'Perfis estendidos dos usuários com informações da empresa';
COMMENT ON TABLE public.companies IS 'Empresas cadastradas no sistema';
COMMENT ON TABLE public.activities IS 'Atividades e tarefas dos usuários';
COMMENT ON TABLE public.projects IS 'Projetos gerenciados pelos usuários';
COMMENT ON TABLE public.employees IS 'Funcionários das empresas';
COMMENT ON TABLE public.products IS 'Produtos e serviços das empresas';
COMMENT ON TABLE public.inventory IS 'Controle de estoque das empresas';
COMMENT ON TABLE public.leads IS 'Leads e oportunidades de venda';
COMMENT ON TABLE public.work_groups IS 'Grupos de trabalho das empresas';
COMMENT ON TABLE public.calendar_events IS 'Eventos do calendário';
COMMENT ON TABLE public.files IS 'Arquivos das empresas';
COMMENT ON TABLE public.messages IS 'Sistema de mensagens entre usuários';
COMMENT ON TABLE public.dashboard_configs IS 'Configurações personalizadas do dashboard';

COMMENT ON TABLE public.user_profiles IS 'Sistema completo com isolamento total por usuário - cada usuário só acessa seus próprios dados e dados da sua empresa';
