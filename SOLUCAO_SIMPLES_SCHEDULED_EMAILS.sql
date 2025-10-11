-- SOLUÇÃO SIMPLES PARA TABELA SCHEDULED_EMAILS
-- Execute este script no Supabase SQL Editor

-- 1. Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.scheduled_emails (
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

-- 2. Habilitar RLS
ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas
DROP POLICY IF EXISTS "Users can view own scheduled emails" ON public.scheduled_emails;
DROP POLICY IF EXISTS "Users can insert own scheduled emails" ON public.scheduled_emails;
DROP POLICY IF EXISTS "Users can update own scheduled emails" ON public.scheduled_emails;
DROP POLICY IF EXISTS "Users can delete own scheduled emails" ON public.scheduled_emails;

-- 4. Criar políticas simples e funcionais
CREATE POLICY "scheduled_emails_select_policy" ON public.scheduled_emails
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "scheduled_emails_insert_policy" ON public.scheduled_emails
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "scheduled_emails_update_policy" ON public.scheduled_emails
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "scheduled_emails_delete_policy" ON public.scheduled_emails
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Criar tabela email_logs se não existir
CREATE TABLE IF NOT EXISTS public.email_logs (
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

-- 6. Habilitar RLS para email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- 7. Políticas para email_logs
DROP POLICY IF EXISTS "email_logs_select_policy" ON public.email_logs;
DROP POLICY IF EXISTS "email_logs_insert_policy" ON public.email_logs;

CREATE POLICY "email_logs_select_policy" ON public.email_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "email_logs_insert_policy" ON public.email_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Verificar se tudo foi criado corretamente
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


