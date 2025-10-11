-- Script para corrigir RLS da tabela contacts
-- Execute este script no Supabase SQL Editor

-- 1. Desabilitar RLS temporariamente
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes se houver
DROP POLICY IF EXISTS "Enable read access for users based on owner_id" ON public.contacts;
DROP POLICY IF EXISTS "Enable insert for users based on owner_id" ON public.contacts;
DROP POLICY IF EXISTS "Enable update for users based on owner_id" ON public.contacts;
DROP POLICY IF EXISTS "Enable delete for users based on owner_id" ON public.contacts;

-- 3. Criar políticas mais permissivas
CREATE POLICY "Enable all access for authenticated users" ON public.contacts
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Opcional: Permitir acesso sem autenticação para o backend
-- CREATE POLICY "Enable all access for service role" ON public.contacts
--   FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- 5. Verificar se a tabela tem as colunas necessárias
-- Se não existirem, adicionar:
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_jid TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS whatsapp_profile_picture TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_connection_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_registered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS whatsapp_message_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS whatsapp_last_message_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS whatsapp_last_message_content TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_last_message_type TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_opted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT false;

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_contacts_owner_id ON public.contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_jid ON public.contacts(whatsapp_jid);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);

-- 7. Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'contacts' 
ORDER BY ordinal_position;