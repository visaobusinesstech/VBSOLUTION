-- Script para corrigir estrutura do banco de dados
-- Execute este script no Supabase SQL Editor

-- 1. Remover foreign key constraint primeiro
ALTER TABLE whatsapp_mensagens 
DROP CONSTRAINT IF EXISTS whatsapp_mensagens_atendimento_id_fkey;

-- 2. Deletar tabela whatsapp_atendimentos
DROP TABLE IF EXISTS whatsapp_atendimentos;

-- 3. Renomear coluna 'tipo' para 'message_type' se existir
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'whatsapp_mensagens' AND column_name = 'tipo') THEN
        ALTER TABLE whatsapp_mensagens RENAME COLUMN tipo TO message_type;
    END IF;
END $$;

-- 4. Adicionar coluna 'media_type' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'whatsapp_mensagens' AND column_name = 'media_type') THEN
        ALTER TABLE whatsapp_mensagens ADD COLUMN media_type VARCHAR(50);
    END IF;
END $$;

-- 5. Tornar atendimento_id nullable (já que não temos mais a tabela de referência)
ALTER TABLE whatsapp_mensagens 
ALTER COLUMN atendimento_id DROP NOT NULL;

-- 6. Adicionar comentários para documentação
COMMENT ON COLUMN whatsapp_mensagens.message_type IS 'Tipo da mensagem: text, image, video, audio, document, etc.';
COMMENT ON COLUMN whatsapp_mensagens.media_type IS 'Tipo de mídia específico para arquivos';
COMMENT ON COLUMN whatsapp_mensagens.atendimento_id IS 'ID do atendimento (pode ser null)';

-- 7. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'whatsapp_mensagens' 
ORDER BY ordinal_position;
