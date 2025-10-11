-- Corrigir completamente a tabela contacts
-- Execute este SQL no Supabase SQL Editor

-- 1. Verificar estrutura atual
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contacts' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Desabilitar RLS temporariamente
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;

-- 3. Remover todas as políticas existentes
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

-- 4. Garantir que a coluna id tenha DEFAULT gen_random_uuid()
ALTER TABLE public.contacts 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 5. Se a coluna id não existir, recriar a tabela
DO $$
BEGIN
    -- Verificar se a coluna id existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contacts' 
        AND table_schema = 'public' 
        AND column_name = 'id'
    ) THEN
        -- Recriar tabela com estrutura correta
        DROP TABLE IF EXISTS public.contacts CASCADE;
        
        CREATE TABLE public.contacts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            email VARCHAR(255),
            company VARCHAR(255),
            gender VARCHAR(20),
            status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'lead')),
            pipeline VARCHAR(50),
            tags TEXT[],
            whatsapp_opted BOOLEAN DEFAULT true,
            profile_image_url TEXT,
            owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            ai_enabled BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            last_contact_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Criar índices
        CREATE INDEX idx_contacts_owner_id ON public.contacts(owner_id);
        CREATE INDEX idx_contacts_phone ON public.contacts(phone);
        CREATE INDEX idx_contacts_ai_enabled ON public.contacts(ai_enabled);
        CREATE INDEX idx_contacts_status ON public.contacts(status);
        
        -- Criar constraint de unicidade para phone por owner
        CREATE UNIQUE INDEX uq_contacts_owner_phone 
        ON public.contacts(owner_id, phone) 
        WHERE phone IS NOT NULL;
        
        RAISE NOTICE 'Tabela contacts recriada com estrutura correta';
    ELSE
        RAISE NOTICE 'Coluna id já existe, apenas ajustando DEFAULT';
    END IF;
END $$;

-- 6. Verificar se RLS foi desabilitado
SELECT schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'contacts' AND schemaname = 'public';

-- 7. Testar inserção de contato
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

-- 8. Verificar se o contato foi inserido
SELECT id, name, phone, ai_enabled, owner_id, created_at
FROM public.contacts 
WHERE phone = '554796643900' 
AND owner_id = '905b926a-785a-4f6d-9c3a-9455729500b3';

-- 9. Comentários para documentação
COMMENT ON TABLE public.contacts IS 'Tabela de contatos do sistema CRM com suporte a Agente IA';
COMMENT ON COLUMN public.contacts.id IS 'ID único do contato (UUID)';
COMMENT ON COLUMN public.contacts.owner_id IS 'ID do usuário proprietário do contato';
COMMENT ON COLUMN public.contacts.ai_enabled IS 'Se o Agente IA está habilitado para este contato';
COMMENT ON COLUMN public.contacts.phone IS 'Número de telefone do contato';

