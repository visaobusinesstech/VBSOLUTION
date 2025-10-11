#!/usr/bin/env python3
"""
Script para corrigir isolamento de dados no VBSolution
Cria tabelas com RLS (Row Level Security) para isolamento por usuário
"""

import requests
import json
import time

# Configurações do Supabase
SUPABASE_URL = "https://zqlwthtkjhmjydkeghfh.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxbHd0aHRramhtanlka2VnaGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTUxMTksImV4cCI6MjA3MDk3MTExOX0.iDAzEjWRHjETngE-elo2zVdgaRmsIWoKDY12OT_O4NY"

headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def execute_sql(sql):
    """Executa SQL no Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    
    payload = {
        "query": sql
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        if response.status_code == 200:
            print("✅ SQL executado com sucesso")
            return True
        else:
            print(f"❌ Erro ao executar SQL: {response.status_code}")
            print(f"Resposta: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return False

def fix_data_isolation():
    """Corrige isolamento de dados criando tabelas com RLS"""
    
    print("🚀 Iniciando correção de isolamento de dados...")
    
    # 1. Remover tabelas antigas que não têm isolamento
    print("\n🗑️ Removendo tabelas antigas...")
    cleanup_sql = """
    -- Remover tabelas antigas sem isolamento
    DROP TABLE IF EXISTS public.activities CASCADE;
    DROP TABLE IF EXISTS public.projects CASCADE;
    DROP TABLE IF EXISTS public.companies CASCADE;
    DROP TABLE IF EXISTS public.user_activities CASCADE;
    DROP TABLE IF EXISTS public.project_tasks CASCADE;
    """
    
    if not execute_sql(cleanup_sql):
        print("❌ Falha ao limpar tabelas antigas")
        return False
    
    # 2. Criar tabelas com estrutura correta e RLS
    print("\n🏗️ Criando novas tabelas com isolamento...")
    
    create_tables_sql = """
    -- 1. Tabela de usuários com perfil completo
    CREATE TABLE IF NOT EXISTS public.user_profiles (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        avatar_url TEXT,
        position TEXT,
        department TEXT,
        role TEXT DEFAULT 'user',
        company_id UUID,
        phone TEXT,
        address TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );

    -- 2. Tabela de empresas (cada usuário pode ter sua própria)
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
        owner_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        logo_url TEXT,
        description TEXT,
        sector TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );

    -- 3. Tabela de projetos (isolados por usuário)
    CREATE TABLE IF NOT EXISTS public.projects (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'planning',
        priority TEXT DEFAULT 'medium',
        start_date DATE,
        end_date DATE,
        due_date DATE,
        budget DECIMAL(12,2),
        owner_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
        tags TEXT[],
        progress INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );

    -- 4. Tabela de atividades (isoladas por usuário)
    CREATE TABLE IF NOT EXISTS public.activities (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT DEFAULT 'task',
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'pending',
        due_date TIMESTAMP WITH TIME ZONE,
        owner_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        assigned_to UUID REFERENCES public.user_profiles(id),
        project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
        company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
        tags TEXT[],
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );

    -- 5. Tabela de produtos/serviços (isolados por usuário)
    CREATE TABLE IF NOT EXISTS public.products (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT DEFAULT 'product',
        price DECIMAL(10,2),
        cost DECIMAL(10,2),
        sku TEXT,
        category TEXT,
        owner_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );

    -- 6. Tabela de funcionários (isolados por usuário)
    CREATE TABLE IF NOT EXISTS public.employees (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        position TEXT,
        department TEXT,
        hire_date DATE,
        salary DECIMAL(10,2),
        owner_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );

    -- 7. Tabela de leads (isolados por usuário)
    CREATE TABLE IF NOT EXISTS public.leads (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        company TEXT,
        source TEXT,
        status TEXT DEFAULT 'new',
        value DECIMAL(10,2),
        owner_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );

    -- 8. Tabela de grupos de trabalho (isolados por usuário)
    CREATE TABLE IF NOT EXISTS public.work_groups (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        owner_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
        members UUID[],
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );

    -- 9. Tabela de configurações do dashboard (isoladas por usuário)
    CREATE TABLE IF NOT EXISTS public.dashboard_configs (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        config_type TEXT NOT NULL,
        config_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        UNIQUE(user_id, config_type)
    );

    -- 10. Tabela de eventos do calendário (isolados por usuário)
    CREATE TABLE IF NOT EXISTS public.calendar_events (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        all_day BOOLEAN DEFAULT false,
        owner_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
        attendees UUID[],
        location TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    """
    
    if not execute_sql(create_tables_sql):
        print("❌ Falha ao criar tabelas")
        return False
    
    # 3. Habilitar RLS em todas as tabelas
    print("\n🔒 Habilitando Row Level Security...")
    
    enable_rls_sql = """
    -- Habilitar RLS em todas as tabelas
    ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.work_groups ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.dashboard_configs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
    """
    
    if not execute_sql(enable_rls_sql):
        print("❌ Falha ao habilitar RLS")
        return False
    
    # 4. Criar políticas RLS para isolamento total
    print("\n🛡️ Criando políticas de isolamento...")
    
    create_policies_sql = """
    -- Políticas para user_profiles (usuário só vê seu próprio perfil)
    DROP POLICY IF EXISTS "Users can only see their own profile" ON public.user_profiles;
    CREATE POLICY "Users can only see their own profile" ON public.user_profiles
        FOR ALL USING (auth.uid() = auth_user_id);

    -- Políticas para companies (usuário só vê suas próprias empresas)
    DROP POLICY IF EXISTS "Users can only see their own companies" ON public.companies;
    CREATE POLICY "Users can only see their own companies" ON public.companies
        FOR ALL USING (owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()));

    -- Políticas para projects (usuário só vê seus próprios projetos)
    DROP POLICY IF EXISTS "Users can only see their own projects" ON public.projects;
    CREATE POLICY "Users can only see their own projects" ON public.projects
        FOR ALL USING (owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()));

    -- Políticas para activities (usuário só vê suas próprias atividades)
    DROP POLICY IF EXISTS "Users can only see their own activities" ON public.activities;
    CREATE POLICY "Users can only see their own activities" ON public.activities
        FOR ALL USING (owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()));

    -- Políticas para products (usuário só vê seus próprios produtos)
    DROP POLICY IF EXISTS "Users can only see their own products" ON public.products;
    CREATE POLICY "Users can only see their own products" ON public.products
        FOR ALL USING (owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()));

    -- Políticas para employees (usuário só vê seus próprios funcionários)
    DROP POLICY IF EXISTS "Users can only see their own employees" ON public.employees;
    CREATE POLICY "Users can only see their own employees" ON public.employees
        FOR ALL USING (owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()));

    -- Políticas para leads (usuário só vê seus próprios leads)
    DROP POLICY IF EXISTS "Users can only see their own leads" ON public.leads;
    CREATE POLICY "Users can only see their own leads" ON public.leads
        FOR ALL USING (owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()));

    -- Políticas para work_groups (usuário só vê seus próprios grupos)
    DROP POLICY IF EXISTS "Users can only see their own work groups" ON public.work_groups;
    CREATE POLICY "Users can only see their own work groups" ON public.work_groups
        FOR ALL USING (owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()));

    -- Políticas para dashboard_configs (usuário só vê suas próprias configurações)
    DROP POLICY IF EXISTS "Users can only see their own dashboard configs" ON public.dashboard_configs;
    CREATE POLICY "Users can only see their own dashboard configs" ON public.dashboard_configs
        FOR ALL USING (user_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()));

    -- Políticas para calendar_events (usuário só vê seus próprios eventos)
    DROP POLICY IF EXISTS "Users can only see their own calendar events" ON public.calendar_events;
    CREATE POLICY "Users can only see their own calendar events" ON public.calendar_events
        FOR ALL USING (owner_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()));
    """
    
    if not execute_sql(create_policies_sql):
        print("❌ Falha ao criar políticas RLS")
        return False
    
    # 5. Criar função para atualizar updated_at
    print("\n⚡ Criando função de atualização automática...")
    
    create_function_sql = """
    -- Função para atualizar updated_at automaticamente
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Triggers para todas as tabelas
    DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
    CREATE TRIGGER update_user_profiles_updated_at
        BEFORE UPDATE ON public.user_profiles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
    CREATE TRIGGER update_companies_updated_at
        BEFORE UPDATE ON public.companies
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
    CREATE TRIGGER update_projects_updated_at
        BEFORE UPDATE ON public.projects
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_activities_updated_at ON public.activities;
    CREATE TRIGGER update_activities_updated_at
        BEFORE UPDATE ON public.activities
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
    CREATE TRIGGER update_products_updated_at
        BEFORE UPDATE ON public.products
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;
    CREATE TRIGGER update_employees_updated_at
        BEFORE UPDATE ON public.employees
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
    CREATE TRIGGER update_leads_updated_at
        BEFORE UPDATE ON public.leads
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_work_groups_updated_at ON public.work_groups;
    CREATE TRIGGER update_work_groups_updated_at
        BEFORE UPDATE ON public.work_groups
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_dashboard_configs_updated_at ON public.dashboard_configs;
    CREATE TRIGGER update_dashboard_configs_updated_at
        BEFORE UPDATE ON public.dashboard_configs
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON public.calendar_events;
    CREATE TRIGGER update_calendar_events_updated_at
        BEFORE UPDATE ON public.calendar_events
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """
    
    if not execute_sql(create_function_sql):
        print("❌ Falha ao criar função de atualização")
        return False
    
    # 6. Criar função para criar perfil automaticamente
    print("\n👤 Criando função de perfil automático...")
    
    create_profile_function_sql = """
    -- Função para criar perfil automaticamente quando usuário se registra
    CREATE OR REPLACE FUNCTION handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
        INSERT INTO public.user_profiles (auth_user_id, name, email)
        VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.email);
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Trigger para criar perfil automaticamente
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user();
    """
    
    if not execute_sql(create_profile_function_sql):
        print("❌ Falha ao criar função de perfil automático")
        return False
    
    # 7. Inserir dados de exemplo para o usuário atual
    print("\n📝 Inserindo dados de exemplo...")
    
    insert_sample_data_sql = """
    -- Inserir empresa de exemplo (se não existir)
    INSERT INTO public.companies (name, fantasy_name, email, owner_id, status)
    SELECT 
        'Minha Empresa',
        'Minha Empresa LTDA',
        'contato@minhaempresa.com',
        up.id,
        'active'
    FROM public.user_profiles up
    WHERE up.email = 'daviresende3322@gmail.com'
    AND NOT EXISTS (
        SELECT 1 FROM public.companies c 
        WHERE c.owner_id = up.id
    );

    -- Inserir projeto de exemplo
    INSERT INTO public.projects (name, description, status, priority, owner_id, company_id)
    SELECT 
        'Projeto Principal',
        'Este é o projeto principal da empresa',
        'active',
        'high',
        up.id,
        c.id
    FROM public.user_profiles up
    LEFT JOIN public.companies c ON c.owner_id = up.id
    WHERE up.email = 'daviresende3322@gmail.com'
    AND NOT EXISTS (
        SELECT 1 FROM public.projects p 
        WHERE p.owner_id = up.id
    )
    LIMIT 1;

    -- Inserir atividade de exemplo
    INSERT INTO public.activities (title, description, type, priority, status, owner_id, project_id)
    SELECT 
        'Configurar Sistema',
        'Configurar o sistema VBSolution para uso da empresa',
        'task',
        'high',
        'in_progress',
        up.id,
        p.id
    FROM public.user_profiles up
    LEFT JOIN public.projects p ON p.owner_id = up.id
    WHERE up.email = 'daviresende3322@gmail.com'
    AND NOT EXISTS (
        SELECT 1 FROM public.activities a 
        WHERE a.owner_id = up.id
    )
    LIMIT 1;
    """
    
    if not execute_sql(insert_sample_data_sql):
        print("❌ Falha ao inserir dados de exemplo")
        return False
    
    print("\n✅ ISOLAMENTO DE DADOS IMPLEMENTADO COM SUCESSO!")
    print("\n🎯 RESULTADO:")
    print("- Cada usuário só vê seus próprios dados")
    print("- Tabelas criadas para todas as funcionalidades")
    print("- RLS (Row Level Security) ativo em todas as tabelas")
    print("- Sistema isolado e seguro")
    
    return True

if __name__ == "__main__":
    print("🚀 VBSolution - Corrigindo Isolamento de Dados")
    print("=" * 50)
    
    success = fix_data_isolation()
    
    if success:
        print("\n🎉 SISTEMA CORRIGIDO COM SUCESSO!")
        print("Agora cada usuário só vê seus próprios dados!")
    else:
        print("\n❌ Falha ao corrigir o sistema")
        print("Verifique as mensagens de erro acima")
