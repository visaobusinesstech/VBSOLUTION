-- Atualizar tabela whatsapp_sessions para incluir colunas necessárias
-- Execute este script no Supabase SQL Editor

-- Adicionar colunas que estão faltando
ALTER TABLE public.whatsapp_sessions 
ADD COLUMN IF NOT EXISTS connection_id TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_info JSONB;

-- Criar índice único para connection_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_sessions_connection_id 
ON public.whatsapp_sessions (connection_id);

-- Criar índice para phone_number
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_phone_number 
ON public.whatsapp_sessions (phone_number);

-- Criar constraint única para phone_number quando status = 'connected'
-- (para evitar múltiplas conexões com o mesmo número)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_phone_connected 
ON public.whatsapp_sessions (phone_number) 
WHERE status = 'connected';

-- Comentários para documentação
COMMENT ON COLUMN public.whatsapp_sessions.connection_id IS 'ID único da conexão WhatsApp';
COMMENT ON COLUMN public.whatsapp_sessions.phone_number IS 'Número de telefone do WhatsApp';
COMMENT ON COLUMN public.whatsapp_sessions.whatsapp_info IS 'Informações adicionais do WhatsApp (JSON)';

