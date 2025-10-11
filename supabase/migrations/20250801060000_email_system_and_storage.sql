-- Sistema de E-mails e Storage
-- Data: 2025-08-01

-- 1. Criar bucket para assets da empresa
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de storage para company-assets
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'company-assets');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company-assets' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON storage.objects FOR UPDATE USING (bucket_id = 'company-assets' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete" ON storage.objects FOR DELETE USING (bucket_id = 'company-assets' AND auth.role() = 'authenticated');

-- 3. Tabela para logs de e-mails
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    template TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Adicionar campo invite_token na tabela company_users
ALTER TABLE public.company_users 
ADD COLUMN IF NOT EXISTS invite_token TEXT,
ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMP WITH TIME ZONE;

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON public.email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_company_users_invite_token ON public.company_users(invite_token);

-- 6. Trigger para updated_at em email_logs
CREATE OR REPLACE FUNCTION update_email_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_logs_updated_at
    BEFORE UPDATE ON public.email_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_email_logs_updated_at();

-- 7. RLS para email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email logs" ON public.email_logs
    FOR SELECT USING (auth.email() = to_email);

CREATE POLICY "Authenticated users can create email logs" ON public.email_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 8. Função para limpar tokens expirados
CREATE OR REPLACE FUNCTION cleanup_expired_invites()
RETURNS void AS $$
BEGIN
    UPDATE public.company_users 
    SET invite_token = NULL, invite_expires_at = NULL
    WHERE invite_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 9. Job para limpar convites expirados (executar a cada hora)
SELECT cron.schedule(
    'cleanup-expired-invites',
    '0 * * * *', -- A cada hora
    'SELECT cleanup_expired_invites();'
);

-- 10. Comentários nas tabelas
COMMENT ON TABLE public.email_logs IS 'Logs de e-mails enviados pelo sistema';
COMMENT ON COLUMN public.email_logs.template IS 'Template do e-mail (user_invite, password_reset, welcome, etc.)';
COMMENT ON COLUMN public.email_logs.data IS 'Dados específicos do template em formato JSON';
COMMENT ON COLUMN public.company_users.invite_token IS 'Token único para convite de usuário';
COMMENT ON COLUMN public.company_users.invite_expires_at IS 'Data de expiração do convite (24 horas)';
