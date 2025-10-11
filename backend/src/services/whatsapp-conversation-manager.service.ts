import { supabase } from '../supabaseClient';
import { WhatsAppProfileExtractorService, WhatsAppContactInfo } from './whatsapp-profile-extractor.service';
import logger from '../logger';

export interface ConversationData {
  id: string;
  owner_id: string;
  connection_id: string;
  chat_id: string;
  numero_cliente: string;
  nome_cliente: string;
  display_name: string; // Nome que aparece na interface (NUNCA muda após ser definido)
  status: string;
  ultima_mensagem_preview: string;
  ultima_mensagem_em: string;
  nao_lidas: number;
  is_group: boolean;
  contact_info?: WhatsAppContactInfo;
  created_at: string;
  updated_at: string;
}

export class WhatsAppConversationManagerService {
  private profileExtractor: WhatsAppProfileExtractorService;

  constructor(profileExtractor: WhatsAppProfileExtractorService) {
    this.profileExtractor = profileExtractor;
  }

  /**
   * Cria ou atualiza uma conversa, garantindo que o nome nunca mude após ser definido
   */
  async createOrUpdateConversation(
    ownerId: string,
    connectionId: string,
    chatId: string,
    messageData: any,
    socket: any
  ): Promise<ConversationData | null> {
    try {
      console.log(`💬 [CONVERSATION-MANAGER] Processando conversa: ${chatId}`);
      
      const phoneNumber = chatId.replace('@s.whatsapp.net', '').replace('@g.us', '');
      const isGroup = chatId.endsWith('@g.us');

      // 1. Verificar se a conversa já existe
      const existingConversation = await this.getExistingConversation(ownerId, connectionId, chatId);
      
      if (existingConversation) {
        // Conversa existe - apenas atualizar dados, MAS NUNCA mudar o display_name
        return await this.updateExistingConversation(existingConversation, messageData);
      } else {
        // Nova conversa - extrair informações completas e criar
        return await this.createNewConversation(
          ownerId, 
          connectionId, 
          chatId, 
          phoneNumber, 
          isGroup, 
          messageData, 
          socket
        );
      }

    } catch (error) {
      console.error(`❌ [CONVERSATION-MANAGER] Erro ao processar conversa:`, error);
      return null;
    }
  }

