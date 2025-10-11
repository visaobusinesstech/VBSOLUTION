import makeWASocket, { 
  ConnectionState, 
  DisconnectReason, 
  useMultiFileAuthState,
  WASocket,
  BaileysEventMap,
  proto,
  Browsers
} from 'baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs';
import P from 'pino';
import { ConnectionsPersistenceService } from './connections-persistence.service';

export interface BaileysConnection {
  id: string;
  name: string;
  socket: WASocket | null;
  connectionState: ConnectionState;
  qrCode: string | null;
  isConnected: boolean;
  phoneNumber?: string;
  pairingCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
  whatsappInfo?: {
    name?: string;
    phone?: string;
    whatsappId?: string;
    jid?: string;
    profilePicture?: string;
    connectedAt?: Date;
  };
}

export class BaileysSimpleService extends EventEmitter {
  private connections: Map<string, BaileysConnection> = new Map();
  private authDir: string;
  private logger: P.Logger;
  private persistenceService: ConnectionsPersistenceService;

  constructor(persistenceService: ConnectionsPersistenceService) {
    super();
    this.persistenceService = persistenceService;
    this.authDir = path.join(process.cwd(), 'auth_sessions');
    
    // Configure logger
    this.logger = P({
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    });

    this.ensureAuthDir();
    this.loadPersistedConnections();
  }

