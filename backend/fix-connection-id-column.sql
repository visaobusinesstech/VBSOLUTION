-- Script para corrigir a coluna atendimento_id para connection_id
-- Execute este script no Supabase SQL Editor

-- 1. Renomear coluna atendimento_id para connection_id
ALTER TABLE whatsapp_mensagens RENAME COLUMN atendimento_id TO connection_id;

-- 2. Alterar o tipo da coluna connection_id para TEXT (se necessário)
ALTER TABLE whatsapp_mensagens ALTER COLUMN connection_id TYPE TEXT;

-- 3. Tornar a coluna connection_id nullable (opcional)
ALTER TABLE whatsapp_mensagens ALTER COLUMN connection_id DROP NOT NULL;

-- 4. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_connection_id ON whatsapp_mensagens(connection_id);

-- 5. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'whatsapp_mensagens' 
ORDER BY ordinal_position;
