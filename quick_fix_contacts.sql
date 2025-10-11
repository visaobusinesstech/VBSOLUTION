-- Solução rápida para contatos
-- Execute este SQL no Supabase SQL Editor

-- 1. Desabilitar RLS temporariamente
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'contacts' AND schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.contacts';
    END LOOP;
END $$;

-- 3. Garantir que id tenha DEFAULT
ALTER TABLE public.contacts 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 4. Verificar status
SELECT schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'contacts' AND schemaname = 'public';

-- 5. Testar inserção
INSERT INTO public.contacts (
    name, 
    phone, 
    whatsapp_opted, 
    ai_enabled, 
    owner_id, 
    status
) VALUES (
    'Contato Teste 554796643900',
    '554796643900',
    true,
    true,
    '905b926a-785a-4f6d-9c3a-9455729500b3',
    'active'
) ON CONFLICT (owner_id, phone) DO UPDATE SET
    ai_enabled = EXCLUDED.ai_enabled,
    updated_at = NOW();

-- 6. Verificar resultado
SELECT COUNT(*) as total_contacts FROM public.contacts;
SELECT id, name, phone, ai_enabled FROM public.contacts WHERE phone = '554796643900';

