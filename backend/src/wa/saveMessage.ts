import { supabase } from '../supabaseClient';

export async function saveMessage(opts: {
  ownerId: string;
  chatId: string;
  connectionId: string;
  messageType: 'TEXTO'|'IMAGEM'|'AUDIO'|'VIDEO'|'ARQUIVO';
  remetente: 'AI'|'OPERADOR'|'CLIENTE';
  conteudo: string;
  status?: 'AI'|'AGUARDANDO'|'ENVIADO';
  mediaUrl?: string;
  mediaMime?: string;
  messageId?: string;
  waMsgId?: string;
}): Promise<any> {
  try {
    console.log('💾 Salvando mensagem:', {
      ownerId: opts.ownerId,
      chatId: opts.chatId,
      messageType: opts.messageType,
      remetente: opts.remetente,
      status: opts.status
    });

    const messageData = {
      owner_id: opts.ownerId,
      chat_id: opts.chatId,
      connection_id: opts.connectionId,
      message_type: opts.messageType,
      remetente: opts.remetente,
      conteudo: opts.conteudo,
      status: opts.status || 'AI',
      lida: opts.remetente === 'AI', // Mensagens da IA são consideradas lidas
      timestamp: new Date().toISOString(),
      message_id: opts.messageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      wa_msg_id: opts.waMsgId,
      media_url: opts.mediaUrl || null,
      media_mime_text: opts.mediaMime || null,
      atendimento_id: opts.remetente === 'AI' ? `ai_${Date.now()}` : null
    };

    const { data, error } = await supabase
      .from('whatsapp_mensagens')
      .insert([messageData])
      .select('*')
      .single();

    if (error) {
      console.error('❌ Erro ao salvar mensagem:', error);
      throw error;
    }

    console.log('✅ Mensagem salva com sucesso:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Erro ao salvar mensagem:', error);
    throw error;
  }
}

export async function updateMessage(messageId: string, updates: {
  media_url?: string;
  media_mime_text?: string;
  conteudo?: string;
  status?: string;
}): Promise<any> {
  try {
    console.log('💾 Atualizando mensagem:', messageId, updates);

    const { data, error } = await supabase
      .from('whatsapp_mensagens')
      .update(updates)
      .eq('message_id', messageId)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Erro ao atualizar mensagem:', error);
      throw error;
    }

    console.log('✅ Mensagem atualizada com sucesso:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Erro ao atualizar mensagem:', error);
    throw error;
  }
}
