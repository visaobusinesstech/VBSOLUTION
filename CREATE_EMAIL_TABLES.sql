-- =========================================================
-- CRIAR/CORRIGIR TABELAS PARA O SISTEMA DE EMAIL
-- Execute este script no SQL Editor do Supabase
-- Este script é seguro para executar múltiplas vezes
-- =========================================================

-- 1. ADICIONAR COLUNAS FALTANTES NA TABELA scheduled_emails
DO $$ 
BEGIN
    -- Criar tabela se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'scheduled_emails') THEN
        CREATE TABLE public.scheduled_emails (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            subject TEXT NOT NULL,
            recipients TEXT[] NOT NULL,
            message TEXT,
            template_id UUID,
            scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
            status TEXT DEFAULT 'pending',
            sent_at TIMESTAMP WITH TIME ZONE,
            error_message TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        -- Adicionar colunas básicas se não existirem
        ALTER TABLE public.scheduled_emails ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        ALTER TABLE public.scheduled_emails ADD COLUMN IF NOT EXISTS subject TEXT;
        ALTER TABLE public.scheduled_emails ADD COLUMN IF NOT EXISTS recipients TEXT[];
        ALTER TABLE public.scheduled_emails ADD COLUMN IF NOT EXISTS message TEXT;
        ALTER TABLE public.scheduled_emails ADD COLUMN IF NOT EXISTS template_id UUID;
        ALTER TABLE public.scheduled_emails ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP WITH TIME ZONE;
        ALTER TABLE public.scheduled_emails ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
        ALTER TABLE public.scheduled_emails ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE public.scheduled_emails ADD COLUMN IF NOT EXISTS error_message TEXT;
        ALTER TABLE public.scheduled_emails ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        ALTER TABLE public.scheduled_emails ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 2. ADICIONAR COLUNAS FALTANTES NA TABELA email_logs
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_logs') THEN
        CREATE TABLE public.email_logs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            to_email TEXT NOT NULL,
            subject TEXT NOT NULL,
            template TEXT,
            data JSONB DEFAULT '{}',
            status TEXT DEFAULT 'pending',
            sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            delivered_at TIMESTAMP WITH TIME ZONE,
            error_message TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        -- Adicionar colunas básicas se não existirem
        ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS to_email TEXT;
        ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS subject TEXT;
        ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS template TEXT;
        ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';
        ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
        ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS error_message TEXT;
        ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 3. ADICIONAR COLUNAS FALTANTES NA TABELA templates
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'templates') THEN
        CREATE TABLE public.templates (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            nome TEXT NOT NULL,
            conteudo TEXT NOT NULL,
            canal TEXT NOT NULL,
            assinatura TEXT,
            signature_image TEXT,
            status TEXT DEFAULT 'ativo',
            attachments JSONB DEFAULT '[]',
            descricao TEXT,
            template_file_url TEXT,
            template_file_name TEXT,
            image_url TEXT,
            font_size_px TEXT DEFAULT '16px',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        -- Adicionar colunas básicas se não existirem
        ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS nome TEXT;
        ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS conteudo TEXT;
        ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS canal TEXT DEFAULT 'email';
        ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS assinatura TEXT;
        ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo';
        ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Adicionar colunas adicionais
        ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS signature_image TEXT;
        ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
        ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS descricao TEXT;
        ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS template_file_url TEXT;
        ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS template_file_name TEXT;
        ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS image_url TEXT;
        ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS font_size_px TEXT DEFAULT '16px';
    END IF;
END $$;

-- 4. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_user_id ON public.scheduled_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_status ON public.scheduled_emails(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_scheduled_date ON public.scheduled_emails(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON public.email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_canal ON public.templates(canal);
CREATE INDEX IF NOT EXISTS idx_templates_status ON public.templates(status);

-- 5. HABILITAR RLS
ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS
DROP POLICY IF EXISTS "Users can view their own scheduled emails" ON public.scheduled_emails;
CREATE POLICY "Users can view their own scheduled emails" ON public.scheduled_emails
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own scheduled emails" ON public.scheduled_emails;
CREATE POLICY "Users can insert their own scheduled emails" ON public.scheduled_emails
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own scheduled emails" ON public.scheduled_emails;
CREATE POLICY "Users can update their own scheduled emails" ON public.scheduled_emails
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own scheduled emails" ON public.scheduled_emails;
CREATE POLICY "Users can delete their own scheduled emails" ON public.scheduled_emails
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can view email logs" ON public.email_logs;
CREATE POLICY "Authenticated users can view email logs" ON public.email_logs
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert email logs" ON public.email_logs;
CREATE POLICY "Authenticated users can insert email logs" ON public.email_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update email logs" ON public.email_logs;
CREATE POLICY "Authenticated users can update email logs" ON public.email_logs
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view their own templates" ON public.templates;
CREATE POLICY "Users can view their own templates" ON public.templates
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own templates" ON public.templates;
CREATE POLICY "Users can insert their own templates" ON public.templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own templates" ON public.templates;
CREATE POLICY "Users can update their own templates" ON public.templates
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own templates" ON public.templates;
CREATE POLICY "Users can delete their own templates" ON public.templates
    FOR DELETE USING (auth.uid() = user_id);

-- 7. TRIGGERS
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

DROP TRIGGER IF EXISTS update_email_logs_updated_at ON public.email_logs;
CREATE TRIGGER update_email_logs_updated_at
    BEFORE UPDATE ON public.email_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_templates_updated_at ON public.templates;
CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON public.templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. VERIFICAR RESULTADO
SELECT '✅ Script executado com sucesso!' as status;