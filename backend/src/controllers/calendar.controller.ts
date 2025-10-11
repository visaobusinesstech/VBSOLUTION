import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../services/encryption.service';
import { GoogleService } from '../services/google.service';
import logger from '../logger';

export class CalendarController {
  private prisma: PrismaClient;
  private encryptionService: EncryptionService;
  private googleService: GoogleService;

  constructor(prisma: PrismaClient, encryptionService: EncryptionService) {
    this.prisma = prisma;
    this.encryptionService = encryptionService;
    this.googleService = new GoogleService(prisma, encryptionService);
  }

  // Buscar eventos do calendário
  async getEvents(req: Request, res: Response) {
    try {
      const ownerId = req.headers['x-user-id'] as string;
      const { start, end, lead_id } = req.query;

      if (!ownerId) {
        return res.status(400).json({ success: false, error: 'Owner ID é obrigatório' });
      }

      let whereClause: any = {
        owner_id: ownerId,
      };

      // Filtrar por período se especificado
      if (start || end) {
        whereClause.start_time = {};
        if (start) {
          whereClause.start_time.gte = new Date(start as string);
        }
        if (end) {
          whereClause.start_time.lte = new Date(end as string);
        }
      }

      // Usar query SQL raw para contornar problemas do Prisma
      const events = await this.prisma.$queryRaw`
        SELECT * FROM events 
        WHERE owner_id = ${ownerId}
        ${start ? `AND start_time >= ${new Date(start as string)}` : ''}
        ${end ? `AND start_time <= ${new Date(end as string)}` : ''}
        ORDER BY start_time ASC
      `;

      // Converter para formato do frontend
      const formattedEvents = events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        start: event.scheduled_date,
        end: event.end_date,
        type: event.type,
        lead_id: event.lead_id,
        lead: event.lead,
        location: event.location,
        attendees: event.attendees ? JSON.parse(event.attendees) : [],
        is_all_day: event.is_all_day,
        reminder_minutes: event.reminder_minutes,
        status: event.status,
        google_event_id: event.google_event_id,
        created_at: event.created_at,
        updated_at: event.updated_at,
      }));

      res.json({ success: true, data: formattedEvents });
    } catch (error: any) {
      logger.error('Erro ao buscar eventos:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Criar novo evento
  async createEvent(req: Request, res: Response) {
    try {
      const ownerId = req.headers['x-user-id'] as string;
      const {
        title,
        description,
        start,
        end,
        type,
        lead_id,
        location,
        attendees,
        is_all_day,
        reminder_minutes,
        sync_to_google,
      } = req.body;

      if (!ownerId) {
        return res.status(400).json({ success: false, error: 'Owner ID é obrigatório' });
      }

      if (!title || !start) {
        return res.status(400).json({ success: false, error: 'Título e data de início são obrigatórios' });
      }

      // Criar evento local usando SQL raw
      const eventResult = await this.prisma.$queryRaw`
        INSERT INTO events (id, owner_id, title, description, start_time, end_time, location, attendees, all_day, created_at, updated_at)
        VALUES (
          gen_random_uuid(),
          ${ownerId},
          ${title},
          ${description || null},
          ${new Date(start)},
          ${end ? new Date(end) : null},
          ${location || null},
          ${attendees ? JSON.stringify(attendees) : null},
          ${is_all_day || false},
          NOW(),
          NOW()
        )
        RETURNING *
      `;
      
      const event = eventResult[0];

      let googleEventId = null;

      // Sincronizar com Google Calendar se solicitado
      if (sync_to_google) {
        try {
          // Buscar integração do Google
          const integration = await this.prisma.integration.findFirst({
            where: {
              ownerId,
              platform: 'google',
              isActive: true,
            },
            include: {
              google: true,
            },
          });

          if (integration && integration.google) {
            // Buscar calendário primário
            const auth = await this.googleService.getAuthenticatedClient(integration.id);
            if (auth) {
              const { google } = require('googleapis');
              const calendar = google.calendar({ version: 'v3', auth });

              // Buscar calendário primário
              const calendars = await calendar.calendarList.list();
              const primaryCalendar = calendars.data.items.find((cal: any) => cal.primary);

              if (primaryCalendar) {
                // Criar evento no Google Calendar
                const googleEvent = {
                  summary: title,
                  description: description || '',
                  start: is_all_day 
                    ? { date: new Date(start).toISOString().split('T')[0] }
                    : { dateTime: new Date(start).toISOString() },
                  end: end 
                    ? (is_all_day 
                        ? { date: new Date(end).toISOString().split('T')[0] }
                        : { dateTime: new Date(end).toISOString() })
                    : undefined,
                  location: location || '',
                  attendees: attendees?.map((email: string) => ({ email })) || [],
                };

                const googleEventResponse = await calendar.events.insert({
                  calendarId: primaryCalendar.id,
                  requestBody: googleEvent,
                });

                googleEventId = googleEventResponse.data.id;

                // Atualizar evento local com ID do Google
                await this.prisma.leadActivities.update({
                  where: { id: event.id },
                  data: { google_event_id: googleEventId },
                });
              }
            }
          }
        } catch (googleError) {
          logger.warn('Erro ao sincronizar com Google Calendar:', googleError);
          // Evento local foi criado com sucesso, apenas Google falhou
        }
      }

      const formattedEvent = {
        id: event.id,
        title: event.title,
        description: event.description,
        start: event.scheduled_date,
        end: event.end_date,
        type: event.type,
        lead_id: event.lead_id,
        lead: event.lead,
        location: event.location,
        attendees: event.attendees ? JSON.parse(event.attendees) : [],
        is_all_day: event.is_all_day,
        reminder_minutes: event.reminder_minutes,
        status: event.status,
        google_event_id: googleEventId,
        created_at: event.created_at,
        updated_at: event.updated_at,
      };

      res.json({ success: true, data: formattedEvent });
    } catch (error: any) {
      logger.error('Erro ao criar evento:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Atualizar evento
  async updateEvent(req: Request, res: Response) {
    try {
      const ownerId = req.headers['x-user-id'] as string;
      const { eventId } = req.params;
      const updateData = req.body;

      if (!ownerId) {
        return res.status(400).json({ success: false, error: 'Owner ID é obrigatório' });
      }

      // Buscar evento existente
      const existingEvent = await this.prisma.leadActivities.findFirst({
        where: {
          id: eventId,
          ownerId,
        },
      });

      if (!existingEvent) {
        return res.status(404).json({ success: false, error: 'Evento não encontrado' });
      }

      // Preparar dados para atualização
      const updateFields: any = {};
      
      if (updateData.title !== undefined) updateFields.title = updateData.title;
      if (updateData.description !== undefined) updateFields.description = updateData.description;
      if (updateData.start !== undefined) updateFields.scheduled_date = new Date(updateData.start);
      if (updateData.end !== undefined) updateFields.end_date = updateData.end ? new Date(updateData.end) : null;
      if (updateData.type !== undefined) updateFields.type = updateData.type;
      if (updateData.lead_id !== undefined) updateFields.lead_id = updateData.lead_id || null;
      if (updateData.location !== undefined) updateFields.location = updateData.location;
      if (updateData.attendees !== undefined) updateFields.attendees = updateData.attendees ? JSON.stringify(updateData.attendees) : null;
      if (updateData.is_all_day !== undefined) updateFields.is_all_day = updateData.is_all_day;
      if (updateData.reminder_minutes !== undefined) updateFields.reminder_minutes = updateData.reminder_minutes;
      if (updateData.status !== undefined) updateFields.status = updateData.status;

      // Atualizar evento local
      const updatedEvent = await this.prisma.leadActivities.update({
        where: { id: eventId },
        data: updateFields,
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              company: true,
            },
          },
        },
      });

      // Atualizar no Google Calendar se o evento estiver sincronizado
      if (existingEvent.google_event_id) {
        try {
          // Buscar integração do Google
          const integration = await this.prisma.integration.findFirst({
            where: {
              ownerId,
              platform: 'google',
              isActive: true,
            },
            include: {
              google: true,
            },
          });

          if (integration && integration.google) {
            const auth = await this.googleService.getAuthenticatedClient(integration.id);
            if (auth) {
              const { google } = require('googleapis');
              const calendar = google.calendar({ version: 'v3', auth });

              // Buscar calendário primário
              const calendars = await calendar.calendarList.list();
              const primaryCalendar = calendars.data.items.find((cal: any) => cal.primary);

              if (primaryCalendar) {
                // Atualizar evento no Google Calendar
                const googleEvent = {
                  summary: updatedEvent.title,
                  description: updatedEvent.description || '',
                  start: updatedEvent.is_all_day 
                    ? { date: updatedEvent.scheduled_date.toISOString().split('T')[0] }
                    : { dateTime: updatedEvent.scheduled_date.toISOString() },
                  end: updatedEvent.end_date 
                    ? (updatedEvent.is_all_day 
                        ? { date: updatedEvent.end_date.toISOString().split('T')[0] }
                        : { dateTime: updatedEvent.end_date.toISOString() })
                    : undefined,
                  location: updatedEvent.location || '',
                  attendees: updatedEvent.attendees ? JSON.parse(updatedEvent.attendees).map((email: string) => ({ email })) : [],
                };

                await calendar.events.update({
                  calendarId: primaryCalendar.id,
                  eventId: existingEvent.google_event_id,
                  requestBody: googleEvent,
                });
              }
            }
          }
        } catch (googleError) {
          logger.warn('Erro ao atualizar evento no Google Calendar:', googleError);
          // Evento local foi atualizado com sucesso, apenas Google falhou
        }
      }

      const formattedEvent = {
        id: updatedEvent.id,
        title: updatedEvent.title,
        description: updatedEvent.description,
        start: updatedEvent.scheduled_date,
        end: updatedEvent.end_date,
        type: updatedEvent.type,
        lead_id: updatedEvent.lead_id,
        lead: updatedEvent.lead,
        location: updatedEvent.location,
        attendees: updatedEvent.attendees ? JSON.parse(updatedEvent.attendees) : [],
        is_all_day: updatedEvent.is_all_day,
        reminder_minutes: updatedEvent.reminder_minutes,
        status: updatedEvent.status,
        google_event_id: updatedEvent.google_event_id,
        created_at: updatedEvent.created_at,
        updated_at: updatedEvent.updated_at,
      };

      res.json({ success: true, data: formattedEvent });
    } catch (error: any) {
      logger.error('Erro ao atualizar evento:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Deletar evento
  async deleteEvent(req: Request, res: Response) {
    try {
      const ownerId = req.headers['x-user-id'] as string;
      const { eventId } = req.params;

      if (!ownerId) {
        return res.status(400).json({ success: false, error: 'Owner ID é obrigatório' });
      }

      // Buscar evento existente
      const existingEvent = await this.prisma.leadActivities.findFirst({
        where: {
          id: eventId,
          ownerId,
        },
      });

      if (!existingEvent) {
        return res.status(404).json({ success: false, error: 'Evento não encontrado' });
      }

      // Deletar do Google Calendar se o evento estiver sincronizado
      if (existingEvent.google_event_id) {
        try {
          // Buscar integração do Google
          const integration = await this.prisma.integration.findFirst({
            where: {
              ownerId,
              platform: 'google',
              isActive: true,
            },
            include: {
              google: true,
            },
          });

          if (integration && integration.google) {
            const auth = await this.googleService.getAuthenticatedClient(integration.id);
            if (auth) {
              const { google } = require('googleapis');
              const calendar = google.calendar({ version: 'v3', auth });

              // Buscar calendário primário
              const calendars = await calendar.calendarList.list();
              const primaryCalendar = calendars.data.items.find((cal: any) => cal.primary);

              if (primaryCalendar) {
                // Deletar evento do Google Calendar
                await calendar.events.delete({
                  calendarId: primaryCalendar.id,
                  eventId: existingEvent.google_event_id,
                });
              }
            }
          }
        } catch (googleError) {
          logger.warn('Erro ao deletar evento do Google Calendar:', googleError);
          // Continuar com a exclusão local mesmo se Google falhar
        }
      }

      // Deletar evento local
      await this.prisma.leadActivities.delete({
        where: { id: eventId },
      });

      res.json({ success: true, message: 'Evento deletado com sucesso' });
    } catch (error: any) {
      logger.error('Erro ao deletar evento:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
