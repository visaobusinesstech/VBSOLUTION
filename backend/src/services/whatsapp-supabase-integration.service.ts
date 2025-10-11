import { supabaseSessionsService, WhatsAppSessionData } from './supabase-sessions.service';
import { supabaseMessagesService, WhatsAppMessageData } from './supabase-messages.service';
import { supabaseAtendimentosService, WhatsAppAtendimentoData } from './supabase-atendimentos.service';
import { supabaseConfiguracoesService, WhatsAppConfiguracaoData } from './supabase-configuracoes.service';
import { isWhatsAppV2Enabled, DEFAULT_OWNER_ID, DEFAULT_COMPANY_ID } from '../config/supabase';
import { logDbPersistOk } from '../utils/observer-logger';
import logger from '../logger';

export interface BaileysMessageEvent {
  connectionId: string;
  chatId: string;
  messageId: string;
  from: string;
  to: string;
  message: any;
  timestamp: number;
  isFromMe: boolean;
}

export interface BaileysConnectionEvent {
  connectionId: string;
  status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  qrCode?: string;
  phoneNumber?: string;
  whatsappInfo?: any;
}

export class WhatsAppSupabaseIntegrationService {
  private messageQueue: BaileysMessageEvent[] = [];
  private isProcessingQueue = false;

  /**
   * Handle Baileys connection events
   */
  async handleConnectionEvent(event: BaileysConnectionEvent): Promise<void> {
    if (!isWhatsAppV2Enabled()) {
      logger.debug('WhatsApp V2 disabled, skipping connection event');
      return;
    }

    try {
      const sessionData: Partial<WhatsAppSessionData> = {
        id: event.connectionId,
        owner_id: DEFAULT_OWNER_ID,
        session_name: `Session ${event.connectionId}`,
        status: event.status,
        qr_code: event.qrCode,
        connected_at: event.status === 'CONNECTED' ? new Date() : undefined,
        disconnected_at: event.status === 'DISCONNECTED' ? new Date() : undefined,
        connection_id: event.connectionId,
        phone_number: event.phoneNumber,
        whatsapp_info: event.whatsappInfo
      };

      const savedSession = await supabaseSessionsService.upsertSession(sessionData);
      
      // Log de observação
      if (savedSession) {
        logDbPersistOk('whatsapp_sessions', savedSession.id, new Date().toISOString());
      }
      
      logger.info(`Connection event processed: ${event.connectionId} - ${event.status}`);
    } catch (error) {
      logger.error('Error handling connection event:', error);
    }
  }

  /**
   * Handle Baileys message events
   */
  async handleMessageEvent(event: BaileysMessageEvent): Promise<void> {
    if (!isWhatsAppV2Enabled()) {
      logger.debug('WhatsApp V2 disabled, skipping message event');
      return;
    }

    // Add to queue for batch processing
    this.messageQueue.push(event);
    
    if (!this.isProcessingQueue) {
      this.processMessageQueue();
    }
  }

  /**
   * Process message queue in batches
   */
  private async processMessageQueue(): Promise<void> {
    if (this.isProcessingQueue || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const batch = this.messageQueue.splice(0, 10); // Process 10 messages at a time
      
      for (const event of batch) {
        await this.processMessage(event);
      }

      // Continue processing if there are more messages
      if (this.messageQueue.length > 0) {
        setTimeout(() => {
          this.isProcessingQueue = false;
          this.processMessageQueue();
        }, 100);
      } else {
        this.isProcessingQueue = false;
      }
    } catch (error) {
      logger.error('Error processing message queue:', error);
      this.isProcessingQueue = false;
    }
  }

