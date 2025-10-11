-- Corrigir tipo da coluna atendimento_id de UUID para TEXT
-- Isso permitirá inserir strings como "atendimento_559285880257"

-- Primeiro, remover a foreign key constraint se existir
ALTER TABLE whatsapp_mensagens DROP CONSTRAINT IF EXISTS whatsapp_mensagens_atendimento_id_fkey;

-- Alterar o tipo da coluna de UUID para TEXT
ALTER TABLE whatsapp_mensagens ALTER COLUMN atendimento_id TYPE TEXT;

-- Verificar se a alteração funcionou
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'whatsapp_mensagens' 
AND column_name = 'atendimento_id';
