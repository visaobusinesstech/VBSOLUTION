-- Script para migrar dados de whatsapp_atendimentos para whatsapp_mensagens
-- e deletar a tabela whatsapp_atendimentos

BEGIN;

-- 1. Primeiro, vamos atualizar a coluna status na tabela whatsapp_mensagens
-- com base nos dados de whatsapp_atendimentos
UPDATE whatsapp_mensagens 
SET status = wa.status
FROM whatsapp_atendimentos wa
WHERE whatsapp_mensagens.atendimento_id = wa.id;

-- 2. Se houver mensagens sem atendimento_id, vamos criar registros baseados nos atendimentos
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

-- 3. Agora vamos deletar a tabela whatsapp_atendimentos
DROP TABLE IF EXISTS whatsapp_atendimentos CASCADE;

-- 4. Vamos também deletar a tabela whatsapp_configuracoes se existir
DROP TABLE IF EXISTS whatsapp_configuracoes CASCADE;

COMMIT;

-- Verificar se a migração foi bem-sucedida
SELECT 
    'whatsapp_mensagens' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN status IS NOT NULL THEN 1 END) as com_status
FROM whatsapp_mensagens
UNION ALL
SELECT 
    'whatsapp_sessions' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN status IS NOT NULL THEN 1 END) as com_status
FROM whatsapp_sessions;
