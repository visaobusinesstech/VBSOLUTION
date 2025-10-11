import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../services/encryption.service';
import { GoogleService } from '../services/google.service';
import { authMiddleware } from '../middlewares/auth';
import logger from '../logger';

export function createGoogleCalendarRoutes(prisma: PrismaClient) {
  const router = Router();
  const encryptionService = new EncryptionService();
  const googleService = new GoogleService(prisma, encryptionService);

  // Aplicar middleware de autenticação em todas as rotas
  router.use(authMiddleware);

  // Buscar calendários do usuário
  router.get('/calendars/:integrationId', async (req, res) => {
    try {
      const ownerId = req.headers['x-user-id'] as string;
      const { integrationId } = req.params;

      if (!ownerId) {
        return res.status(400).json({ success: false, error: 'Owner ID é obrigatório' });
      }

      // Verificar se a integração pertence ao usuário
      const integration = await prisma.integration.findFirst({
        where: {
          id: integrationId,
          ownerId,
          platform: 'google',
          isActive: true,
        },
      });

      if (!integration) {
        return res.status(404).json({ success: false, error: 'Integração não encontrada' });
      }

      // Buscar calendários do Google
      const auth = await googleService.getAuthenticatedClient(integrationId);
      if (!auth) {
        return res.status(401).json({ success: false, error: 'Não foi possível autenticar com o Google' });
      }

      const { google } = require('googleapis');
      const calendar = google.calendar({ version: 'v3', auth });

      const calendars = await calendar.calendarList.list();

      res.json({ success: true, data: calendars.data });
    } catch (error: any) {
      logger.error('Erro ao buscar calendários do Google:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Buscar eventos de um calendário específico
  router.get('/events/:integrationId/:calendarId', async (req, res) => {
    try {
      const ownerId = req.headers['x-user-id'] as string;
      const { integrationId, calendarId } = req.params;
      const { timeMin, timeMax, maxResults = 250 } = req.query;

      if (!ownerId) {
        return res.status(400).json({ success: false, error: 'Owner ID é obrigatório' });
      }

      // Verificar se a integração pertence ao usuário
      const integration = await prisma.integration.findFirst({
        where: {
          id: integrationId,
          ownerId,
          platform: 'google',
          isActive: true,
        },
      });

      if (!integration) {
        return res.status(404).json({ success: false, error: 'Integração não encontrada' });
      }

      // Buscar eventos do Google Calendar
      const auth = await googleService.getAuthenticatedClient(integrationId);
      if (!auth) {
        return res.status(401).json({ success: false, error: 'Não foi possível autenticar com o Google' });
      }

      const { google } = require('googleapis');
      const calendar = google.calendar({ version: 'v3', auth });

      const eventsParams: any = {
        calendarId,
        maxResults: parseInt(maxResults as string),
        singleEvents: true,
        orderBy: 'startTime',
      };

      if (timeMin) {
        eventsParams.timeMin = timeMin;
      }
      if (timeMax) {
        eventsParams.timeMax = timeMax;
      }

      const events = await calendar.events.list(eventsParams);

      res.json({ success: true, data: events.data });
    } catch (error: any) {
      logger.error('Erro ao buscar eventos do Google Calendar:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Criar evento no Google Calendar
  router.post('/events/:integrationId/:calendarId', async (req, res) => {
    try {
      const ownerId = req.headers['x-user-id'] as string;
      const { integrationId, calendarId } = req.params;
      const eventData = req.body;

      if (!ownerId) {
        return res.status(400).json({ success: false, error: 'Owner ID é obrigatório' });
      }

      // Verificar se a integração pertence ao usuário
      const integration = await prisma.integration.findFirst({
        where: {
          id: integrationId,
          ownerId,
          platform: 'google',
          isActive: true,
        },
      });

      if (!integration) {
        return res.status(404).json({ success: false, error: 'Integração não encontrada' });
      }

      // Criar evento no Google Calendar
      const auth = await googleService.getAuthenticatedClient(integrationId);
      if (!auth) {
        return res.status(401).json({ success: false, error: 'Não foi possível autenticar com o Google' });
      }

      const { google } = require('googleapis');
      const calendar = google.calendar({ version: 'v3', auth });

      const event = await calendar.events.insert({
        calendarId,
        requestBody: eventData,
      });

      res.json({ success: true, data: event.data });
    } catch (error: any) {
      logger.error('Erro ao criar evento no Google Calendar:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Atualizar evento no Google Calendar
  router.patch('/events/:integrationId/:calendarId/:eventId', async (req, res) => {
    try {
      const ownerId = req.headers['x-user-id'] as string;
      const { integrationId, calendarId, eventId } = req.params;
      const eventData = req.body;

      if (!ownerId) {
        return res.status(400).json({ success: false, error: 'Owner ID é obrigatório' });
      }

      // Verificar se a integração pertence ao usuário
      const integration = await prisma.integration.findFirst({
        where: {
          id: integrationId,
          ownerId,
          platform: 'google',
          isActive: true,
        },
      });

      if (!integration) {
        return res.status(404).json({ success: false, error: 'Integração não encontrada' });
      }

      // Atualizar evento no Google Calendar
      const auth = await googleService.getAuthenticatedClient(integrationId);
      if (!auth) {
        return res.status(401).json({ success: false, error: 'Não foi possível autenticar com o Google' });
      }

      const { google } = require('googleapis');
      const calendar = google.calendar({ version: 'v3', auth });

      const event = await calendar.events.update({
        calendarId,
        eventId,
        requestBody: eventData,
      });

      res.json({ success: true, data: event.data });
    } catch (error: any) {
      logger.error('Erro ao atualizar evento no Google Calendar:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Deletar evento do Google Calendar
  router.delete('/events/:integrationId/:calendarId/:eventId', async (req, res) => {
    try {
      const ownerId = req.headers['x-user-id'] as string;
      const { integrationId, calendarId, eventId } = req.params;

      if (!ownerId) {
        return res.status(400).json({ success: false, error: 'Owner ID é obrigatório' });
      }

      // Verificar se a integração pertence ao usuário
      const integration = await prisma.integration.findFirst({
        where: {
          id: integrationId,
          ownerId,
          platform: 'google',
          isActive: true,
        },
      });

      if (!integration) {
        return res.status(404).json({ success: false, error: 'Integração não encontrada' });
      }

      // Deletar evento do Google Calendar
      const auth = await googleService.getAuthenticatedClient(integrationId);
      if (!auth) {
        return res.status(401).json({ success: false, error: 'Não foi possível autenticar com o Google' });
      }

      const { google } = require('googleapis');
      const calendar = google.calendar({ version: 'v3', auth });

      await calendar.events.delete({
        calendarId,
        eventId,
      });

      res.json({ success: true, message: 'Evento deletado com sucesso' });
    } catch (error: any) {
      logger.error('Erro ao deletar evento do Google Calendar:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Criar webhook para receber notificações do Google Calendar
  router.post('/watch/:integrationId/:calendarId', async (req, res) => {
    try {
      const ownerId = req.headers['x-user-id'] as string;
      const { integrationId, calendarId } = req.params;
      const { channelId, webhookUrl } = req.body;

      if (!ownerId) {
        return res.status(400).json({ success: false, error: 'Owner ID é obrigatório' });
      }

      // Verificar se a integração pertence ao usuário
      const integration = await prisma.integration.findFirst({
        where: {
          id: integrationId,
          ownerId,
          platform: 'google',
          isActive: true,
        },
      });

      if (!integration) {
        return res.status(404).json({ success: false, error: 'Integração não encontrada' });
      }

      // Criar webhook no Google Calendar
      const auth = await googleService.getAuthenticatedClient(integrationId);
      if (!auth) {
        return res.status(401).json({ success: false, error: 'Não foi possível autenticar com o Google' });
      }

      const { google } = require('googleapis');
      const calendar = google.calendar({ version: 'v3', auth });

      const watchResponse = await calendar.events.watch({
        calendarId,
        requestBody: {
          id: channelId,
          type: 'web_hook',
          address: webhookUrl,
        },
      });

      // Salvar informações do webhook no banco
      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          webhook_config: JSON.stringify({
            calendarId,
            channelId,
            webhookUrl,
            resourceId: watchResponse.data.resourceId,
            expiration: watchResponse.data.expiration,
          }),
        },
      });

      res.json({ success: true, data: watchResponse.data });
    } catch (error: any) {
      logger.error('Erro ao criar webhook do Google Calendar:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Parar webhook do Google Calendar
  router.post('/stop/:integrationId/:channelId', async (req, res) => {
    try {
      const ownerId = req.headers['x-user-id'] as string;
      const { integrationId, channelId } = req.params;
      const { resourceId } = req.body;

      if (!ownerId) {
        return res.status(400).json({ success: false, error: 'Owner ID é obrigatório' });
      }

      // Verificar se a integração pertence ao usuário
      const integration = await prisma.integration.findFirst({
        where: {
          id: integrationId,
          ownerId,
          platform: 'google',
          isActive: true,
        },
      });

      if (!integration) {
        return res.status(404).json({ success: false, error: 'Integração não encontrada' });
      }

      // Parar webhook no Google Calendar
      const auth = await googleService.getAuthenticatedClient(integrationId);
      if (!auth) {
        return res.status(401).json({ success: false, error: 'Não foi possível autenticar com o Google' });
      }

      const { google } = require('googleapis');
      const calendar = google.calendar({ version: 'v3', auth });

      await calendar.channels.stop({
        requestBody: {
          id: channelId,
          resourceId,
        },
      });

      // Limpar configuração do webhook no banco
      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          webhook_config: null,
        },
      });

      res.json({ success: true, message: 'Webhook parado com sucesso' });
    } catch (error: any) {
      logger.error('Erro ao parar webhook do Google Calendar:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
