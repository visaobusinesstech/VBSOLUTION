-- Índices recomendados para otimizar performance das consultas WhatsApp
-- Execute estes comandos no Supabase SQL Editor

-- Índice principal para conversas por owner + connection + chat + timestamp
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_conn_chat_ts
ON whatsapp_mensagens (owner_id, connection_id, chat_id, timestamp DESC);

-- Índice de fallback por connection_phone quando connection_id não bate
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_connphone_chat_ts
ON whatsapp_mensagens (owner_id, connection_phone, chat_id, timestamp DESC);

-- Índice adicional para consultas por chat_id apenas
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_chat_ts
ON whatsapp_mensagens (chat_id, timestamp ASC);

-- Índice para consultas por status (AGUARDANDO, ATENDIDO, AI)
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_status
ON whatsapp_mensagens (status, timestamp DESC);

-- Índice para consultas por remetente
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_remetente
ON whatsapp_mensagens (remetente, timestamp DESC);

-- Índice para consultas por lida/não lida
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_lida
ON whatsapp_mensagens (lida, timestamp DESC);
