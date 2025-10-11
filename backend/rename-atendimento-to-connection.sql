-- Renomear coluna atendimento_id para connection_id
-- Execute este script no Supabase SQL Editor

-- 1. Renomear coluna atendimento_id para connection_id
ALTER TABLE whatsapp_mensagens RENAME COLUMN atendimento_id TO connection_id;

-- 2. Atualizar dados existentes - copiar connection_id real para a nova coluna
UPDATE whatsapp_mensagens 
SET connection_id = connection_id 
WHERE connection_id IS NOT NULL;

-- 3. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_connection_id ON whatsapp_mensagens(connection_id);

-- 4. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'whatsapp_mensagens' 
AND column_name IN ('connection_id', 'chat_id', 'phone_number', 'connection_phone')
ORDER BY ordinal_position;
