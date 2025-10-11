-- Correção da tabela company_settings
-- Data: 2025-08-01

-- 1. Criar tabela company_settings se não existir
CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID,
    company_name TEXT NOT NULL DEFAULT '',
    default_language TEXT NOT NULL DEFAULT 'pt-BR',
    default_timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    default_currency TEXT NOT NULL DEFAULT 'BRL',
    datetime_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY HH:mm',
    logo_url TEXT,
    primary_color TEXT NOT NULL DEFAULT '#021529',
    secondary_color TEXT NOT NULL DEFAULT '#ffffff',
    accent_color TEXT NOT NULL DEFAULT '#3b82f6',
    enable_2fa BOOLEAN NOT NULL DEFAULT false,
    password_policy JSONB NOT NULL DEFAULT '{"min_length": 8, "require_numbers": true, "require_uppercase": true, "require_special": true}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela company_areas se não existir
CREATE TABLE IF NOT EXISTS public.company_areas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela company_roles se não existir
CREATE TABLE IF NOT EXISTS public.company_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID,
    name TEXT NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela company_users se não existir
CREATE TABLE IF NOT EXISTS public.company_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    birth_date DATE,
    phone TEXT,
    role_id UUID REFERENCES public.company_roles(id) ON DELETE SET NULL,
    area_id UUID REFERENCES public.company_areas(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    last_login TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    invite_token TEXT,
    invite_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_company_settings_company_id ON public.company_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_company_areas_company_id ON public.company_areas(company_id);
CREATE INDEX IF NOT EXISTS idx_company_areas_status ON public.company_areas(status);
CREATE INDEX IF NOT EXISTS idx_company_roles_company_id ON public.company_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_company_roles_status ON public.company_roles(status);
CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON public.company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_email ON public.company_users(email);
CREATE INDEX IF NOT EXISTS idx_company_users_status ON public.company_users(status);

-- 6. Triggers para updated_at
CREATE OR REPLACE FUNCTION update_company_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_company_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_company_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_company_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Aplicar triggers
DROP TRIGGER IF EXISTS update_company_settings_updated_at ON public.company_settings;
CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON public.company_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_company_settings_updated_at();

DROP TRIGGER IF EXISTS update_company_areas_updated_at ON public.company_areas;
CREATE TRIGGER update_company_areas_updated_at
    BEFORE UPDATE ON public.company_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_company_areas_updated_at();

DROP TRIGGER IF EXISTS update_company_roles_updated_at ON public.company_roles;
CREATE TRIGGER update_company_roles_updated_at
    BEFORE UPDATE ON public.company_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_company_roles_updated_at();

DROP TRIGGER IF EXISTS update_company_users_updated_at ON public.company_users;
CREATE TRIGGER update_company_users_updated_at
    BEFORE UPDATE ON public.company_users
    FOR EACH ROW
    EXECUTE FUNCTION update_company_users_updated_at();

-- 8. Habilitar RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- 9. Políticas RLS básicas (permitir acesso autenticado)
CREATE POLICY "Authenticated users can view company settings" ON public.company_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can modify company settings" ON public.company_settings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view company areas" ON public.company_areas
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can modify company areas" ON public.company_areas
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view company roles" ON public.company_roles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can modify company roles" ON public.company_roles
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view company users" ON public.company_users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can modify company users" ON public.company_users
    FOR ALL USING (auth.role() = 'authenticated');

-- 10. Inserir configurações padrão se não existirem
INSERT INTO public.company_settings (company_name, default_language, default_timezone, default_currency, datetime_format, primary_color, secondary_color, accent_color, enable_2fa, password_policy)
VALUES (
    'Minha Empresa',
    'pt-BR',
    'America/Sao_Paulo',
    'BRL',
    'DD/MM/YYYY HH:mm',
    '#021529',
    '#ffffff',
    '#3b82f6',
    false,
    '{"min_length": 8, "require_numbers": true, "require_uppercase": true, "require_special": true}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 11. Comentários nas tabelas
COMMENT ON TABLE public.company_settings IS 'Configurações da empresa';
COMMENT ON TABLE public.company_areas IS 'Áreas da empresa';
COMMENT ON TABLE public.company_roles IS 'Cargos da empresa';
COMMENT ON TABLE public.company_users IS 'Usuários da empresa';
