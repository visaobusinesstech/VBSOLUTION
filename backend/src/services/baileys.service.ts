import makeWASocket, { 
  ConnectionState, 
  DisconnectReason, 
  useMultiFileAuthState,
  WASocket,
  BaileysEventMap,
  proto,
  Browsers,
  fetchLatestBaileysVersion
} from 'baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs';
import P from 'pino';
import NodeCache from 'node-cache';
import { getMessageHistoryService } from './message-history.service';
import { getMessageHandlerService } from './message-handler.service';
import { PrismaClient } from '@prisma/client';

export interface BaileysConnection {
  id: string;
  name: string;
  socket: WASocket | null;
  connectionState: ConnectionState;
  qrCode: string | null;
  isConnected: boolean;
  phoneNumber?: string;
  pairingCode?: string;
}

export class BaileysService extends EventEmitter {
  private connections: Map<string, BaileysConnection> = new Map();
  private authDir: string;
  private groupCache: NodeCache;
  private messageCache: Map<string, proto.WebMessageInfo> = new Map();
  private logger: P.Logger;
  private version: any;
  private messageHistoryService: any;
  private messageHandlerService: any;

  constructor(prisma?: PrismaClient) {
    super();
    this.authDir = path.join(process.cwd(), 'auth_sessions');
    this.groupCache = new NodeCache({ 
      stdTTL: 1000 * 60 * 60 * 24, // 24 hours
      checkperiod: 1000 * 60 * 60 // 1 hour
    });
    
    // Configure logger
    this.logger = P({
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
      transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      } : undefined
    });

    // Initialize services if prisma is provided
    // Temporarily commented out to avoid recursion issues
    // if (prisma) {
    //   this.messageHistoryService = getMessageHistoryService(prisma);
    //   this.messageHandlerService = getMessageHandlerService(prisma);
    // }

