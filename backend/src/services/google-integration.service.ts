import { google } from 'googleapis';
import { supabase } from '../supabaseClient';

export interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  location?: string;
  conferenceData?: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: {
        type: 'hangoutsMeet';
      };
    };
  };
}

export interface GoogleMeetMeeting {
  meetingUrl: string;
  meetingId: string;
  conferenceId: string;
  entryPoints: Array<{
    entryPointType: 'video';
    uri: string;
    label: string;
  }>;
}

export class GoogleIntegrationService {
  private oauth2Client: any;
  private calendar: any;

  constructor() {
    const { GOOGLE } = require('../config/integrations.config').INTEGRATIONS_CONFIG;
    
    this.oauth2Client = new google.auth.OAuth2(
      GOOGLE.CLIENT_ID,
      GOOGLE.CLIENT_SECRET,
      GOOGLE.REDIRECT_URI
    );
  }

  /**
   * Configurar credenciais do usuário
   */
  async setCredentials(accessToken: string, refreshToken?: string) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Criar evento no Google Calendar
   */
  async createCalendarEvent(eventData: GoogleCalendarEvent, calendarId: string = 'primary'): Promise<any> {
    try {
      console.log('📅 Criando evento no Google Calendar:', eventData.summary);

      const event = {
        summary: eventData.summary,
        description: eventData.description,
        start: eventData.start,
        end: eventData.end,
        attendees: eventData.attendees,
        location: eventData.location,
        conferenceData: eventData.conferenceData
      };

      const response = await this.calendar.events.insert({
        calendarId: calendarId,
        resource: event,
        conferenceDataVersion: eventData.conferenceData ? 1 : 0
      });

      console.log('✅ Evento criado com sucesso:', response.data.id);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao criar evento no Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Criar reunião no Google Meet
   */
  async createGoogleMeetMeeting(eventData: GoogleCalendarEvent): Promise<GoogleMeetMeeting> {
    try {
      console.log('🎥 Criando reunião no Google Meet');

      // Adicionar dados de conferência para Google Meet
      const eventWithConference = {
        ...eventData,
        conferenceData: {
          createRequest: {
            requestId: `meet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        }
      };

      const event = await this.createCalendarEvent(eventWithConference);

      if (event.conferenceData) {
        const meeting: GoogleMeetMeeting = {
          meetingUrl: event.conferenceData.entryPoints[0].uri,
          meetingId: event.conferenceData.conferenceId,
          conferenceId: event.conferenceData.conferenceId,
          entryPoints: event.conferenceData.entryPoints
        };

        console.log('✅ Reunião do Google Meet criada:', meeting.meetingUrl);
        return meeting;
      } else {
        throw new Error('Falha ao criar reunião no Google Meet');
      }
    } catch (error) {
      console.error('❌ Erro ao criar reunião no Google Meet:', error);
      throw error;
    }
  }

  /**
   * Verificar disponibilidade no calendário
   */
  async checkAvailability(
    timeMin: string,
    timeMax: string,
    attendees: string[],
    calendarId: string = 'primary'
  ): Promise<boolean> {
    try {
      console.log('🔍 Verificando disponibilidade no calendário');

      const response = await this.calendar.freebusy.query({
        resource: {
          timeMin: timeMin,
          timeMax: timeMax,
          items: [
            { id: calendarId },
            ...attendees.map(email => ({ id: email }))
          ]
        }
      });

      const busyTimes = response.data.calendars[calendarId]?.busy || [];
      const isAvailable = busyTimes.length === 0;

      console.log(`📊 Disponibilidade: ${isAvailable ? 'Disponível' : 'Ocupado'}`);
      return isAvailable;
    } catch (error) {
      console.error('❌ Erro ao verificar disponibilidade:', error);
      return false;
    }
  }

  /**
   * Listar eventos do calendário
   */
  async listEvents(
    timeMin: string,
    timeMax: string,
    calendarId: string = 'primary',
    maxResults: number = 10
  ): Promise<any[]> {
    try {
      console.log('📋 Listando eventos do calendário');

      const response = await this.calendar.events.list({
        calendarId: calendarId,
        timeMin: timeMin,
        timeMax: timeMax,
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items || [];
    } catch (error) {
      console.error('❌ Erro ao listar eventos:', error);
      return [];
    }
  }

  /**
   * Atualizar evento no calendário
   */
  async updateCalendarEvent(
    eventId: string,
    eventData: Partial<GoogleCalendarEvent>,
    calendarId: string = 'primary'
  ): Promise<any> {
    try {
      console.log('✏️ Atualizando evento no Google Calendar:', eventId);

      const response = await this.calendar.events.update({
        calendarId: calendarId,
        eventId: eventId,
        resource: eventData
      });

      console.log('✅ Evento atualizado com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar evento:', error);
      throw error;
    }
  }

  /**
   * Deletar evento do calendário
   */
  async deleteCalendarEvent(eventId: string, calendarId: string = 'primary'): Promise<boolean> {
    try {
      console.log('🗑️ Deletando evento do Google Calendar:', eventId);

      await this.calendar.events.delete({
        calendarId: calendarId,
        eventId: eventId
      });

      console.log('✅ Evento deletado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar evento:', error);
      return false;
    }
  }

  /**
   * Obter URL de autorização OAuth2
   */
  getAuthUrl(): string {
    const { GOOGLE } = require('../config/integrations.config').INTEGRATIONS_CONFIG;

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE.SCOPES,
      prompt: 'consent'
    });
  }

  /**
   * Trocar código de autorização por tokens
   */
  async getTokensFromCode(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      
      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token
      };
    } catch (error) {
      console.error('❌ Erro ao obter tokens:', error);
      throw error;
    }
  }

  /**
   * Salvar credenciais do usuário no banco
   */
  async saveUserCredentials(
    ownerId: string,
    accessToken: string,
    refreshToken: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('connections')
        .upsert({
          owner_id: ownerId,
          name: 'Google Calendar',
          connection_type: 'google',
          config: {
            service: 'calendar',
            scopes: ['calendar', 'calendar.events']
          },
          credentials: {
            access_token: accessToken,
            refresh_token: refreshToken
          },
          is_connected: true,
          last_used_at: new Date().toISOString()
        }, {
          onConflict: 'owner_id,connection_type'
        });

      if (error) {
        console.error('❌ Erro ao salvar credenciais:', error);
        return false;
      }

      console.log('✅ Credenciais salvas com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar credenciais:', error);
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
        .select('credentials')
        .eq('owner_id', ownerId)
        .eq('connection_type', 'google')
        .eq('is_connected', true)
        .single();

      if (error || !data) {
        console.log('⚠️ Credenciais do Google não encontradas');
        return false;
      }

      const { access_token, refresh_token } = data.credentials;
      await this.setCredentials(access_token, refresh_token);

      console.log('✅ Credenciais carregadas com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao carregar credenciais:', error);
      return false;
    }
  }

  /**
   * Verificar se o usuário está conectado ao Google
   */
  async isUserConnected(ownerId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('connections')
        .select('is_connected')
        .eq('owner_id', ownerId)
        .eq('connection_type', 'google')
        .single();

      return !error && data?.is_connected === true;
    } catch (error) {
      console.error('❌ Erro ao verificar conexão:', error);
      return false;
    }
  }

  /**
   * Desconectar usuário do Google
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
        .eq('connection_type', 'google');

      if (error) {
        console.error('❌ Erro ao desconectar usuário:', error);
        return false;
      }

      console.log('✅ Usuário desconectado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao desconectar usuário:', error);
      return false;
    }
  }
}

export default GoogleIntegrationService;
