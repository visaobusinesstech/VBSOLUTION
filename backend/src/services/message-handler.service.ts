import { proto } from 'baileys';
import { EventEmitter } from 'events';
import { getMessageHistoryService } from './message-history.service';
import { PrismaClient } from '@prisma/client';

export interface ProcessedMessage {
  id: string;
  connectionId: string;
  remoteJid: string;
  fromMe: boolean;
  messageType: string;
  content: any;
  timestamp: Date;
  status?: string;
  quotedMessage?: any;
  contextInfo?: any;
}

export interface TextMessage {
  type: 'text';
  text: string;
  isExtended?: boolean;
  linkPreview?: any;
  replyTo?: string;
}

export interface MediaMessage {
  type: 'media';
  mediaType: 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'voice';
  url?: string;
  mimetype?: string;
  filename?: string;
  caption?: string;
  thumbnail?: string;
  fileSize?: number;
  duration?: number;
}

export interface LocationMessage {
  type: 'location';
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface ContactMessage {
  type: 'contact';
  name: string;
  number: string;
  vcard?: string;
}

export interface GroupInviteMessage {
  type: 'group_invite';
  groupName: string;
  groupJid: string;
  inviteCode: string;
  inviteExpiration?: number;
}

export type ParsedMessage = TextMessage | MediaMessage | LocationMessage | ContactMessage | GroupInviteMessage;

export class MessageHandlerService extends EventEmitter {
  private messageHistoryService: any;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    this.messageHistoryService = getMessageHistoryService(prisma);
  }

  // Process incoming message
  async processMessage(connectionId: string, message: proto.IWebMessageInfo): Promise<ProcessedMessage> {
    try {
      const messageKey = `${message.key?.remoteJid}_${message.key?.id}`;
      
      // Parse message content
      const parsedMessage = this.parseMessage(message);
      
      // Create processed message object
      const processedMessage: ProcessedMessage = {
        id: messageKey,
        connectionId,
        remoteJid: message.key?.remoteJid || '',
        fromMe: message.key?.fromMe || false,
        messageType: parsedMessage.type,
        content: parsedMessage,
        timestamp: new Date((message.messageTimestamp || 0) * 1000),
        status: message.status,
        quotedMessage: message.message?.extendedTextMessage?.contextInfo?.quotedMessage,
        contextInfo: message.message?.extendedTextMessage?.contextInfo
      };

      // Save to database
      await this.saveMessage(processedMessage);

      // Emit event for real-time processing
      this.emit('messageProcessed', processedMessage);

      return processedMessage;
    } catch (error) {
      console.error('Error processing message:', error);
      throw error;
    }
  }

  // Parse message content based on type
  private parseMessage(message: proto.IWebMessageInfo): ParsedMessage {
    const msg = message.message;
    if (!msg) {
      throw new Error('No message content found');
    }

    // Text messages
    if (msg.conversation) {
      return {
        type: 'text',
        text: msg.conversation,
        isExtended: false
      };
    }

    if (msg.extendedTextMessage) {
      const extended = msg.extendedTextMessage;
      return {
        type: 'text',
        text: extended.text || '',
        isExtended: true,
        linkPreview: extended.contextInfo?.quotedMessage ? undefined : extended.canonicalUrl,
        replyTo: extended.contextInfo?.quotedMessage?.key?.id
      };
    }

    // Media messages
    if (msg.imageMessage) {
      return this.parseMediaMessage('image', msg.imageMessage);
    }

    if (msg.videoMessage) {
      return this.parseMediaMessage('video', msg.videoMessage);
    }

    if (msg.audioMessage) {
      return this.parseMediaMessage('audio', msg.audioMessage);
    }

    if (msg.documentMessage) {
      return this.parseMediaMessage('document', msg.documentMessage);
    }

    if (msg.stickerMessage) {
      return this.parseMediaMessage('sticker', msg.stickerMessage);
    }

    if (msg.voiceMessage) {
      return this.parseMediaMessage('voice', msg.voiceMessage);
    }

    // Location messages
    if (msg.locationMessage) {
      const location = msg.locationMessage;
      return {
        type: 'location',
        latitude: location.degreesLatitude || 0,
        longitude: location.degreesLongitude || 0,
        name: location.name,
        address: location.address
      };
    }

    // Contact messages
    if (msg.contactMessage) {
      const contact = msg.contactMessage;
      return {
        type: 'contact',
        name: contact.displayName || '',
        number: contact.vcard || '',
        vcard: contact.vcard
      };
    }

    // Group invite messages
    if (msg.groupInviteMessage) {
      const invite = msg.groupInviteMessage;
      return {
        type: 'group_invite',
        groupName: invite.groupName || '',
        groupJid: invite.groupJid || '',
        inviteCode: invite.inviteCode || '',
        inviteExpiration: invite.inviteExpiration
      };
    }

    // Unknown message type
    return {
      type: 'text',
      text: '[Mensagem não suportada]',
      isExtended: false
    };
  }

  // Parse media message
  private parseMediaMessage(mediaType: MediaMessage['mediaType'], mediaData: any): MediaMessage {
    return {
      type: 'media',
      mediaType,
      url: mediaData.url,
      mimetype: mediaData.mimetype,
      filename: mediaData.fileName,
      caption: mediaData.caption,
      thumbnail: mediaData.jpegThumbnail ? `data:image/jpeg;base64,${mediaData.jpegThumbnail.toString('base64')}` : undefined,
      fileSize: mediaData.fileLength,
      duration: mediaData.seconds
    };
  }