    this.ensureAuthDir();
    // Initialize version asynchronously
    this.initializeVersion().catch(error => {
      this.logger.error('Error initializing version:', error);
    });
  }

  private ensureAuthDir() {
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }
  }

  private async initializeVersion() {
    try {
      // Use a fixed version to avoid network issues
      this.version = [2, 2413, 1];
      this.logger.info('Baileys version initialized:', this.version);
    } catch (error) {
      this.logger.error('Error fetching Baileys version:', error);
      // Use default version if fetch fails
      this.version = [2, 2413, 1];
    }
  }

  private getMessage = async (key: proto.IMessageKey): Promise<proto.WebMessageInfo | undefined> => {
    const messageKey = `${key.remoteJid}_${key.id}`;
    
    // Try cache first
    let message = this.messageCache.get(messageKey);
    if (message) {
      return message;
    }

    // For now, just return undefined to avoid recursion issues
    // TODO: Implement database lookup once the basic connection works
    return undefined;
  };

  async createConnection(connectionId: string, name: string, phoneNumber?: string): Promise<BaileysConnection> {
    try {
      // Wait for version to be initialized
      if (!this.version) {
        await this.initializeVersion();
      }
      
      const authPath = path.join(this.authDir, `auth_${connectionId}`);
      
      // Create auth state
      const { state, saveCreds } = await useMultiFileAuthState(authPath);
      
      // Create socket with recommended configuration
      const socket = makeWASocket({
        auth: state,
        version: this.version,
        logger: this.logger.child({ connectionId }),
        printQRInTerminal: false,
        browser: phoneNumber ? Browsers.macOS('Desktop') : Browsers.macOS('Desktop'),
        syncFullHistory: true,
        markOnlineOnConnect: false,
        getMessage: this.getMessage,
        cachedGroupMetadata: async (jid: string) => {
          return this.groupCache.get(jid);
        },
        generateHighQualityLinkPreview: true,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        connectTimeoutMs: 60000,
        retryRequestDelayMs: 250
      });

      const connection: BaileysConnection = {
        id: connectionId,
        name,
        socket,
        connectionState: 'connecting',
        qrCode: null,
        isConnected: false,
        phoneNumber
      };

      // Save credentials when updated
      socket.ev.on('creds.update', saveCreds);

      // Handle connection updates
      socket.ev.on('connection.update', async (update) => {
        await this.handleConnectionUpdate(connection, update);
      });

      // Handle messages
      socket.ev.on('messages.upsert', (m) => {
        // Cache messages for getMessage function
        m.messages.forEach(msg => {
          if (msg.key) {
            const messageKey = `${msg.key.remoteJid}_${msg.key.id}`;
            this.messageCache.set(messageKey, msg);
          }
        });
        
        this.emit('message', { connectionId, message: m });
      });

      // Handle presence updates
      socket.ev.on('presence.update', (presence) => {
        this.emit('presence', { connectionId, presence });
      });

      // Handle group metadata updates
      socket.ev.on('groups.update', (updates) => {
        updates.forEach(update => {
          if (update.id) {
            this.groupCache.set(update.id, update);
          }
        });
        this.emit('groupUpdate', { connectionId, updates });
      });

      // Handle contacts update
      socket.ev.on('contacts.update', (updates) => {
        this.emit('contactsUpdate', { connectionId, updates });
      });

      // Handle messaging history sync
      socket.ev.on('messaging-history.set', async ({ chats, contacts, messages, syncType }) => {
        this.emit('historySync', { 
          connectionId, 
          chats, 
          contacts, 
          messages, 
          syncType 
        });

        // Process and save to database if message history service is available
        if (this.messageHistoryService) {
          try {
            await this.messageHistoryService.processHistorySync(connectionId, {
              chats,
              contacts,
              messages,
              syncType
            });
            console.log(`History sync processed for connection ${connectionId}, type: ${syncType}`);
          } catch (error) {
            console.error('Error processing history sync:', error);
          }
        }
      });

      // Handle chat updates
      socket.ev.on('chats.update', (updates) => {
        this.emit('chatsUpdate', { connectionId, updates });
      });

      // Handle chat delete
      socket.ev.on('chats.delete', (deletedChats) => {
        this.emit('chatsDelete', { connectionId, deletedChats });
      });

      // Handle chat upsert (new chats)
      socket.ev.on('chats.upsert', (newChats) => {
        this.emit('chatsUpsert', { connectionId, newChats });
      });

      // Handle message events
      socket.ev.on('messages.upsert', async ({ type, messages }) => {
        this.emit('messagesUpsert', { connectionId, type, messages });
        
        // Process new messages if message handler service is available
        if (this.messageHandlerService && type === 'notify') {
          await this.processNewMessages(connectionId, messages);
        }
      });

      socket.ev.on('messages.update', async (updates) => {
        this.emit('messagesUpdate', { connectionId, updates });
        
        // Handle message updates
        if (this.messageHandlerService) {
          await this.messageHandlerService.handleMessageUpdate(connectionId, updates);
        }
      });

      socket.ev.on('messages.delete', (deletedMessages) => {
        this.emit('messagesDelete', { connectionId, deletedMessages });
      });

      socket.ev.on('messages.reaction', async (reactions) => {
        this.emit('messagesReaction', { connectionId, reactions });
        
        // Handle message reactions
        if (this.messageHandlerService) {
          await this.messageHandlerService.handleMessageReaction(connectionId, reactions);
        }
      });

      socket.ev.on('message-receipt.update', (receipts) => {
        this.emit('messageReceiptUpdate', { connectionId, receipts });
      });

      // Handle contact events
      socket.ev.on('contacts.upsert', (newContacts) => {
        this.emit('contactsUpsert', { connectionId, newContacts });
      });

      // Handle group events
      socket.ev.on('groups.upsert', (newGroups) => {
        this.emit('groupsUpsert', { connectionId, newGroups });
      });

      socket.ev.on('group-participants.update', (updates) => {
        this.emit('groupParticipantsUpdate', { connectionId, updates });
      });

      // Handle blocklist events
      socket.ev.on('blocklist.set', (blocklist) => {
        this.emit('blocklistSet', { connectionId, blocklist });
      });

      socket.ev.on('blocklist.update', (updates) => {
        this.emit('blocklistUpdate', { connectionId, updates });
      });

      // Handle call events
      socket.ev.on('call', (callData) => {
        this.emit('call', { connectionId, callData });
      });

      this.connections.set(connectionId, connection);
      this.emit('connectionCreated', connection);

      return connection;
    } catch (error) {
      console.error('Error creating Baileys connection:', error);
      throw error;
    }
  }

  private async handleConnectionUpdate(connection: BaileysConnection, update: Partial<BaileysEventMap['connection.update']>) {
    const { connection: conn, lastDisconnect, qr } = update;

    connection.connectionState = conn || 'connecting';

    // Handle QR Code
    if (qr) {
      try {
        connection.qrCode = await QRCode.toDataURL(qr);
        this.emit('qrCode', { connectionId: connection.id, qrCode: connection.qrCode });
      } catch (error) {
        console.error('Error generating QR code:', error);
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
    }

    // Handle successful connection
    if (conn === 'open') {
      connection.isConnected = true;
      connection.qrCode = null;
      console.log(`Connection ${connection.id} opened successfully`);
      this.emit('connectionOpened', { connectionId: connection.id });
    }

    this.emit('connectionUpdate', { connectionId: connection.id, update });
  }

  async requestPairingCode(connectionId: string, phoneNumber: string): Promise<string> {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.socket) {
      throw new Error('Connection not found');
    }

    try {
      const code = await connection.socket.requestPairingCode(phoneNumber);
      connection.pairingCode = code;
      connection.phoneNumber = phoneNumber;
      
      this.emit('pairingCode', { connectionId, code, phoneNumber });
      return code;
    } catch (error) {
      console.error('Error requesting pairing code:', error);
      throw error;
    }
  }

  async sendMessage(connectionId: string, jid: string, message: string): Promise<proto.WebMessageInfo | undefined> {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.socket || !connection.isConnected) {
      throw new Error('Connection not available or not connected');
    }

    try {
      const result = await connection.socket.sendMessage(jid, { text: message });
      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getConnectionInfo(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    return {
      id: connection.id,
      name: connection.name,
      isConnected: connection.isConnected,
      connectionState: connection.connectionState,
      phoneNumber: connection.phoneNumber,
      hasQRCode: !!connection.qrCode
    };
  }

  async getQRCode(connectionId: string): Promise<string | null> {
    const connection = this.connections.get(connectionId);
    return connection?.qrCode || null;
  }

  async disconnect(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.socket) {
      throw new Error('Connection not found');
    }

    try {
      await connection.socket.logout();
      connection.isConnected = false;
      connection.qrCode = null;
      this.connections.delete(connectionId);
      this.emit('connectionDisconnected', { connectionId });
    } catch (error) {
      console.error('Error disconnecting:', error);
      throw error;
    }
  }

  private async reconnect(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }

    try {
      // Create new socket with existing auth state
      const authPath = path.join(this.authDir, `auth_${connectionId}`);
      const { state, saveCreds } = await useMultiFileAuthState(authPath);
      
      const newSocket = makeWASocket({
        auth: state,
        version: this.version,
        logger: this.logger.child({ connectionId }),
        printQRInTerminal: false,
        browser: Browsers.macOS('Desktop'),
        syncFullHistory: true,
        markOnlineOnConnect: false,
        getMessage: this.getMessage,
        cachedGroupMetadata: async (jid: string) => {
          return this.groupCache.get(jid);
        },
        generateHighQualityLinkPreview: true,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        connectTimeoutMs: 60000,
        retryRequestDelayMs: 250
      });

      // Update connection with new socket
      connection.socket = newSocket;
      connection.connectionState = 'connecting';

      // Re-setup event listeners
      newSocket.ev.on('creds.update', saveCreds);
      newSocket.ev.on('connection.update', async (update) => {
        await this.handleConnectionUpdate(connection, update);
      });
      newSocket.ev.on('messages.upsert', (m) => {
        // Cache messages for getMessage function
        m.messages.forEach(msg => {
          if (msg.key) {
            const messageKey = `${msg.key.remoteJid}_${msg.key.id}`;
            this.messageCache.set(messageKey, msg);
          }
        });
        
        this.emit('message', { connectionId, message: m });
      });
      newSocket.ev.on('presence.update', (presence) => {
        this.emit('presence', { connectionId, presence });
      });
      newSocket.ev.on('groups.update', (updates) => {
        updates.forEach(update => {
          if (update.id) {
            this.groupCache.set(update.id, update);
          }
        });
        this.emit('groupUpdate', { connectionId, updates });
      });
      newSocket.ev.on('contacts.update', (updates) => {
        this.emit('contactsUpdate', { connectionId, updates });
      });
      newSocket.ev.on('messaging-history.set', ({ chats, contacts, messages, syncType }) => {
        this.emit('historySync', { 
          connectionId, 
          chats, 
          contacts, 
          messages, 
          syncType 
        });
      });
      newSocket.ev.on('chats.update', (updates) => {
        this.emit('chatsUpdate', { connectionId, updates });
      });
      newSocket.ev.on('chats.delete', (deletedChats) => {
        this.emit('chatsDelete', { connectionId, deletedChats });
      });
      newSocket.ev.on('chats.upsert', (newChats) => {
        this.emit('chatsUpsert', { connectionId, newChats });
      });
      newSocket.ev.on('messages.upsert', ({ type, messages }) => {
        this.emit('messagesUpsert', { connectionId, type, messages });
        if (this.messageHistoryService && type === 'notify') {
          this.processNewMessages(connectionId, messages);
        }
      });
      newSocket.ev.on('messages.update', (updates) => {
        this.emit('messagesUpdate', { connectionId, updates });
      });
      newSocket.ev.on('messages.delete', (deletedMessages) => {
        this.emit('messagesDelete', { connectionId, deletedMessages });
      });
      newSocket.ev.on('messages.reaction', (reactions) => {
        this.emit('messagesReaction', { connectionId, reactions });
      });
      newSocket.ev.on('message-receipt.update', (receipts) => {
        this.emit('messageReceiptUpdate', { connectionId, receipts });
      });
      newSocket.ev.on('contacts.upsert', (newContacts) => {
        this.emit('contactsUpsert', { connectionId, newContacts });
      });
      newSocket.ev.on('groups.upsert', (newGroups) => {
        this.emit('groupsUpsert', { connectionId, newGroups });
      });
      newSocket.ev.on('group-participants.update', (updates) => {
        this.emit('groupParticipantsUpdate', { connectionId, updates });
      });
      newSocket.ev.on('blocklist.set', (blocklist) => {
        this.emit('blocklistSet', { connectionId, blocklist });
      });
      newSocket.ev.on('blocklist.update', (updates) => {
        this.emit('blocklistUpdate', { connectionId, updates });
      });
      newSocket.ev.on('call', (callData) => {
        this.emit('call', { connectionId, callData });
      });

      console.log(`Reconnected ${connectionId}`);
    } catch (error) {
      console.error('Error reconnecting:', error);
    }
  }

  getAllConnections(): BaileysConnection[] {
    return Array.from(this.connections.values());
  }

  getConnection(connectionId: string): BaileysConnection | undefined {
    return this.connections.get(connectionId);
  }

  // Fetch message history on demand
  async fetchMessageHistory(connectionId: string, jid: string, count: number = 50) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.socket || !connection.isConnected) {
      throw new Error('Connection not available or not connected');
    }

    try {
      const history = await connection.socket.fetchMessageHistory(jid, count);
      this.emit('messageHistory', { connectionId, jid, history });
      return history;
    } catch (error) {
      console.error('Error fetching message history:', error);
      throw error;
    }
  }

  // Get chat list
  async getChats(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.socket || !connection.isConnected) {
      throw new Error('Connection not available or not connected');
    }

    try {
      const chats = await connection.socket.getChats();
      return chats;
    } catch (error) {
      console.error('Error getting chats:', error);
      throw error;
    }
  }

  // Get contacts
  async getContacts(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.socket || !connection.isConnected) {
      throw new Error('Connection not available or not connected');
    }

    try {
      const contacts = await connection.socket.getContacts();
      return contacts;
    } catch (error) {
      console.error('Error getting contacts:', error);
      throw error;
    }
  }

  // Get profile picture
  async getProfilePicture(connectionId: string, jid: string) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.socket || !connection.isConnected) {
      throw new Error('Connection not available or not connected');
    }

    try {
      const profilePicture = await connection.socket.profilePictureUrl(jid);
      return profilePicture;
    } catch (error) {
      console.error('Error getting profile picture:', error);
      return null;
    }
  }

  // Get chat metadata
  async getChatMetadata(connectionId: string, jid: string) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.socket || !connection.isConnected) {
      throw new Error('Connection not available or not connected');
    }

    try {
      const metadata = await connection.socket.getChatMetadata(jid);
      return metadata;
    } catch (error) {
      console.error('Error getting chat metadata:', error);
      throw error;
    }
  }

  // Process new messages in real-time
  private async processNewMessages(connectionId: string, messages: proto.IWebMessageInfo[]) {
    if (!this.messageHandlerService) return;

    try {
      // Process each message using the message handler service
      for (const message of messages) {
        try {
          const processedMessage = await this.messageHandlerService.processMessage(connectionId, message);
          
          // Cache message for getMessage function
          if (message.key?.remoteJid && message.key?.id) {
            const messageKey = `${message.key.remoteJid}_${message.key.id}`;
            this.messageCache.set(messageKey, message);
          }

          console.log(`Processed message ${processedMessage.id} of type ${processedMessage.messageType}`);
        } catch (error) {
          console.error('Error processing individual message:', error);
        }
      }

      console.log(`Processed ${messages.length} new messages for connection ${connectionId}`);
    } catch (error) {
      console.error('Error processing new messages:', error);
    }
  }

  // Send message
  async sendMessage(connectionId: string, jid: string, message: any) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.socket || !connection.isConnected) {
      throw new Error('Connection not available or not connected');
    }

    try {
      const result = await connection.socket.sendMessage(jid, message);
      this.emit('messageSent', { connectionId, jid, message, result });
      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Send text message
  async sendTextMessage(connectionId: string, jid: string, text: string, replyTo?: string) {
    if (!this.messageHandlerService) {
      throw new Error('Message handler service not available');
    }

    const message = this.messageHandlerService.createTextMessage(text, replyTo);
    return this.sendMessage(connectionId, jid, message);
  }

  // Send media message
  async sendMediaMessage(
    connectionId: string, 
    jid: string, 
    mediaType: 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'voice',
    mediaData: {
      url?: string;
      mimetype?: string;
      filename?: string;
      caption?: string;
    }
  ) {
    if (!this.messageHandlerService) {
      throw new Error('Message handler service not available');
    }

    const message = this.messageHandlerService.createMediaMessage(mediaType, mediaData);
    return this.sendMessage(connectionId, jid, message);
  }

  // Send location message
  async sendLocationMessage(
    connectionId: string, 
    jid: string, 
    latitude: number, 
    longitude: number, 
    name?: string, 
    address?: string
  ) {
    if (!this.messageHandlerService) {
      throw new Error('Message handler service not available');
    }

    const message = this.messageHandlerService.createLocationMessage(latitude, longitude, name, address);
    return this.sendMessage(connectionId, jid, message);
  }

  // Send contact message
  async sendContactMessage(connectionId: string, jid: string, name: string, number: string, vcard?: string) {
    if (!this.messageHandlerService) {
      throw new Error('Message handler service not available');
    }

    const message = this.messageHandlerService.createContactMessage(name, number, vcard);
    return this.sendMessage(connectionId, jid, message);
  }

  // Mark message as read
  async markMessageAsRead(connectionId: string, jid: string, messageId: string) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.socket || !connection.isConnected) {
      throw new Error('Connection not available or not connected');
    }

    try {
      await connection.socket.readMessages([{ remoteJid: jid, id: messageId }]);
      this.emit('messageRead', { connectionId, jid, messageId });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  // Get presence
  async getPresence(connectionId: string, jid: string) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.socket || !connection.isConnected) {
      throw new Error('Connection not available or not connected');
    }

    try {
      const presence = await connection.socket.presenceSubscribe(jid);
      return presence;
    } catch (error) {
      console.error('Error getting presence:', error);
      throw error;
    }
  }

  // Update presence
  async updatePresence(connectionId: string, presence: 'unavailable' | 'available' | 'composing' | 'recording' | 'paused') {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.socket || !connection.isConnected) {
      throw new Error('Connection not available or not connected');
    }

    try {
      await connection.socket.updatePresence(presence);
      this.emit('presenceUpdated', { connectionId, presence });
    } catch (error) {
      console.error('Error updating presence:', error);
      throw error;
    }
  }
}

// Singleton instance
let baileysService: BaileysService | null = null;

export const getBaileysService = (prisma?: PrismaClient) => {
  if (!baileysService) {
    baileysService = new BaileysService(prisma);
  }
  return baileysService;
};


