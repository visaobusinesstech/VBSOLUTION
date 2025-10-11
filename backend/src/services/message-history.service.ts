import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';

export interface WhatsAppChat {
  id: string;
  name?: string;
  isGroup: boolean;
  participants: string[];
  unreadCount: number;
  lastMessage?: any;
  timestamp: number;
}

export interface WhatsAppContact {
  id: string;
  name?: string;
  notify?: string;
  verifiedName?: string;
  imgUrl?: string;
}

export interface WhatsAppMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message?: any;
  messageTimestamp: number;
  status?: string;
}

export class MessageHistoryService extends EventEmitter {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
  }

  // Salvar chats sincronizados
  async saveChats(connectionId: string, chats: WhatsAppChat[]) {
    try {
      for (const chat of chats) {
        await this.prisma.whatsappChat.upsert({
          where: {
            connectionId_chatId: {
              connectionId,
              chatId: chat.id
            }
          },
          update: {
            name: chat.name,
            isGroup: chat.isGroup,
            participants: chat.participants,
            unreadCount: chat.unreadCount,
            lastMessage: chat.lastMessage,
            timestamp: new Date(chat.timestamp * 1000),
            updatedAt: new Date()
          },
          create: {
            connectionId,
            chatId: chat.id,
            name: chat.name,
            isGroup: chat.isGroup,
            participants: chat.participants,
            unreadCount: chat.unreadCount,
            lastMessage: chat.lastMessage,
            timestamp: new Date(chat.timestamp * 1000)
          }
        });
      }

      this.emit('chatsSaved', { connectionId, count: chats.length });
      console.log(`Saved ${chats.length} chats for connection ${connectionId}`);
    } catch (error) {
      console.error('Error saving chats:', error);
      throw error;
    }
  }

  // Salvar contatos sincronizados
  async saveContacts(connectionId: string, contacts: WhatsAppContact[]) {
    try {
      for (const contact of contacts) {
        await this.prisma.whatsappContact.upsert({
          where: {
            connectionId_contactId: {
              connectionId,
              contactId: contact.id
            }
          },
          update: {
            name: contact.name,
            notify: contact.notify,
            verifiedName: contact.verifiedName,
            imgUrl: contact.imgUrl,
            updatedAt: new Date()
          },
          create: {
            connectionId,
            contactId: contact.id,
            name: contact.name,
            notify: contact.notify,
            verifiedName: contact.verifiedName,
            imgUrl: contact.imgUrl
          }
        });
      }

      this.emit('contactsSaved', { connectionId, count: contacts.length });
      console.log(`Saved ${contacts.length} contacts for connection ${connectionId}`);
    } catch (error) {
      console.error('Error saving contacts:', error);
      throw error;
    }
  }

  // Salvar mensagens sincronizadas
  async saveMessages(connectionId: string, messages: WhatsAppMessage[]) {
    try {
      for (const message of messages) {
        const messageKey = `${message.key.remoteJid}_${message.key.id}`;
        
        await this.prisma.whatsappMessage.upsert({
          where: {
            connectionId_messageKey: {
              connectionId,
              messageKey
            }
          },
          update: {
            message: message.message,
            messageTimestamp: new Date(message.messageTimestamp * 1000),
            status: message.status,
            updatedAt: new Date()
          },
          create: {
            connectionId,
            messageKey,
            remoteJid: message.key.remoteJid,
            fromMe: message.key.fromMe,
            messageId: message.key.id,
            message: message.message,
            messageTimestamp: new Date(message.messageTimestamp * 1000),
            status: message.status
          }
        });
      }

      this.emit('messagesSaved', { connectionId, count: messages.length });
      console.log(`Saved ${messages.length} messages for connection ${connectionId}`);
    } catch (error) {
      console.error('Error saving messages:', error);
      throw error;
    }
  }

  // Obter mensagens por chat
  async getMessagesByChat(connectionId: string, chatId: string, limit: number = 50) {
    try {
      const messages = await this.prisma.whatsappMessage.findMany({
        where: {
          connectionId,
          remoteJid: chatId
        },
        orderBy: {
          messageTimestamp: 'desc'
        },
        take: limit
      });

      return messages;
    } catch (error) {
      console.error('Error getting messages by chat:', error);
      throw error;
    }
  }

  // Obter chats de uma conexão
  async getChatsByConnection(connectionId: string) {
    try {
      const chats = await this.prisma.whatsappChat.findMany({
        where: {
          connectionId
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      return chats;
    } catch (error) {
      console.error('Error getting chats by connection:', error);
      throw error;
    }
  }

  // Obter contatos de uma conexão
  async getContactsByConnection(connectionId: string) {
    try {
      const contacts = await this.prisma.whatsappContact.findMany({
        where: {
          connectionId
        },
        orderBy: {
          name: 'asc'
        }
      });

      return contacts;
    } catch (error) {
      console.error('Error getting contacts by connection:', error);
      throw error;
    }
  }

  // Obter uma mensagem específica (para getMessage function)
  async getMessage(connectionId: string, messageKey: string) {
    try {
      const message = await this.prisma.whatsappMessage.findUnique({
        where: {
          connectionId_messageKey: {
            connectionId,
            messageKey
          }
        }
      });

      return message;
    } catch (error) {
      console.error('Error getting message:', error);
      return null;
    }
  }

  // Processar sincronização completa de histórico
  async processHistorySync(connectionId: string, data: {
    chats: WhatsAppChat[];
    contacts: WhatsAppContact[];
    messages: WhatsAppMessage[];
    syncType: string;
  }) {
    try {
      console.log(`Processing history sync for connection ${connectionId}, type: ${data.syncType}`);

      // Salvar dados em paralelo
      await Promise.all([
        this.saveChats(connectionId, data.chats),
        this.saveContacts(connectionId, data.contacts),
        this.saveMessages(connectionId, data.messages)
      ]);

      this.emit('historySyncProcessed', {
        connectionId,
        syncType: data.syncType,
        chatsCount: data.chats.length,
        contactsCount: data.contacts.length,
        messagesCount: data.messages.length
      });

      return {
        success: true,
        chatsCount: data.chats.length,
        contactsCount: data.contacts.length,
        messagesCount: data.messages.length
      };
    } catch (error) {
      console.error('Error processing history sync:', error);
      throw error;
    }
  }

  // Limpar dados de uma conexão
  async clearConnectionData(connectionId: string) {
    try {
      await Promise.all([
        this.prisma.whatsappMessage.deleteMany({
          where: { connectionId }
        }),
        this.prisma.whatsappChat.deleteMany({
          where: { connectionId }
        }),
        this.prisma.whatsappContact.deleteMany({
          where: { connectionId }
        })
      ]);

      console.log(`Cleared all data for connection ${connectionId}`);
    } catch (error) {
      console.error('Error clearing connection data:', error);
      throw error;
    }
  }
}

// Singleton instance
let messageHistoryService: MessageHistoryService | null = null;

export const getMessageHistoryService = (prisma: PrismaClient) => {
  if (!messageHistoryService) {
    messageHistoryService = new MessageHistoryService(prisma);
  }
  return messageHistoryService;
};
