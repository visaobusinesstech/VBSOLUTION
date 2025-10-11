-- Script para criar as tabelas necessárias para o sistema de configurações da empresa
-- Execute este script no SQL Editor do Supabase

-- =====================================================
-- TABELAS DE CONFIGURAÇÕES DA EMPRESA
-- =====================================================

-- Tabela de configurações da empresa
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  logo_url TEXT,
  default_language TEXT DEFAULT 'pt-BR',
  default_timezone TEXT DEFAULT 'America/Sao_Paulo',
  default_currency TEXT DEFAULT 'BRL',
  datetime_format TEXT DEFAULT 'DD/MM/YYYY HH:mm',
  primary_color TEXT DEFAULT '#021529',
  secondary_color TEXT DEFAULT '#ffffff',
  accent_color TEXT DEFAULT '#3b82f6',
  enable_2fa BOOLEAN DEFAULT false,
  password_policy JSONB DEFAULT '{
    "min_length": 8,
    "require_numbers": true,
    "require_uppercase": true,
    "require_special": true
  }',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de áreas da empresa
CREATE TABLE IF NOT EXISTS company_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de cargos/funções da empresa
CREATE TABLE IF NOT EXISTS company_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de usuários da empresa (diferente dos profiles)
CREATE TABLE IF NOT EXISTS company_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  birth_date DATE,
  phone TEXT,
  role_id UUID REFERENCES company_roles(id),
  area_id UUID REFERENCES company_areas(id),
  status TEXT DEFAULT 'pending',
  last_login TIMESTAMP WITH TIME ZONE,
  last_login_ip TEXT,
  invite_token TEXT,
  invite_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de perfis de usuários (se não existir)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_company_settings_company_id ON company_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_company_areas_company_id ON company_areas(company_id);
CREATE INDEX IF NOT EXISTS idx_company_roles_company_id ON company_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_email ON company_users(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);

-- =====================================================
-- RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança (permitir todas as operações para usuários autenticados)
CREATE POLICY "Allow all operations on company_settings" ON company_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations on company_areas" ON company_areas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations on company_roles" ON company_roles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations on company_users" ON company_users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations on user_profiles" ON user_profiles FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- DADOS INICIAIS (OPCIONAL)
-- =====================================================

-- Inserir dados de exemplo para teste (apenas se necessário)
-- INSERT INTO company_areas (company_id, name, description) VALUES
-- ('seu-company-id-aqui', 'Administração', 'Setor administrativo da empresa'),
-- ('seu-company-id-aqui', 'Vendas', 'Setor de vendas e comercial'),
-- ('seu-company-id-aqui', 'TI', 'Tecnologia da Informação');

-- INSERT INTO company_roles (company_id, name, description, permissions) VALUES
-- ('seu-company-id-aqui', 'Administrador', 'Administrador do sistema', '{}'),
-- ('seu-company-id-aqui', 'Gerente', 'Gerente de equipe', '{}'),
-- ('seu-company-id-aqui', 'Usuário', 'Usuário padrão', '{}');
