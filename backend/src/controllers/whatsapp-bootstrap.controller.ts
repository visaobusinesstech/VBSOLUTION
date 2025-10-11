import { Request, Response } from 'express';
import logger from '../logger';
import { whatsappBootstrapService } from '../services/whatsapp-bootstrap.service';

export class WhatsAppBootstrapController {
  /**
   * Inicializar todos os serviços
   */
  async initialize(req: Request, res: Response): Promise<void> {
    try {
      const status = await whatsappBootstrapService.initialize();
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Erro ao inicializar serviços:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao inicializar serviços',
        details: error.message
      });
    }
  }

  /**
   * Obter status dos serviços
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = whatsappBootstrapService.getStatus();
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Erro ao obter status:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter status'
      });
    }
  }

  /**
   * Executar teste do sistema
   */
  async runSystemTest(req: Request, res: Response): Promise<void> {
    try {
      const testResult = await whatsappBootstrapService.runSystemTest();
      
      res.json({
        success: true,
        data: testResult
      });
    } catch (error) {
      logger.error('Erro ao executar teste do sistema:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao executar teste do sistema'
      });
    }
  }

  /**
   * Criar conexão de teste
   */
  async createTestConnection(req: Request, res: Response): Promise<void> {
    try {
      const { ownerId, companyId } = req.body;

      if (!ownerId) {
        res.status(400).json({
          success: false,
          error: 'ownerId é obrigatório'
        });
        return;
      }

      const connectionId = await whatsappBootstrapService.createTestConnection(ownerId, companyId);
      
      res.json({
        success: true,
        data: {
          connectionId,
          message: 'Conexão de teste criada com sucesso'
        }
      });
    } catch (error) {
      logger.error('Erro ao criar conexão de teste:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao criar conexão de teste',
        details: error.message
      });
    }
  }

  /**
   * Reiniciar todos os serviços
   */
  async restart(req: Request, res: Response): Promise<void> {
    try {
      await whatsappBootstrapService.restart();
      
      res.json({
        success: true,
        message: 'Todos os serviços reiniciados com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao reiniciar serviços:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao reiniciar serviços',
        details: error.message
      });
    }
  }

  /**
   * Parar todos os serviços
   */
  async shutdown(req: Request, res: Response): Promise<void> {
    try {
      await whatsappBootstrapService.shutdown();
      
      res.json({
        success: true,
        message: 'Todos os serviços parados com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao parar serviços:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao parar serviços',
        details: error.message
      });
    }
  }

  /**
   * Obter estatísticas detalhadas
   */
  async getDetailedStats(req: Request, res: Response): Promise<void> {
    try {
      const status = whatsappBootstrapService.getStatus();
      
      // Adicionar estatísticas adicionais
      const detailedStats = {
        ...status,
        uptime: Date.now() - status.startTime.getTime(),
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
        platform: process.platform,
        nodeVersion: process.version
      };
      
      res.json({
        success: true,
        data: detailedStats
      });
    } catch (error) {
      logger.error('Erro ao obter estatísticas detalhadas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter estatísticas'
      });
    }
  }
}

export const whatsappBootstrapController = new WhatsAppBootstrapController();
