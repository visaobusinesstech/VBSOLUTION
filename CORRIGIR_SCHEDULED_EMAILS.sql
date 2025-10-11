-- CORREÇÃO DA TABELA SCHEDULED_EMAILS
-- Este script corrige os problemas de RLS e estrutura da tabela

-- 1. Verificar se a tabela existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scheduled_emails') THEN
        -- Criar a tabela se não existir
        CREATE TABLE public.scheduled_emails (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            to_email TEXT NOT NULL,
            subject TEXT NOT NULL,
            content TEXT NOT NULL,
            template_id UUID REFERENCES public.templates(id),
            scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            error_message TEXT,
            sent_at TIMESTAMP WITH TIME ZONE,
            retry_count INTEGER DEFAULT 0,
            max_retries INTEGER DEFAULT 3
        );
        
        -- Criar índices
        CREATE INDEX idx_scheduled_emails_user_id ON public.scheduled_emails(user_id);
        CREATE INDEX idx_scheduled_emails_status ON public.scheduled_emails(status);
        CREATE INDEX idx_scheduled_emails_scheduled_at ON public.scheduled_emails(scheduled_at);
        
        RAISE NOTICE 'Tabela scheduled_emails criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela scheduled_emails já existe';
    END IF;
END $$;

-- 2. Habilitar RLS
ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can view own scheduled emails" ON public.scheduled_emails;
DROP POLICY IF EXISTS "Users can insert own scheduled emails" ON public.scheduled_emails;
DROP POLICY IF EXISTS "Users can update own scheduled emails" ON public.scheduled_emails;
DROP POLICY IF EXISTS "Users can delete own scheduled emails" ON public.scheduled_emails;

-- 4. Criar novas políticas RLS
CREATE POLICY "Users can view own scheduled emails" ON public.scheduled_emails
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scheduled emails" ON public.scheduled_emails
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled emails" ON public.scheduled_emails
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled emails" ON public.scheduled_emails
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Criar trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_scheduled_emails_updated_at ON public.scheduled_emails;
CREATE TRIGGER update_scheduled_emails_updated_at
    BEFORE UPDATE ON public.scheduled_emails
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Verificar se a tabela email_logs existe (para logs)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_logs') THEN
        CREATE TABLE public.email_logs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            to_email TEXT NOT NULL,
            subject TEXT NOT NULL,
            status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
            message_id TEXT,
            sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            error_message TEXT,
            template_id UUID REFERENCES public.templates(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own email logs" ON public.email_logs
            FOR SELECT USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can insert own email logs" ON public.email_logs
            FOR INSERT WITH CHECK (auth.uid() = user_id);
            
        RAISE NOTICE 'Tabela email_logs criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela email_logs já existe';
    END IF;
END $$;

-- 7. Verificar configuração
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


