-- Atualizar valores de status na tabela whatsapp_mensagens
-- Status deve ser: AGUARDANDO ou ATENDENDO

-- Primeiro, atualizar registros existentes que tenham status incorreto
UPDATE whatsapp_mensagens 
SET status = 'AGUARDANDO' 
WHERE status NOT IN ('AGUARDANDO', 'ATENDENDO');

-- Adicionar constraint para garantir apenas valores válidos
ALTER TABLE whatsapp_mensagens 
ADD CONSTRAINT check_status_values 
CHECK (status IN ('AGUARDANDO', 'ATENDENDO'));

-- Verificar se a atualização funcionou
SELECT status, COUNT(*) as quantidade 
FROM whatsapp_mensagens 
GROUP BY status;
