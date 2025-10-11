import axios from 'axios';
import { supabase } from '../supabaseClient';
import { INTEGRATIONS_CONFIG } from '../config/integrations.config';

export interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  tasks: string[];
}

export interface MetaPost {
  id: string;
  message: string;
  created_time: string;
  permalink_url: string;
  full_picture?: string;
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

export interface InstagramMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  caption?: string;
  timestamp: string;
  permalink: string;
  like_count: number;
  comments_count: number;
}

export class MetaIntegrationService {
  private accessToken: string = '';
  private pageAccessToken: string = '';

  constructor() {
    // Inicializar com configurações padrão
  }

  /**
   * Configurar token de acesso
   */
  async setAccessToken(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Obter URL de autorização OAuth2
   */
  getAuthUrl(): string {
    const { APP_ID, REDIRECT_URI, SCOPES } = INTEGRATIONS_CONFIG.META;
    
    const params = new URLSearchParams({
      client_id: APP_ID,
      redirect_uri: REDIRECT_URI,
      scope: SCOPES.join(','),
      response_type: 'code',
      auth_type: 'rerequest'
    });

    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Trocar código de autorização por token de acesso
   */
  async getAccessTokenFromCode(code: string): Promise<{ accessToken: string; longLivedToken: string }> {
    try {
      const { APP_ID, APP_SECRET, REDIRECT_URI } = INTEGRATIONS_CONFIG.META;

      // Obter token de acesso de curta duração
      const shortTokenResponse = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
        params: {
          client_id: APP_ID,
          client_secret: APP_SECRET,
          redirect_uri: REDIRECT_URI,
          code: code
        }
      });

      const shortToken = shortTokenResponse.data.access_token;

      // Obter token de longa duração
      const longTokenResponse = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: APP_ID,
          client_secret: APP_SECRET,
          fb_exchange_token: shortToken
        }
      });

      const longToken = longTokenResponse.data.access_token;

      return {
        accessToken: shortToken,
        longLivedToken: longToken
      };
    } catch (error) {
      console.error('❌ Erro ao obter token do Meta:', error);
      throw error;
    }
  }

  /**
   * Obter páginas do usuário
   */
  async getPages(): Promise<MetaPage[]> {
    try {
      console.log('📄 Buscando páginas do Meta...');

      const response = await axios.get(`https://graph.facebook.com/v19.0/me/accounts`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,access_token,category,tasks'
        }
      });

      const pages = response.data.data.map((page: any) => ({
        id: page.id,
        name: page.name,
        access_token: page.access_token,
        category: page.category,
        tasks: page.tasks
      }));

      console.log(`✅ ${pages.length} páginas encontradas`);
      return pages;
    } catch (error) {
      console.error('❌ Erro ao buscar páginas:', error);
      return [];
    }
  }

  /**
   * Configurar página específica
   */
  async setPageAccessToken(pageId: string, pageAccessToken: string) {
    this.pageAccessToken = pageAccessToken;
    console.log(`📄 Página configurada: ${pageId}`);
  }

  /**
   * Publicar post na página do Facebook
   */
  async publishPost(pageId: string, message: string, link?: string): Promise<any> {
    try {
      console.log('📝 Publicando post no Facebook...');

      const postData: any = {
        message: message,
        access_token: this.pageAccessToken
      };

      if (link) {
        postData.link = link;
      }

      const response = await axios.post(
        `https://graph.facebook.com/v19.0/${pageId}/feed`,
        postData
      );

      console.log('✅ Post publicado com sucesso:', response.data.id);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao publicar post:', error);
      throw error;
    }
  }

  /**
   * Obter posts da página
   */
  async getPagePosts(pageId: string, limit: number = 10): Promise<MetaPost[]> {
    try {
      console.log('📋 Buscando posts da página...');

      const response = await axios.get(`https://graph.facebook.com/v19.0/${pageId}/posts`, {
        params: {
          access_token: this.pageAccessToken,
          fields: 'id,message,created_time,permalink_url,full_picture',
          limit: limit
        }
      });

      const posts = response.data.data.map((post: any) => ({
        id: post.id,
        message: post.message || '',
        created_time: post.created_time,
        permalink_url: post.permalink_url,
        full_picture: post.full_picture
      }));

      console.log(`✅ ${posts.length} posts encontrados`);
      return posts;
    } catch (error) {
      console.error('❌ Erro ao buscar posts:', error);
      return [];
    }
  }

  /**
   * Obter comentários de um post
   */
  async getPostComments(postId: string): Promise<MetaComment[]> {
    try {
      console.log('💬 Buscando comentários do post...');

      const response = await axios.get(`https://graph.facebook.com/v19.0/${postId}/comments`, {
        params: {
          access_token: this.pageAccessToken,
          fields: 'id,message,from,created_time'
        }
      });

      const comments = response.data.data.map((comment: any) => ({
        id: comment.id,
        message: comment.message,
        from: comment.from,
        created_time: comment.created_time
      }));

      console.log(`✅ ${comments.length} comentários encontrados`);
      return comments;
    } catch (error) {
      console.error('❌ Erro ao buscar comentários:', error);
      return [];
    }
  }

  /**
   * Responder a um comentário
   */
  async replyToComment(commentId: string, message: string): Promise<any> {
    try {
      console.log('💬 Respondendo ao comentário...');

      const response = await axios.post(
        `https://graph.facebook.com/v19.0/${commentId}/comments`,
        {
          message: message,
          access_token: this.pageAccessToken
        }
      );

      console.log('✅ Resposta enviada com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao responder comentário:', error);
      throw error;
    }
  }

  /**
   * Obter mídia do Instagram
   */
  async getInstagramMedia(instagramAccountId: string, limit: number = 10): Promise<InstagramMedia[]> {
    try {
      console.log('📸 Buscando mídia do Instagram...');

      const response = await axios.get(`https://graph.facebook.com/v19.0/${instagramAccountId}/media`, {
        params: {
          access_token: this.pageAccessToken,
          fields: 'id,media_type,media_url,caption,timestamp,permalink,like_count,comments_count',
          limit: limit
        }
      });

      const media = response.data.data.map((item: any) => ({
        id: item.id,
        media_type: item.media_type,
        media_url: item.media_url,
        caption: item.caption,
        timestamp: item.timestamp,
        permalink: item.permalink,
        like_count: item.like_count || 0,
        comments_count: item.comments_count || 0
      }));

      console.log(`✅ ${media.length} itens de mídia encontrados`);
      return media;
    } catch (error) {
      console.error('❌ Erro ao buscar mídia do Instagram:', error);
      return [];
    }
  }

  /**
   * Obter estatísticas da página
   */
  async getPageInsights(pageId: string, metric: string = 'page_impressions'): Promise<any> {
    try {
      console.log('📊 Buscando insights da página...');

      const response = await axios.get(`https://graph.facebook.com/v19.0/${pageId}/insights`, {
        params: {
          access_token: this.pageAccessToken,
          metric: metric,
          period: 'day',
          since: Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60), // Últimos 7 dias
          until: Math.floor(Date.now() / 1000)
        }
      });

      console.log('✅ Insights obtidos com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar insights:', error);
      return null;
    }
  }

  /**
   * Salvar credenciais do usuário no banco
   */
  async saveUserCredentials(
    ownerId: string,
    accessToken: string,
    longLivedToken: string,
    pages: MetaPage[]
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('connections')
        .upsert({
          owner_id: ownerId,
          name: 'Meta (Facebook/Instagram)',
          connection_type: 'meta',
          config: {
            service: 'meta',
            scopes: INTEGRATIONS_CONFIG.META.SCOPES,
            pages: pages
          },
          credentials: {
            access_token: accessToken,
            long_lived_token: longLivedToken
          },
          is_connected: true,
          last_used_at: new Date().toISOString()
        }, {
          onConflict: 'owner_id,connection_type'
        });

      if (error) {
        console.error('❌ Erro ao salvar credenciais do Meta:', error);
        return false;
      }

      console.log('✅ Credenciais do Meta salvas com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar credenciais do Meta:', error);
      return false;
    }
  }

  /**
   * Carregar credenciais do usuário do banco
   */
  async loadUserCredentials(ownerId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('connections')
        .select('credentials, config')
        .eq('owner_id', ownerId)
        .eq('connection_type', 'meta')
        .eq('is_connected', true)
        .single();

      if (error || !data) {
        console.log('⚠️ Credenciais do Meta não encontradas');
        return false;
      }

      const { access_token } = data.credentials;
      await this.setAccessToken(access_token);

      console.log('✅ Credenciais do Meta carregadas com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao carregar credenciais do Meta:', error);
      return false;
    }
  }

  /**
   * Verificar se o usuário está conectado ao Meta
   */
  async isUserConnected(ownerId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('connections')
        .select('is_connected')
        .eq('owner_id', ownerId)
        .eq('connection_type', 'meta')
        .single();

      return !error && data?.is_connected === true;
    } catch (error) {
      console.error('❌ Erro ao verificar conexão do Meta:', error);
      return false;
    }
  }

  /**
   * Desconectar usuário do Meta
   */
  async disconnectUser(ownerId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('connections')
        .update({
          is_connected: false,
          credentials: null,
          last_used_at: new Date().toISOString()
        })
        .eq('owner_id', ownerId)
        .eq('connection_type', 'meta');

      if (error) {
        console.error('❌ Erro ao desconectar usuário do Meta:', error);
        return false;
      }

      console.log('✅ Usuário desconectado do Meta com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao desconectar usuário do Meta:', error);
      return false;
    }
  }
}

export default MetaIntegrationService;
