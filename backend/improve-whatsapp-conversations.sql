-- Script para melhorar a estrutura da tabela whatsapp_mensagens para conversas reais
-- Data: $(date)

-- 1. Adicionar coluna phone_number para armazenar apenas o número sem @s.whatsapp.net
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'whatsapp_mensagens' AND column_name = 'phone_number') THEN
        ALTER TABLE whatsapp_mensagens ADD COLUMN phone_number TEXT;
    END IF;
END $$;

-- 2. Preencher phone_number com dados existentes do chat_id
UPDATE whatsapp_mensagens 
SET phone_number = SPLIT_PART(chat_id, '@', 1)
WHERE phone_number IS NULL;

-- 3. Adicionar coluna connection_phone para identificar o número do WhatsApp conectado
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'whatsapp_mensagens' AND column_name = 'connection_phone') THEN
        ALTER TABLE whatsapp_mensagens ADD COLUMN connection_phone TEXT;
    END IF;
END $$;

-- 4. Adicionar coluna connection_id para identificar a conexão específica
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'whatsapp_mensagens' AND column_name = 'connection_id') THEN
        ALTER TABLE whatsapp_mensagens ADD COLUMN connection_id TEXT;
    END IF;
END $$;

-- 5. Remover coluna atendimento_id se não for necessária (comentado por segurança)
-- ALTER TABLE whatsapp_mensagens DROP COLUMN IF EXISTS atendimento_id;

-- 6. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_phone_number ON whatsapp_mensagens(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_connection_phone ON whatsapp_mensagens(connection_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_connection_id ON whatsapp_mensagens(connection_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_chat_id ON whatsapp_mensagens(chat_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_timestamp ON whatsapp_mensagens(timestamp);

-- 7. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'whatsapp_mensagens' 
ORDER BY ordinal_position;
