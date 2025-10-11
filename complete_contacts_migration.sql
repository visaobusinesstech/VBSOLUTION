-- Migração completa para tabela contacts com suporte total ao WhatsApp
-- Execute este SQL no Supabase SQL Editor

-- 1. Verificar estrutura atual
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contacts' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Adicionar colunas necessárias para WhatsApp
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_jid TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_name TEXT;

ALTER TABLE TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_profile_picture TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_business_profile JSONB;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_presence JSONB;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_last_seen TIMESTAMPTZ;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_is_typing BOOLEAN DEFAULT false;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_is_online BOOLEAN DEFAULT false;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_connection_id TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_registered_at TIMESTAMPTZ;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_message_count INTEGER DEFAULT 0;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_last_message_at TIMESTAMPTZ;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_last_message_content TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_last_message_type TEXT;

-- 3. Adicionar colunas de sistema se não existirem
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT false;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS company VARCHAR(255);

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS gender VARCHAR(20);

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'lead', 'converted'));

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS pipeline VARCHAR(50);

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS tags TEXT[];

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_opted BOOLEAN DEFAULT true;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_contacts_owner_id ON public.contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_jid ON public.contacts(whatsapp_jid);
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_connection_id ON public.contacts(whatsapp_connection_id);
CREATE INDEX IF NOT EXISTS idx_contacts_ai_enabled ON public.contacts(ai_enabled);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON public.contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_registered_at ON public.contacts(whatsapp_registered_at);
CREATE INDEX IF NOT EXISTS idx_contacts_last_contact_at ON public.contacts(last_contact_at);

-- 5. Criar constraints de unicidade
CREATE UNIQUE INDEX IF NOT EXISTS uq_contacts_owner_phone 
ON public.contacts(owner_id, phone) 
WHERE phone IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_contacts_owner_whatsapp_jid 
ON public.contacts(owner_id, whatsapp_jid) 
WHERE whatsapp_jid IS NOT NULL;

-- 6. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_contacts_updated_at ON public.contacts;
CREATE TRIGGER trigger_update_contacts_updated_at
    BEFORE UPDATE ON public.contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_contacts_updated_at();

-- 8. Configurar RLS (Row Level Security)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- 9. Criar políticas RLS
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts;
CREATE POLICY "Users can view their own contacts" ON public.contacts
    FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert their own contacts" ON public.contacts;
CREATE POLICY "Users can insert their own contacts" ON public.contacts
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contacts;
CREATE POLICY "Users can update their own contacts" ON public.contacts
    FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contacts;
CREATE POLICY "Users can delete their own contacts" ON public.contacts
    FOR DELETE USING (auth.uid() = owner_id);

-- 10. Comentários para documentação
COMMENT ON TABLE public.contacts IS 'Tabela de contatos do sistema CRM com suporte completo ao WhatsApp';
COMMENT ON COLUMN public.contacts.id IS 'Identificador único do contato';
COMMENT ON COLUMN public.contacts.owner_id IS 'ID do usuário proprietário do contato';
COMMENT ON COLUMN public.contacts.name IS 'Nome do contato';
COMMENT ON COLUMN public.contacts.phone IS 'Número de telefone';
COMMENT ON COLUMN public.contacts.email IS 'Endereço de email';
COMMENT ON COLUMN public.contacts.whatsapp_jid IS 'JID do WhatsApp (ex: 5511999999999@s.whatsapp.net)';
COMMENT ON COLUMN public.contacts.whatsapp_name IS 'Nome real do WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_profile_picture IS 'URL da foto de perfil do WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_business_profile IS 'Perfil de negócio do WhatsApp (JSON)';
COMMENT ON COLUMN public.contacts.whatsapp_presence IS 'Status de presença do WhatsApp (JSON)';
COMMENT ON COLUMN public.contacts.whatsapp_last_seen IS 'Última vez visto no WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_is_typing IS 'Se está digitando no WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_is_online IS 'Se está online no WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_connection_id IS 'ID da conexão WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_registered_at IS 'Data de registro via WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_message_count IS 'Número de mensagens trocadas';
COMMENT ON COLUMN public.contacts.whatsapp_last_message_at IS 'Data da última mensagem';
COMMENT ON COLUMN public.contacts.whatsapp_last_message_content IS 'Conteúdo da última mensagem';
COMMENT ON COLUMN public.contacts.whatsapp_last_message_type IS 'Tipo da última mensagem';
COMMENT ON COLUMN public.contacts.ai_enabled IS 'Se o Agente IA está habilitado';
COMMENT ON COLUMN public.contacts.status IS 'Status do contato: active, inactive, lead, converted';
COMMENT ON COLUMN public.contacts.tags IS 'Array de tags para categorização';
COMMENT ON COLUMN public.contacts.whatsapp_opted IS 'Se optou por receber mensagens WhatsApp';

-- 11. Verificar estrutura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contacts' AND table_schema = 'public'
ORDER BY ordinal_position;
