import { Request, Response } from 'express';
import logger from '../logger';
import { whatsappIntegrationService } from '../services/whatsapp-integration.service';
import { supabaseWhatsAppService } from '../services/supabase-whatsapp.service';

export class WhatsAppIntegrationController {
  /**
   * Criar nova conexão WhatsApp
   */
  async createConnection(req: Request, res: Response): Promise<void> {
    try {
      const { connectionId, name, ownerId, companyId } = req.body;

      if (!connectionId || !name || !ownerId) {
        res.status(400).json({
          success: false,
          error: 'connectionId, name e ownerId são obrigatórios'
        });
        return;
      }

      const result = await whatsappIntegrationService.createConnection(
        connectionId,
        name,
        ownerId,
        companyId
      );

      if (result.success) {
        res.json({
          success: true,
          data: {
            connectionId,
            name,
            status: 'connecting',
            qrCode: result.qrCode
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      logger.error('Erro ao criar conexão WhatsApp:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obter status de uma conexão
   */
  async getConnectionStatus(req: Request, res: Response): Promise<void> {
    try {
      const { connectionId } = req.params;

      const connection = whatsappIntegrationService.getConnection(connectionId!);
      
      if (!connection) {
        res.status(404).json({
          success: false,
          error: 'Conexão não encontrada'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: connection.id,
          name: connection.name,
          isConnected: connection.isConnected,
          qrCode: connection.qrCode,
          lastSeen: connection.lastSeen,
          ownerId: connection.ownerId,
          companyId: connection.companyId
        }
      });
    } catch (error) {
      logger.error('Erro ao obter status da conexão:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Listar todas as conexões
   */
  async listConnections(_req: Request, res: Response): Promise<void> {
    try {
      const connections = whatsappIntegrationService.getAllConnections();
      
      res.json({
        success: true,
        data: connections.map(conn => ({
          id: conn.id,
          name: conn.name,
          isConnected: conn.isConnected,
          lastSeen: conn.lastSeen,
          ownerId: conn.ownerId,
          companyId: conn.companyId
        }))
      });
    } catch (error) {
      logger.error('Erro ao listar conexões:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Enviar mensagem
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { connectionId, to, content, type = 'text', mediaUrl } = req.body;

      if (!connectionId || !to || !content) {
        res.status(400).json({
          success: false,
          error: 'connectionId, to e content são obrigatórios'
        });
        return;
      }

      const result = await whatsappIntegrationService.sendMessage(
        connectionId,
        to,
        content,
        type,
        mediaUrl
      );

      if (result.success) {
        res.json({
          success: true,
          data: {
            messageId: result.messageId,
            sentAt: new Date().toISOString()
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      logger.error('Erro ao enviar mensagem:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Remover conexão
   */
  async removeConnection(req: Request, res: Response): Promise<void> {
    try {
      const { connectionId } = req.params;

      await whatsappIntegrationService.removeConnection(connectionId!);
      
      res.json({
        success: true,
        message: 'Conexão removida com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao remover conexão:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obter mensagens de um atendimento
   */
  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { atendimentoId } = req.params;
      const { ownerId } = req.query;
      const limit = parseInt(req.query['limit'] as string) || 50;
      const offset = parseInt(req.query['offset'] as string) || 0;

      if (!ownerId) {
        res.status(400).json({
          success: false,
          error: 'ownerId é obrigatório'
        });
        return;
      }

      const messages = await supabaseWhatsAppService.getMessages(
        atendimentoId!,
        ownerId as string,
        limit,
        offset
      );

      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      logger.error('Erro ao buscar mensagens:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obter atendimentos ativos
   */
  async getActiveAtendimentos(req: Request, res: Response): Promise<void> {
    try {
      const { ownerId } = req.query;
      const { companyId } = req.query;

      if (!ownerId) {
        res.status(400).json({
          success: false,
          error: 'ownerId é obrigatório'
        });
        return;
      }

      const atendimentos = await supabaseWhatsAppService.getActiveAtendimentos(
        ownerId as string,
        companyId as string
      );

      res.json({
        success: true,
        data: atendimentos
      });
    } catch (error) {
      logger.error('Erro ao buscar atendimentos ativos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obter sessões ativas
   */
  async getActiveSessions(req: Request, res: Response): Promise<void> {
    try {
      const { ownerId } = req.query;

      if (!ownerId) {
        res.status(400).json({
          success: false,
          error: 'ownerId é obrigatório'
        });
        return;
      }

      const sessions = await supabaseWhatsAppService.getActiveSessions(ownerId as string);

      res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      logger.error('Erro ao buscar sessões ativas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obter estatísticas do Supabase
   */
  async getSupabaseStats(_req: Request, res: Response): Promise<void> {
    try {
      const isHealthy = supabaseWhatsAppService.isHealthy();
      const queueStats = supabaseWhatsAppService.getQueueStats();

      res.json({
        success: true,
        data: {
          isHealthy,
          queueStats,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Erro ao obter estatísticas do Supabase:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Limpar fila de mensagens
   */
  async clearMessageQueue(_req: Request, res: Response): Promise<void> {
    try {
      supabaseWhatsAppService.clearQueue();
      
      res.json({
        success: true,
        message: 'Fila de mensagens limpa com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao limpar fila de mensagens:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obter QR Code de uma conexão
   */
  async getQRCode(req: Request, res: Response): Promise<void> {
    try {
      const { connectionId } = req.params;

      const connection = whatsappIntegrationService.getConnection(connectionId!);
      
      if (!connection) {
        res.status(404).json({
          success: false,
          error: 'Conexão não encontrada'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          connectionId,
          qrCode: connection.qrCode,
          isConnected: connection.isConnected
        }
      });
    } catch (error) {
      logger.error('Erro ao obter QR Code:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}

export const whatsappIntegrationController = new WhatsAppIntegrationController();
