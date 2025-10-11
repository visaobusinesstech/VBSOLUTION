import { Request, Response } from 'express';
import { getBaileysService } from '../services/baileys.service';
import { PrismaClient } from '@prisma/client';

export class BaileysController {
  private baileysService: any;

  constructor() {
    const prisma = new PrismaClient();
    this.baileysService = getBaileysService(prisma);
  }

  // Criar nova conexão Baileys
  async createConnection(req: Request, res: Response) {
    try {
      const { connectionId, name, phoneNumber } = req.body;

      if (!connectionId || !name) {
        return res.status(400).json({
          success: false,
          error: 'connectionId e name são obrigatórios'
        });
      }

      const connection = await this.baileysService.createConnection(connectionId, name, phoneNumber);

      res.json({
        success: true,
        data: {
          id: connection.id,
          name: connection.name,
          connectionState: connection.connectionState,
          isConnected: connection.isConnected
        }
      });
    } catch (error) {
      console.error('Error creating Baileys connection:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao criar conexão Baileys',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Obter informações da conexão
  async getConnectionInfo(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;

      const info = await this.baileysService.getConnectionInfo(connectionId);

      res.json({
        success: true,
        data: info
      });
    } catch (error) {
      console.error('Error getting connection info:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter informações da conexão'
      });
    }
  }

  // Obter QR Code
  async getQRCode(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;

      const qrCode = await this.baileysService.getQRCode(connectionId);

      res.json({
        success: true,
        data: { qrCode }
      });
    } catch (error) {
      console.error('Error getting QR code:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter QR Code'
      });
    }
  }

  // Solicitar código de pareamento
  async requestPairingCode(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          error: 'phoneNumber é obrigatório'
        });
      }

      const code = await this.baileysService.requestPairingCode(connectionId, phoneNumber);

      res.json({
        success: true,
        data: { code, phoneNumber }
      });
    } catch (error) {
      console.error('Error requesting pairing code:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao solicitar código de pareamento'
      });
    }
  }

  // Enviar mensagem
  async sendMessage(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;
      const { jid, message } = req.body;

      if (!jid || !message) {
        return res.status(400).json({
          success: false,
          error: 'jid e message são obrigatórios'
        });
      }

      const result = await this.baileysService.sendMessage(connectionId, jid, message);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao enviar mensagem'
      });
    }
  }

  // Desconectar
  async disconnect(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;

      await this.baileysService.disconnect(connectionId);

      res.json({
        success: true,
        message: 'Conexão desconectada com sucesso'
      });
    } catch (error) {
      console.error('Error disconnecting:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao desconectar'
      });
    }
  }

  // Listar todas as conexões
  async getAllConnections(req: Request, res: Response) {
    try {
      const connections = this.baileysService.getAllConnections();

      const connectionsInfo = connections.map(conn => ({
        id: conn.id,
        name: conn.name,
        connectionState: conn.connectionState,
        isConnected: conn.isConnected,
        phoneNumber: conn.phoneNumber
      }));

      res.json({
        success: true,
        data: connectionsInfo
      });
    } catch (error) {
      console.error('Error getting all connections:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter conexões'
      });
    }
  }

  // Testar webhook
  async testWebhook(req: Request, res: Response) {
    try {
      const { webhookUrl, webhookToken } = req.body;

      if (!webhookUrl) {
        return res.status(400).json({
          success: false,
          error: 'URL do webhook é obrigatória'
        });
      }

      // Fazer requisição de teste para o webhook
      const testPayload = {
        event: 'webhook_test',
        timestamp: new Date().toISOString(),
        data: {
          message: 'Teste de webhook do VBSolutionCRM',
          status: 'success'
        }
      };

      const headers: any = {
        'Content-Type': 'application/json',
        'User-Agent': 'VBSolutionCRM-Webhook-Test/1.0'
      };

      if (webhookToken) {
        headers['Authorization'] = `Bearer ${webhookToken}`;
        headers['X-Webhook-Token'] = webhookToken;
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload),
        timeout: 10000 // 10 segundos de timeout
      });

      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }

      res.json({
        success: true,
        data: {
          status: response.status,
          statusText: response.statusText,
          response: responseData,
          headers: Object.fromEntries(response.headers.entries())
        }
      });
    } catch (error) {
      console.error('Error testing webhook:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao testar webhook: ' + error.message
      });
    }
  }

  // Obter histórico de mensagens
  async getMessageHistory(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;
      const { jid, count = 50 } = req.query;

      if (!jid) {
        return res.status(400).json({
          success: false,
          error: 'JID é obrigatório'
        });
      }

      const history = await this.baileysService.fetchMessageHistory(
        connectionId, 
        jid as string, 
        parseInt(count as string)
      );

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Error getting message history:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter histórico de mensagens'
      });
    }
  }

  // Obter lista de chats
  async getChats(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;

      const chats = await this.baileysService.getChats(connectionId);

      res.json({
        success: true,
        data: chats
      });
    } catch (error) {
      console.error('Error getting chats:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter lista de chats'
      });
    }
  }

  // Obter contatos
  async getContacts(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;

      const contacts = await this.baileysService.getContacts(connectionId);

      res.json({
        success: true,
        data: contacts
      });
    } catch (error) {
      console.error('Error getting contacts:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter contatos'
      });
    }
  }

  // Obter foto de perfil
  async getProfilePicture(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;
      const { jid } = req.query;

      if (!jid) {
        return res.status(400).json({
          success: false,
          error: 'JID é obrigatório'
        });
      }

      const profilePicture = await this.baileysService.getProfilePicture(
        connectionId, 
        jid as string
      );

      res.json({
        success: true,
        data: { profilePicture }
      });
    } catch (error) {
      console.error('Error getting profile picture:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter foto de perfil'
      });
    }
  }

  // Obter metadados do chat
  async getChatMetadata(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;
      const { jid } = req.query;

      if (!jid) {
        return res.status(400).json({
          success: false,
          error: 'JID é obrigatório'
        });
      }

      const metadata = await this.baileysService.getChatMetadata(
        connectionId, 
        jid as string
      );

      res.json({
        success: true,
        data: metadata
      });
    } catch (error) {
      console.error('Error getting chat metadata:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter metadados do chat'
      });
    }
  }

  // Enviar mensagem
  async sendMessage(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;
      const { jid, message } = req.body;

      if (!jid || !message) {
        return res.status(400).json({
          success: false,
          error: 'JID e mensagem são obrigatórios'
        });
      }

      const result = await this.baileysService.sendMessage(connectionId, jid, message);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao enviar mensagem'
      });
    }
  }

  // Marcar mensagem como lida
  async markMessageAsRead(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;
      const { jid, messageId } = req.body;

      if (!jid || !messageId) {
        return res.status(400).json({
          success: false,
          error: 'JID e messageId são obrigatórios'
        });
      }

      await this.baileysService.markMessageAsRead(connectionId, jid, messageId);

      res.json({
        success: true,
        message: 'Mensagem marcada como lida'
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao marcar mensagem como lida'
      });
    }
  }

  // Obter presença
  async getPresence(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;
      const { jid } = req.query;

      if (!jid) {
        return res.status(400).json({
          success: false,
          error: 'JID é obrigatório'
        });
      }

      const presence = await this.baileysService.getPresence(connectionId, jid as string);

      res.json({
        success: true,
        data: { presence }
      });
    } catch (error) {
      console.error('Error getting presence:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter presença'
      });
    }
  }

  // Atualizar presença
  async updatePresence(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;
      const { presence } = req.body;

      if (!presence) {
        return res.status(400).json({
          success: false,
          error: 'Presença é obrigatória'
        });
      }

      await this.baileysService.updatePresence(connectionId, presence);

      res.json({
        success: true,
        message: 'Presença atualizada'
      });
    } catch (error) {
      console.error('Error updating presence:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao atualizar presença'
      });
    }
  }

  // Enviar mensagem de texto
  async sendTextMessage(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;
      const { jid, text, replyTo } = req.body;

      if (!jid || !text) {
        return res.status(400).json({
          success: false,
          error: 'JID e texto são obrigatórios'
        });
      }

      const result = await this.baileysService.sendTextMessage(connectionId, jid, text, replyTo);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error sending text message:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao enviar mensagem de texto'
      });
    }
  }

  // Enviar mensagem de mídia
  async sendMediaMessage(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;
      const { jid, mediaType, mediaData } = req.body;

      if (!jid || !mediaType || !mediaData) {
        return res.status(400).json({
          success: false,
          error: 'JID, tipo de mídia e dados da mídia são obrigatórios'
        });
      }

      const result = await this.baileysService.sendMediaMessage(connectionId, jid, mediaType, mediaData);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error sending media message:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao enviar mensagem de mídia'
      });
    }
  }

  // Enviar mensagem de localização
  async sendLocationMessage(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;
      const { jid, latitude, longitude, name, address } = req.body;

      if (!jid || latitude === undefined || longitude === undefined) {
        return res.status(400).json({
          success: false,
          error: 'JID, latitude e longitude são obrigatórios'
        });
      }

      const result = await this.baileysService.sendLocationMessage(
        connectionId, 
        jid, 
        latitude, 
        longitude, 
        name, 
        address
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error sending location message:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao enviar mensagem de localização'
      });
    }
  }

  // Enviar mensagem de contato
  async sendContactMessage(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;
      const { jid, name, number, vcard } = req.body;

      if (!jid || !name || !number) {
        return res.status(400).json({
          success: false,
          error: 'JID, nome e número são obrigatórios'
        });
      }

      const result = await this.baileysService.sendContactMessage(connectionId, jid, name, number, vcard);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error sending contact message:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao enviar mensagem de contato'
      });
    }
  }
}

export const baileysController = new BaileysController();