  /**
   * Process individual message
   */
  private async processMessage(event: BaileysMessageEvent): Promise<void> {
    try {
      // Extract message content and type
      const { conteudo, tipo, midia_url, midia_tipo, midia_nome, midia_tamanho } = this.extractMessageContent(event.message);
      
      // Get or create atendimento
      const atendimento = await this.getOrCreateAtendimento(
        event.connectionId,
        event.chatId,
        event.from,
        event.isFromMe
      );

      if (!atendimento) {
        logger.error('Failed to get or create atendimento for message');
        return;
      }

      // Save message
      const messageData: WhatsAppMessageData = {
        owner_id: DEFAULT_OWNER_ID,
        atendimento_id: atendimento.id!,
        message_id: event.messageId,
        chat_id: event.chatId,
        connection_id: event.connectionId,
        conteudo,
        tipo,
        remetente: event.isFromMe ? 'ATENDENTE' : 'CLIENTE',
        timestamp: new Date(event.timestamp * 1000),
        lida: event.isFromMe, // Messages from us are considered read
        midia_url,
        midia_tipo,
        midia_nome,
        midia_tamanho,
        raw_data: event.message
      };

      const savedMessage = await supabaseMessagesService.saveMessage(messageData);
      
      // Log de observação
      if (savedMessage) {
        logDbPersistOk('whatsapp_mensagens', savedMessage.id, new Date().toISOString());
      }

      // Update atendimento last message timestamp
      await supabaseAtendimentosService.updateLastMessage(
        atendimento.id!,
        new Date(event.timestamp * 1000)
      );
      
      // Log de observação para atendimento
      logDbPersistOk('whatsapp_atendimentos', atendimento.id!, new Date().toISOString());

      // Update atendimento status if needed
      if (event.isFromMe && atendimento.status === 'AGUARDANDO') {
        await supabaseAtendimentosService.updateAtendimentoStatus(
          atendimento.id!,
          'ATENDENDO'
        );
      }

      logger.debug(`Message processed: ${event.messageId} for atendimento ${atendimento.id}`);
    } catch (error) {
      logger.error('Error processing message:', error);
    }
  }

  /**
   * Get or create atendimento for a conversation
   */
  private async getOrCreateAtendimento(
    connectionId: string,
    chatId: string,
    from: string,
    isFromMe: boolean
  ): Promise<WhatsAppAtendimentoData | null> {
    try {
      // Extract phone number from JID
      const phoneNumber = this.extractPhoneNumber(from);
      if (!phoneNumber) {
        logger.error('Could not extract phone number from JID:', from);
        return null;
      }

      // Try to get existing atendimento
      let atendimento = await supabaseAtendimentosService.getAtendimentoByConnection(
        connectionId,
        phoneNumber
      );

      if (!atendimento) {
        // Create new atendimento
        const atendimentoData: Partial<WhatsAppAtendimentoData> = {
          owner_id: DEFAULT_OWNER_ID,
          company_id: DEFAULT_COMPANY_ID,
          connection_id: connectionId,
          chat_id: chatId,
          numero_cliente: phoneNumber,
          nome_cliente: this.extractContactName(from),
          status: 'AGUARDANDO',
          data_inicio: new Date(),
          ultima_mensagem: new Date(),
          prioridade: 1,
          canal: 'whatsapp'
        };

        atendimento = await supabaseAtendimentosService.upsertAtendimento(atendimentoData);
      }

      return atendimento;
    } catch (error) {
      logger.error('Error getting or creating atendimento:', error);
      return null;
    }
  }

