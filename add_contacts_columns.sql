-- Adicionar colunas necessárias para o Agente IA na tabela contacts
-- Execute este SQL no Supabase SQL Editor

-- Adicionar coluna owner_id se não existir
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Adicionar coluna ai_enabled se não existir
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT false;

-- Adicionar coluna phone_number se não existir (para compatibilidade)
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Atualizar phone_number com dados da coluna phone existente
UPDATE public.contacts 
SET phone_number = phone 
WHERE phone_number IS NULL AND phone IS NOT NULL;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_contacts_owner_id ON public.contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contacts_ai_enabled ON public.contacts(ai_enabled);
CREATE INDEX IF NOT EXISTS idx_contacts_phone_number ON public.contacts(phone_number);

-- Adicionar constraint para garantir que phone_number seja único por owner
CREATE UNIQUE INDEX IF NOT EXISTS uq_contacts_owner_phone 
ON public.contacts(owner_id, phone_number) 
WHERE phone_number IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.contacts.owner_id IS 'ID do usuário proprietário do contato';
COMMENT ON COLUMN public.contacts.ai_enabled IS 'Se o Agente IA está habilitado para este contato';
COMMENT ON COLUMN public.contacts.phone_number IS 'Número de telefone do contato (compatibilidade)';

