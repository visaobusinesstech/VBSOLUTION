import { Request, Response } from 'express';
import { getBaileysSimpleService } from '../services/baileys-simple.service';

export class ConversationsController {
  private baileysService: any;

  constructor() {
    this.baileysService = getBaileysSimpleService();
  }

  // Obter conversas
  async getConversations(req: Request, res: Response) {
    try {
      const { connectionId, cursor, limit = 20 } = req.query;

      if (!connectionId) {
        return res.status(400).json({
          success: false,
          error: 'connectionId é obrigatório'
        });
      }

      const chats = await this.baileysService.getChats(connectionId as string);
      
      res.json({
        success: true,
        data: {
          conversations: chats,
          cursor: cursor || null,
          hasMore: false
        }
      });
    } catch (error) {
      console.error('Error getting conversations:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter conversas'
      });
    }
  }

  // Criar conversa (placeholder)
  async createConversation(req: Request, res: Response) {
    try {
      const { connectionId, contactId, message } = req.body;

      if (!connectionId || !contactId) {
        return res.status(400).json({
          success: false,
          error: 'connectionId e contactId são obrigatórios'
        });
      }

      // Por enquanto, apenas retornar sucesso
      res.json({
        success: true,
        data: {
          id: `conv_${Date.now()}`,
          connectionId,
          contactId,
          message,
          createdAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao criar conversa'
      });
    }
  }

  // Obter mensagens de uma conversa
  async getMessages(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { cursor, limit = 50 } = req.query;
      const { connectionId } = req.query;

      if (!connectionId) {
        return res.status(400).json({
          success: false,
          error: 'connectionId é obrigatório'
        });
      }

      const messages = await this.baileysService.getMessages(connectionId as string, id, Number(limit));
      
      res.json({
        success: true,
        data: {
          messages,
          cursor: cursor || null,
          hasMore: false
        }
      });
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter mensagens'
      });
    }
  }
}
