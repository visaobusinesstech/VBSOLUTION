const { supabase } = require('../supabaseClient');
const { downloadWhatsAppMedia } = require('../wa/waMedia');

async function resolveMedia(mediaUrl, connectionId) {
  try {
    console.log('📎 Resolvendo mídia:', mediaUrl);
    
    if (!mediaUrl) {
      return null;
    }
    
    // Se já é uma URL válida
    if (mediaUrl.startsWith('http') || mediaUrl.startsWith('data:')) {
      console.log('📎 URL já resolvida:', mediaUrl);
      return { url: mediaUrl, mime: 'application/octet-stream' };
    }
    
    // Se é um hash de mídia (media:hash)
    if (mediaUrl.startsWith('media:')) {
      const hash = mediaUrl.replace('media:', '');
      console.log('📎 Baixando mídia do WhatsApp:', hash);
      
      try {
        const { buffer, mime } = await downloadWhatsAppMedia({ connectionId, waId: hash });
        
        // Salvar no Supabase Storage
        const fileName = `${connectionId}_${hash}.${mimeToExt(mime)}`;
        const filePath = `whatsapp-media/${connectionId}/${fileName}`;
        
        console.log('📎 Salvando no storage:', filePath);
        
        const { data, error } = await supabase.storage
          .from('whatsapp-media')
          .upload(filePath, buffer, { 
            contentType: mime, 
            upsert: true 
          });
        
        if (error) {
          console.error('❌ Erro ao salvar no storage:', error);
          return null;
        }
        
        const { data: publicUrl } = supabase.storage
          .from('whatsapp-media')
          .getPublicUrl(filePath);
        
        console.log('✅ Mídia salva com sucesso:', publicUrl.publicUrl);
        return { url: publicUrl.publicUrl, mime };
        
      } catch (downloadError) {
        console.error('❌ Erro ao baixar mídia:', downloadError);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erro geral na resolução de mídia:', error);
    return null;
  }
}

function mimeToExt(mime) {
  if (!mime) return 'bin';
  if (mime.includes('jpeg')) return 'jpg';
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('mp3')) return 'mp3';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('mp4')) return 'mp4';
  return 'bin';
}

module.exports = { resolveMedia };
