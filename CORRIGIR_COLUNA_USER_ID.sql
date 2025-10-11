-- CORREÇÃO DA COLUNA USER_ID NA TABELA SCHEDULED_EMAILS
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estrutura atual da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'scheduled_emails' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Se a tabela não existir, criar do zero
DROP TABLE IF EXISTS public.scheduled_emails CASCADE;

CREATE TABLE public.scheduled_emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    template_id UUID,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3
);

-- 3. Criar índices
CREATE INDEX idx_scheduled_emails_user_id ON public.scheduled_emails(user_id);
CREATE INDEX idx_scheduled_emails_status ON public.scheduled_emails(status);
CREATE INDEX idx_scheduled_emails_scheduled_at ON public.scheduled_emails(scheduled_at);

-- 4. Habilitar RLS
ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS
CREATE POLICY "scheduled_emails_select_policy" ON public.scheduled_emails
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "scheduled_emails_insert_policy" ON public.scheduled_emails
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "scheduled_emails_update_policy" ON public.scheduled_emails
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "scheduled_emails_delete_policy" ON public.scheduled_emails
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Criar tabela email_logs
DROP TABLE IF EXISTS public.email_logs CASCADE;

CREATE TABLE public.email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
    message_id TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_message TEXT,
    template_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Habilitar RLS para email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- 8. Políticas para email_logs
CREATE POLICY "email_logs_select_policy" ON public.email_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "email_logs_insert_policy" ON public.email_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. Verificar se tudo foi criado corretamente
SELECT 
    'scheduled_emails' as tabela,
    EXISTS(SELECT FROM information_schema.tables WHERE table_name = 'scheduled_emails') as existe,
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'scheduled_emails') as rls_habilitado,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'scheduled_emails') as politicas_rls
UNION ALL
SELECT 
    'email_logs' as tabela,
    EXISTS(SELECT FROM information_schema.tables WHERE table_name = 'email_logs') as existe,
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'email_logs') as rls_habilitado,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'email_logs') as politicas_rls;

-- 10. Verificar colunas das tabelas
SELECT 'scheduled_emails' as tabela, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'scheduled_emails' AND table_schema = 'public'
UNION ALL
SELECT 'email_logs' as tabela, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'email_logs' AND table_schema = 'public'
ORDER BY tabela, column_name;


