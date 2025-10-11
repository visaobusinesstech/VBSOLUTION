import { PrismaClient, Integration, IntegrationToken, IntegrationPermission, IntegrationPlatform, TokenType } from '@prisma/client';
import { EncryptionService } from './encryption.service';
import { logger } from '../logger';

export interface IntegrationConfig {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  scope?: string[];
  webhookUrl?: string;
  webhookSecret?: string;
  [key: string]: any;
}

export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
  tokenType?: string;
  metadata?: any;
}

export class IntegrationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Cria uma nova integração
   */
  async createIntegration(
    userId: string,
    platform: IntegrationPlatform,
    name: string,
    description?: string,
    config?: IntegrationConfig
  ): Promise<Integration> {
    try {
      const integration = await this.prisma.integration.create({
        data: {
          userId,
          platform,
          name,
          description,
          config: config || {},
          isActive: true,
          isConnected: false,
        },
      });

      logger.info(`Integração criada: ${integration.id} para usuário ${userId}`);
      return integration;
    } catch (error) {
      logger.error('Erro ao criar integração:', error);
      throw error;
    }
  }

  /**
   * Busca integrações por usuário
   */
  async getIntegrationsByUser(userId: string): Promise<Integration[]> {
    try {
      return await this.prisma.integration.findMany({
        where: { userId },
        include: {
          tokens: true,
          permissions: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Erro ao buscar integrações:', error);
      throw error;
    }
  }

  /**
   * Busca integração por ID
   */
  async getIntegrationById(id: string, userId: string): Promise<Integration | null> {
    try {
      return await this.prisma.integration.findFirst({
        where: { id, userId },
        include: {
          tokens: true,
          permissions: true,
        },
      });
    } catch (error) {
      logger.error('Erro ao buscar integração:', error);
      throw error;
    }
  }

  /**
   * Salva tokens de uma integração
   */
  async saveTokens(
    integrationId: string,
    tokenData: TokenData
  ): Promise<IntegrationToken[]> {
    try {
      const tokens: IntegrationToken[] = [];

      // Salvar access token
      const accessToken = await this.prisma.integrationToken.upsert({
        where: {
          integrationId_tokenType: {
            integrationId,
            tokenType: TokenType.ACCESS_TOKEN,
          },
        },
        update: {
          accessToken: EncryptionService.encrypt(tokenData.accessToken),
          expiresAt: tokenData.expiresAt,
          scope: tokenData.scope,
          metadata: tokenData.metadata,
          updatedAt: new Date(),
        },
        create: {
          integrationId,
          tokenType: TokenType.ACCESS_TOKEN,
          accessToken: EncryptionService.encrypt(tokenData.accessToken),
          expiresAt: tokenData.expiresAt,
          scope: tokenData.scope,
          metadata: tokenData.metadata,
        },
      });
      tokens.push(accessToken);

      // Salvar refresh token se existir
      if (tokenData.refreshToken) {
        const refreshToken = await this.prisma.integrationToken.upsert({
          where: {
            integrationId_tokenType: {
              integrationId,
              tokenType: TokenType.REFRESH_TOKEN,
            },
          },
          update: {
            accessToken: EncryptionService.encrypt(tokenData.refreshToken),
            updatedAt: new Date(),
          },
          create: {
            integrationId,
            tokenType: TokenType.REFRESH_TOKEN,
            accessToken: EncryptionService.encrypt(tokenData.refreshToken),
          },
        });
        tokens.push(refreshToken);
      }

      // Atualizar status da integração
      await this.prisma.integration.update({
        where: { id: integrationId },
        data: {
          isConnected: true,
          lastSyncAt: new Date(),
        },
      });

      logger.info(`Tokens salvos para integração ${integrationId}`);
      return tokens;
    } catch (error) {
      logger.error('Erro ao salvar tokens:', error);
      throw error;
    }
  }

  /**
   * Busca access token de uma integração
   */
  async getAccessToken(integrationId: string): Promise<string | null> {
    try {
      const token = await this.prisma.integrationToken.findUnique({
        where: {
          integrationId_tokenType: {
            integrationId,
            tokenType: TokenType.ACCESS_TOKEN,
          },
        },
      });

      if (!token) return null;

      // Verificar se o token não expirou
      if (!EncryptionService.isTokenValid(token.expiresAt)) {
        logger.warn(`Token expirado para integração ${integrationId}`);
        return null;
      }

      return EncryptionService.decrypt(token.accessToken);
    } catch (error) {
      logger.error('Erro ao buscar access token:', error);
      return null;
    }
  }

  /**
   * Busca refresh token de uma integração
   */
  async getRefreshToken(integrationId: string): Promise<string | null> {
    try {
      const token = await this.prisma.integrationToken.findUnique({
        where: {
          integrationId_tokenType: {
            integrationId,
            tokenType: TokenType.REFRESH_TOKEN,
          },
        },
      });

      if (!token) return null;

      return EncryptionService.decrypt(token.accessToken);
    } catch (error) {
      logger.error('Erro ao buscar refresh token:', error);
      return null;
    }
  }

  /**
   * Atualiza tokens de uma integração
   */
  async updateTokens(
    integrationId: string,
    tokenData: Partial<TokenData>
  ): Promise<void> {
    try {
      if (tokenData.accessToken) {
        await this.prisma.integrationToken.update({
          where: {
            integrationId_tokenType: {
              integrationId,
              tokenType: TokenType.ACCESS_TOKEN,
            },
          },
          data: {
            accessToken: EncryptionService.encrypt(tokenData.accessToken),
            expiresAt: tokenData.expiresAt,
            scope: tokenData.scope,
            metadata: tokenData.metadata,
            updatedAt: new Date(),
          },
        });
      }

      if (tokenData.refreshToken) {
        await this.prisma.integrationToken.update({
          where: {
            integrationId_tokenType: {
              integrationId,
              tokenType: TokenType.REFRESH_TOKEN,
            },
          },
          data: {
            accessToken: EncryptionService.encrypt(tokenData.refreshToken),
            updatedAt: new Date(),
          },
        });
      }

      logger.info(`Tokens atualizados para integração ${integrationId}`);
    } catch (error) {
      logger.error('Erro ao atualizar tokens:', error);
      throw error;
    }
  }

  /**
   * Salva permissões de uma integração
   */
  async savePermissions(
    integrationId: string,
    permissions: string[]
  ): Promise<void> {
    try {
      // Remover permissões existentes
      await this.prisma.integrationPermission.deleteMany({
        where: { integrationId },
      });

      // Adicionar novas permissões
      const permissionData = permissions.map(permission => ({
        integrationId,
        permission,
        granted: true,
        grantedAt: new Date(),
      }));

      await this.prisma.integrationPermission.createMany({
        data: permissionData,
      });

      logger.info(`Permissões salvas para integração ${integrationId}: ${permissions.join(', ')}`);
    } catch (error) {
      logger.error('Erro ao salvar permissões:', error);
      throw error;
    }
  }

  /**
   * Verifica se uma integração tem uma permissão específica
   */
  async hasPermission(integrationId: string, permission: string): Promise<boolean> {
    try {
      const perm = await this.prisma.integrationPermission.findUnique({
        where: {
          integrationId_permission: {
            integrationId,
            permission,
          },
        },
      });

      return perm ? perm.granted : false;
    } catch (error) {
      logger.error('Erro ao verificar permissão:', error);
      return false;
    }
  }

  /**
   * Desconecta uma integração
   */
  async disconnectIntegration(integrationId: string, userId: string): Promise<void> {
    try {
      // Remover todos os tokens
      await this.prisma.integrationToken.deleteMany({
        where: { integrationId },
      });

      // Remover todas as permissões
      await this.prisma.integrationPermission.deleteMany({
        where: { integrationId },
      });

      // Atualizar status da integração
      await this.prisma.integration.update({
        where: { id: integrationId, userId },
        data: {
          isConnected: false,
          lastSyncAt: new Date(),
        },
      });

      logger.info(`Integração ${integrationId} desconectada`);
    } catch (error) {
      logger.error('Erro ao desconectar integração:', error);
      throw error;
    }
  }

  /**
   * Remove uma integração completamente
   */
  async deleteIntegration(integrationId: string, userId: string): Promise<void> {
    try {
      await this.prisma.integration.delete({
        where: { id: integrationId, userId },
      });

      logger.info(`Integração ${integrationId} removida`);
    } catch (error) {
      logger.error('Erro ao remover integração:', error);
      throw error;
    }
  }

  /**
   * Atualiza configuração de uma integração
   */
  async updateIntegrationConfig(
    integrationId: string,
    userId: string,
    config: IntegrationConfig
  ): Promise<Integration> {
    try {
      return await this.prisma.integration.update({
        where: { id: integrationId, userId },
        data: {
          config,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Erro ao atualizar configuração:', error);
      throw error;
    }
  }

  /**
   * Lista integrações conectadas de um usuário
   */
  async getConnectedIntegrations(userId: string): Promise<Integration[]> {
    try {
      return await this.prisma.integration.findMany({
        where: {
          userId,
          isConnected: true,
          isActive: true,
        },
        include: {
          tokens: true,
          permissions: true,
        },
        orderBy: { lastSyncAt: 'desc' },
      });
    } catch (error) {
      logger.error('Erro ao buscar integrações conectadas:', error);
      throw error;
    }
  }
}
