import { makeWASocket, DisconnectReason, useMultiFileAuthState, ConnectionState, WASocket } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../logger';
import { supabaseWhatsAppService, WhatsAppMessage, WhatsAppAtendimento, WhatsAppSession } from './supabase-whatsapp.service';
import { v4 as uuidv4 } from 'uuid';

export interface WhatsAppConnection {
  id: string;
  name: string;
  socket: WASocket;
  isConnected: boolean;
  qrCode?: string;
  lastSeen?: Date;
  ownerId: string;
  companyId?: string;
}

export interface MessageData {
  id: string;
  from: string;
  to: string;
  message: any;
  timestamp: Date;
  type: string;
  isFromMe: boolean;
}

export class WhatsAppIntegrationService extends EventEmitter {
  private connections: Map<string, WhatsAppConnection> = new Map();
  private authDir: string;
  private isRunning: boolean = false;
  private watchdogInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.authDir = path.join(process.cwd(), 'auth_sessions');
    this.ensureAuthDir();
    this.startWatchdog();
  }

  /**
   * Garante que o diretório de autenticação existe
   */
  private ensureAuthDir(): void {
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }
  }

  /**
   * Inicia o watchdog para monitorar conexões
   */
  private startWatchdog(): void {
    this.watchdogInterval = setInterval(() => {
      this.checkConnectionsHealth();
    }, 30000); // Verifica a cada 30 segundos
  }

  /**
   * Verifica a saúde de todas as conexões
   */
  private async checkConnectionsHealth(): Promise<void> {
    for (const [connectionId, connection] of this.connections) {
      try {
        if (!connection.isConnected) {
          logger.warn(`⚠️ Conexão ${connectionId} desconectada, tentando reconectar...`);
          await this.reconnectConnection(connectionId);
        }
      } catch (error) {
        logger.error(`❌ Erro ao verificar conexão ${connectionId}:`, error);
      }
    }
  }

  /**
   * Cria uma nova conexão WhatsApp
   */
  async createConnection(
    connectionId: string,
    name: string,
    ownerId: string,
    companyId?: string
  ): Promise<{ success: boolean; qrCode?: string; error?: string }> {
    try {
      logger.info(`🔗 Criando conexão WhatsApp: ${connectionId}`);

      // Verificar se já existe
      if (this.connections.has(connectionId)) {
        return { success: false, error: 'Conexão já existe' };
      }

      // Diretório de autenticação específico para esta conexão
      const connectionAuthDir = path.join(this.authDir, connectionId);
      if (!fs.existsSync(connectionAuthDir)) {
        fs.mkdirSync(connectionAuthDir, { recursive: true });
      }

      // Configurar estado de autenticação
      const { state, saveCreds } = await useMultiFileAuthState(connectionAuthDir);

      // Criar socket WhatsApp
      const socket = makeWASocket({
        auth: state,
        logger: logger.child({ connectionId }),
        printQRInTerminal: false,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        markOnlineOnConnect: true,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        connectTimeoutMs: 60000,
        retryRequestDelayMs: 250,
        maxMsgRetryCount: 5,
        msgRetryCounterCache: new Map(),
        getMessage: async (key) => {
          return {
            conversation: "Mensagem não encontrada"
          };
        }
      });

      // Configurar eventos do socket
      this.setupSocketEvents(socket, connectionId, ownerId, companyId);

      // Criar objeto de conexão
      const connection: WhatsAppConnection = {
        id: connectionId,
        name,
        socket,
        isConnected: false,
        ownerId,
        companyId
      };

      this.connections.set(connectionId, connection);

      // Salvar sessão no Supabase
      await this.saveSessionToSupabase(connectionId, name, 'connecting', ownerId);

      return { success: true };
    } catch (error) {
      logger.error(`❌ Erro ao criar conexão ${connectionId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Configura eventos do socket WhatsApp
   */
  private setupSocketEvents(socket: WASocket, connectionId: string, ownerId: string, companyId?: string): void {
    // Evento de atualização de conexão
    socket.ev.on('connection.update', async (update) => {
      const connection = this.connections.get(connectionId);
      if (!connection) return;

      const { connection: connectionState, lastDisconnect, qr } = update;

      if (qr) {
        connection.qrCode = qr;
        await this.saveSessionToSupabase(connectionId, connection.name, 'connecting', ownerId, qr);
        this.emit('qrCode', { connectionId, qrCode: qr });
        logger.info(`📱 QR Code gerado para ${connectionId}`);
      }

      if (connectionState === 'close') {
        connection.isConnected = false;
        connection.qrCode = undefined;
        
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        
        if (shouldReconnect) {
          logger.warn(`⚠️ Conexão ${connectionId} fechada, tentando reconectar...`);
          setTimeout(() => this.reconnectConnection(connectionId), 5000);
        } else {
          logger.error(`❌ Conexão ${connectionId} deslogada, removendo...`);
          this.connections.delete(connectionId);
        }

        await this.saveSessionToSupabase(connectionId, connection.name, 'disconnected', ownerId);
        this.emit('disconnected', { connectionId });
      } else if (connectionState === 'open') {
        connection.isConnected = true;
        connection.lastSeen = new Date();
        connection.qrCode = undefined;
        
        await this.saveSessionToSupabase(connectionId, connection.name, 'connected', ownerId);
        this.emit('connected', { connectionId });
        logger.info(`✅ Conexão ${connectionId} estabelecida`);
      }
    });

    // Evento de mensagens recebidas
    socket.ev.on('messages.upsert', async (messageUpdate) => {
      try {
        const { messages, type } = messageUpdate;
        
        for (const message of messages) {
          if (type === 'notify' && message.key.fromMe === false) {
            await this.handleIncomingMessage(message, connectionId, ownerId, companyId);
          }
        }
      } catch (error) {
        logger.error(`❌ Erro ao processar mensagem recebida:`, error);
      }
    });

    // Evento de atualização de credenciais
    socket.ev.on('creds.update', saveCreds);
  }

  /**
   * Processa mensagem recebida
   */
  private async handleIncomingMessage(message: any, connectionId: string, ownerId: string, companyId?: string): Promise<void> {
    try {
      const from = message.key.remoteJid;
      const messageContent = this.extractMessageContent(message);
      
      if (!from || !messageContent) return;

      // Buscar ou criar atendimento
      const atendimento = await this.findOrCreateAtendimento(
        from,
        connectionId,
        ownerId,
        companyId
      );

      // Criar mensagem
      const messageData: WhatsAppMessage = {
        id: uuidv4(),
        owner_id: ownerId,
        atendimento_id: atendimento.id,
        conteudo: messageContent.text || '',
        tipo: this.mapMessageType(messageContent.type),
        remetente: 'CLIENTE',
        timestamp: new Date(message.messageTimestamp * 1000),
        lida: false,
        midia_url: messageContent.url,
        midia_tipo: messageContent.mimeType,
        midia_nome: messageContent.filename,
        midia_tamanho: messageContent.fileLength
      };

      // Salvar mensagem no Supabase
      await supabaseWhatsAppService.saveMessage(messageData);

      // Atualizar atendimento
      await this.updateAtendimentoLastMessage(atendimento.id, messageData.timestamp);

      this.emit('messageReceived', {
        connectionId,
        atendimentoId: atendimento.id,
        message: messageData
      });

      logger.info(`📨 Mensagem recebida de ${from}: ${messageContent.text?.substring(0, 50)}...`);
    } catch (error) {
      logger.error(`❌ Erro ao processar mensagem recebida:`, error);
    }
  }

  /**
   * Extrai conteúdo da mensagem
   */
  private extractMessageContent(message: any): { text?: string; type: string; url?: string; mimeType?: string; filename?: string; fileLength?: number } {
    const messageContent = message.message;
    if (!messageContent) return { type: 'unknown' };

    if (messageContent.conversation) {
      return { text: messageContent.conversation, type: 'text' };
    }

    if (messageContent.extendedTextMessage) {
      return { text: messageContent.extendedTextMessage.text, type: 'text' };
    }

    if (messageContent.imageMessage) {
      return {
        text: messageContent.imageMessage.caption,
        type: 'image',
        url: messageContent.imageMessage.url,
        mimeType: messageContent.imageMessage.mimetype,
        fileLength: messageContent.imageMessage.fileLength
      };
    }

    if (messageContent.videoMessage) {
      return {
        text: messageContent.videoMessage.caption,
        type: 'video',
        url: messageContent.videoMessage.url,
        mimeType: messageContent.videoMessage.mimetype,
        fileLength: messageContent.videoMessage.fileLength
      };
    }

    if (messageContent.audioMessage) {
      return {
        type: 'audio',
        url: messageContent.audioMessage.url,
        mimeType: messageContent.audioMessage.mimetype,
        fileLength: messageContent.audioMessage.fileLength
      };
    }

    if (messageContent.documentMessage) {
      return {
        text: messageContent.documentMessage.caption,
        type: 'document',
        url: messageContent.documentMessage.url,
        mimeType: messageContent.documentMessage.mimetype,
        filename: messageContent.documentMessage.fileName,
        fileLength: messageContent.documentMessage.fileLength
      };
    }

    return { type: 'unknown' };
  }

  /**
   * Mapeia tipo de mensagem do Baileys para nosso formato
   */
  private mapMessageType(type: string): 'TEXTO' | 'IMAGEM' | 'VIDEO' | 'AUDIO' | 'DOCUMENTO' | 'STICKER' | 'SISTEMA' {
    switch (type) {
      case 'text': return 'TEXTO';
      case 'image': return 'IMAGEM';
      case 'video': return 'VIDEO';
      case 'audio': return 'AUDIO';
      case 'document': return 'DOCUMENTO';
      case 'sticker': return 'STICKER';
      default: return 'SISTEMA';
    }
  }

  /**
   * Busca ou cria atendimento
   */
  private async findOrCreateAtendimento(
    numeroCliente: string,
    connectionId: string,
    ownerId: string,
    companyId?: string
  ): Promise<WhatsAppAtendimento> {
    try {
      // Buscar atendimento ativo
      const atendimentos = await supabaseWhatsAppService.getActiveAtendimentos(ownerId, companyId);
      const atendimentoAtivo = atendimentos.find(a => a.numero_cliente === numeroCliente);

      if (atendimentoAtivo) {
        return atendimentoAtivo;
      }

      // Criar novo atendimento
      const novoAtendimento: WhatsAppAtendimento = {
        id: uuidv4(),
        owner_id: ownerId,
        company_id: companyId,
        numero_cliente: numeroCliente,
        nome_cliente: `Cliente ${numeroCliente}`,
        status: 'AGUARDANDO',
        data_inicio: new Date(),
        ultima_mensagem: new Date(),
        prioridade: 1,
        canal: 'whatsapp'
      };

      await supabaseWhatsAppService.saveAtendimento(novoAtendimento);
      return novoAtendimento;
    } catch (error) {
      logger.error(`❌ Erro ao buscar/criar atendimento:`, error);
      throw error;
    }
  }

  /**
   * Atualiza última mensagem do atendimento
   */
  private async updateAtendimentoLastMessage(atendimentoId: string, timestamp: Date): Promise<void> {
    try {
      // Aqui você implementaria a atualização da última mensagem
      // Por enquanto, vamos apenas logar
      logger.info(`📝 Atualizando última mensagem do atendimento ${atendimentoId}`);
    } catch (error) {
      logger.error(`❌ Erro ao atualizar última mensagem:`, error);
    }
  }

  /**
   * Envia mensagem
   */
  async sendMessage(
    connectionId: string,
    to: string,
    content: string,
    type: 'text' | 'image' | 'video' | 'audio' | 'document' = 'text',
    mediaUrl?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection || !connection.isConnected) {
        return { success: false, error: 'Conexão não encontrada ou desconectada' };
      }

      let messageContent: any = {};

      switch (type) {
        case 'text':
          messageContent = { text: content };
          break;
        case 'image':
          messageContent = { image: { url: mediaUrl }, caption: content };
          break;
        case 'video':
          messageContent = { video: { url: mediaUrl }, caption: content };
          break;
        case 'audio':
          messageContent = { audio: { url: mediaUrl } };
          break;
        case 'document':
          messageContent = { document: { url: mediaUrl, fileName: content } };
          break;
      }

      const result = await connection.socket.sendMessage(to, messageContent);
      
      // Salvar mensagem enviada no Supabase
      const messageData: WhatsAppMessage = {
        id: uuidv4(),
        owner_id: connection.ownerId,
        atendimento_id: '', // Seria necessário buscar o atendimento ativo
        conteudo: content,
        tipo: this.mapMessageType(type),
        remetente: 'ATENDENTE',
        timestamp: new Date(),
        lida: true
      };

      await supabaseWhatsAppService.saveMessage(messageData);

      this.emit('messageSent', {
        connectionId,
        to,
        message: messageData
      });

      return { success: true, messageId: result?.key?.id };
    } catch (error) {
      logger.error(`❌ Erro ao enviar mensagem:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reconecta uma conexão
   */
  private async reconnectConnection(connectionId: string): Promise<void> {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) return;

      logger.info(`🔄 Reconectando ${connectionId}...`);
      
      // Aqui você implementaria a lógica de reconexão
      // Por simplicidade, vamos apenas marcar como desconectado
      connection.isConnected = false;
      
      await this.saveSessionToSupabase(
        connectionId,
        connection.name,
        'disconnected',
        connection.ownerId
      );
    } catch (error) {
      logger.error(`❌ Erro ao reconectar ${connectionId}:`, error);
    }
  }

  /**
   * Salva sessão no Supabase
   */
  private async saveSessionToSupabase(
    connectionId: string,
    name: string,
    status: 'disconnected' | 'connecting' | 'connected' | 'error',
    ownerId: string,
    qrCode?: string
  ): Promise<void> {
    try {
      const session: WhatsAppSession = {
        id: connectionId,
        owner_id: ownerId,
        session_name: name,
        status,
        qr_code: qrCode,
        connected_at: status === 'connected' ? new Date() : undefined,
        disconnected_at: status === 'disconnected' ? new Date() : undefined
      };

      await supabaseWhatsAppService.saveSession(session);
    } catch (error) {
      logger.error(`❌ Erro ao salvar sessão no Supabase:`, error);
    }
  }

  /**
   * Obtém conexão por ID
   */
  getConnection(connectionId: string): WhatsAppConnection | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Lista todas as conexões
   */
  getAllConnections(): WhatsAppConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Remove conexão
   */
  async removeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.socket.logout();
      this.connections.delete(connectionId);
      
      await this.saveSessionToSupabase(
        connectionId,
        connection.name,
        'disconnected',
        connection.ownerId
      );
      
      logger.info(`🗑️ Conexão ${connectionId} removida`);
    }
  }

  /**
   * Verifica se está rodando
   */
  isServiceRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Inicia o serviço
   */
  start(): void {
    this.isRunning = true;
    logger.info('🚀 Serviço WhatsApp Integration iniciado');
  }

  /**
   * Para o serviço
   */
  stop(): void {
    this.isRunning = false;
    
    if (this.watchdogInterval) {
      clearInterval(this.watchdogInterval);
    }

    // Fechar todas as conexões
    for (const [connectionId, connection] of this.connections) {
      connection.socket.logout();
    }
    
    this.connections.clear();
    logger.info('🛑 Serviço WhatsApp Integration parado');
  }

  /**
   * Destrói o serviço
   */
  destroy(): void {
    this.stop();
    this.removeAllListeners();
  }
}

// Instância singleton
export const whatsappIntegrationService = new WhatsAppIntegrationService();
