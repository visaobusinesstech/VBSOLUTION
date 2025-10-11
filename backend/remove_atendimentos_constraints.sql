-- Remover constraints e migrar dados de whatsapp_atendimentos para whatsapp_mensagens

-- 1. Remover foreign key constraint
ALTER TABLE whatsapp_mensagens DROP CONSTRAINT IF EXISTS whatsapp_mensagens_atendimento_id_fkey;

-- 2. Atualizar status na tabela whatsapp_mensagens baseado nos atendimentos existentes
UPDATE whatsapp_mensagens 
SET status = wa.status
FROM whatsapp_atendimentos wa
WHERE whatsapp_mensagens.atendimento_id = wa.id;

-- 3. Inserir mensagens para atendimentos que não têm mensagens
INSERT INTO whatsapp_mensagens (
    id,
    owner_id,
    atendimento_id,
    chat_id,
    message_id,
    conteudo,
    tipo,
    status,
    remetente,
    timestamp,
    lida,
    media_url,
    media_mime,
    duration_ms,
    raw,
    created_at
)
SELECT 
    gen_random_uuid() as id,
    wa.owner_id,
    wa.id as atendimento_id,
    wa.chat_id,
    NULL as message_id,
    COALESCE(wa.ultima_mensagem, 'Mensagem de atendimento') as conteudo,
    'TEXTO' as tipo,
    wa.status,
    'ATENDENTE' as remetente,
    COALESCE(wa.ultima_mensagem, wa.data_inicio) as timestamp,
    false as lida,
    NULL as media_url,
    NULL as media_mime,
    NULL as duration_ms,
    NULL as raw,
    wa.created_at
FROM whatsapp_atendimentos wa
WHERE wa.id NOT IN (
    SELECT DISTINCT atendimento_id 
    FROM whatsapp_mensagens 
    WHERE atendimento_id IS NOT NULL
);

-- 4. Deletar a tabela whatsapp_atendimentos
DROP TABLE IF EXISTS whatsapp_atendimentos CASCADE;

-- 5. Deletar a tabela whatsapp_configuracoes se existir
DROP TABLE IF EXISTS whatsapp_configuracoes CASCADE;
