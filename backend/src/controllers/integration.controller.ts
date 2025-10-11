import { Request, Response } from 'express';
import { IntegrationService, IntegrationConfig } from '../services/integration.service';
import { GoogleService } from '../services/google.service';
import { MetaService } from '../services/meta.service';
import { logger } from '../logger';
import { IntegrationPlatform } from '@prisma/client';

export class IntegrationController {
  constructor(
    private integrationService: IntegrationService,
    private googleService: GoogleService,
    private metaService: MetaService
  ) {}

  /**
   * Lista todas as integrações do usuário
   */
  async getIntegrations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        res.status(401).json({ error: 'Usuário não identificado' });
        return;
      }

      const integrations = await this.integrationService.getIntegrationsByUser(userId);
      
      // Mascarar tokens sensíveis na resposta
      const safeIntegrations = integrations.map(integration => ({
        ...integration,
        tokens: integration.tokens.map(token => ({
          ...token,
          accessToken: token.accessToken ? '***masked***' : null,
        })),
      }));

      res.json({
        success: true,
        data: safeIntegrations,
      });
    } catch (error) {
      logger.error('Erro ao buscar integrações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Busca uma integração específica
   */
  async getIntegration(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(401).json({ error: 'Usuário não identificado' });
        return;
      }

      const integration = await this.integrationService.getIntegrationById(id, userId);
      
      if (!integration) {
        res.status(404).json({ error: 'Integração não encontrada' });
        return;
      }

      // Mascarar tokens sensíveis
      const safeIntegration = {
        ...integration,
        tokens: integration.tokens.map(token => ({
          ...token,
          accessToken: token.accessToken ? '***masked***' : null,
        })),
      };

      res.json({
        success: true,
        data: safeIntegration,
      });
    } catch (error) {
      logger.error('Erro ao buscar integração:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Cria uma nova integração
   */
  async createIntegration(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { platform, name, description, config } = req.body;
      
      if (!userId) {
        res.status(401).json({ error: 'Usuário não identificado' });
        return;
      }

      if (!platform || !name) {
        res.status(400).json({ error: 'Plataforma e nome são obrigatórios' });
        return;
      }

      const integration = await this.integrationService.createIntegration(
        userId,
        platform,
        name,
        description,
        config
      );

      res.status(201).json({
        success: true,
        data: integration,
      });
    } catch (error) {
      logger.error('Erro ao criar integração:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Gera URL de autorização para Google
   */
  async generateGoogleAuthUrl(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { integrationId } = req.query;
      
      if (!userId) {
        res.status(401).json({ error: 'Usuário não identificado' });
        return;
      }

      // Buscar configuração da integração
      let integration = null;
      if (integrationId) {
        integration = await this.integrationService.getIntegrationById(integrationId as string, userId);
      }

      const config = integration?.config as IntegrationConfig || {};
      const clientId = config.clientId || process.env.GOOGLE_CLIENT_ID;
      const redirectUri = config.redirectUri || `${process.env.WEB_ORIGIN}/auth/google/callback`;

      if (!clientId) {
        res.status(400).json({ error: 'Client ID do Google não configurado' });
        return;
      }

      const state = JSON.stringify({ userId, integrationId });
      const authUrl = GoogleService.generateAuthUrl(clientId, redirectUri, state);

      res.json({
        success: true,
        data: { authUrl, state },
      });
    } catch (error) {
      logger.error('Erro ao gerar URL de autorização Google:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Processa callback de autorização do Google
   */
  async handleGoogleCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code, state, error } = req.query;
      
      if (error) {
        res.status(400).json({ error: `Erro de autorização: ${error}` });
        return;
      }

      if (!code || !state) {
        res.status(400).json({ error: 'Código de autorização ou state não fornecidos' });
        return;
      }

      const { userId, integrationId } = JSON.parse(state as string);
      
      // Buscar ou criar integração
      let integration;
      if (integrationId) {
        integration = await this.integrationService.getIntegrationById(integrationId, userId);
      }

      if (!integration) {
        integration = await this.integrationService.createIntegration(
          userId,
          IntegrationPlatform.GOOGLE,
          'Google Calendar',
          'Integração com Google Calendar e serviços Google',
          {}
        );
      }

      const config = integration.config as IntegrationConfig || {};
      const clientId = config.clientId || process.env.GOOGLE_CLIENT_ID;
      const clientSecret = config.clientSecret || process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = config.redirectUri || `${process.env.WEB_ORIGIN}/auth/google/callback`;

      if (!clientId || !clientSecret) {
        res.status(400).json({ error: 'Credenciais do Google não configuradas' });
        return;
      }

      // Trocar código por tokens
      const tokenData = await this.googleService.exchangeCodeForTokens(
        code as string,
        clientId,
        clientSecret,
        redirectUri
      );

      // Salvar tokens
      await this.integrationService.saveTokens(integration.id, tokenData);

      // Salvar permissões (scopes)
      if (tokenData.scope) {
        const scopes = tokenData.scope.split(' ');
        await this.integrationService.savePermissions(integration.id, scopes);
      }

      res.json({
        success: true,
        data: { integrationId: integration.id, connected: true },
      });
    } catch (error) {
      logger.error('Erro ao processar callback Google:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Gera URL de autorização para Meta (Facebook/Instagram)
   */
  async generateMetaAuthUrl(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { integrationId } = req.query;
      
      if (!userId) {
        res.status(401).json({ error: 'Usuário não identificado' });
        return;
      }

      // Buscar configuração da integração
      let integration = null;
      if (integrationId) {
        integration = await this.integrationService.getIntegrationById(integrationId as string, userId);
      }

      const config = integration?.config as IntegrationConfig || {};
      const clientId = config.clientId || process.env.META_CLIENT_ID;
      const redirectUri = config.redirectUri || `${process.env.WEB_ORIGIN}/auth/meta/callback`;

      if (!clientId) {
        res.status(400).json({ error: 'Client ID do Meta não configurado' });
        return;
      }

      const state = JSON.stringify({ userId, integrationId });
      const authUrl = MetaService.generateAuthUrl(clientId, redirectUri, state);

      res.json({
        success: true,
        data: { authUrl, state },
      });
    } catch (error) {
      logger.error('Erro ao gerar URL de autorização Meta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Processa callback de autorização do Meta
   */
  async handleMetaCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code, state, error } = req.query;
      
      if (error) {
        res.status(400).json({ error: `Erro de autorização: ${error}` });
        return;
      }

      if (!code || !state) {
        res.status(400).json({ error: 'Código de autorização ou state não fornecidos' });
        return;
      }

      const { userId, integrationId } = JSON.parse(state as string);
      
      // Buscar ou criar integração
      let integration;
      if (integrationId) {
        integration = await this.integrationService.getIntegrationById(integrationId, userId);
      }

      if (!integration) {
        integration = await this.integrationService.createIntegration(
          userId,
          IntegrationPlatform.META,
          'Facebook & Instagram',
          'Integração com Facebook Pages e Instagram',
          {}
        );
      }

      const config = integration.config as IntegrationConfig || {};
      const clientId = config.clientId || process.env.META_CLIENT_ID;
      const clientSecret = config.clientSecret || process.env.META_CLIENT_SECRET;
      const redirectUri = config.redirectUri || `${process.env.WEB_ORIGIN}/auth/meta/callback`;

      if (!clientId || !clientSecret) {
        res.status(400).json({ error: 'Credenciais do Meta não configuradas' });
        return;
      }

      // Trocar código por tokens
      const tokenData = await this.metaService.exchangeCodeForTokens(
        code as string,
        clientId,
        clientSecret,
        redirectUri
      );

      // Salvar tokens
      await this.integrationService.saveTokens(integration.id, tokenData);

      // Salvar permissões (scopes)
      if (tokenData.scope) {
        const scopes = tokenData.scope.split(',');
        await this.integrationService.savePermissions(integration.id, scopes);
      }

      res.json({
        success: true,
        data: { integrationId: integration.id, connected: true },
      });
    } catch (error) {
      logger.error('Erro ao processar callback Meta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Desconecta uma integração
   */
  async disconnectIntegration(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(401).json({ error: 'Usuário não identificado' });
        return;
      }

      await this.integrationService.disconnectIntegration(id, userId);

      res.json({
        success: true,
        message: 'Integração desconectada com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao desconectar integração:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Remove uma integração
   */
  async deleteIntegration(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(401).json({ error: 'Usuário não identificado' });
        return;
      }

      await this.integrationService.deleteIntegration(id, userId);

      res.json({
        success: true,
        message: 'Integração removida com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao remover integração:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Atualiza configuração de uma integração
   */
  async updateIntegrationConfig(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.headers['x-user-id'] as string;
      const { config } = req.body;
      
      if (!userId) {
        res.status(401).json({ error: 'Usuário não identificado' });
        return;
      }

      const integration = await this.integrationService.updateIntegrationConfig(
        id,
        userId,
        config
      );

      res.json({
        success: true,
        data: integration,
      });
    } catch (error) {
      logger.error('Erro ao atualizar configuração:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Verifica status das integrações
   */
  async getIntegrationStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(401).json({ error: 'Usuário não identificado' });
        return;
      }

      const integrations = await this.integrationService.getConnectedIntegrations(userId);
      
      const status = {
        google: {
          connected: integrations.some(i => i.platform === IntegrationPlatform.GOOGLE && i.isConnected),
          integrations: integrations.filter(i => i.platform === IntegrationPlatform.GOOGLE).length,
        },
        meta: {
          connected: integrations.some(i => i.platform === IntegrationPlatform.META && i.isConnected),
          integrations: integrations.filter(i => i.platform === IntegrationPlatform.META).length,
        },
        total: integrations.length,
      };

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      logger.error('Erro ao verificar status:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Testa conexão de uma integração
   */
  async testIntegration(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(401).json({ error: 'Usuário não identificado' });
        return;
      }

      const integration = await this.integrationService.getIntegrationById(id, userId);
      
      if (!integration) {
        res.status(404).json({ error: 'Integração não encontrada' });
        return;
      }

      let testResult = { success: false, message: '' };

      try {
        switch (integration.platform) {
          case IntegrationPlatform.GOOGLE:
            await this.googleService.listCalendars(integration.id);
            testResult = { success: true, message: 'Conexão com Google Calendar OK' };
            break;
            
          case IntegrationPlatform.META:
            await this.metaService.getUserPages(integration.id);
            testResult = { success: true, message: 'Conexão com Meta OK' };
            break;
            
          default:
            testResult = { success: false, message: 'Plataforma não suportada para teste' };
        }
      } catch (error) {
        testResult = { success: false, message: `Erro na conexão: ${error}` };
      }

      res.json({
        success: true,
        data: testResult,
      });
    } catch (error) {
      logger.error('Erro ao testar integração:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
