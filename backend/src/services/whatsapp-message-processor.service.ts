import { WASocket } from '@whiskeysockets/baileys';
import { WhatsAppProfileExtractorService, WhatsAppContactInfo } from './whatsapp-profile-extractor.service';
import { WhatsAppConversationManagerService } from './whatsapp-conversation-manager.service';
import { supabase } from '../supabaseClient';
import logger from '../logger';

export interface ProcessedMessage {
  success: boolean;
  conversationId?: string;
  displayName?: string;
  contactInfo?: WhatsAppContactInfo;
  error?: string;
}

export class WhatsAppMessageProcessorService {
  private profileExtractor: WhatsAppProfileExtractorService;
  private conversationManager: WhatsAppConversationManagerService;

  constructor(socket: WASocket) {
    this.profileExtractor = new WhatsAppProfileExtractorService(socket);
    this.conversationManager = new WhatsAppConversationManagerService(this.profileExtractor);
  }

  /**
   * Processa uma mensagem recebida com extração completa de informações
   */
  async processIncomingMessage(
    ownerId: string,
    connectionId: string,
    messageData: any
  ): Promise<ProcessedMessage> {
    try {
      console.log(`📨 [MESSAGE-PROCESSOR] Processando mensagem recebida: ${messageData.key?.id}`);
      
      const chatId = messageData.key.remoteJid;
      const phoneNumber = chatId?.replace('@s.whatsapp.net', '').replace('@g.us', '');
      
      if (!chatId || !phoneNumber) {
        throw new Error('Chat ID ou número de telefone inválido');
      }

      // 1. Criar ou atualizar conversa com informações completas
      const conversation = await this.conversationManager.createOrUpdateConversation(
        ownerId,
        connectionId,
        chatId,
        messageData,
        null // socket será usado internamente
      );

      if (!conversation) {
        throw new Error('Falha ao criar/atualizar conversa');
      }

      // 2. Salvar mensagem com dados completos
      const messageSaved = await this.conversationManager.saveMessageWithCompleteData(
        ownerId,
        connectionId,
        chatId,
        {
          ...messageData,
          direction: 'in',
          timestamp: new Date(messageData.messageTimestamp * 1000).toISOString(),
          messageId: messageData.key.id
        },
        conversation.id
      );

      if (!messageSaved) {
        throw new Error('Falha ao salvar mensagem');
      }

      console.log(`✅ [MESSAGE-PROCESSOR] Mensagem processada com sucesso: ${conversation.display_name}`);
      
      return {
        success: true,
        conversationId: conversation.id,
        displayName: conversation.display_name,
        contactInfo: conversation.contact_info
      };

    } catch (error) {
      console.error(`❌ [MESSAGE-PROCESSOR] Erro ao processar mensagem recebida:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Processa uma mensagem enviada (outgoing)
   */
  async processOutgoingMessage(
    ownerId: string,
    connectionId: string,
    chatId: string,
    messageContent: string,
    isAI: boolean = false
  ): Promise<ProcessedMessage> {
    try {
      console.log(`📤 [MESSAGE-PROCESSOR] Processando mensagem enviada: ${chatId}`);
      
      // 1. Obter conversa existente
      const conversation = await this.conversationManager.getExistingConversation(
        ownerId,
        connectionId,
        chatId
      );

      if (!conversation) {
        throw new Error('Conversa não encontrada');
      }

      // 2. Criar dados da mensagem
      const messageData = {
        direction: 'out',
        text: messageContent,
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        isAI: isAI,
        messageTimestamp: Math.floor(Date.now() / 1000)
      };

      // 3. Salvar mensagem
      const messageSaved = await this.conversationManager.saveMessageWithCompleteData(
        ownerId,
        connectionId,
        chatId,
        messageData,
        conversation.id
      );

      if (!messageSaved) {
        throw new Error('Falha ao salvar mensagem enviada');
      }

      // 4. Atualizar conversa
      await this.conversationManager.updateExistingConversation(conversation, {
        ...messageData,
        direction: 'out'
      });

      console.log(`✅ [MESSAGE-PROCESSOR] Mensagem enviada processada: ${conversation.display_name}`);
      
      return {
        success: true,
        conversationId: conversation.id,
        displayName: conversation.display_name
      };

    } catch (error) {
      console.error(`❌ [MESSAGE-PROCESSOR] Erro ao processar mensagem enviada:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Atualiza nome de exibição de uma conversa (apenas se ainda não foi definido)
   */
  async updateConversationDisplayName(
    ownerId: string,
    connectionId: string,
    chatId: string,
    newDisplayName: string
  ): Promise<boolean> {
    try {
      console.log(`🏷️ [DISPLAY-NAME] Tentando atualizar nome de exibição: ${newDisplayName}`);
      
      const conversation = await this.conversationManager.getExistingConversation(
        ownerId,
        connectionId,
        chatId
      );

      if (!conversation) {
        console.log(`⚠️ [DISPLAY-NAME] Conversa não encontrada: ${chatId}`);
        return false;
      }

      // Só atualizar se o display_name ainda não foi definido ou está vazio
      if (!conversation.display_name || conversation.display_name.startsWith('Contato ') || conversation.display_name.startsWith('Grupo ')) {
        const { error } = await supabase
          .from('whatsapp_atendimentos')
          .update({ 
            display_name: newDisplayName,
            nome_cliente: newDisplayName,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversation.id);

        if (error) throw error;

        console.log(`✅ [DISPLAY-NAME] Nome atualizado: ${newDisplayName}`);
        return true;
      } else {
        console.log(`ℹ️ [DISPLAY-NAME] Nome já definido, mantendo: ${conversation.display_name}`);
        return false;
      }

    } catch (error) {
      console.error(`❌ [DISPLAY-NAME] Erro ao atualizar nome:`, error);
      return false;
    }
  }

  /**
   * Obtém informações de uma conversa
   */
  async getConversationInfo(
    ownerId: string,
    connectionId: string,
    chatId: string
  ): Promise<any> {
    try {
      const conversation = await this.conversationManager.getExistingConversation(
        ownerId,
        connectionId,
        chatId
      );

      return conversation;
    } catch (error) {
      console.error(`❌ [CONVERSATION-INFO] Erro ao obter informações:`, error);
      return null;
    }
  }

  /**
   * Força atualização de informações de contato para conversas existentes
   */
  async refreshContactInfo(
    ownerId: string,
    connectionId: string,
    chatId: string
  ): Promise<boolean> {
    try {
      console.log(`🔄 [REFRESH-CONTACT] Atualizando informações do contato: ${chatId}`);
      
      // Extrair informações atualizadas
      const contactInfo = await this.profileExtractor.extractCompleteProfile(chatId);
      
      if (!contactInfo) {
        console.log(`⚠️ [REFRESH-CONTACT] Não foi possível extrair informações`);
        return false;
      }

      // Atualizar conversa com novas informações
      const conversation = await this.conversationManager.getExistingConversation(
        ownerId,
        connectionId,
        chatId
      );

      if (conversation) {
        const displayName = this.profileExtractor.getDisplayName(contactInfo);
        
        // Atualizar apenas se o novo nome for melhor que o atual
        if (displayName !== conversation.display_name && 
            !conversation.display_name?.startsWith('Contato ') && 
            !conversation.display_name?.startsWith('Grupo ')) {
          
          await this.updateConversationDisplayName(ownerId, connectionId, chatId, displayName);
        }

        // Atualizar contact_info na conversa
        await supabase
          .from('whatsapp_atendimentos')
          .update({ 
            contact_info: contactInfo,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversation.id);
      }

      // Salvar no contatos (apenas se for novo contato)
      await this.profileExtractor.saveContactToSupabase(contactInfo, ownerId);

      console.log(`✅ [REFRESH-CONTACT] Informações atualizadas: ${contactInfo.wpp_name || contactInfo.group_subject}`);
      return true;

    } catch (error) {
      console.error(`❌ [REFRESH-CONTACT] Erro ao atualizar informações:`, error);
      return false;
    }
  }

  /**
   * Obtém todas as conversas com informações completas
   */
  async getAllConversationsWithInfo(ownerId: string, connectionId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_atendimentos')
        .select('*')
        .eq('owner_id', ownerId)
        .eq('connection_id', connectionId)
        .order('ultima_mensagem_em', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error(`❌ [ALL-CONVERSATIONS] Erro ao obter conversas:`, error);
      return [];
    }
  }
}
