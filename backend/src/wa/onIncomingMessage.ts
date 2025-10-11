import { ingestIncomingMedia } from '../media/ingest';
import { loadAgentConfig } from '../ai/loadAgentConfig';
import { buildSystemMessage, buildUserMessage } from '../ai/buildPrompt';
import { infer } from '../ai/infer';
import { saveMessage, updateMessage } from './saveMessage';
import { sendMessage } from './sendMessage';
import { supabase } from '../supabaseClient';

function mimeToExt(mime: string) {
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

export async function onIncomingMessage(evt: {
  ownerId: string;
  connectionId: string;
  chatId: string;
  messageId: string;
  fromPhone: string;
  type: 'TEXTO' | 'IMAGEM' | 'AUDIO' | 'VIDEO' | 'ARQUIVO';
  text?: string;
  media_url?: string | null;
  media_mime?: string | null;
}): Promise<void> {
  try {
    console.log('🤖 ===== PROCESSANDO MENSAGEM RECEBIDA =====');
    console.log('🤖 Owner ID:', evt.ownerId);
    console.log('🤖 Connection ID:', evt.connectionId);
    console.log('🤖 Chat ID:', evt.chatId);
    console.log('🤖 Message ID:', evt.messageId);
    console.log('🤖 Type:', evt.type);
    console.log('🤖 Text:', evt.text);
    console.log('🤖 Media URL:', evt.media_url);

    // 1) Resolver mídia se necessário
    let mediaContent = null;
    let mediaUrl = evt.media_url;
    
    if (evt.media_url && (evt.type === 'IMAGEM' || evt.type === 'AUDIO')) {
      console.log('📎 Resolvendo mídia:', evt.media_url);
      
      // Se é media:hash, tentar baixar do WhatsApp
      if (evt.media_url.startsWith('media:')) {
        try {
          const { downloadWhatsAppMedia } = require('../wa/waMedia');
          const hash = evt.media_url.replace('media:', '');
          const { buffer, mime } = await downloadWhatsAppMedia({ 
            connectionId: evt.connectionId, 
            waId: hash 
          });
          
          // Salvar no Supabase Storage
          const fileName = `${evt.chatId}_${evt.messageId}.${mimeToExt(mime)}`;
          const filePath = `whatsapp-media/${evt.ownerId}/${fileName}`;
          
          const { data, error } = await supabase.storage
            .from('whatsapp-media')
            .upload(filePath, buffer, { contentType: mime, upsert: true });
          
          if (!error) {
            const { data: publicUrl } = supabase.storage
              .from('whatsapp-media')
              .getPublicUrl(filePath);
            
            mediaUrl = publicUrl.publicUrl;
            console.log('✅ Mídia resolvida:', mediaUrl);
          }
        } catch (error) {
          console.error('❌ Erro ao resolver mídia:', error);
        }
      }
    }

    // 2) Load agent config
    console.log('🤖 Carregando configuração da IA...');
    const cfg = await loadAgentConfig(evt.ownerId);
    if (!cfg) {
      console.log('⚠️ Nenhuma configuração da IA encontrada - pulando resposta automática');
      return;
    }

    if (!cfg.openaiApiKey) {
      console.log('⚠️ API key da OpenAI não configurada - pulando resposta automática');
      return;
    }

    // 3) Build conversational context (last N messages for this chat)
    console.log('🤖 Construindo contexto da conversa...');
    const { data: history } = await supabase
      .from('whatsapp_mensagens')
      .select('remetente, message_type, conteudo, media_url, media_mime_text, timestamp')
      .eq('chat_id', evt.chatId)
      .order('timestamp', { ascending: true })
      .limit(30);

    // Convert to plain text transcript the model can digest
    const transcript: string[] = [];
    for (const m of history || []) {
      if (m.message_type === 'AUDIO' && m.media_url) {
        transcript.push(`${m.remetente}: [Áudio anexado]`);
      } else if (m.message_type === 'IMAGEM' && m.media_url) {
        transcript.push(`${m.remetente}: [Imagem anexada]`);
      } else if (m.message_type === 'VIDEO' && m.media_url) {
        transcript.push(`${m.remetente}: [Vídeo anexado]`);
      } else if (m.message_type === 'ARQUIVO' && m.media_url) {
        transcript.push(`${m.remetente}: [Arquivo anexado]`);
      } else {
        transcript.push(`${m.remetente}: ${m.conteudo || ''}`);
      }
    }

    // 4) Process current message content
    let userInput = evt.text || '';

    if (evt.type === 'AUDIO' && mediaUrl) {
      console.log('🎵 Transcrevendo áudio...');
      try {
        const { transcript: tr } = await infer.transcribeAudio(mediaUrl, cfg);
        mediaContent = tr || undefined;
        userInput = tr ? `(Transcrição do áudio) ${tr}` : '[Áudio recebido]';
      } catch (error) {
        console.error('❌ Erro na transcrição:', error);
        userInput = '[Áudio recebido]';
      }
    } else if (evt.type === 'IMAGEM' && mediaUrl) {
      console.log('🖼️ Analisando imagem...');
      try {
        const { description } = await infer.describeImage(mediaUrl, cfg);
        mediaContent = description || undefined;
        userInput = description ? `(Descrição da imagem) ${description}` : '[Imagem recebida]';
      } catch (error) {
        console.error('❌ Erro na análise de imagem:', error);
        userInput = '[Imagem recebida]';
      }
    } else if (evt.type === 'VIDEO') {
      userInput = '[Vídeo recebido]';
    } else if (evt.type === 'ARQUIVO') {
      userInput = '[Arquivo recebido]';
    }

    // 5) Build system prompt
    console.log('🤖 Construindo prompt do sistema...');
    const system = buildSystemMessage(cfg);
    
    // 6) Build user message
    const userMessage = buildUserMessage(userInput, evt.type, mediaContent);

    // 7) Ask model
    console.log('🤖 Consultando modelo de IA...');
    const answer = await infer.answer({
      system,
      language: cfg.language || 'pt-BR',
      model: cfg.model,
      temperature: cfg.temperature,
      max_tokens: cfg.max_tokens,
      transcript,
      userInput: userInput,
      imageUrl: (evt.type === 'IMAGEM' && mediaUrl) ? mediaUrl : undefined,
      apiKey: cfg.openaiApiKey
    });

    if (!answer) {
      console.log('⚠️ Nenhuma resposta gerada pela IA');
      return;
    }

    // 8) Persist AI message
    console.log('💾 Salvando mensagem da IA...');
    const aiMessage = await saveMessage({
      ownerId: evt.ownerId,
      chatId: evt.chatId,
      connectionId: evt.connectionId,
      messageType: 'TEXTO',
      remetente: 'AI',
      conteudo: answer,
      status: 'AI'
    });

    // 9) Send back to WhatsApp
    console.log('📤 Enviando resposta via WhatsApp...');
    try {
      const sendResult = await sendMessage({
        connectionId: evt.connectionId,
        chatId: evt.chatId,
        text: answer
      });

      // 10) Update AI message with WhatsApp message ID
      if (sendResult.success && sendResult.messageId) {
        await updateMessage(savedMessage.message_id, {
          wa_msg_id: sendResult.messageId
        });
        console.log('✅ Mensagem da IA enviada com sucesso!');
      } else {
        console.error('❌ Erro ao enviar mensagem via WhatsApp:', sendResult.error);
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem via WhatsApp:', error);
    }

    console.log('✅ Resposta da IA enviada com sucesso!');
    console.log('🤖 ==========================================');

  } catch (error) {
    console.error('❌ Erro no processamento da mensagem:', error);
    console.error('❌ Stack trace:', error.stack);
  }
}

// Função para verificar se deve processar a mensagem
export function shouldProcessMessage(message: any): boolean {
  // Não processar mensagens da própria IA
  if (message.remetente === 'AI') {
    return false;
  }

  // Não processar mensagens antigas (mais de 5 minutos)
  const messageTime = new Date(message.timestamp);
  const now = new Date();
  const diffMinutes = (now.getTime() - messageTime.getTime()) / (1000 * 60);
  
  if (diffMinutes > 5) {
    console.log('⚠️ Mensagem muito antiga, pulando processamento:', diffMinutes, 'minutos');
    return false;
  }

  return true;
}
