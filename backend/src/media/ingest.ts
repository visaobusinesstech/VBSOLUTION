import { supabase } from '../supabaseClient';
import { downloadWhatsAppMedia } from '../wa/waMedia';
import fetch from 'node-fetch';

type IngestResult = { url: string; mime: string; size: number };

export async function ingestIncomingMedia(opts: {
  ownerId: string;
  connectionId: string;
  chatId: string;
  messageId: string;
  mediaUrl: string;      // can be 'media:<waMediaId>' or 'data:<mime>;base64,...'
  mediaMime?: string | null;
}): Promise<IngestResult | null> {
  try {
    const { mediaUrl, mediaMime, connectionId, messageId, chatId, ownerId } = opts;
    
    console.log('📎 Iniciando ingestão de mídia:', { 
      mediaUrl: mediaUrl?.substring(0, 50) + '...', 
      mediaMime,
      messageId 
    });

    // Case A: WhatsApp pointer like 'media:abc123'
    if (mediaUrl?.startsWith('media:')) {
      const waId = mediaUrl.split(':')[1];
      console.log('📎 Download de mídia WhatsApp:', waId);
      
      try {
        const { buffer, mime } = await downloadWhatsAppMedia({ connectionId, waId });
        const fileName = `${chatId}_${messageId}.${mimeToExt(mime)}`;
        const filePath = `whatsapp-media/${ownerId}/${fileName}`;

        console.log('📎 Salvando mídia no storage:', filePath);

        // Save to Supabase Storage (preferred) or local fs
        const { data, error } = await supabase.storage
          .from('whatsapp-media')
          .upload(filePath, buffer, { contentType: mime, upsert: true });

        if (error) {
          console.error('❌ Erro no upload para Supabase:', error);
          return null;
        }

        const { data: pub } = supabase.storage.from('whatsapp-media').getPublicUrl(filePath);
        console.log('✅ Mídia salva com sucesso:', pub.publicUrl);
        
        return { url: pub.publicUrl, mime, size: buffer.length };
      } catch (downloadError) {
        console.error('❌ Erro ao baixar mídia WhatsApp:', downloadError);
        return null;
      }
    }

    // Case B: Base64 data URL 'data:image/jpeg;base64,...'
    if (mediaUrl?.startsWith('data:')) {
      console.log('📎 Processando URL base64');
      
      try {
        const { mime, data } = parseDataUrl(mediaUrl);
        const buf = Buffer.from(data, 'base64');
        const fileName = `${chatId}_${messageId}.${mimeToExt(mime)}`;
        const filePath = `whatsapp-media/${ownerId}/${fileName}`;
        
        console.log('📎 Salvando base64 no storage:', filePath);
        
        const { error } = await supabase.storage
          .from('whatsapp-media')
          .upload(filePath, buf, { contentType: mime, upsert: true });
          
        if (error) { 
          console.error('❌ Erro no upload base64:', error); 
          return null; 
        }
        
        const { data: pub } = supabase.storage.from('whatsapp-media').getPublicUrl(filePath);
        console.log('✅ Base64 salvo com sucesso:', pub.publicUrl);
        
        return { url: pub.publicUrl, mime, size: buf.length };
      } catch (parseError) {
        console.error('❌ Erro ao processar base64:', parseError);
        return null;
      }
    }

    // Case C: URL externa (já resolvida)
    if (mediaUrl?.startsWith('http')) {
      console.log('📎 URL externa já resolvida:', mediaUrl);
      return { 
        url: mediaUrl, 
        mime: mediaMime || 'application/octet-stream', 
        size: 0 
      };
    }

    console.log('⚠️ Formato de mídia não suportado:', mediaUrl);
    return null;
  } catch (error) {
    console.error('❌ Erro geral na ingestão de mídia:', error);
    return null;
  }
}

function parseDataUrl(u: string) {
  const m = u.match(/^data:(.+?);base64,(.*)$/);
  if (!m) throw new Error('Invalid data URL');
  return { mime: m[1], data: m[2] };
}

function mimeToExt(mime: string) {
  if (!mime) return 'bin';
  if (mime.includes('jpeg')) return 'jpg';
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('mp3')) return 'mp3';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('mp4')) return 'mp4';
  if (mime.includes('pdf')) return 'pdf';
  if (mime.includes('doc')) return 'doc';
  if (mime.includes('docx')) return 'docx';
  return 'bin';
}

// Função para criar bucket se não existir
export async function ensureMediaBucket() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'whatsapp-media');
    
    if (!bucketExists) {
      console.log('📎 Criando bucket whatsapp-media...');
      const { data, error } = await supabase.storage.createBucket('whatsapp-media', {
        public: true,
        allowedMimeTypes: ['image/*', 'audio/*', 'video/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      });
      
      if (error) {
        console.error('❌ Erro ao criar bucket:', error);
      } else {
        console.log('✅ Bucket whatsapp-media criado com sucesso');
      }
    } else {
      console.log('✅ Bucket whatsapp-media já existe');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar bucket:', error);
  }
}
