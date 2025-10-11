import { Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsapp.service';
import { z } from 'zod';
import logger from '../logger';

const startSessionSchema = z.object({
  sessionName: z.string().optional().default('default')
});

const sendMessageSchema = z.object({
  to: z.string().min(1, 'Número de destino é obrigatório'),
  text: z.string().min(1, 'Texto da mensagem é obrigatório')
});

const sendFileSchema = z.object({
  to: z.string().min(1, 'Número de destino é obrigatório'),
  filePath: z.string().min(1, 'Caminho do arquivo é obrigatório'),
  caption: z.string().optional()
});

export class WhatsAppController {
  constructor(private whatsappService: WhatsAppService) {}

  async startSession(req: Request, res: Response) {
    try {
      const { sessionName } = startSessionSchema.parse(req.body);
      
      const result = await this.whatsappService.startSession(sessionName);
      
      if (result.success) {
        res.json({
          success: true,
          data: {
            sessionId: result.sessionId,
            qrCode: result.qrCode,
            message: result.qrCode ? 'QR Code gerado. Escaneie com seu WhatsApp.' : 'Sessão iniciada com sucesso.'
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || 'Erro ao iniciar sessão'
        });
      }
    } catch (error) {
      logger.error('Erro ao iniciar sessão WhatsApp:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao iniciar sessão WhatsApp'
      });
    }
  }

  async getStatus(req: Request, res: Response) {
    try {
      const { sessionName = 'default' } = req.query;
      const status = await this.whatsappService.getStatus(sessionName as string);
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Erro ao obter status do WhatsApp:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter status'
      });
    }
  }

  async stopSession(req: Request, res: Response) {
    try {
      const { sessionName = 'default' } = req.query;
      const success = await this.whatsappService.stopSession(sessionName as string);
      
      if (success) {
        res.json({
          success: true,
          message: 'Sessão WhatsApp encerrada'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Erro ao encerrar sessão'
        });
      }
    } catch (error) {
      logger.error('Erro ao encerrar sessão WhatsApp:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao encerrar sessão WhatsApp'
      });
    }
  }

  async sendText(req: Request, res: Response) {
    try {
      const { to, text } = sendMessageSchema.parse(req.body);
      const { sessionName = 'default' } = req.query;
      
      const success = await this.whatsappService.sendText(sessionName as string, to, text);
      
      if (success) {
        res.json({
          success: true,
          message: 'Mensagem enviada com sucesso'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Erro ao enviar mensagem'
        });
      }
    } catch (error) {
      logger.error('Erro ao enviar texto:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao enviar mensagem'
      });
    }
  }

  async sendFile(req: Request, res: Response) {
    try {
      const { to, filePath, caption } = sendFileSchema.parse(req.body);
      const { sessionName = 'default' } = req.query;
      
      const success = await this.whatsappService.sendFile(sessionName as string, to, filePath, caption);
      
      if (success) {
        res.json({
          success: true,
          message: 'Arquivo enviado com sucesso'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Erro ao enviar arquivo'
        });
      }
    } catch (error) {
      logger.error('Erro ao enviar arquivo:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao enviar arquivo'
      });
    }
  }

  async getSessions(req: Request, res: Response) {
    try {
      const sessions = await this.whatsappService.getSessions();
      
      res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      logger.error('Erro ao buscar sessões:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar sessões'
      });
    }
  }

  async deleteSession(req: Request, res: Response) {
    try {
      const { sessionName } = req.params;
      
      if (!sessionName) {
        return res.status(400).json({
          success: false,
          error: 'Nome da sessão é obrigatório'
        });
      }

      const success = await this.whatsappService.deleteSession(sessionName);
      
      if (success) {
        res.json({
          success: true,
          message: 'Sessão removida com sucesso'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Erro ao remover sessão'
        });
      }
    } catch (error) {
      logger.error('Erro ao remover sessão:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao remover sessão'
      });
    }
  }

  async getMessages(req: Request, res: Response) {
    try {
      const { sessionName = 'default' } = req.query;
      const { limit = '50', offset = '0' } = req.query;
      
      // Buscar mensagens do banco
      const messages = await this.whatsappService.prisma.whatsAppMessage.findMany({
        where: { sessionName: sessionName as string },
        orderBy: { timestamp: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      });
      
      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      logger.error('Erro ao buscar mensagens:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar mensagens'
      });
    }
  }
}
