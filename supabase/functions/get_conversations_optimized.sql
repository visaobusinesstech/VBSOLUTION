-- =====================================================
-- OPTIMIZED: Função SQL para buscar conversas com paginação
-- =====================================================
-- Execute esta função no SQL Editor do Supabase para otimizar as consultas de conversas

CREATE OR REPLACE FUNCTION get_conversations_optimized(
  p_owner_id UUID,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  chat_id TEXT,
  phone TEXT,
  wpp_name TEXT,
  connection_id TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  last_remetente TEXT,
  last_tipo TEXT,
  last_lida BOOLEAN,
  unread_count BIGINT,
  total_messages BIGINT,
  status TEXT,
  owner_id UUID
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_messages AS (
    -- Buscar mensagens ordenadas por timestamp descendente
    SELECT 
      m.chat_id,
      m.phone,
      m.wpp_name,
      m.connection_id,
      m.conteudo AS last_message,
      m.timestamp AS last_message_at,
      m.remetente AS last_remetente,
      m.message_type AS last_tipo,
      m.lida AS last_lida,
      m.status,
      m.owner_id,
      ROW_NUMBER() OVER (PARTITION BY m.chat_id ORDER BY m.timestamp DESC) as rn
    FROM whatsapp_mensagens m
    WHERE m.owner_id = p_owner_id
  ),
  conversation_stats AS (
    -- Calcular estatísticas por conversa
    SELECT 
      m.chat_id,
      COUNT(*) as total_messages,
      COUNT(*) FILTER (WHERE m.remetente = 'CLIENTE' AND m.lida = false) as unread_count
    FROM whatsapp_mensagens m
    WHERE m.owner_id = p_owner_id
    GROUP BY m.chat_id
  ),
  latest_conversations AS (
    -- Pegar apenas a última mensagem de cada conversa
    SELECT 
      rm.chat_id,
      rm.phone,
      rm.wpp_name,
      rm.connection_id,
      rm.last_message,
      rm.last_message_at,
      rm.last_remetente,
      rm.last_tipo,
      rm.last_lida,
      rm.status,
      rm.owner_id,
      COALESCE(cs.unread_count, 0) as unread_count,
      COALESCE(cs.total_messages, 0) as total_messages
    FROM ranked_messages rm
    LEFT JOIN conversation_stats cs ON cs.chat_id = rm.chat_id
    WHERE rm.rn = 1
  )
  SELECT 
    lc.chat_id,
    lc.phone,
    lc.wpp_name,
    lc.connection_id,
    lc.last_message,
    lc.last_message_at,
    lc.last_remetente,
    lc.last_tipo,
    lc.last_lida,
    lc.unread_count,
    lc.total_messages,
    lc.status,
    lc.owner_id
  FROM latest_conversations lc
  ORDER BY lc.last_message_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- OPTIMIZED: Função para buscar mensagens de uma conversa
-- =====================================================

CREATE OR REPLACE FUNCTION get_conversation_messages_optimized(
  p_owner_id UUID,
  p_chat_id TEXT,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id TEXT,
  message_id TEXT,
  chat_id TEXT,
  phone TEXT,
  conteudo TEXT,
  message_type TEXT,
  media_url TEXT,
  media_mime TEXT,
  remetente TEXT,
  status TEXT,
  lida BOOLEAN,
  timestamp TIMESTAMPTZ,
  owner_id UUID,
  connection_id TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.message_id,
    m.chat_id,
    m.phone,
    m.conteudo,
    m.message_type,
    m.media_url,
    m.media_mime,
    m.remetente,
    m.status,
    m.lida,
    m.timestamp,
    m.owner_id,
    m.connection_id
  FROM whatsapp_mensagens m
  WHERE m.owner_id = p_owner_id 
    AND m.chat_id = p_chat_id
  ORDER BY m.timestamp ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- OPTIMIZED: Função para atualizar status de leitura
-- =====================================================

CREATE OR REPLACE FUNCTION mark_conversation_messages_read(
  p_owner_id UUID,
  p_chat_id TEXT
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE whatsapp_mensagens 
  SET lida = true, 
      updated_at = NOW()
  WHERE owner_id = p_owner_id 
    AND chat_id = p_chat_id 
    AND remetente = 'CLIENTE'
    AND lida = false;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- OPTIMIZED: Índices para melhorar performance
-- =====================================================

-- Índice composto para consultas de conversas
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_conversations 
ON whatsapp_mensagens (owner_id, chat_id, timestamp DESC);

-- Índice para consultas de mensagens não lidas
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_unread 
ON whatsapp_mensagens (owner_id, chat_id, remetente, lida) 
WHERE lida = false AND remetente = 'CLIENTE';

-- Índice para consultas por timestamp
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_timestamp 
ON whatsapp_mensagens (timestamp DESC);

-- =====================================================
-- OPTIMIZED: Trigger para atualizar estatísticas automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Invalidação de cache pode ser implementada aqui se necessário
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar estatísticas quando mensagens são inseridas/atualizadas
DROP TRIGGER IF EXISTS trigger_update_conversation_stats ON whatsapp_mensagens;
CREATE TRIGGER trigger_update_conversation_stats
  AFTER INSERT OR UPDATE OR DELETE ON whatsapp_mensagens
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_stats();

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================
-- 
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Use as funções da seguinte forma:
-- 
-- -- Buscar conversas paginadas:
-- SELECT * FROM get_conversations_optimized('seu-uuid-aqui', 20, 0);
-- 
-- -- Buscar mensagens de uma conversa:
-- SELECT * FROM get_conversation_messages_optimized('seu-uuid-aqui', 'chat-id-aqui', 50, 0);
-- 
-- -- Marcar conversa como lida:
-- SELECT mark_conversation_messages_read('seu-uuid-aqui', 'chat-id-aqui');
-- 
-- =====================================================
