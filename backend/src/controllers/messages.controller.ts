import { Request, Response } from 'express';
import { getBaileysSimpleService } from '../services/baileys-simple.service';

export class MessagesController {
  private baileysService: any;

  constructor() {
    this.baileysService = getBaileysSimpleService();
  }

  // Enviar mensagem
  async sendMessage(req: Request, res: Response) {
    try {
      const { connectionId, chatId, content, type = 'text' } = req.body;

      if (!connectionId || !chatId || !content) {
        return res.status(400).json({
          success: false,
          error: 'connectionId, chatId e content são obrigatórios'
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

  // Marcar mensagem como lida
  async markAsRead(req: Request, res: Response) {
    try {
      const { connectionId, chatId, messageIds } = req.body;

      if (!connectionId || !chatId || !messageIds) {
        return res.status(400).json({
          success: false,
          error: 'connectionId, chatId e messageIds são obrigatórios'
        });
      }

      // Por enquanto, apenas retornar sucesso
      // TODO: Implementar marcação de mensagens como lidas
      res.json({
        success: true,
        data: {
          chatId,
          messageIds,
          readAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao marcar mensagens como lidas'
      });
    }
  }

  // Definir status de digitação
  async setTyping(req: Request, res: Response) {
    try {
      const { connectionId, chatId, isTyping } = req.body;

      if (!connectionId || !chatId || typeof isTyping !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'connectionId, chatId e isTyping são obrigatórios'
        });
      }

      // Por enquanto, apenas retornar sucesso
      // TODO: Implementar status de digitação
      res.json({
        success: true,
        data: {
          chatId,
          isTyping,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error setting typing status:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao definir status de digitação'
      });
    }
  }
}
