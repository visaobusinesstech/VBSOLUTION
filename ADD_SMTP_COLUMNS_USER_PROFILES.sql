-- =========================================================
-- SCRIPT PARA ADICIONAR COLUNAS DE SMTP NO USER_PROFILES
-- Execute este script no SQL Editor do Supabase
-- Cada usuário terá suas próprias configurações de email
-- =========================================================

-- Adicionar colunas de SMTP na tabela user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS smtp_host TEXT,
ADD COLUMN IF NOT EXISTS email_porta INTEGER DEFAULT 587,
ADD COLUMN IF NOT EXISTS email_usuario TEXT,
ADD COLUMN IF NOT EXISTS smtp_pass TEXT,
ADD COLUMN IF NOT EXISTS smtp_from_name TEXT,
ADD COLUMN IF NOT EXISTS smtp_seguranca TEXT DEFAULT 'tls',
ADD COLUMN IF NOT EXISTS signature_image TEXT,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;

-- Comentários nas colunas para documentação
COMMENT ON COLUMN public.user_profiles.smtp_host IS 'Servidor SMTP pessoal do usuário (ex: smtp.gmail.com)';
COMMENT ON COLUMN public.user_profiles.email_porta IS 'Porta SMTP do usuário (587 para TLS, 465 para SSL)';
COMMENT ON COLUMN public.user_profiles.email_usuario IS 'Email/Usuário para autenticação SMTP do usuário';
COMMENT ON COLUMN public.user_profiles.smtp_pass IS 'Senha ou token para autenticação SMTP do usuário';
COMMENT ON COLUMN public.user_profiles.smtp_from_name IS 'Nome do remetente nos emails do usuário';
COMMENT ON COLUMN public.user_profiles.smtp_seguranca IS 'Tipo de segurança SMTP do usuário: tls ou ssl';
COMMENT ON COLUMN public.user_profiles.signature_image IS 'URL da imagem de assinatura pessoal do usuário';
COMMENT ON COLUMN public.user_profiles.two_factor_enabled IS 'Se 2FA está habilitado para o usuário';

-- Verificar se as colunas foram criadas
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
AND column_name IN (
    'smtp_host', 
    'email_porta', 
    'email_usuario', 
    'smtp_pass', 
    'smtp_from_name', 
    'smtp_seguranca',
    'signature_image',
    'two_factor_enabled'
)
ORDER BY column_name;
