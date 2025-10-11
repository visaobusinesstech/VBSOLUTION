import { IntegrationService, TokenData } from './integration.service';
import { logger } from '../logger';

export interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  tasks: string[];
}

export interface MetaUserPagesResponse {
  data: MetaPage[];
}

export interface MetaPost {
  id?: string;
  message?: string;
  link?: string;
  scheduled_publish_time?: number;
  published?: boolean;
}

export interface MetaPostResponse {
  id: string;
  post_id: string;
}

export interface MetaComment {
  id: string;
  message: string;
  from: {
    name: string;
    id: string;
  };
  created_time: string;
}

export interface MetaCommentsResponse {
  data: MetaComment[];
}

export interface InstagramMediaContainer {
  id: string;
}

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  permalink?: string;
  thumbnail_url?: string;
  timestamp: string;
}

export interface InstagramMediaResponse {
  data: InstagramMedia[];
}

export interface InstagramUser {
  id: string;
  username: string;
  account_type: 'BUSINESS' | 'PERSONAL';
  media_count: number;
}

export class MetaService {
  private static readonly BASE_URL = 'https://graph.facebook.com';
  private static readonly API_VERSION = 'v20.0';
  
  // Permissões necessárias para Facebook Pages
  public static readonly FACEBOOK_SCOPES = [
    'pages_manage_posts',
    'pages_read_engagement',
    'pages_manage_engagement',
    'pages_messaging',
    'pages_show_list',
    'instagram_basic',
    'instagram_content_publish',
    'instagram_manage_insights',
    'instagram_manage_messages',
  ];

  constructor(private integrationService: IntegrationService) {}

