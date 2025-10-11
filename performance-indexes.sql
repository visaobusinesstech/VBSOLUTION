-- Performance indexes for WhatsApp messages pagination
-- Run these in your Supabase SQL editor

-- Composite index to speed WHERE owner_id & chat_id + ORDER BY timestamp
CREATE INDEX IF NOT EXISTS idx_msgs_owner_chat_ts
ON whatsapp_mensagens(owner_id, chat_id, timestamp DESC);

-- Additional index for id ranges if needed
CREATE INDEX IF NOT EXISTS idx_msgs_owner_chat_id
ON whatsapp_mensagens(owner_id, chat_id, id);

-- Index for unread messages filtering
CREATE INDEX IF NOT EXISTS idx_msgs_unread
ON whatsapp_mensagens(owner_id, chat_id, lida, timestamp DESC);

-- Index for message type filtering
CREATE INDEX IF NOT EXISTS idx_msgs_type
ON whatsapp_mensagens(owner_id, chat_id, message_type, timestamp DESC);
