-- Migração para adicionar colunas de informações de perfil WhatsApp
-- Execute este SQL no Supabase SQL Editor

-- 1. Adicionar colunas para informações de grupos na tabela contacts
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_is_group BOOLEAN DEFAULT false;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_group_subject TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_group_description TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_group_owner TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_group_admins JSONB;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_group_participants JSONB;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_group_created TIMESTAMPTZ;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_group_settings JSONB;

-- 2. Adicionar colunas para informações de negócio na tabela contacts
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_business_name TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_business_description TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_business_category TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_business_email TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_business_website TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_business_address TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN DEFAULT false;

-- 3. Adicionar colunas para informações de status e presença
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_online BOOLEAN DEFAULT false;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_blocked BOOLEAN DEFAULT false;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_muted BOOLEAN DEFAULT false;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_pinned BOOLEAN DEFAULT false;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_archived BOOLEAN DEFAULT false;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_status TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_last_seen TIMESTAMPTZ;

-- 4. Adicionar colunas para dados brutos e metadados
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_raw_data JSONB;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_presence JSONB;

-- 5. Adicionar colunas para informações de grupos na tabela whatsapp_mensagens
ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_is_group BOOLEAN DEFAULT false;

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_group_subject TEXT;

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_group_description TEXT;

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_group_owner TEXT;

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_group_admins JSONB;

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_group_participants JSONB;

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_group_created TIMESTAMPTZ;

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_group_settings JSONB;

-- 6. Adicionar colunas para informações de negócio na tabela whatsapp_mensagens
ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_business_name TEXT;

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_business_description TEXT;

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_business_category TEXT;

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_business_email TEXT;

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_business_website TEXT;

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_business_address TEXT;

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN DEFAULT false;

-- 7. Adicionar colunas para informações de status na tabela whatsapp_mensagens
ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_online BOOLEAN DEFAULT false;

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_blocked BOOLEAN DEFAULT false;

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_muted BOOLEAN DEFAULT false;

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_pinned BOOLEAN DEFAULT false;

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_archived BOOLEAN DEFAULT false;

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_status TEXT;

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_last_seen TIMESTAMPTZ;

-- 8. Adicionar colunas para dados brutos na tabela whatsapp_mensagens
ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_raw_data JSONB;

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_presence JSONB;

-- 9. Adicionar colunas para informações de contato na tabela whatsapp_mensagens
ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS wpp_name TEXT;

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS group_contact_name TEXT;

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'TEXTO';

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS media_type TEXT;

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS media_mime TEXT;

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS duration_ms INTEGER;

-- 10. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_is_group ON public.contacts(whatsapp_is_group);
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_business_name ON public.contacts(whatsapp_business_name);
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_verified ON public.contacts(whatsapp_verified);
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_online ON public.contacts(whatsapp_online);

CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_whatsapp_is_group ON public.whatsapp_mensagens(whatsapp_is_group);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_wpp_name ON public.whatsapp_mensagens(wpp_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_message_type ON public.whatsapp_mensagens(message_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_whatsapp_verified ON public.whatsapp_mensagens(whatsapp_verified);

-- 11. Comentários para documentação
COMMENT ON COLUMN public.contacts.whatsapp_is_group IS 'Se o contato é um grupo do WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_group_subject IS 'Nome do grupo do WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_group_description IS 'Descrição do grupo do WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_group_owner IS 'Proprietário do grupo do WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_group_admins IS 'Lista de administradores do grupo (JSON)';
COMMENT ON COLUMN public.contacts.whatsapp_group_participants IS 'Lista de participantes do grupo (JSON)';
COMMENT ON COLUMN public.contacts.whatsapp_group_created IS 'Data de criação do grupo';
COMMENT ON COLUMN public.contacts.whatsapp_group_settings IS 'Configurações do grupo (JSON)';
COMMENT ON COLUMN public.contacts.whatsapp_business_name IS 'Nome do negócio no WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_business_description IS 'Descrição do negócio no WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_business_category IS 'Categoria do negócio no WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_business_email IS 'Email do negócio no WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_business_website IS 'Website do negócio no WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_business_address IS 'Endereço do negócio no WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_verified IS 'Se o contato é verificado no WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_online IS 'Se o contato está online no WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_blocked IS 'Se o contato está bloqueado';
COMMENT ON COLUMN public.contacts.whatsapp_muted IS 'Se o contato está silenciado';
COMMENT ON COLUMN public.contacts.whatsapp_pinned IS 'Se o contato está fixado';
COMMENT ON COLUMN public.contacts.whatsapp_archived IS 'Se o contato está arquivado';
COMMENT ON COLUMN public.contacts.whatsapp_status IS 'Status do contato no WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_last_seen IS 'Última vez visto no WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_raw_data IS 'Dados brutos do WhatsApp (JSON)';
COMMENT ON COLUMN public.contacts.whatsapp_presence IS 'Informações de presença (JSON)';

-- 12. Verificar estrutura final
SELECT 
    'contacts' as tabela,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contacts' AND table_schema = 'public'
    AND column_name LIKE 'whatsapp_%'
ORDER BY ordinal_position;

SELECT 
    'whatsapp_mensagens' as tabela,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'whatsapp_mensagens' AND table_schema = 'public'
    AND (column_name LIKE 'whatsapp_%' OR column_name IN ('wpp_name', 'group_contact_name', 'message_type', 'media_type', 'media_mime', 'duration_ms'))
ORDER BY ordinal_position;
