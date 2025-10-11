import { Request, Response } from 'express';
import { getBaileysSimpleService } from '../services/baileys-simple.service';
import { ConnectionsPersistenceService } from '../services/connections-persistence.service';
import { PrismaClient } from '@prisma/client';

export class BaileysSimpleController {
  private baileysService: any;
  private persistenceService: ConnectionsPersistenceService;

  constructor(prisma: PrismaClient) {
    this.persistenceService = new ConnectionsPersistenceService(prisma);
    this.baileysService = getBaileysSimpleService(this.persistenceService);
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

      console.log('Creating connection with:', { connectionId, name, phoneNumber });
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
      const connection = this.baileysService.getConnection(connectionId);

      if (!connection) {
        return res.status(404).json({
          success: false,
          error: 'Conexão não encontrada'
        });
      }

      res.json({
        success: true,
        data: {
          id: connection.id,
          name: connection.name,
          connectionState: connection.connectionState,
          isConnected: connection.isConnected,
          qrCode: connection.qrCode,
          phoneNumber: connection.phoneNumber,
          whatsappInfo: connection.whatsappInfo,
          createdAt: connection.createdAt || new Date().toISOString(),
          updatedAt: connection.updatedAt || new Date().toISOString()
        }
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
      const connection = this.baileysService.getConnection(connectionId);

      if (!connection) {
        return res.status(404).json({
          success: false,
          error: 'Conexão não encontrada'
        });
      }

      res.json({
        success: true,
        data: {
          qrCode: connection.qrCode,
          connectionState: connection.connectionState,
          isConnected: connection.isConnected
        }
      });
    } catch (error) {
      console.error('Error getting QR code:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter QR Code'
      });
    }
  }

  // Listar conexões
  async listConnections(req: Request, res: Response) {
    try {
      // Buscar conexões persistentes do banco
      const persistentConnections = await this.persistenceService.getAllConnections();
      
      res.json({
        success: true,
        data: persistentConnections.map(conn => ({
          id: conn.connectionId,
          name: conn.name,
          connectionState: conn.status,
          isConnected: conn.status === 'connected',
          phoneNumber: conn.phoneNumber,
          whatsappInfo: conn.whatsappInfo,
          createdAt: conn.createdAt,
          updatedAt: conn.updatedAt,
          lastConnectedAt: conn.lastConnectedAt
        }))
      });
    } catch (error) {
      console.error('Error listing connections:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao listar conexões'
      });
    }
  }

  // Deletar conexão
  async deleteConnection(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;
      await this.baileysService.deleteConnection(connectionId);
      
      res.json({
        success: true,
        message: 'Conexão deletada com sucesso'
      });
    } catch (error) {
      console.error('Error deleting connection:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao deletar conexão'
      });
    }
  }

  // Obter chats
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
        error: 'Erro ao obter conversas'
      });
    }
  }

  // Obter mensagens
  async getMessages(req: Request, res: Response) {
    try {
      const { connectionId, chatId } = req.params;
      const { limit = 50 } = req.query;
      const messages = await this.baileysService.getMessages(connectionId, chatId, Number(limit));
      
      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter mensagens'
      });
    }
  }

  // Enviar mensagem
  async sendMessage(req: Request, res: Response) {
    try {
      const { connectionId, chatId } = req.params;
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          error: 'Conteúdo da mensagem é obrigatório'
        });
      }

      const message = await this.baileysService.sendMessage(connectionId, chatId, content);
      
      res.json({
        success: true,
        data: message
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao enviar mensagem'
      });
    }
  }




}
