import { Router } from 'express';
import { IntegrationController } from '../controllers/integration.controller';
import { IntegrationService } from '../services/integration.service';
import { GoogleService } from '../services/google.service';
import { MetaService } from '../services/meta.service';
import { PrismaClient } from '@prisma/client';

export function createIntegrationRoutes(prisma: PrismaClient) {
  const router = Router();
  
  // Inicializar serviços
  const integrationService = new IntegrationService(prisma);
  const googleService = new GoogleService(integrationService);
  const metaService = new MetaService(integrationService);
  
  // Inicializar controlador
  const integrationController = new IntegrationController(
    integrationService,
    googleService,
    metaService
  );

  // Middleware para validar usuário (pode ser substituído por middleware de auth mais robusto)
  const validateUser = (req: any, res: any, next: any) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não identificado' });
    }
    next();
  };

  // Rotas de integração
  router.get('/integrations', validateUser, (req, res) => 
    integrationController.getIntegrations(req, res)
  );
  
  router.get('/integrations/:id', validateUser, (req, res) => 
    integrationController.getIntegration(req, res)
  );
  
  router.post('/integrations', validateUser, (req, res) => 
    integrationController.createIntegration(req, res)
  );
  
  router.put('/integrations/:id/config', validateUser, (req, res) => 
    integrationController.updateIntegrationConfig(req, res)
  );
  
  router.delete('/integrations/:id', validateUser, (req, res) => 
    integrationController.deleteIntegration(req, res)
  );
  
  router.post('/integrations/:id/disconnect', validateUser, (req, res) => 
    integrationController.disconnectIntegration(req, res)
  );
  
  router.get('/integrations/status', validateUser, (req, res) => 
    integrationController.getIntegrationStatus(req, res)
  );
  
  router.post('/integrations/:id/test', validateUser, (req, res) => 
    integrationController.testIntegration(req, res)
  );

  // Rotas de autorização Google
  router.get('/google/auth', validateUser, (req, res) => 
    integrationController.generateGoogleAuthUrl(req, res)
  );
  
  router.get('/google/callback', (req, res) => 
    integrationController.handleGoogleCallback(req, res)
  );

  // Rotas de autorização Meta (Facebook/Instagram)
  router.get('/meta/auth', validateUser, (req, res) => 
    integrationController.generateMetaAuthUrl(req, res)
  );
  
  router.get('/meta/callback', (req, res) => 
    integrationController.handleMetaCallback(req, res)
  );

  // Rotas específicas do Google Calendar
  router.get('/google/calendars/:integrationId', validateUser, async (req, res) => {
    try {
      const { integrationId } = req.params;
      const calendars = await googleService.listCalendars(integrationId);
      res.json({ success: true, data: calendars });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar calendários' });
    }
  });

  router.post('/google/events/:integrationId/:calendarId', validateUser, async (req, res) => {
    try {
      const { integrationId, calendarId } = req.params;
      const event = req.body;
      const result = await googleService.createEvent(integrationId, calendarId, event);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar evento' });
    }
  });

  router.get('/google/events/:integrationId/:calendarId', validateUser, async (req, res) => {
    try {
      const { integrationId, calendarId } = req.params;
      const { timeMin, timeMax, maxResults } = req.query;
      const events = await googleService.listEvents(
        integrationId, 
        calendarId, 
        timeMin as string, 
        timeMax as string, 
        parseInt(maxResults as string) || 100
      );
      res.json({ success: true, data: events });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar eventos' });
    }
  });

  router.patch('/google/events/:integrationId/:calendarId/:eventId', validateUser, async (req, res) => {
    try {
      const { integrationId, calendarId, eventId } = req.params;
      const event = req.body;
      const result = await googleService.updateEvent(integrationId, calendarId, eventId, event);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar evento' });
    }
  });

  router.delete('/google/events/:integrationId/:calendarId/:eventId', validateUser, async (req, res) => {
    try {
      const { integrationId, calendarId, eventId } = req.params;
      await googleService.deleteEvent(integrationId, calendarId, eventId);
      res.json({ success: true, message: 'Evento removido com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao remover evento' });
    }
  });

  // Rotas específicas do Meta (Facebook/Instagram)
  router.get('/meta/pages/:integrationId', validateUser, async (req, res) => {
    try {
      const { integrationId } = req.params;
      const pages = await metaService.getUserPages(integrationId);
      res.json({ success: true, data: pages });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar páginas' });
    }
  });

  router.post('/meta/posts/:integrationId/:pageId', validateUser, async (req, res) => {
    try {
      const { integrationId, pageId } = req.params;
      const post = req.body;
      const result = await metaService.createPost(integrationId, pageId, post);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar post' });
    }
  });

  router.get('/meta/posts/:integrationId/:pageId', validateUser, async (req, res) => {
    try {
      const { integrationId, pageId } = req.params;
      const { limit } = req.query;
      const posts = await metaService.getPagePosts(integrationId, pageId, parseInt(limit as string) || 25);
      res.json({ success: true, data: posts });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar posts' });
    }
  });

  router.get('/meta/comments/:integrationId/:postId', validateUser, async (req, res) => {
    try {
      const { integrationId, postId } = req.params;
      const { limit } = req.query;
      const comments = await metaService.getPostComments(integrationId, postId, parseInt(limit as string) || 25);
      res.json({ success: true, data: comments });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar comentários' });
    }
  });

  router.post('/meta/comments/:integrationId/:commentId/reply', validateUser, async (req, res) => {
    try {
      const { integrationId, commentId } = req.params;
      const { message } = req.body;
      const result = await metaService.replyToComment(integrationId, commentId, message);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao responder comentário' });
    }
  });

  // Rotas específicas do Instagram
  router.get('/instagram/user/:integrationId', validateUser, async (req, res) => {
    try {
      const { integrationId } = req.params;
      const user = await metaService.getInstagramUser(integrationId);
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar usuário Instagram' });
    }
  });

  router.post('/instagram/media/:integrationId/:userId/container', validateUser, async (req, res) => {
    try {
      const { integrationId, userId } = req.params;
      const { imageUrl, caption } = req.body;
      const result = await metaService.createInstagramMediaContainer(integrationId, userId, imageUrl, caption);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar container de mídia' });
    }
  });

  router.post('/instagram/media/:integrationId/:userId/publish', validateUser, async (req, res) => {
    try {
      const { integrationId, userId } = req.params;
      const { creationId } = req.body;
      const result = await metaService.publishInstagramMedia(integrationId, userId, creationId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao publicar mídia' });
    }
  });

  router.get('/instagram/media/:integrationId/:userId', validateUser, async (req, res) => {
    try {
      const { integrationId, userId } = req.params;
      const { limit } = req.query;
      const media = await metaService.getInstagramMedia(integrationId, userId, parseInt(limit as string) || 25);
      res.json({ success: true, data: media });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar mídia' });
    }
  });

  router.get('/instagram/comments/:integrationId/:mediaId', validateUser, async (req, res) => {
    try {
      const { integrationId, mediaId } = req.params;
      const { limit } = req.query;
      const comments = await metaService.getInstagramMediaComments(integrationId, mediaId, parseInt(limit as string) || 25);
      res.json({ success: true, data: comments });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar comentários da mídia' });
    }
  });

  router.post('/instagram/comments/:integrationId/:commentId/reply', validateUser, async (req, res) => {
    try {
      const { integrationId, commentId } = req.params;
      const { message } = req.body;
      const result = await metaService.replyToInstagramComment(integrationId, commentId, message);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao responder comentário do Instagram' });
    }
  });

  // Rotas de mensagens (Messenger/Instagram DM)
  router.post('/messages/:integrationId/:pageId/send', validateUser, async (req, res) => {
    try {
      const { integrationId, pageId } = req.params;
      const { recipientId, message, platform } = req.body;
      const result = await metaService.sendMessage(integrationId, pageId, recipientId, message, platform);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
  });

  return router;
}
