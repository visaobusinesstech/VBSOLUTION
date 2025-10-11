/**
 * Observer Logger - Apenas para modo de observação
 * Logs eventos do WhatsApp quando FEATURE_WHATSAPP_STRICT_OBSERVE=true
 */

export function logEvent(eventName: string, payload: any) {
  if (process.env.FEATURE_WHATSAPP_STRICT_OBSERVE === 'true') {
    const timestamp = new Date().toISOString();
    console.log(JSON.stringify({
      timestamp,
      event: eventName,
      ...payload
    }));
  }
}

export function logInboundMessage(messageId: string, chatId: string, tipo: string, remetente: string, timestamp: string) {
  logEvent('wapp_inbound_message', {
    message_id: messageId,
    chat_id: chatId,
    tipo,
    remetente,
    timestamp
  });
}

export function logOutboundMessage(messageId: string, chatId: string, tipo: string, remetente: string, timestamp: string) {
  logEvent('wapp_outbound_message', {
    message_id: messageId,
    chat_id: chatId,
    tipo,
    remetente,
    timestamp
  });
}

export function logDbPersistOk(table: string, rowId: string, timestamp: string) {
  logEvent('wapp_db_persist_ok', {
    table,
    row_id: rowId,
    timestamp
  });
}

export function logSessionStatus(sessionName: string, status: 'CONNECTED' | 'DISCONNECTED', timestamp: string) {
  logEvent('wapp_session_status', {
    session_name: sessionName,
    status,
    timestamp
  });
}
