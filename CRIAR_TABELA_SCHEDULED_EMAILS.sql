-- Script para criar apenas a tabela scheduled_emails
-- Execute este script no SQL Editor do Supabase

-- 1. Criar a tabela scheduled_emails se não existir
CREATE TABLE IF NOT EXISTS public.scheduled_emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    recipients TEXT[] NOT NULL,
    message TEXT,
    template_id UUID,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_user_id ON public.scheduled_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_status ON public.scheduled_emails(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_scheduled_date ON public.scheduled_emails(scheduled_date);

-- 3. Habilitar RLS
ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can view their own scheduled emails" ON public.scheduled_emails;
DROP POLICY IF EXISTS "Users can insert their own scheduled emails" ON public.scheduled_emails;
DROP POLICY IF EXISTS "Users can update their own scheduled emails" ON public.scheduled_emails;
DROP POLICY IF EXISTS "Users can delete their own scheduled emails" ON public.scheduled_emails;

-- 5. Criar políticas RLS
CREATE POLICY "Users can view their own scheduled emails" ON public.scheduled_emails
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled emails" ON public.scheduled_emails
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled emails" ON public.scheduled_emails
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled emails" ON public.scheduled_emails
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
DROP TRIGGER IF EXISTS update_scheduled_emails_updated_at ON public.scheduled_emails;
CREATE TRIGGER update_scheduled_emails_updated_at
    BEFORE UPDATE ON public.scheduled_emails
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Teste de inserção (opcional - remover depois)
-- INSERT INTO public.scheduled_emails (user_id, subject, recipients, message, scheduled_date, status)
-- VALUES (
--     auth.uid(),
--     'Teste de Agendamento',
--     ARRAY['teste@example.com'],
--     'Mensagem de teste',
--     NOW() + INTERVAL '1 hour',
--     'pending'
-- );

-- Verificar se a tabela foi criada
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'scheduled_emails' 
AND table_schema = 'public'
ORDER BY ordinal_position;


