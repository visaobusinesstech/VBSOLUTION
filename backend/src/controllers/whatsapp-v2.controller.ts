import { Request, Response } from 'express';
import { whatsappServiceV2 } from '../services/whatsapp-v2.service';
import { whatsappSupabaseIntegrationService } from '../services/whatsapp-supabase-integration.service';
import { supabaseSessionsService } from '../services/supabase-sessions.service';
import { supabaseMessagesService } from '../services/supabase-messages.service';
import { supabaseAtendimentosService } from '../services/supabase-atendimentos.service';
import { supabaseConfiguracoesService } from '../services/supabase-configuracoes.service';
import { isWhatsAppV2Enabled, DEFAULT_OWNER_ID, DEFAULT_COMPANY_ID } from '../config/supabase';
import logger from '../logger';

export class WhatsAppV2Controller {
  /**
   * Start WhatsApp session
   */
  async startSession(req: Request, res: Response): Promise<void> {
    try {
      if (!isWhatsAppV2Enabled()) {
        res.status(400).json({
          success: false,
          error: 'WhatsApp V2 feature is disabled'
        });
        return;
      }

      const { sessionName = 'default' } = req.body;
      
      const result = await whatsappServiceV2.startSession(sessionName);
      
      res.json(result);
    } catch (error) {
      logger.error('Error starting WhatsApp session:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Stop WhatsApp session
   */
  async stopSession(req: Request, res: Response): Promise<void> {
    try {
      if (!isWhatsAppV2Enabled()) {
        res.status(400).json({
          success: false,
          error: 'WhatsApp V2 feature is disabled'
        });
        return;
      }

      const { sessionName } = req.params;
      
      const result = await whatsappServiceV2.stopSession(sessionName);
      
      res.json(result);
    } catch (error) {
      logger.error('Error stopping WhatsApp session:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get session status
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!isWhatsAppV2Enabled()) {
        res.status(400).json({
          success: false,
          error: 'WhatsApp V2 feature is disabled'
        });
        return;
      }

      const { sessionName } = req.params;
      
      const status = whatsappServiceV2.getSessionStatus(sessionName);
      
      if (!status) {
        res.status(404).json({
          success: false,
          error: 'Session not found'
        });
        return;
      }

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Error getting session status:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get all sessions
   */
  async getAllSessions(req: Request, res: Response): Promise<void> {
    try {
      if (!isWhatsAppV2Enabled()) {
        res.status(400).json({
          success: false,
          error: 'WhatsApp V2 feature is disabled'
        });
        return;
      }

      const sessions = whatsappServiceV2.getAllSessions();
      
      res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      logger.error('Error getting all sessions:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Send message
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      if (!isWhatsAppV2Enabled()) {
        res.status(400).json({
          success: false,
          error: 'WhatsApp V2 feature is disabled'
        });
        return;
      }

      const { sessionName, to, message } = req.body;
      
      if (!sessionName || !to || !message) {
        res.status(400).json({
          success: false,
          error: 'sessionName, to, and message are required'
        });
        return;
      }

      const result = await whatsappServiceV2.sendMessage(sessionName, to, message);
      
      res.json(result);
    } catch (error) {
      logger.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get conversations from Supabase
   */
  async getConversations(req: Request, res: Response): Promise<void> {
    try {
      if (!isWhatsAppV2Enabled()) {
        res.status(400).json({
          success: false,
          error: 'WhatsApp V2 feature is disabled'
        });
        return;
      }

      const { ownerId = DEFAULT_OWNER_ID, limit = 50, offset = 0 } = req.query;
      
      const atendimentos = await supabaseAtendimentosService.getAtendimentosByOwner(
        ownerId as string,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      
      res.json({
        success: true,
        data: atendimentos
      });
    } catch (error) {
      logger.error('Error getting conversations:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      if (!isWhatsAppV2Enabled()) {
        res.status(400).json({
          success: false,
          error: 'WhatsApp V2 feature is disabled'
        });
        return;
      }

      const { atendimentoId } = req.params;
      const { ownerId = DEFAULT_OWNER_ID, limit = 50, offset = 0 } = req.query;
      
      const messages = await supabaseMessagesService.getMessages(
        atendimentoId,
        ownerId as string,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      
      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      logger.error('Error getting messages:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      if (!isWhatsAppV2Enabled()) {
        res.status(400).json({
          success: false,
          error: 'WhatsApp V2 feature is disabled'
        });
        return;
      }

      const { atendimentoId } = req.params;
      const { ownerId = DEFAULT_OWNER_ID } = req.body;
      
      const success = await supabaseMessagesService.markMessagesAsRead(
        atendimentoId,
        ownerId
      );
      
      res.json({
        success,
        message: success ? 'Messages marked as read' : 'Failed to mark messages as read'
      });
    } catch (error) {
      logger.error('Error marking messages as read:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Update atendimento status
   */
  async updateAtendimentoStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!isWhatsAppV2Enabled()) {
        res.status(400).json({
          success: false,
          error: 'WhatsApp V2 feature is disabled'
        });
        return;
      }

      const { atendimentoId } = req.params;
      const { status, atendenteId } = req.body;
      
      const success = await supabaseAtendimentosService.updateAtendimentoStatus(
        atendimentoId,
        status,
        { atendente_id: atendenteId }
      );
      
      res.json({
        success,
        message: success ? 'Atendimento status updated' : 'Failed to update atendimento status'
      });
    } catch (error) {
      logger.error('Error updating atendimento status:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get configuration
   */
  async getConfiguration(req: Request, res: Response): Promise<void> {
    try {
      if (!isWhatsAppV2Enabled()) {
        res.status(400).json({
          success: false,
          error: 'WhatsApp V2 feature is disabled'
        });
        return;
      }

      const { ownerId = DEFAULT_OWNER_ID, companyId = DEFAULT_COMPANY_ID } = req.query;
      
      const config = await supabaseConfiguracoesService.getConfiguracao(
        ownerId as string,
        companyId as string
      );
      
      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      logger.error('Error getting configuration:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Update configuration
   */
  async updateConfiguration(req: Request, res: Response): Promise<void> {
    try {
      if (!isWhatsAppV2Enabled()) {
        res.status(400).json({
          success: false,
          error: 'WhatsApp V2 feature is disabled'
        });
        return;
      }

      const configData = req.body;
      
      const result = await supabaseConfiguracoesService.upsertConfiguracao(configData);
      
      res.json({
        success: !!result,
        data: result,
        message: result ? 'Configuration updated' : 'Failed to update configuration'
      });
    } catch (error) {
      logger.error('Error updating configuration:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get health status
   */
  async getHealthStatus(req: Request, res: Response): Promise<void> {
    try {
      const health = await whatsappServiceV2.getHealthStatus();
      
      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      logger.error('Error getting health status:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Initialize default configuration
   */
  async initializeConfig(req: Request, res: Response): Promise<void> {
    try {
      if (!isWhatsAppV2Enabled()) {
        res.status(400).json({
          success: false,
          error: 'WhatsApp V2 feature is disabled'
        });
        return;
      }

      await whatsappSupabaseIntegrationService.initializeDefaultConfig();
      
      res.json({
        success: true,
        message: 'Default configuration initialized'
      });
    } catch (error) {
      logger.error('Error initializing configuration:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

export const whatsappV2Controller = new WhatsAppV2Controller();
