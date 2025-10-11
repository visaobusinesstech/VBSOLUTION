-- CORREÇÃO COMPLETA DAS TABELAS WHATSAPP
-- Execute este SQL no Supabase SQL Editor

-- ========================================
-- 1. CORRIGIR TABELA CONTACTS
-- ========================================

-- Adicionar colunas faltantes na tabela contacts
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_jid TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS name_wpp TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_name TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_profile_picture TEXT;

-- Informações de negócio
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

-- Informações de status
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

-- Informações de grupo
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

-- Dados brutos
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_raw_data JSONB;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_presence JSONB;

-- ========================================
-- 2. CORRIGIR TABELA WHATSAPP_MENSAGENS
-- ========================================

-- Adicionar colunas faltantes na tabela whatsapp_mensagens
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

-- Informações de negócio
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

-- Informações de status
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

-- Informações de grupo
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

-- Dados brutos
ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_raw_data JSONB;

ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS whatsapp_presence JSONB;

-- ========================================
-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- ========================================

-- Índices para contacts
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_jid ON public.contacts(whatsapp_jid);
CREATE INDEX IF NOT EXISTS idx_contacts_name_wpp ON public.contacts(name_wpp);
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_name ON public.contacts(whatsapp_name);
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_is_group ON public.contacts(whatsapp_is_group);
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_business_name ON public.contacts(whatsapp_business_name);
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_verified ON public.contacts(whatsapp_verified);
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_online ON public.contacts(whatsapp_online);

-- Índices para whatsapp_mensagens
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_wpp_name ON public.whatsapp_mensagens(wpp_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_group_contact_name ON public.whatsapp_mensagens(group_contact_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_message_type ON public.whatsapp_mensagens(message_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_whatsapp_is_group ON public.whatsapp_mensagens(whatsapp_is_group);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_whatsapp_business_name ON public.whatsapp_mensagens(whatsapp_business_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_whatsapp_verified ON public.whatsapp_mensagens(whatsapp_verified);

-- ========================================
-- 4. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ========================================

-- Comentários para contacts
COMMENT ON COLUMN public.contacts.whatsapp_jid IS 'JID do WhatsApp (ex: 5511999999999@s.whatsapp.net)';
COMMENT ON COLUMN public.contacts.name_wpp IS 'Nome do contato no WhatsApp (Push Name)';
COMMENT ON COLUMN public.contacts.whatsapp_name IS 'Nome do contato no WhatsApp (alias para name_wpp)';
COMMENT ON COLUMN public.contacts.whatsapp_profile_picture IS 'URL da foto de perfil do WhatsApp';
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
COMMENT ON COLUMN public.contacts.whatsapp_is_group IS 'Se o contato é um grupo do WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_group_subject IS 'Nome do grupo do WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_group_description IS 'Descrição do grupo do WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_group_owner IS 'Proprietário do grupo do WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_group_admins IS 'Lista de administradores do grupo (JSON)';
COMMENT ON COLUMN public.contacts.whatsapp_group_participants IS 'Lista de participantes do grupo (JSON)';
COMMENT ON COLUMN public.contacts.whatsapp_group_created IS 'Data de criação do grupo';
COMMENT ON COLUMN public.contacts.whatsapp_group_settings IS 'Configurações do grupo (JSON)';
COMMENT ON COLUMN public.contacts.whatsapp_raw_data IS 'Dados brutos do WhatsApp (JSON)';
COMMENT ON COLUMN public.contacts.whatsapp_presence IS 'Informações de presença (JSON)';

-- Comentários para whatsapp_mensagens
COMMENT ON COLUMN public.whatsapp_mensagens.wpp_name IS 'Nome do contato no WhatsApp (Push Name)';
COMMENT ON COLUMN public.whatsapp_mensagens.group_contact_name IS 'Nome do contato no grupo';
COMMENT ON COLUMN public.whatsapp_mensagens.message_type IS 'Tipo da mensagem (TEXTO, IMAGEM, etc.)';
COMMENT ON COLUMN public.whatsapp_mensagens.media_type IS 'Tipo de mídia';
COMMENT ON COLUMN public.whatsapp_mensagens.media_mime IS 'MIME type da mídia';
COMMENT ON COLUMN public.whatsapp_mensagens.duration_ms IS 'Duração em milissegundos (para áudio/vídeo)';

-- ========================================
-- 5. VERIFICAR ESTRUTURA FINAL
-- ========================================

-- Verificar colunas da tabela contacts
SELECT 
    'contacts' as tabela,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contacts' 
    AND table_schema = 'public'
    AND (column_name LIKE 'whatsapp_%' OR column_name IN ('name_wpp', 'whatsapp_jid'))
ORDER BY ordinal_position;

-- Verificar colunas da tabela whatsapp_mensagens
SELECT 
    'whatsapp_mensagens' as tabela,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'whatsapp_mensagens' 
    AND table_schema = 'public'
    AND (column_name LIKE 'whatsapp_%' OR column_name IN ('wpp_name', 'group_contact_name', 'message_type', 'media_type', 'media_mime', 'duration_ms'))
ORDER BY ordinal_position;

-- ========================================
-- 6. SUCESSO
-- ========================================
SELECT 'Migração completa finalizada com sucesso!' as status;