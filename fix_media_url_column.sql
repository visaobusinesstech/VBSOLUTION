-- Script para corrigir o problema da coluna media_url
-- Execute este script no Supabase SQL Editor

-- 1. Alterar o tipo da coluna media_url para suportar textos longos
ALTER TABLE whatsapp_mensagens 
ALTER COLUMN media_url TYPE TEXT;

-- 2. Adicionar uma coluna para armazenar o hash da mídia (opcional)
ALTER TABLE whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS media_hash VARCHAR(64);

-- 3. Criar índice para busca rápida por hash
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_media_hash 
ON whatsapp_mensagens(media_hash);

-- 4. Verificar o tamanho atual da coluna
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'whatsapp_mensagens' 
AND column_name = 'media_url';
