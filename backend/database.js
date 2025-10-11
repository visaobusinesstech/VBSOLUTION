const Database = require('better-sqlite3');
const path = require('path');

// Caminho para o arquivo do banco de dados
const dbPath = path.join(__dirname, 'whatsapp.db');

// Criar conexão com o banco
const db = new Database(dbPath);

// Habilitar WAL mode para melhor performance
db.pragma('journal_mode = WAL');

// Criar tabelas se não existirem
const initDatabase = () => {
  console.log('🗄️ Inicializando banco de dados...');

  // Tabela de conversas
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      connection_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      jid TEXT NOT NULL,
      unread INTEGER DEFAULT 0,
      last_message_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de mensagens
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      conversation_id TEXT NOT NULL,
      wa_msg_id TEXT UNIQUE,
      jid TEXT NOT NULL,
      direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
      type TEXT NOT NULL,
      body TEXT,
      media_url TEXT,
      media_mimetype TEXT,
      caption TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed'))
    )
  `);

  // Índices para performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_conversations_tenant_connection 
    ON conversations(tenant_id, connection_id)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_conversations_contact 
    ON conversations(contact_id)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_conversations_updated 
    ON conversations(updated_at)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
    ON messages(conversation_id, created_at)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_jid_created 
    ON messages(jid, created_at)
  `);

  console.log('✅ Banco de dados inicializado com sucesso');
};

// Função para criar/obter conversa
const upsertConversation = (tenantId, connectionId, jid, contactId) => {
  const conversationId = `${connectionId}_${jid}`;
  
  // Tentar encontrar conversa existente
  let conversation = db.prepare(`
    SELECT * FROM conversations 
    WHERE tenant_id = ? AND connection_id = ? AND jid = ?
  `).get(tenantId, connectionId, jid);

  if (!conversation) {
    // Criar nova conversa
    db.prepare(`
      INSERT INTO conversations (id, tenant_id, connection_id, contact_id, jid, unread, last_message_at)
      VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `).run(conversationId, tenantId, connectionId, contactId, jid);
    
    conversation = { id: conversationId };
    console.log(`📝 Nova conversa criada: ${conversationId}`);
  }

  return conversation;
};

// Função para salvar mensagem
const saveMessage = (messageData) => {
  const stmt = db.prepare(`
    INSERT INTO messages (
      id, tenant_id, conversation_id, wa_msg_id, jid, direction, type, 
      body, media_url, media_mimetype, caption, created_at, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    messageData.id,
    messageData.tenantId,
    messageData.conversationId,
    messageData.waMsgId,
    messageData.jid,
    messageData.direction,
    messageData.type,
    messageData.body,
    messageData.mediaUrl,
    messageData.mediaMimetype,
    messageData.caption,
    messageData.createdAt,
    messageData.status
  );

  console.log(`💾 Mensagem salva no banco: ${messageData.id}`);
};

// Função para atualizar conversa
const updateConversation = (conversationId, lastMessageAt, incrementUnread = 0) => {
  db.prepare(`
    UPDATE conversations 
    SET last_message_at = ?, unread = unread + ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(lastMessageAt, incrementUnread, conversationId);
};

// Função para buscar mensagens paginadas
const getMessages = (conversationId, cursor, limit = 20) => {
  let query = `
    SELECT * FROM messages 
    WHERE conversation_id = ?
  `;
  
  const params = [conversationId];
  
  if (cursor) {
    query += ` AND created_at < ?`;
    params.push(cursor);
  }
  
  query += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(limit);
  
  const messages = db.prepare(query).all(...params);
  
  // Determinar se há mais mensagens
  const hasMore = messages.length === limit;
  const nextCursor = hasMore && messages.length > 0 
    ? messages[messages.length - 1].created_at 
    : null;
  
  // Retornar em ordem crescente (mais antigas primeiro)
  return {
    items: messages.reverse(),
    nextCursor
  };
};

// Função para buscar conversas
const getConversations = (connectionId, limit = 30) => {
  const conversations = db.prepare(`
    SELECT 
      c.*,
      (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.direction = 'in' AND m.status != 'read') as unread_count,
      (SELECT m.body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
      (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_at
    FROM conversations c
    WHERE c.connection_id = ?
    ORDER BY c.updated_at DESC
    LIMIT ?
  `).all(connectionId, limit);

  return conversations.map(conv => ({
    id: conv.id,
    contact: {
      id: conv.contact_id,
      jid: conv.jid,
      name: conv.contact_id
    },
    lastMessage: {
      preview: conv.last_message || '',
      createdAt: conv.last_message_at
    },
    unread: conv.unread_count || 0
  }));
};

// Função para marcar mensagens como lidas
const markMessagesAsRead = (conversationId, messageIds) => {
  if (messageIds.length === 0) return;
  
  const placeholders = messageIds.map(() => '?').join(',');
  db.prepare(`
    UPDATE messages 
    SET status = 'read' 
    WHERE conversation_id = ? AND id IN (${placeholders})
  `).run(conversationId, ...messageIds);
  
  // Atualizar contador de não lidas
  db.prepare(`
    UPDATE conversations 
    SET unread = 0, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(conversationId);
};

// Função para atualizar status de mensagem
const updateMessageStatus = (waMsgId, status) => {
  db.prepare(`
    UPDATE messages 
    SET status = ? 
    WHERE wa_msg_id = ?
  `).run(status, waMsgId);
};

// Inicializar banco
initDatabase();

module.exports = {
  db,
  upsertConversation,
  saveMessage,
  updateConversation,
  getMessages,
  getConversations,
  markMessagesAsRead,
  updateMessageStatus
};
