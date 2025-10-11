export type IncomingMessage = {
  type?: string;          // 'text', 'image', 'video', 'audio', 'document', 'sticker', ...
  text?: string | null;   // legenda/caption
  caption?: string | null;
  mimetype?: string | null;
  fileName?: string | null;
  message_type?: string;  // Alternative field name
  conteudo?: string | null; // Content field
  // ...outros campos que você já tem
};

export function buildMessagePreview(m: IncomingMessage): string {
  // Use message_type if available, otherwise type
  const messageType = m.message_type || m.type;
  const caption = (m.caption || m.text || m.conteudo || '').trim();
  
  switch (messageType) {
    case 'image':
    case 'IMAGEM':
      return caption ? `📷 ${caption}` : '📷 Foto';
    case 'video':
    case 'VIDEO':
      return caption ? `🎬 ${caption}` : '🎬 Vídeo';
    case 'audio':
    case 'AUDIO':
      return '🎧 Áudio';
    case 'ptt':
    case 'PTT':
      return '🎤 Mensagem de voz';
    case 'document':
    case 'DOCUMENTO':
      return m.fileName ? `📄 ${m.fileName}` : '📄 Documento';
    case 'sticker':
    case 'FIGURINHA':
      return '🖼️ Figurinha';
    case 'contact':
    case 'CONTATO':
      return '👤 Contato';
    case 'location':
    case 'LOCALIZACAO':
      return '📍 Localização';
    case 'reaction':
    case 'REACAO':
      return '👍 Reação';
    case 'text':
    case 'TEXTO':
    default:
      return caption || 'Mensagem';
  }
}
