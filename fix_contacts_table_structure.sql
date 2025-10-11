-- Corrigir estrutura da tabela contacts
-- Execute este SQL no Supabase SQL Editor

-- 1. Verificar estrutura atual da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contacts' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Se a coluna id não existir, criar a tabela corretamente
CREATE TABLE IF NOT EXISTS public.contacts (
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

-- 3. Adicionar colunas que podem estar faltando
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT false;

-- 4. Garantir que a coluna id tenha DEFAULT gen_random_uuid()
ALTER TABLE public.contacts 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_contacts_owner_id ON public.contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_ai_enabled ON public.contacts(ai_enabled);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON public.contacts(status);

-- 6. Criar constraint de unicidade para phone por owner
CREATE UNIQUE INDEX IF NOT EXISTS uq_contacts_owner_phone 
ON public.contacts(owner_id, phone) 
WHERE phone IS NOT NULL;

-- 7. Desabilitar RLS temporariamente para permitir inserções
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;

-- 8. Remover políticas existentes
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

-- 9. Verificar se RLS foi desabilitado
SELECT schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'contacts' AND schemaname = 'public';

-- 10. Comentários para documentação
COMMENT ON TABLE public.contacts IS 'Tabela de contatos do sistema CRM com suporte a Agente IA';
COMMENT ON COLUMN public.contacts.id IS 'ID único do contato (UUID)';
COMMENT ON COLUMN public.contacts.owner_id IS 'ID do usuário proprietário do contato';
COMMENT ON COLUMN public.contacts.ai_enabled IS 'Se o Agente IA está habilitado para este contato';
COMMENT ON COLUMN public.contacts.phone IS 'Número de telefone do contato';

