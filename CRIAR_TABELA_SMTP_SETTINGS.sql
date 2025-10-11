-- Script para criar tabela unificada de configurações SMTP
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela smtp_settings se não existir
CREATE TABLE IF NOT EXISTS public.smtp_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    host TEXT NOT NULL,
    port INTEGER DEFAULT 587,
    "user" TEXT NOT NULL,
    pass TEXT NOT NULL,
    from_name TEXT,
    security TEXT DEFAULT 'tls' CHECK (security IN ('tls', 'ssl')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_smtp_settings_user_id ON public.smtp_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_smtp_settings_active ON public.smtp_settings(is_active);

-- 3. Habilitar RLS
ALTER TABLE public.smtp_settings ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas existentes
DROP POLICY IF EXISTS "Users can manage their own SMTP settings" ON public.smtp_settings;
DROP POLICY IF EXISTS "Users can view their own SMTP settings" ON public.smtp_settings;
DROP POLICY IF EXISTS "Users can insert their own SMTP settings" ON public.smtp_settings;
DROP POLICY IF EXISTS "Users can update their own SMTP settings" ON public.smtp_settings;
DROP POLICY IF EXISTS "Users can delete their own SMTP settings" ON public.smtp_settings;

-- 5. Criar políticas RLS
CREATE POLICY "Users can view their own SMTP settings" ON public.smtp_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own SMTP settings" ON public.smtp_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own SMTP settings" ON public.smtp_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own SMTP settings" ON public.smtp_settings
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Trigger para updated_at
DROP TRIGGER IF EXISTS update_smtp_settings_updated_at ON public.smtp_settings;
CREATE TRIGGER update_smtp_settings_updated_at
    BEFORE UPDATE ON public.smtp_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Migrar configurações existentes de user_profiles para smtp_settings
INSERT INTO public.smtp_settings (user_id, host, port, "user", pass, from_name, security, is_active)
SELECT 
    id as user_id,
    smtp_host as host,
    email_porta as port,
    email_usuario as "user",
    smtp_pass as pass,
    smtp_from_name as from_name,
    smtp_seguranca as security,
    true as is_active
FROM public.user_profiles
WHERE smtp_host IS NOT NULL 
AND email_usuario IS NOT NULL 
AND smtp_pass IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.smtp_settings 
    WHERE smtp_settings.user_id = user_profiles.id
);

-- 9. Verificar se a tabela foi criada corretamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'smtp_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 10. Verificar configurações migradas
SELECT 
    id,
    user_id,
    host,
    port,
    "user",
    from_name,
    security,
    is_active,
    created_at
FROM public.smtp_settings
ORDER BY created_at DESC;
