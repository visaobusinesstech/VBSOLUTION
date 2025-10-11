import { IntegrationService, TokenData } from './integration.service';
import { logger } from '../logger';

export interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  conferenceData?: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: {
        type: 'hangoutsMeet';
      };
    };
  };
  recurrence?: string[];
  location?: string;
}

export interface GoogleCalendarListResponse {
  items: Array<{
    id: string;
    summary: string;
    primary?: boolean;
    accessRole: string;
  }>;
}

export interface GoogleEventResponse {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: string;
  }>;
  conferenceData?: {
    entryPoints: Array<{
      entryPointType: string;
      uri: string;
      label?: string;
    }>;
  };
  htmlLink: string;
  created: string;
  updated: string;
}

export class GoogleService {
  private static readonly BASE_URL = 'https://www.googleapis.com';
  private static readonly CALENDAR_API_URL = `${this.BASE_URL}/calendar/v3`;
  
  // Scopes necessários para o funcionamento completo
  public static readonly REQUIRED_SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/drive.file',
  ];

  constructor(private integrationService: IntegrationService) {}

  /**
   * Gera URL de autorização OAuth para Google
   */
  static generateAuthUrl(
    clientId: string,
    redirectUri: string,
    state?: string
  ): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: this.REQUIRED_SCOPES.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      ...(state && { state }),
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
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
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao trocar código por tokens: ${error}`);
      }

      const data = await response.json();
      
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + (data.expires_in * 1000)),
        scope: data.scope,
        tokenType: data.token_type,
        metadata: {
          issuedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Erro ao trocar código por tokens:', error);
      throw error;
    }
  }

  /**
   * Renova access token usando refresh token
   */
  async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<TokenData> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao renovar token: ${error}`);
      }

      const data = await response.json();
      
      return {
        accessToken: data.access_token,
        refreshToken: refreshToken, // Manter o refresh token existente
        expiresAt: new Date(Date.now() + (data.expires_in * 1000)),
        scope: data.scope,
        tokenType: data.token_type,
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
      // Tentar renovar usando refresh token
      const refreshToken = await this.integrationService.getRefreshToken(integrationId);
      if (!refreshToken) {
        throw new Error('Tokens não encontrados para a integração');
      }

      const integration = await this.integrationService.getIntegrationById(integrationId, '');
      if (!integration || !integration.config) {
        throw new Error('Configuração da integração não encontrada');
      }

      const config = integration.config as any;
      const tokenData = await this.refreshAccessToken(
        refreshToken,
        config.clientId,
        config.clientSecret
      );

      await this.integrationService.updateTokens(integrationId, tokenData);
      accessToken = tokenData.accessToken;
    }

    return accessToken;
  }

  /**
   * Lista calendários do usuário
   */
  async listCalendars(integrationId: string): Promise<GoogleCalendarListResponse> {
    try {
      const accessToken = await this.getValidAccessToken(integrationId);
      
      const response = await fetch(`${GoogleService.CALENDAR_API_URL}/users/me/calendarList`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao listar calendários: ${error}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Erro ao listar calendários:', error);
      throw error;
    }
  }

  /**
   * Cria um evento no Google Calendar
   */
  async createEvent(
    integrationId: string,
    calendarId: string,
    event: GoogleCalendarEvent
  ): Promise<GoogleEventResponse> {
    try {
      const accessToken = await this.getValidAccessToken(integrationId);
      
      const response = await fetch(
        `${GoogleService.CALENDAR_API_URL}/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...event,
            conferenceDataVersion: event.conferenceData ? 1 : 0,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao criar evento: ${error}`);
      }

      const result = await response.json();
      logger.info(`Evento criado: ${result.id} no calendário ${calendarId}`);
      return result;
    } catch (error) {
      logger.error('Erro ao criar evento:', error);
      throw error;
    }
  }

  /**
   * Atualiza um evento no Google Calendar
   */
  async updateEvent(
    integrationId: string,
    calendarId: string,
    eventId: string,
    event: Partial<GoogleCalendarEvent>
  ): Promise<GoogleEventResponse> {
    try {
      const accessToken = await this.getValidAccessToken(integrationId);
      
      const response = await fetch(
        `${GoogleService.CALENDAR_API_URL}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao atualizar evento: ${error}`);
      }

      const result = await response.json();
      logger.info(`Evento atualizado: ${eventId}`);
      return result;
    } catch (error) {
      logger.error('Erro ao atualizar evento:', error);
      throw error;
    }
  }

  /**
   * Remove um evento do Google Calendar
   */
  async deleteEvent(
    integrationId: string,
    calendarId: string,
    eventId: string
  ): Promise<void> {
    try {
      const accessToken = await this.getValidAccessToken(integrationId);
      
      const response = await fetch(
        `${GoogleService.CALENDAR_API_URL}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok && response.status !== 410) { // 410 = já deletado
        const error = await response.text();
        throw new Error(`Erro ao deletar evento: ${error}`);
      }

      logger.info(`Evento deletado: ${eventId}`);
    } catch (error) {
      logger.error('Erro ao deletar evento:', error);
      throw error;
    }
  }

  /**
   * Lista eventos de um calendário
   */
  async listEvents(
    integrationId: string,
    calendarId: string,
    timeMin?: string,
    timeMax?: string,
    maxResults: number = 100
  ): Promise<{ items: GoogleEventResponse[] }> {
    try {
      const accessToken = await this.getValidAccessToken(integrationId);
      
      const params = new URLSearchParams({
        maxResults: maxResults.toString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        ...(timeMin && { timeMin }),
        ...(timeMax && { timeMax }),
      });
      
      const response = await fetch(
        `${GoogleService.CALENDAR_API_URL}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao listar eventos: ${error}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Erro ao listar eventos:', error);
      throw error;
    }
  }

  /**
   * Verifica disponibilidade em múltiplos calendários
   */
  async checkFreeBusy(
    integrationId: string,
    timeMin: string,
    timeMax: string,
    calendars: string[]
  ): Promise<any> {
    try {
      const accessToken = await this.getValidAccessToken(integrationId);
      
      const response = await fetch(`${GoogleService.CALENDAR_API_URL}/freeBusy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeMin,
          timeMax,
          items: calendars.map(id => ({ id })),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao verificar disponibilidade: ${error}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Erro ao verificar disponibilidade:', error);
      throw error;
    }
  }

  /**
   * Configura webhook para mudanças no calendário
   */
  async setupCalendarWebhook(
    integrationId: string,
    calendarId: string,
    webhookUrl: string
  ): Promise<any> {
    try {
      const accessToken = await this.getValidAccessToken(integrationId);
      
      const response = await fetch(
        `${GoogleService.CALENDAR_API_URL}/calendars/${encodeURIComponent(calendarId)}/events/watch`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: `vbsolution-${integrationId}-${Date.now()}`,
            type: 'web_hook',
            address: webhookUrl,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao configurar webhook: ${error}`);
      }

      const result = await response.json();
      logger.info(`Webhook configurado para calendário ${calendarId}`);
      return result;
    } catch (error) {
      logger.error('Erro ao configurar webhook:', error);
      throw error;
    }
  }
}