  // Save message to database
  private async saveMessage(processedMessage: ProcessedMessage) {
    try {
      await this.messageHistoryService.saveMessages(processedMessage.connectionId, [{
        key: {
          remoteJid: processedMessage.remoteJid,
          fromMe: processedMessage.fromMe,
          id: processedMessage.id
        },
        message: processedMessage.content,
        messageTimestamp: Math.floor(processedMessage.timestamp.getTime() / 1000),
        status: processedMessage.status
      }]);
    } catch (error) {
      console.error('Error saving message to database:', error);
    }
  }

  // Create text message for sending
  createTextMessage(text: string, replyTo?: string): proto.IMessage {
    if (replyTo) {
      return {
        extendedTextMessage: {
          text: text,
          contextInfo: {
            quotedMessage: {
              key: {
                id: replyTo
              }
            }
          }
        }
      };
    }

    return {
      conversation: text
    };
  }

  // Create media message for sending
  createMediaMessage(
    mediaType: MediaMessage['mediaType'],
    mediaData: {
      url?: string;
      mimetype?: string;
      filename?: string;
      caption?: string;
    }
  ): proto.IMessage {
    const baseMessage: any = {
      mimetype: mediaData.mimetype,
      caption: mediaData.caption
    };

    if (mediaData.url) {
      baseMessage.url = mediaData.url;
    }

    if (mediaData.filename) {
      baseMessage.fileName = mediaData.filename;
    }

    switch (mediaType) {
      case 'image':
        return { imageMessage: baseMessage };
      case 'video':
        return { videoMessage: baseMessage };
      case 'audio':
        return { audioMessage: baseMessage };
      case 'document':
        return { documentMessage: baseMessage };
      case 'sticker':
        return { stickerMessage: baseMessage };
      case 'voice':
        return { voiceMessage: baseMessage };
      default:
        throw new Error(`Unsupported media type: ${mediaType}`);
    }
  }

  // Create location message for sending
  createLocationMessage(latitude: number, longitude: number, name?: string, address?: string): proto.IMessage {
    return {
      locationMessage: {
        degreesLatitude: latitude,
        degreesLongitude: longitude,
        name: name,
        address: address
      }
    };
  }

  // Create contact message for sending
  createContactMessage(name: string, number: string, vcard?: string): proto.IMessage {
    return {
      contactMessage: {
        displayName: name,
        vcard: vcard || `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${number}\nEND:VCARD`
      }
    };
  }

  // Get message by ID
  async getMessage(connectionId: string, messageId: string): Promise<ProcessedMessage | null> {
    try {
      const dbMessage = await this.messageHistoryService.getMessage(connectionId, messageId);
      if (!dbMessage) return null;

      return {
        id: messageId,
        connectionId,
        remoteJid: dbMessage.remoteJid,
        fromMe: dbMessage.fromMe,
        messageType: 'unknown', // Would need to parse from stored message
        content: dbMessage.message,
        timestamp: dbMessage.messageTimestamp,
        status: dbMessage.status
      };
    } catch (error) {
      console.error('Error getting message:', error);
      return null;
    }
  }

  // Get messages by chat
  async getMessagesByChat(connectionId: string, chatId: string, limit: number = 50): Promise<ProcessedMessage[]> {
    try {
      const dbMessages = await this.messageHistoryService.getMessagesByChat(connectionId, chatId, limit);
      
      return dbMessages.map(dbMsg => ({
        id: dbMsg.messageKey,
        connectionId,
        remoteJid: dbMsg.remoteJid,
        fromMe: dbMsg.fromMe,
        messageType: 'unknown', // Would need to parse from stored message
        content: dbMsg.message,
        timestamp: dbMsg.messageTimestamp,
        status: dbMsg.status
      }));
    } catch (error) {
      console.error('Error getting messages by chat:', error);
      return [];
    }
  }

  // Update message status
  async updateMessageStatus(connectionId: string, messageId: string, status: string) {
    try {
      // This would need to be implemented in the message history service
      console.log(`Updating message ${messageId} status to ${status} for connection ${connectionId}`);
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  }

  // Handle message reactions
  async handleMessageReaction(connectionId: string, reaction: any) {
    try {
      console.log(`Handling message reaction for connection ${connectionId}:`, reaction);
      this.emit('messageReaction', { connectionId, reaction });
    } catch (error) {
      console.error('Error handling message reaction:', error);
    }
  }

  // Handle message updates (edit, delete, etc.)
  async handleMessageUpdate(connectionId: string, update: any) {
    try {
      console.log(`Handling message update for connection ${connectionId}:`, update);
      this.emit('messageUpdate', { connectionId, update });
    } catch (error) {
      console.error('Error handling message update:', error);
    }
  }
}

// Singleton instance
let messageHandlerService: MessageHandlerService | null = null;

export const getMessageHandlerService = (prisma: PrismaClient) => {
  if (!messageHandlerService) {
    messageHandlerService = new MessageHandlerService(prisma);
  }
  return messageHandlerService;
};
