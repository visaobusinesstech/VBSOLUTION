-- Script para atualizar tabelas do WhatsApp com informações completas de contato
-- Este script adiciona todas as colunas necessárias para capturar informações reais do perfil WhatsApp

-- =====================================================
-- 1. ATUALIZAR TABELA WHATSAPP_ATENDIMENTOS
-- =====================================================

-- Adicionar coluna display_name (nome que NUNCA muda após ser definido)
ALTER TABLE public.whatsapp_atendimentos 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Adicionar coluna para indicar se é grupo
ALTER TABLE public.whatsapp_atendimentos 
ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT FALSE;

-- Adicionar coluna para armazenar informações completas do contato
ALTER TABLE public.whatsapp_atendimentos 
ADD COLUMN IF NOT EXISTS contact_info JSONB;

-- Comentários para documentação
COMMENT ON COLUMN public.whatsapp_atendimentos.display_name IS 'Nome de exibição da conversa - NUNCA muda após ser definido';
COMMENT ON COLUMN public.whatsapp_atendimentos.is_group IS 'Indica se a conversa é um grupo WhatsApp';
COMMENT ON COLUMN public.whatsapp_atendimentos.contact_info IS 'Informações completas do contato em formato JSON';

-- =====================================================
-- 2. ATUALIZAR TABELA WHATSAPP_MENSAGENS
-- =====================================================

-- Adicionar coluna wpp_name (nome real do WhatsApp)
ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS wpp_name TEXT;

-- Adicionar coluna raw para armazenar dados completos da mensagem
ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS raw JSONB;

-- Comentários para documentação
COMMENT ON COLUMN public.whatsapp_mensagens.wpp_name IS 'Nome real do contato no WhatsApp (pushName)';
COMMENT ON COLUMN public.whatsapp_mensagens.raw IS 'Dados completos da mensagem em formato JSON';

-- =====================================================
-- 3. ATUALIZAR TABELA CONTACTS COM INFORMAÇÕES COMPLETAS DO WHATSAPP
-- =====================================================

-- Adicionar colunas para informações básicas do WhatsApp
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_name TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Adicionar colunas para informações de negócio do WhatsApp
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_business_name TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_business_description TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_business_email TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_business_website TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_business_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_business_category TEXT;

-- Adicionar colunas para informações de grupo do WhatsApp
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_group_subject TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_group_description TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_group_participants INTEGER;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_group_owner TEXT;

-- Adicionar colunas para informações gerais do WhatsApp
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_profile_picture_url TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS whatsapp_status TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS is_whatsapp_business BOOLEAN DEFAULT FALSE;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS is_whatsapp_group BOOLEAN DEFAULT FALSE;

-- Comentários para documentação
COMMENT ON COLUMN public.contacts.whatsapp_name IS 'Nome do WhatsApp (pushName)';
COMMENT ON COLUMN public.contacts.full_name IS 'Nome completo do contato';
COMMENT ON COLUMN public.contacts.whatsapp_business_name IS 'Nome do negócio no WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_business_description IS 'Descrição do negócio no WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_business_email IS 'Email do negócio no WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_business_website IS 'Website do negócio no WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_business_verified IS 'Se o negócio é verificado no WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_business_category IS 'Categoria do negócio no WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_group_subject IS 'Nome do grupo no WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_group_description IS 'Descrição do grupo no WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_group_participants IS 'Número de participantes do grupo';
COMMENT ON COLUMN public.contacts.whatsapp_group_owner IS 'Proprietário do grupo no WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_profile_picture_url IS 'URL da foto de perfil do WhatsApp';
COMMENT ON COLUMN public.contacts.whatsapp_status IS 'Status do WhatsApp';
COMMENT ON COLUMN public.contacts.is_whatsapp_business IS 'Se é um negócio WhatsApp';
COMMENT ON COLUMN public.contacts.is_whatsapp_group IS 'Se é um grupo WhatsApp';

-- =====================================================
-- 4. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para whatsapp_atendimentos
CREATE INDEX IF NOT EXISTS idx_wa_atend_display_name ON public.whatsapp_atendimentos(display_name);
CREATE INDEX IF NOT EXISTS idx_wa_atend_is_group ON public.whatsapp_atendimentos(is_group);
CREATE INDEX IF NOT EXISTS idx_wa_atend_contact_info ON public.whatsapp_atendimentos USING GIN(contact_info);

-- Índices para whatsapp_mensagens
CREATE INDEX IF NOT EXISTS idx_wa_msg_wpp_name ON public.whatsapp_mensagens(wpp_name);
CREATE INDEX IF NOT EXISTS idx_wa_msg_raw ON public.whatsapp_mensagens USING GIN(raw);

