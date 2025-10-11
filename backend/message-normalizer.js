// backend/message-normalizer.js
function unwrapMessageLayer(m) {
  if (!m) return {};
  if (m.ephemeralMessage?.message) m = m.ephemeralMessage.message;
  if (m.viewOnceMessageV2?.message) m = m.viewOnceMessageV2.message;
  if (m.viewOnceMessage?.message) m = m.viewOnceMessage.message;
  if (m.documentWithCaptionMessage?.message) m = m.documentWithCaptionMessage.message;
  return m ?? {};
}
function getContentType(m) {
  if (m.conversation) return 'conversation';
  if (m.extendedTextMessage) return 'extendedTextMessage';
  if (m.imageMessage) return 'imageMessage';
  if (m.videoMessage) return 'videoMessage';
  if (m.audioMessage) return 'audioMessage';
  if (m.stickerMessage) return 'stickerMessage';
  if (m.documentMessage) return 'documentMessage';
  if (m.locationMessage) return 'locationMessage';
  if (m.buttonsResponseMessage) return 'buttonsResponseMessage';
  if (m.listResponseMessage) return 'listResponseMessage';
  if (m.templateButtonReplyMessage) return 'templateButtonReplyMessage';
  if (m.protocolMessage) return 'protocolMessage';
  if (m.messageContextInfo) return 'messageContextInfo';
  return null;
}
function resolveWaContent(msg) {
  let m = unwrapMessageLayer(msg.message);
  const rawType = getContentType(m) || null;

  if (m.conversation) return { kind: 'TEXT', text: m.conversation };
  if (m.extendedTextMessage?.text) return { kind: 'TEXT', text: m.extendedTextMessage.text };

  if (m.imageMessage) {
    const img = m.imageMessage;
    return { 
      kind: 'IMAGE', 
      caption: img.caption ?? null, 
      mimetype: img.mimetype ?? 'image/jpeg', 
      url: img.url ?? null, 
      mediaKey: img.mediaKey ?? null,
      fileLength: img.fileLength ?? null,
      fileSha256: img.fileSha256 ?? null,
      directPath: img.directPath ?? null
    };
  }
  if (m.videoMessage) {
    const vid = m.videoMessage;
    return { 
      kind: 'VIDEO', 
      caption: vid.caption ?? null, 
      mimetype: vid.mimetype ?? 'video/mp4', 
      url: vid.url ?? null, 
      mediaKey: vid.mediaKey ?? null,
      fileLength: vid.fileLength ?? null,
      fileSha256: vid.fileSha256 ?? null,
      directPath: vid.directPath ?? null,
      seconds: Number(vid.seconds ?? 0)
    };
  }
  if (m.audioMessage) {
    const aud = m.audioMessage;
    return { 
      kind: 'AUDIO', 
      seconds: Number(aud.seconds ?? 0), 
      mimetype: aud.mimetype ?? 'audio/ogg', 
      ptt: !!aud.ptt, 
      url: aud.url ?? null, 
      mediaKey: aud.mediaKey ?? null,
      fileLength: aud.fileLength ?? null,
      fileSha256: aud.fileSha256 ?? null,
      directPath: aud.directPath ?? null
    };
  }
  if (m.stickerMessage) {
    const stk = m.stickerMessage;
    return { 
      kind: 'STICKER', 
      mimetype: stk.mimetype ?? 'image/webp', 
      url: stk.url ?? null, 
      mediaKey: stk.mediaKey ?? null,
      fileLength: stk.fileLength ?? null,
      fileSha256: stk.fileSha256 ?? null,
      directPath: stk.directPath ?? null
    };
  }
  if (m.documentMessage) {
    const doc = m.documentMessage;
    return { 
      kind: 'FILE', 
      fileName: doc.fileName ?? 'documento', 
      mimetype: doc.mimetype ?? 'application/octet-stream', 
      url: doc.url ?? null, 
      mediaKey: doc.mediaKey ?? null,
      fileLength: doc.fileLength ?? null,
      fileSha256: doc.fileSha256 ?? null,
      directPath: doc.directPath ?? null
    };
  }

  if (m.locationMessage) {
    return { kind: 'LOCATION', lat: Number(m.locationMessage.degreesLatitude), lng: Number(m.locationMessage.degreesLongitude), name: m.locationMessage.name ?? null };
  }
  if (m.buttonsResponseMessage)  return { kind:'BUTTON_REPLY',  id: m.buttonsResponseMessage.selectedButtonId ?? null, text: m.buttonsResponseMessage.selectedDisplayText ?? null };
  if (m.listResponseMessage)     return { kind:'LIST_REPLY',    id: m.listResponseMessage.singleSelect?.selectedRowId ?? null, text: m.listResponseMessage.title ?? null };
  if (m.templateButtonReplyMessage) {
    const t = m.templateButtonReplyMessage;
    return { kind:'TEMPLATE_REPLY', id: t.selectedId ?? null, text: t.selectedDisplayText ?? null };
  }
  
  // Suporte para novos tipos de mensagem
  if (m.reactionMessage) {
    return { kind: 'REACTION', text: m.reactionMessage.text || '👍', targetMessageId: m.reactionMessage.targetMessageKey?.id };
  }
  if (m.contactMessage) {
    return { kind: 'CONTACT', text: `Contato: ${m.contactMessage.displayName || 'Contato compartilhado'}` };
  }
  if (m.contactsArrayMessage) {
    return { kind: 'CONTACTS', text: `Contatos: ${m.contactsArrayMessage.contacts?.length || 0} contatos compartilhados` };
  }
  if (m.groupInviteMessage) {
    return { kind: 'GROUP_INVITE', text: `Convite para grupo: ${m.groupInviteMessage.groupName || 'Grupo'}` };
  }
  if (m.liveLocationMessage) {
    return { kind: 'LIVE_LOCATION', text: 'Localização em tempo real compartilhada' };
  }
  if (m.pollCreationMessage) {
    return { kind: 'POLL', text: `Enquete: ${m.pollCreationMessage.name || 'Enquete'}` };
  }
  if (m.pollUpdateMessage) {
    return { kind: 'POLL_UPDATE', text: 'Atualização de enquete' };
  }
  if (m.requestPhoneNumberMessage) {
    return { kind: 'REQUEST_PHONE', text: 'Solicitação de número de telefone' };
  }
  if (m.requestPaymentMessage) {
    return { kind: 'REQUEST_PAYMENT', text: 'Solicitação de pagamento' };
  }
  if (m.sendPaymentMessage) {
    return { kind: 'SEND_PAYMENT', text: 'Pagamento enviado' };
  }
  if (m.senderKeyDistributionMessage) {
    return { kind: 'SECURITY', text: 'Mensagem de segurança' };
  }
  if (m.statusMessage) {
    return { kind: 'STATUS', text: 'Status atualizado' };
  }
  if (m.templateMessage) {
    // Template messages (botões, templates do WhatsApp Business)
    const template = m.templateMessage;
    if (template.hydratedTemplate) {
      const hydrated = template.hydratedTemplate;
      if (hydrated.hydratedContentText) {
        return { kind: 'TEMPLATE', text: hydrated.hydratedContentText };
      }
      if (hydrated.hydratedTitleText) {
        return { kind: 'TEMPLATE', text: hydrated.hydratedTitleText };
      }
    }
    return { kind: 'TEMPLATE', text: '[Mensagem de template]' };
  }
  if (m.listMessage) {
    return { kind: 'LIST', text: `Lista: ${m.listMessage.description || 'Lista de opções'}` };
  }
  if (m.listResponseMessage) {
    return { kind: 'LIST_RESPONSE', text: `Seleção: ${m.listResponseMessage.singleSelectReply?.selectedRowId || 'Opção selecionada'}` };
  }
  
  // Tratar mensagens de protocolo
  if (m.protocolMessage) {
    return { kind: 'PROTOCOL', text: '[Mensagem de protocolo]' };
  }
  
  // Tratar mensagens de contexto
  if (m.messageContextInfo) {
    return { kind: 'CONTEXT', text: '[Informação de contexto]' };
  }
  
  // Log para debug de tipos não suportados
  console.log('🔍 Tipo de mensagem não suportado:', rawType, 'Estrutura:', Object.keys(m));
  
  return { kind: 'UNKNOWN', rawType, debug: Object.keys(m) };
}

