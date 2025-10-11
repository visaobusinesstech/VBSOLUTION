-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  cid TEXT, -- clientMessageId para reconciliação
  instance_id TEXT NOT NULL,
  jid TEXT NOT NULL,
  from_me BOOLEAN NOT NULL DEFAULT false,
  type TEXT NOT NULL CHECK (type IN ('text', 'image', 'audio', 'document', 'video', 'sticker', 'system')),
  text TEXT,
  media_url TEXT,
  timestamp BIGINT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de chats
CREATE TABLE IF NOT EXISTS chats (
  instance_id TEXT NOT NULL,
  jid TEXT NOT NULL,
  name TEXT,
  last_message_at BIGINT,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (instance_id, jid)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_messages_instance_jid ON messages(instance_id, jid);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_cid ON messages(cid);
CREATE INDEX IF NOT EXISTS idx_chats_instance ON chats(instance_id);
CREATE INDEX IF NOT EXISTS idx_chats_last_message ON chats(last_message_at DESC);

-- RLS (Row Level Security)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança (ajustar conforme necessário)
CREATE POLICY "Allow all operations on messages" ON messages FOR ALL USING (true);
CREATE POLICY "Allow all operations on chats" ON chats FOR ALL USING (true);