  /**
   * Obtém conversa existente
   */
  private async getExistingConversation(
    ownerId: string, 
    connectionId: string, 
    chatId: string
  ): Promise<ConversationData | null> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_atendimentos')
        .select('*')
        .eq('owner_id', ownerId)
        .eq('connection_id', connectionId)
        .eq('chat_id', chatId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`❌ [CONVERSATION-MANAGER] Erro ao buscar conversa existente:`, error);
      return null;
    }
  }

  /**
   * Atualiza conversa existente (NUNCA muda o display_name)
   */
  private async updateExistingConversation(
    conversation: ConversationData,
    messageData: any
  ): Promise<ConversationData> {
    try {
      console.log(`🔄 [CONVERSATION-MANAGER] Atualizando conversa existente: ${conversation.id}`);
      
      const updateData = {
        ultima_mensagem_preview: this.getPreviewFromMessage(messageData),
        ultima_mensagem_em: messageData.timestamp || new Date().toISOString(),
        nao_lidas: messageData.direction === 'in' ? 
          (conversation.nao_lidas || 0) + 1 : 
          conversation.nao_lidas || 0,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('whatsapp_atendimentos')
        .update(updateData)
        .eq('id', conversation.id);

      if (error) throw error;

      console.log(`✅ [CONVERSATION-MANAGER] Conversa atualizada: ${conversation.id}`);
      return { ...conversation, ...updateData };

    } catch (error) {
      console.error(`❌ [CONVERSATION-MANAGER] Erro ao atualizar conversa:`, error);
      return conversation;
    }
  }

  /**
   * Cria nova conversa com informações completas
   */
  private async createNewConversation(
    ownerId: string,
    connectionId: string,
    chatId: string,
    phoneNumber: string,
    isGroup: boolean,
    messageData: any,
    socket: any
  ): Promise<ConversationData | null> {
    try {
      console.log(`🆕 [CONVERSATION-MANAGER] Criando nova conversa: ${chatId}`);

      // 1. Extrair informações completas do perfil
      const contactInfo = await this.profileExtractor.extractCompleteProfile(chatId);
      
      // 2. Determinar nome de exibição
      let displayName: string;
      if (contactInfo) {
        displayName = this.profileExtractor.getDisplayName(contactInfo);
        // Salvar informações do contato no Supabase (apenas para novos contatos)
        await this.profileExtractor.saveContactToSupabase(contactInfo, ownerId);
      } else {
        // Fallback se não conseguir extrair informações
        displayName = isGroup ? `Grupo ${phoneNumber}` : `Contato ${phoneNumber}`;
      }

      // 3. Criar conversa no Supabase
      const conversationData = {
        owner_id: ownerId,
        connection_id: connectionId,
        chat_id: chatId,
        numero_cliente: phoneNumber,
        nome_cliente: contactInfo?.wpp_name || contactInfo?.full_name || phoneNumber,
        display_name: displayName, // Nome que NUNCA muda
        status: 'active',
        ultima_mensagem_preview: this.getPreviewFromMessage(messageData),
        ultima_mensagem_em: messageData.timestamp || new Date().toISOString(),
        nao_lidas: messageData.direction === 'in' ? 1 : 0,
        is_group: isGroup,
        contact_info: contactInfo,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('whatsapp_atendimentos')
        .insert([conversationData])
        .select('*')
        .single();

      if (error) throw error;

      console.log(`✅ [CONVERSATION-MANAGER] Nova conversa criada: ${data.id} com nome: ${displayName}`);
      return data;

    } catch (error) {
      console.error(`❌ [CONVERSATION-MANAGER] Erro ao criar nova conversa:`, error);
      return null;
    }
  }

  /**
   * Obtém preview da mensagem
   */
  private getPreviewFromMessage(messageData: any): string {
    if (messageData.text) {
      return messageData.text.length > 50 ? 
        messageData.text.substring(0, 50) + '...' : 
        messageData.text;
    }
    
    if (messageData.message?.conversation) {
      const text = messageData.message.conversation;
      return text.length > 50 ? text.substring(0, 50) + '...' : text;
    }
    
    if (messageData.message?.extendedTextMessage?.text) {
      const text = messageData.message.extendedTextMessage.text;
      return text.length > 50 ? text.substring(0, 50) + '...' : text;
    }

    // Tipos de mídia
    const messageTypes = {
      'imageMessage': '[Imagem]',
      'videoMessage': '[Vídeo]',
      'audioMessage': '[Áudio]',
      'documentMessage': '[Documento]',
      'stickerMessage': '[Sticker]',
      'locationMessage': '[Localização]',
      'contactMessage': '[Contato]'
    };

    const messageType = Object.keys(messageData.message || {})[0];
    return messageTypes[messageType] || '[Mensagem]';
  }

  /**
   * Garante que uma mensagem seja salva com todos os campos necessários
   */
  async saveMessageWithCompleteData(
    ownerId: string,
    connectionId: string,
    chatId: string,
    messageData: any,
    conversationId: string
  ): Promise<boolean> {
    try {
      console.log(`💾 [MESSAGE-SAVER] Salvando mensagem completa: ${messageData.messageId}`);

      // Determinar remetente
      const remetente = messageData.direction === 'in' ? 'CLIENTE' : 
                       (messageData.isAI ? 'AI' : 'ATENDENTE');

      // Obter informações do contato para wpp_name
      const conversation = await this.getExistingConversation(ownerId, connectionId, chatId);
      const wppName = conversation?.contact_info?.wpp_name || 
                     conversation?.nome_cliente || 
                     (remetente === 'ATENDENTE' ? 'Atendente' : null);

      // Determinar group_contact_name se for grupo
      const isGroup = chatId.endsWith('@g.us');
      const groupContactName = isGroup ? conversation?.contact_info?.group_subject : null;

      const messageRecord = {
        owner_id: ownerId,
        atendimento_id: conversationId,
        connection_id: connectionId,
        chat_id: chatId,
        message_id: messageData.messageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conteudo: this.extractMessageContent(messageData),
        tipo: this.getMessageType(messageData),
        remetente: remetente,
        wpp_name: wppName,
        group_contact_name: groupContactName,
        timestamp: messageData.timestamp || new Date().toISOString(),
        lida: remetente === 'AI' || remetente === 'ATENDENTE', // AI e Atendente são considerados lidos
        midia_url: messageData.mediaUrl || null,
        midia_tipo: messageData.mediaMime || null,
        midia_nome: messageData.mediaName || null,
        midia_tamanho: messageData.mediaSize || null,
        raw: JSON.stringify(messageData.raw || messageData), // Sempre salvar raw completo
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('whatsapp_mensagens')
        .insert([messageRecord]);

      if (error) throw error;

      console.log(`✅ [MESSAGE-SAVER] Mensagem salva com sucesso: ${messageRecord.message_id}`);
      return true;

    } catch (error) {
      console.error(`❌ [MESSAGE-SAVER] Erro ao salvar mensagem:`, error);
      return false;
    }
  }

  /**
   * Extrai conteúdo da mensagem
   */
  private extractMessageContent(messageData: any): string {
    if (messageData.text) return messageData.text;
    if (messageData.message?.conversation) return messageData.message.conversation;
    if (messageData.message?.extendedTextMessage?.text) return messageData.message.extendedTextMessage.text;
    return '';
  }

  /**
   * Determina tipo da mensagem
   */
  private getMessageType(messageData: any): string {
    if (messageData.message) {
      const messageType = Object.keys(messageData.message)[0];
      const typeMap = {
        'conversation': 'TEXTO',
        'extendedTextMessage': 'TEXTO',
        'imageMessage': 'IMAGEM',
        'videoMessage': 'VIDEO',
        'audioMessage': 'AUDIO',
        'documentMessage': 'DOCUMENTO',
        'stickerMessage': 'STICKER',
        'locationMessage': 'LOCALIZACAO',
        'contactMessage': 'CONTATO'
      };
      return typeMap[messageType] || 'OUTRO';
    }
    return 'TEXTO';
  }

  /**
   * Obtém nome de exibição da conversa (NUNCA muda após ser definido)
   */
  async getConversationDisplayName(
    ownerId: string, 
    connectionId: string, 
    chatId: string
  ): Promise<string> {
    try {
      const conversation = await this.getExistingConversation(ownerId, connectionId, chatId);
      
      if (conversation?.display_name) {
        return conversation.display_name;
      }

      // Se não existe conversa, retornar fallback
      const phoneNumber = chatId.replace('@s.whatsapp.net', '').replace('@g.us', '');
      const isGroup = chatId.endsWith('@g.us');
      
      return isGroup ? `Grupo ${phoneNumber}` : `Contato ${phoneNumber}`;

    } catch (error) {
      console.error(`❌ [DISPLAY-NAME] Erro ao obter nome de exibição:`, error);
      const phoneNumber = chatId.replace('@s.whatsapp.net', '').replace('@g.us', '');
      return `Contato ${phoneNumber}`;
    }
  }
}