function mapToDbRow(msg, chat_id, connection_id, owner_id) {
  const from_me   = !!msg.key?.fromMe;
  const wa_ts_iso = new Date(Number(msg.messageTimestamp || 0) * 1000).toISOString();
  const c         = resolveWaContent(msg);
  
  console.log('🔍 [MESSAGE-NORMALIZER] Processando mensagem:', {
    from_me,
    chat_id: msg.key?.remoteJid,
    content_kind: c.kind,
    content_text: c.text?.substring(0, 50),
    timestamp: wa_ts_iso
  });

  const row = {
    owner_id,
    // atendimento_id: (set later by server)
    chat_id: msg.key?.remoteJid || chat_id || null,
    conteudo: '',
    message_type: 'TEXTO',
    media_type: null,
    remetente: from_me ? 'ATENDENTE' : 'CLIENTE',
    timestamp: wa_ts_iso,
    lida: false,

    message_id: msg.key?.id ?? null,
    media_url: null,
    media_mime: null,
    duration_ms: null,
    wpp_name: null, // Será preenchido pelo servidor
    group_contact_name: null, // Será preenchido pelo servidor

    // <- raw must be an object for jsonb
    raw: {
      key: { remoteJid: msg.key?.remoteJid, id: msg.key?.id, fromMe: from_me },
      messageTimestamp: msg.messageTimestamp,
      message: msg.message ?? null
    }
  };

  switch (c.kind) {
    case 'TEXT':         
      row.message_type = 'TEXTO';         
      row.conteudo = c.text || ''; 
      console.log('✅ [MESSAGE-NORMALIZER] Mensagem de texto processada:', row.conteudo?.substring(0, 50));
      break;
    case 'IMAGE':        
      row.message_type = 'IMAGEM';        
      row.conteudo = c.caption || '[Imagem]'; 
      row.media_type = c.mimetype || 'image/jpeg';
      row.media_mime = c.mimetype || 'image/jpeg';
      row.media_url = c.url || null; // URL direta da imagem
      break;
    case 'VIDEO':        
      row.message_type = 'VIDEO';         
      row.conteudo = c.caption || '[Vídeo]'; 
      row.media_type = c.mimetype || 'video/mp4';
      row.media_mime = c.mimetype || 'video/mp4';
      row.media_url = c.url || null; // URL direta do vídeo
      break;
    case 'AUDIO':        
      row.message_type = 'AUDIO';         
      row.conteudo = '[Áudio]'; 
      row.media_type = c.mimetype || 'audio/ogg';
      row.media_mime = c.mimetype || 'audio/ogg';
      row.duration_ms = Math.round((c.seconds ?? 0) * 1000);
      row.media_url = c.url || null; // URL direta do áudio
      break;
    case 'STICKER':      
      row.message_type = 'STICKER';       
      row.conteudo = '[Sticker]'; 
      row.media_type = c.mimetype || 'image/webp';
      row.media_mime = c.mimetype || 'image/webp';
      row.media_url = c.url || null; // URL direta do sticker
      break;
    case 'FILE':         
      row.message_type = 'ARQUIVO';       
      row.conteudo = c.fileName || '[Arquivo]'; 
      row.media_type = c.mimetype || 'application/octet-stream';
      row.media_mime = c.mimetype || 'application/octet-stream';
      row.media_url = c.url || null; // URL direta do arquivo
      break;
    case 'LOCATION':     
      row.message_type = 'LOCALIZACAO';   
      row.conteudo = c.name ? `${c.name} (${c.lat}, ${c.lng})` : `Localização: ${c.lat}, ${c.lng}`; 
      break;
    case 'BUTTON_REPLY': 
      row.message_type = 'RESPOSTA_BOTAO';
      row.conteudo = c.text || c.id || '[Resposta de Botão]'; 
      break;
    case 'LIST_REPLY':   
      row.message_type = 'RESPOSTA_LISTA';
      row.conteudo = c.text || c.id || '[Resposta de Lista]'; 
      break;
    case 'TEMPLATE_REPLY': 
      row.message_type = 'RESPOSTA_TEMPLATE'; 
      row.conteudo = c.text || c.id || '[Resposta de Template]'; 
      break;
    case 'REACTION':
      row.message_type = 'REACAO';
      row.conteudo = c.text || '👍';
      break;
    case 'CONTACT':
      row.message_type = 'CONTATO';
      row.conteudo = c.text || '[Contato compartilhado]';
      break;
    case 'CONTACTS':
      row.message_type = 'CONTATOS';
      row.conteudo = c.text || '[Contatos compartilhados]';
      break;
    case 'GROUP_INVITE':
      row.message_type = 'CONVITE_GRUPO';
      row.conteudo = c.text || '[Convite para grupo]';
      break;
    case 'LIVE_LOCATION':
      row.message_type = 'LOCALIZACAO_TEMPO_REAL';
      row.conteudo = c.text || '[Localização em tempo real]';
      break;
    case 'POLL':
      row.message_type = 'ENQUETE';
      row.conteudo = c.text || '[Enquete]';
      break;
    case 'POLL_UPDATE':
      row.message_type = 'ATUALIZACAO_ENQUETE';
      row.conteudo = c.text || '[Atualização de enquete]';
      break;
    case 'REQUEST_PHONE':
      row.message_type = 'SOLICITACAO_TELEFONE';
      row.conteudo = c.text || '[Solicitação de telefone]';
      break;
    case 'REQUEST_PAYMENT':
      row.message_type = 'SOLICITACAO_PAGAMENTO';
      row.conteudo = c.text || '[Solicitação de pagamento]';
      break;
    case 'SEND_PAYMENT':
      row.message_type = 'PAGAMENTO_ENVIADO';
      row.conteudo = c.text || '[Pagamento enviado]';
      break;
    case 'SECURITY':
      row.message_type = 'SEGURANCA';
      row.conteudo = c.text || '[Mensagem de segurança]';
      break;
    case 'STATUS':
      row.message_type = 'STATUS';
      row.conteudo = c.text || '[Status atualizado]';
      break;
    case 'TEMPLATE':
      row.message_type = 'TEMPLATE';
      row.conteudo = c.text || '[Mensagem de template]';
      break;
    case 'LIST':
      row.message_type = 'LISTA';
      row.conteudo = c.text || '[Lista de opções]';
      break;
    case 'LIST_RESPONSE':
      row.message_type = 'RESPOSTA_LISTA';
      row.conteudo = c.text || '[Seleção da lista]';
      break;
    case 'PROTOCOL':
      row.message_type = 'PROTOCOLO';
      row.conteudo = c.text || '[Mensagem de protocolo]';
      break;
    case 'CONTEXT':
      row.message_type = 'CONTEXTO';
      row.conteudo = c.text || '[Informação de contexto]';
      break;
    default:             
      row.message_type = 'DESCONHECIDO';  
      row.conteudo = c.debug && c.rawType ? `[Tipo não suportado: ${c.rawType}]` : '[Mensagem não suportada]';
      // Silent: Tipo não suportado
  }

  return row;
}

module.exports = { resolveWaContent, mapToDbRow };
