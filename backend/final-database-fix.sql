-- Execute este script no Supabase SQL Editor para corrigir a estrutura final

-- 1. Deletar tabela whatsapp_atendimentos
DROP TABLE IF EXISTS whatsapp_atendimentos;

-- 2. Remover foreign key constraint
ALTER TABLE whatsapp_mensagens 
DROP CONSTRAINT IF EXISTS whatsapp_mensagens_atendimento_id_fkey;

-- 3. Tornar atendimento_id nullable (isso é o mais importante)
ALTER TABLE whatsapp_mensagens 
ALTER COLUMN atendimento_id DROP NOT NULL;

-- 4. Verificar se a coluna tipo ainda existe e renomear para message_type
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'whatsapp_mensagens' AND column_name = 'tipo') THEN
        ALTER TABLE whatsapp_mensagens RENAME COLUMN tipo TO message_type;
    END IF;
END $$;

-- 5. Verificar se a coluna media_type existe, se não, adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'whatsapp_mensagens' AND column_name = 'media_type') THEN
        ALTER TABLE whatsapp_mensagens ADD COLUMN media_type VARCHAR(50);
    END IF;
END $$;

-- 6. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'whatsapp_mensagens' 
ORDER BY ordinal_position;