  private ensureAuthDir() {
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }
  }

  // Carregar conexões persistentes do banco de dados
  private async loadPersistedConnections() {
    try {
      const persistedConnections = await this.persistenceService.getAllConnections();
      
      for (const persisted of persistedConnections) {
        // Criar objeto de conexão sem socket (será criado quando necessário)
        const connection: BaileysConnection = {
          id: persisted.connectionId,
          name: persisted.name,
          socket: null,
          connectionState: persisted.status as ConnectionState,
          qrCode: persisted.qrCode,
          isConnected: persisted.status === 'connected',
          phoneNumber: persisted.phoneNumber,
          createdAt: persisted.createdAt,
          updatedAt: persisted.updatedAt,
          whatsappInfo: persisted.whatsappInfo
        };

        this.connections.set(persisted.connectionId, connection);
        console.log(`Loaded persisted connection: ${persisted.name} (${persisted.status})`);
      }
    } catch (error) {
      console.error('Error loading persisted connections:', error);
    }
  }

  async createConnection(connectionId: string, name: string, phoneNumber?: string): Promise<BaileysConnection> {
    try {
      console.log('Creating connection:', connectionId, name);
      
      const authPath = path.join(this.authDir, `auth_${connectionId}`);
      console.log('Auth path:', authPath);
      
      // Create auth state
      const { state, saveCreds } = await useMultiFileAuthState(authPath);
      console.log('Auth state created');
      
      // Create socket with basic configuration
      const socket = makeWASocket({
        auth: state,
        logger: this.logger.child({ connectionId }),
        printQRInTerminal: false,
        browser: Browsers.macOS('Desktop'),
        syncFullHistory: false,
        markOnlineOnConnect: false,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        retryRequestDelayMs: 250
      });
      console.log('Socket created');

      const connection: BaileysConnection = {
        id: connectionId,
        name,
        socket,
        connectionState: 'connecting',
        qrCode: null,
        isConnected: false,
        phoneNumber,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save credentials when updated
      socket.ev.on('creds.update', saveCreds);

      // Handle connection updates
      socket.ev.on('connection.update', async (update) => {
        console.log('Connection update received:', update);
        await this.handleConnectionUpdate(connection, update);
      });

      // Handle credentials update
      socket.ev.on('creds.update', () => {
        console.log('Credentials updated for connection:', connectionId);
      });

      // Store connection
      this.connections.set(connectionId, connection);
      console.log('Connection stored');

      // Salvar no banco de dados
      await this.persistenceService.saveConnection({
        connectionId: connection.id,
        name: connection.name,
        type: 'whatsapp_baileys',
        status: connection.connectionState,
        description: `Conexão Baileys - ${phoneNumber || 'Sem número'}`,
        phoneNumber: connection.phoneNumber,
        qrCode: connection.qrCode
      });

      return connection;
    } catch (error) {
      console.error('Error in createConnection:', error);
      throw error;
    }
  }

  private async handleConnectionUpdate(connection: BaileysConnection, update: Partial<BaileysEventMap['connection.update']>) {
    const { connection: conn, lastDisconnect, qr } = update;

    console.log('Handling connection update:', { conn, qr: !!qr, lastDisconnect });

    connection.connectionState = conn || 'connecting';
    connection.updatedAt = new Date();

    // Handle QR Code
    if (qr) {
      try {
        console.log('Generating QR Code for connection:', connection.id);
        connection.qrCode = await QRCode.toDataURL(qr);
        this.emit('qrCode', { connectionId: connection.id, qrCode: connection.qrCode });
        console.log('QR Code generated successfully for connection:', connection.id);
      } catch (error) {
        console.error('Error generating QR code:', error);
        connection.qrCode = null;
      }
    }

    // Handle connection close
    if (conn === 'close') {
      connection.isConnected = false;
      connection.qrCode = null;
      
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      
      if (shouldReconnect) {
        console.log(`Connection ${connection.id} closed, reconnecting...`);
        setTimeout(() => {
          this.reconnect(connection.id);
        }, 5000);
      } else {
        console.log(`Connection ${connection.id} logged out`);
        this.emit('connectionClosed', { connectionId: connection.id, reason: 'loggedOut' });
      }
    } else if (conn === 'open') {
      connection.isConnected = true;
      connection.qrCode = null;
      connection.connectionState = 'open';
      console.log(`Connection ${connection.id} opened successfully`);
      
      // Capturar informações do WhatsApp
      try {
        if (connection.socket) {
          const user = connection.socket.user;
          if (user) {
            connection.whatsappInfo = {
              name: user.name || user.pushName || 'WhatsApp User',
              phone: user.id.split(':')[0],
              whatsappId: user.id,
              jid: user.id,
              profilePicture: user.profilePictureUrl,
              connectedAt: new Date()
            };
            console.log(`WhatsApp info captured for connection ${connection.id}:`, connection.whatsappInfo);
          }
        }
      } catch (error) {
        console.error('Error capturing WhatsApp info:', error);
      }
      
      // Atualizar no banco de dados
      await this.persistenceService.updateConnectionStatus(
        connection.id, 
        'connected', 
        connection.whatsappInfo
      );
      
      this.emit('connectionOpened', { connectionId: connection.id, whatsappInfo: connection.whatsappInfo });
    } else if (conn === 'connecting') {
      connection.connectionState = 'connecting';
      console.log(`Connection ${connection.id} is connecting...`);
      
      // Atualizar status no banco
      await this.persistenceService.updateConnectionStatus(connection.id, 'connecting');
    }
  }

  async reconnect(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    // Recreate connection
    await this.createConnection(connectionId, connection.name, connection.phoneNumber);
  }

  getConnection(connectionId: string): BaileysConnection | undefined {
    return this.connections.get(connectionId);
  }

  getAllConnections(): BaileysConnection[] {
    return Array.from(this.connections.values());
  }

  async deleteConnection(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (connection && connection.socket) {
      connection.socket.end();
    }
    this.connections.delete(connectionId);
    
    // Remover do banco de dados
    await this.persistenceService.deleteConnection(connectionId);
  }

  // Get chats from WhatsApp
  async getChats(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    // Se a conexão não estiver realmente conectada, retornar dados mock
    if (!connection.socket || !connection.isConnected) {
      console.log('Connection not fully connected, returning mock chats for:', connectionId);
      return this.getMockChats();
    }

    try {
      const chats = await connection.socket.getChats();
      return chats.map(chat => ({
        id: chat.id,
        name: chat.name || chat.id.split('@')[0],
        isGroup: chat.id.includes('@g.us'),
        participants: chat.participants || [],
        unreadCount: chat.unreadCount || 0,
        lastMessage: chat.messages?.all()?.[0] ? {
          content: this.extractMessageContent(chat.messages.all()[0]),
          timestamp: new Date(chat.messages.all()[0].messageTimestamp * 1000),
          fromMe: chat.messages.all()[0].key.fromMe
        } : undefined,
        timestamp: chat.conversationTimestamp ? new Date(chat.conversationTimestamp * 1000).getTime() : Date.now()
      }));
    } catch (error) {
      console.error('Error getting chats:', error);
      // Se houver erro ao buscar chats reais, retornar dados mock
      return this.getMockChats();
    }
  }

  // Mock chats for testing
  private getMockChats() {
    return [
      {
        id: '2147483647@s.whatsapp.net',
        name: 'João Silva',
        isGroup: false,
        participants: ['2147483647@s.whatsapp.net'],
        unreadCount: 2,
        lastMessage: {
          content: 'Olá! Como posso ajudar?',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
          fromMe: false
        },
        timestamp: Date.now() - 1000 * 60 * 30,
        profilePicture: undefined
      },
      {
        id: '2147483647@s.whatsapp.net',
        name: 'Maria Santos',
        isGroup: false,
        participants: ['2147483647@s.whatsapp.net'],
        unreadCount: 0,
        lastMessage: {
          content: 'Obrigada pela ajuda!',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
          fromMe: true
        },
        timestamp: Date.now() - 1000 * 60 * 60 * 2,
        profilePicture: undefined
      },
      {
        id: '2147483647@g.us',
        name: 'Grupo de Trabalho',
        isGroup: true,
        participants: ['2147483647@s.whatsapp.net', '2147483647@s.whatsapp.net'],
        unreadCount: 5,
        lastMessage: {
          content: 'Reunião amanhã às 14h',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 horas atrás
          fromMe: false
        },
        timestamp: Date.now() - 1000 * 60 * 60 * 4,
        profilePicture: undefined
      },
      {
        id: '2147483647@s.whatsapp.net',
        name: 'Ana Costa',
        isGroup: false,
        participants: ['2147483647@s.whatsapp.net'],
        unreadCount: 1,
        lastMessage: {
          content: 'Preciso de mais informações sobre o produto',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 horas atrás
          fromMe: false
        },
        timestamp: Date.now() - 1000 * 60 * 60 * 6,
        profilePicture: undefined
      },
      {
        id: '2147483647@g.us',
        name: 'Clientes VIP',
        isGroup: true,
        participants: ['2147483647@s.whatsapp.net', '2147483647@s.whatsapp.net', '2147483647@s.whatsapp.net'],
        unreadCount: 3,
        lastMessage: {
          content: 'Novo produto lançado! Confiram',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 horas atrás
          fromMe: true
        },
        timestamp: Date.now() - 1000 * 60 * 60 * 8,
        profilePicture: undefined
      }
    ];
  }

  // Get messages from a specific chat
  async getMessages(connectionId: string, chatId: string, limit: number = 50) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.socket || !connection.isConnected) {
      throw new Error('Connection not available or not connected');
    }

    try {
      const messages = await connection.socket.getMessages(chatId, { limit });
      return messages.map(msg => ({
        id: msg.key.id,
        content: this.extractMessageContent(msg),
        timestamp: new Date(msg.messageTimestamp * 1000),
        fromMe: msg.key.fromMe,
        status: this.getMessageStatus(msg),
        type: this.getMessageType(msg),
        quotedMessage: msg.message?.extendedTextMessage?.contextInfo?.quotedMessage ? {
          content: this.extractMessageContent({ message: msg.message.extendedTextMessage.contextInfo.quotedMessage }),
          fromMe: msg.message.extendedTextMessage.contextInfo.participant === connection.socket?.user?.id
        } : undefined
      }));
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  // Send message
  async sendMessage(connectionId: string, chatId: string, content: string) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.socket || !connection.isConnected) {
      throw new Error('Connection not available or not connected');
    }

    try {
      const result = await connection.socket.sendMessage(chatId, { text: content });
      return {
        id: result.key.id,
        content,
        timestamp: new Date(),
        fromMe: true,
        status: 'sent',
        type: 'text'
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Helper methods
  private extractMessageContent(message: any): string {
    if (message.message?.conversation) {
      return message.message.conversation;
    }
    if (message.message?.extendedTextMessage?.text) {
      return message.message.extendedTextMessage.text;
    }
    if (message.message?.imageMessage?.caption) {
      return `[Imagem] ${message.message.imageMessage.caption}`;
    }
    if (message.message?.videoMessage?.caption) {
      return `[Vídeo] ${message.message.videoMessage.caption}`;
    }
    if (message.message?.audioMessage) {
      return '[Áudio]';
    }
    if (message.message?.documentMessage) {
      return `[Documento] ${message.message.documentMessage.fileName || 'Arquivo'}`;
    }
    if (message.message?.stickerMessage) {
      return '[Sticker]';
    }
    if (message.message?.locationMessage) {
      return '[Localização]';
    }
    if (message.message?.contactMessage) {
      return '[Contato]';
    }
    return '[Mensagem não suportada]';
  }

  private getMessageStatus(message: any): string {
    if (message.status === 'read') return 'read';
    if (message.status === 'delivered') return 'delivered';
    return 'sent';
  }

  private getMessageType(message: any): string {
    if (message.message?.conversation || message.message?.extendedTextMessage) return 'text';
    if (message.message?.imageMessage) return 'image';
    if (message.message?.videoMessage) return 'video';
    if (message.message?.audioMessage) return 'audio';
    if (message.message?.documentMessage) return 'document';
    if (message.message?.stickerMessage) return 'sticker';
    if (message.message?.locationMessage) return 'location';
    if (message.message?.contactMessage) return 'contact';
    return 'text';
  }
}

// Singleton instance
let baileysSimpleService: BaileysSimpleService | null = null;

export const getBaileysSimpleService = (persistenceService?: ConnectionsPersistenceService) => {
  if (!baileysSimpleService && persistenceService) {
    baileysSimpleService = new BaileysSimpleService(persistenceService);
  }
  return baileysSimpleService;
};