  /**
   * Extract message content from Baileys message
   */
  private extractMessageContent(message: any): {
    conteudo: string;
    tipo: WhatsAppMessageData['tipo'];
    midia_url?: string;
    midia_tipo?: string;
    midia_nome?: string;
    midia_tamanho?: number;
  } {
    let conteudo = '';
    let tipo: WhatsAppMessageData['tipo'] = 'TEXTO';
    let midia_url: string | undefined;
    let midia_tipo: string | undefined;
    let midia_nome: string | undefined;
    let midia_tamanho: number | undefined;

    // Check for different message types
    if (message.conversation || message.extendedTextMessage?.text) {
      conteudo = message.conversation || message.extendedTextMessage?.text || '';
      tipo = 'TEXTO';
    } else if (message.imageMessage) {
      conteudo = message.imageMessage.caption || '[Imagem]';
      tipo = 'IMAGEM';
      midia_url = message.imageMessage.url;
      midia_tipo = message.imageMessage.mimetype;
      midia_nome = message.imageMessage.fileName;
      midia_tamanho = message.imageMessage.fileLength;
    } else if (message.videoMessage) {
      conteudo = message.videoMessage.caption || '[Vídeo]';
      tipo = 'VIDEO';
      midia_url = message.videoMessage.url;
      midia_tipo = message.videoMessage.mimetype;
      midia_nome = message.videoMessage.fileName;
      midia_tamanho = message.videoMessage.fileLength;
    } else if (message.audioMessage) {
      conteudo = '[Áudio]';
      tipo = 'AUDIO';
      midia_url = message.audioMessage.url;
      midia_tipo = message.audioMessage.mimetype;
      midia_tamanho = message.audioMessage.seconds;
    } else if (message.documentMessage) {
      conteudo = message.documentMessage.caption || '[Documento]';
      tipo = 'DOCUMENTO';
      midia_url = message.documentMessage.url;
      midia_tipo = message.documentMessage.mimetype;
      midia_nome = message.documentMessage.fileName;
      midia_tamanho = message.documentMessage.fileLength;
    } else if (message.stickerMessage) {
      conteudo = '[Sticker]';
      tipo = 'STICKER';
      midia_url = message.stickerMessage.url;
      midia_tipo = message.stickerMessage.mimetype;
    } else if (message.locationMessage) {
      conteudo = `[Localização] ${message.locationMessage.degreesLatitude}, ${message.locationMessage.degreesLongitude}`;
      tipo = 'LOCALIZACAO';
    } else if (message.contactMessage) {
      conteudo = `[Contato] ${message.contactMessage.displayName || 'Contato'}`;
      tipo = 'CONTATO';
    } else {
      conteudo = '[Mensagem não suportada]';
      tipo = 'OUTRO';
    }

    return {
      conteudo,
      tipo,
      midia_url,
      midia_tipo,
      midia_nome,
      midia_tamanho
    };
  }

  /**
   * Extract phone number from WhatsApp JID
   */
  private extractPhoneNumber(jid: string): string | null {
    // Remove @s.whatsapp.net suffix and extract phone number
    const match = jid.match(/^(\d+)@s\.whatsapp\.net$/);
    return match ? match[1] : null;
  }

  /**
   * Extract contact name from JID (simplified)
   */
  private extractContactName(jid: string): string {
    const phoneNumber = this.extractPhoneNumber(jid);
    return phoneNumber ? `Cliente ${phoneNumber}` : 'Cliente';
  }

  /**
   * Initialize default configuration
   */
  async initializeDefaultConfig(): Promise<void> {
    if (!isWhatsAppV2Enabled()) {
      return;
    }

    try {
      await supabaseConfiguracoesService.createDefaultConfig(
        DEFAULT_OWNER_ID,
        DEFAULT_COMPANY_ID
      );
      logger.info('Default configuration initialized');
    } catch (error) {
      logger.error('Error initializing default config:', error);
    }
  }

  /**
   * Get integration health status
   */
  async getHealthStatus(): Promise<{
    supabaseConnected: boolean;
    queueLength: number;
    isProcessing: boolean;
  }> {
    try {
      // Test Supabase connection
      const { data, error } = await supabaseSessionsService.getSessionsByOwner(DEFAULT_OWNER_ID);
      const supabaseConnected = !error;

      return {
        supabaseConnected,
        queueLength: this.messageQueue.length,
        isProcessing: this.isProcessingQueue
      };
    } catch (error) {
      return {
        supabaseConnected: false,
        queueLength: this.messageQueue.length,
        isProcessing: this.isProcessingQueue
      };
    }
  }
}

export const whatsappSupabaseIntegrationService = new WhatsAppSupabaseIntegrationService();