-- Índices para contacts (WhatsApp)
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_name ON public.contacts(whatsapp_name);
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_business ON public.contacts(is_whatsapp_business);
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_group ON public.contacts(is_whatsapp_group);

-- =====================================================
-- 5. ATUALIZAR DADOS EXISTENTES
-- =====================================================

-- Atualizar display_name para conversas existentes baseado no nome_cliente
UPDATE public.whatsapp_atendimentos 
SET display_name = COALESCE(nome_cliente, 'Contato ' || numero_cliente)
WHERE display_name IS NULL;

-- Atualizar is_group baseado no chat_id
UPDATE public.whatsapp_atendimentos 
SET is_group = TRUE
WHERE chat_id LIKE '%@g.us' AND is_group IS NULL;

-- =====================================================
-- 6. FUNÇÃO PARA GARANTIR NOME CONSISTENTE
-- =====================================================

-- Função para garantir que o display_name nunca mude após ser definido
CREATE OR REPLACE FUNCTION ensure_display_name_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- Se já existe um display_name e estamos tentando mudá-lo, manter o original
    IF OLD.display_name IS NOT NULL AND NEW.display_name IS DISTINCT FROM OLD.display_name THEN
        NEW.display_name := OLD.display_name;
        RAISE NOTICE 'Display name mantido: % (não pode ser alterado)', OLD.display_name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para garantir consistência do display_name
DROP TRIGGER IF EXISTS trigger_ensure_display_name_consistency ON public.whatsapp_atendimentos;
CREATE TRIGGER trigger_ensure_display_name_consistency
    BEFORE UPDATE ON public.whatsapp_atendimentos
    FOR EACH ROW
    EXECUTE FUNCTION ensure_display_name_consistency();

-- =====================================================
-- 7. FUNÇÃO PARA ATUALIZAR CONTADOR DE MENSAGENS NÃO LIDAS
-- =====================================================

-- Função para atualizar contador de mensagens não lidas
CREATE OR REPLACE FUNCTION update_unread_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.remetente = 'CLIENTE' AND NEW.lida = FALSE THEN
        -- Incrementar contador para mensagens não lidas do cliente
        UPDATE public.whatsapp_atendimentos 
        SET nao_lidas = COALESCE(nao_lidas, 0) + 1
        WHERE id = NEW.atendimento_id;
    ELSIF NEW.remetente IN ('ATENDENTE', 'AI') AND OLD.remetente = 'CLIENTE' THEN
        -- Resetar contador quando atendente ou AI responde
        UPDATE public.whatsapp_atendimentos 
        SET nao_lidas = 0
        WHERE id = NEW.atendimento_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contador de mensagens não lidas
DROP TRIGGER IF EXISTS trigger_update_unread_count ON public.whatsapp_mensagens;
CREATE TRIGGER trigger_update_unread_count
    AFTER INSERT OR UPDATE ON public.whatsapp_mensagens
    FOR EACH ROW
    EXECUTE FUNCTION update_unread_count();

-- =====================================================
-- 8. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se as colunas foram adicionadas corretamente
SELECT 
    'whatsapp_atendimentos' as table_name,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'whatsapp_atendimentos' 
  AND column_name IN ('display_name', 'is_group', 'contact_info')
ORDER BY column_name

UNION ALL

SELECT 
    'whatsapp_mensagens' as table_name,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'whatsapp_mensagens' 
  AND column_name IN ('wpp_name', 'raw')
ORDER BY column_name

UNION ALL

SELECT 
    'contacts' as table_name,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'contacts' 
  AND column_name LIKE 'whatsapp_%' OR column_name LIKE 'is_whatsapp_%'
ORDER BY column_name;

-- Mostrar estatísticas das tabelas atualizadas
SELECT 
    'whatsapp_atendimentos' as table_name,
    COUNT(*) as total_records,
    COUNT(display_name) as records_with_display_name,
    COUNT(is_group) as records_with_group_info,
    COUNT(contact_info) as records_with_contact_info
FROM public.whatsapp_atendimentos

UNION ALL

SELECT 
    'whatsapp_mensagens' as table_name,
    COUNT(*) as total_records,
    COUNT(wpp_name) as records_with_wpp_name,
    COUNT(raw) as records_with_raw_data,
    0 as records_with_contact_info
FROM public.whatsapp_mensagens

UNION ALL

SELECT 
    'contacts' as table_name,
    COUNT(*) as total_records,
    COUNT(whatsapp_name) as records_with_wpp_name,
    COUNT(is_whatsapp_business) as records_with_business_info,
    COUNT(is_whatsapp_group) as records_with_group_info
FROM public.contacts;