  /**
   * Gera URL de autorização OAuth para Meta
   */
  static generateAuthUrl(
    clientId: string,
    redirectUri: string,
    state?: string
  ): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: this.FACEBOOK_SCOPES.join(','),
      response_type: 'code',
      ...(state && { state }),
    });

    return `https://www.facebook.com/v20.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Troca código de autorização por tokens
   */
  async exchangeCodeForTokens(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<TokenData> {
    try {
      const response = await fetch(`${MetaService.BASE_URL}/${MetaService.API_VERSION}/oauth/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao trocar código por tokens: ${error}`);
      }

      const data = await response.json();
      
      return {
        accessToken: data.access_token,
        expiresAt: new Date(Date.now() + (data.expires_in * 1000)),
        scope: data.scope,
        tokenType: 'Bearer',
        metadata: {
          tokenType: data.token_type,
          issuedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Erro ao trocar código por tokens:', error);
      throw error;
    }
  }

  /**
   * Renova access token usando refresh token (se disponível)
   */
  async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<TokenData> {
    try {
      const response = await fetch(`${MetaService.BASE_URL}/${MetaService.API_VERSION}/oauth/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'fb_exchange_token',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao renovar token: ${error}`);
      }

      const data = await response.json();
      
      return {
        accessToken: data.access_token,
        expiresAt: new Date(Date.now() + (data.expires_in * 1000)),
        scope: data.scope,
        tokenType: 'Bearer',
        metadata: {
          refreshedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Erro ao renovar token:', error);
      throw error;
    }
  }

  /**
   * Busca access token válido para uma integração
   */
  private async getValidAccessToken(integrationId: string): Promise<string> {
    let accessToken = await this.integrationService.getAccessToken(integrationId);
    
    if (!accessToken) {
      throw new Error('Token de acesso não encontrado para a integração');
    }

    return accessToken;
  }

  /**
   * Lista páginas do Facebook do usuário
   */
  async getUserPages(integrationId: string): Promise<MetaPage[]> {
    try {
      const accessToken = await this.getValidAccessToken(integrationId);
      
      const response = await fetch(
        `${MetaService.BASE_URL}/${MetaService.API_VERSION}/me/accounts?access_token=${accessToken}`
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao listar páginas: ${error}`);
      }

      const data: MetaUserPagesResponse = await response.json();
      return data.data;
    } catch (error) {
      logger.error('Erro ao listar páginas:', error);
      throw error;
    }
  }

  /**
   * Cria um post no Facebook
   */
  async createPost(
    integrationId: string,
    pageId: string,
    post: MetaPost
  ): Promise<MetaPostResponse> {
    try {
      const accessToken = await this.getValidAccessToken(integrationId);
      
      const params = new URLSearchParams({
        access_token: accessToken,
        ...(post.message && { message: post.message }),
        ...(post.link && { link: post.link }),
        ...(post.scheduled_publish_time && { scheduled_publish_time: post.scheduled_publish_time.toString() }),
        ...(post.published !== undefined && { published: post.published.toString() }),
      });
      
      const response = await fetch(
        `${MetaService.BASE_URL}/${MetaService.API_VERSION}/${pageId}/feed`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params,
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao criar post: ${error}`);
      }

      const result: MetaPostResponse = await response.json();
      logger.info(`Post criado: ${result.id} na página ${pageId}`);
      return result;
    } catch (error) {
      logger.error('Erro ao criar post:', error);
      throw error;
    }
  }

  /**
   * Lista posts de uma página
   */
  async getPagePosts(
    integrationId: string,
    pageId: string,
    limit: number = 25
  ): Promise<{ data: MetaPost[] }> {
    try {
      const accessToken = await this.getValidAccessToken(integrationId);
      
      const response = await fetch(
        `${MetaService.BASE_URL}/${MetaService.API_VERSION}/${pageId}/posts?access_token=${accessToken}&limit=${limit}`
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao listar posts: ${error}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Erro ao listar posts:', error);
      throw error;
    }
  }

  /**
   * Lista comentários de um post
   */
  async getPostComments(
    integrationId: string,
    postId: string,
    limit: number = 25
  ): Promise<MetaCommentsResponse> {
    try {
      const accessToken = await this.getValidAccessToken(integrationId);
      
      const response = await fetch(
        `${MetaService.BASE_URL}/${MetaService.API_VERSION}/${postId}/comments?access_token=${accessToken}&limit=${limit}`
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao listar comentários: ${error}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Erro ao listar comentários:', error);
      throw error;
    }
  }

  /**
   * Responde a um comentário
   */
  async replyToComment(
    integrationId: string,
    commentId: string,
    message: string
  ): Promise<{ id: string }> {
    try {
      const accessToken = await this.getValidAccessToken(integrationId);
      
      const response = await fetch(
        `${MetaService.BASE_URL}/${MetaService.API_VERSION}/${commentId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            access_token: accessToken,
            message,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao responder comentário: ${error}`);
      }

      const result = await response.json();
      logger.info(`Comentário respondido: ${result.id}`);
      return result;
    } catch (error) {
      logger.error('Erro ao responder comentário:', error);
      throw error;
    }
  }

  /**
   * Busca informações do usuário Instagram
   */
  async getInstagramUser(integrationId: string): Promise<InstagramUser> {
    try {
      const accessToken = await this.getValidAccessToken(integrationId);
      
      const response = await fetch(
        `${MetaService.BASE_URL}/${MetaService.API_VERSION}/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao buscar usuário Instagram: ${error}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Erro ao buscar usuário Instagram:', error);
      throw error;
    }
  }

  /**
   * Cria container de mídia no Instagram
   */
  async createInstagramMediaContainer(
    integrationId: string,
    instagramUserId: string,
    imageUrl: string,
    caption?: string
  ): Promise<InstagramMediaContainer> {
    try {
      const accessToken = await this.getValidAccessToken(integrationId);
      
      const params = new URLSearchParams({
        access_token: accessToken,
        image_url: imageUrl,
        ...(caption && { caption }),
      });
      
      const response = await fetch(
        `${MetaService.BASE_URL}/${MetaService.API_VERSION}/${instagramUserId}/media`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params,
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao criar container de mídia: ${error}`);
      }

      const result = await response.json();
      logger.info(`Container de mídia criado: ${result.id}`);
      return result;
    } catch (error) {
      logger.error('Erro ao criar container de mídia:', error);
      throw error;
    }
  }

  /**
   * Publica mídia no Instagram
   */
  async publishInstagramMedia(
    integrationId: string,
    instagramUserId: string,
    creationId: string
  ): Promise<{ id: string }> {
    try {
      const accessToken = await this.getValidAccessToken(integrationId);
      
      const response = await fetch(
        `${MetaService.BASE_URL}/${MetaService.API_VERSION}/${instagramUserId}/media_publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            access_token: accessToken,
            creation_id: creationId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao publicar mídia: ${error}`);
      }

      const result = await response.json();
      logger.info(`Mídia publicada no Instagram: ${result.id}`);
      return result;
    } catch (error) {
      logger.error('Erro ao publicar mídia:', error);
      throw error;
    }
  }

  /**
   * Lista mídia do Instagram
   */
  async getInstagramMedia(
    integrationId: string,
    instagramUserId: string,
    limit: number = 25
  ): Promise<InstagramMediaResponse> {
    try {
      const accessToken = await this.getValidAccessToken(integrationId);
      
      const response = await fetch(
        `${MetaService.BASE_URL}/${MetaService.API_VERSION}/${instagramUserId}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=${accessToken}&limit=${limit}`
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao listar mídia: ${error}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Erro ao listar mídia:', error);
      throw error;
    }
  }

  /**
   * Lista comentários de uma mídia do Instagram
   */
  async getInstagramMediaComments(
    integrationId: string,
    mediaId: string,
    limit: number = 25
  ): Promise<{ data: MetaComment[] }> {
    try {
      const accessToken = await this.getValidAccessToken(integrationId);
      
      const response = await fetch(
        `${MetaService.BASE_URL}/${MetaService.API_VERSION}/${mediaId}/comments?access_token=${accessToken}&limit=${limit}`
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao listar comentários da mídia: ${error}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Erro ao listar comentários da mídia:', error);
      throw error;
    }
  }

  /**
   * Responde a um comentário do Instagram
   */
  async replyToInstagramComment(
    integrationId: string,
    commentId: string,
    message: string
  ): Promise<{ id: string }> {
    try {
      const accessToken = await this.getValidAccessToken(integrationId);
      
      const response = await fetch(
        `${MetaService.BASE_URL}/${MetaService.API_VERSION}/${commentId}/replies`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            access_token: accessToken,
            message,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao responder comentário do Instagram: ${error}`);
      }

      const result = await response.json();
      logger.info(`Comentário do Instagram respondido: ${result.id}`);
      return result;
    } catch (error) {
      logger.error('Erro ao responder comentário do Instagram:', error);
      throw error;
    }
  }

  /**
   * Envia mensagem via Messenger/Instagram DM
   */
  async sendMessage(
    integrationId: string,
    pageId: string,
    recipientId: string,
    message: string,
    platform: 'messenger' | 'instagram' = 'messenger'
  ): Promise<{ id: string }> {
    try {
      const accessToken = await this.getValidAccessToken(integrationId);
      
      const payload = {
        messaging_product: platform === 'instagram' ? 'instagram' : 'whatsapp',
        recipient: { id: recipientId },
        message: { text: message },
      };
      
      const response = await fetch(
        `${MetaService.BASE_URL}/${MetaService.API_VERSION}/${pageId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao enviar mensagem: ${error}`);
      }

      const result = await response.json();
      logger.info(`Mensagem enviada via ${platform}: ${result.id}`);
      return result;
    } catch (error) {
      logger.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }
}
