-- Atualizar constraint de status para incluir os três valores corretos
-- Status: AGUARDANDO, ATENDIDO, AI

-- Remover constraint antiga se existir
ALTER TABLE whatsapp_mensagens DROP CONSTRAINT IF EXISTS check_status_values;

-- Adicionar nova constraint com os três valores
ALTER TABLE whatsapp_mensagens 
ADD CONSTRAINT check_status_values 
CHECK (status IN ('AGUARDANDO', 'ATENDIDO', 'AI'));

-- Atualizar registros existentes para usar os valores corretos
UPDATE whatsapp_mensagens 
SET status = 'AGUARDANDO' 
WHERE status NOT IN ('AGUARDANDO', 'ATENDIDO', 'AI');

-- Verificar se a atualização funcionou
SELECT status, COUNT(*) as quantidade 
FROM whatsapp_mensagens 
GROUP BY status;
