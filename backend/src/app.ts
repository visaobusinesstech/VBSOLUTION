import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import env from './env';
import logger from './logger';
import { errorHandler, notFoundHandler } from './middlewares/error';
import { createWhatsAppRoutes } from './routes/whatsapp.routes';
import { createAtendimentoRoutes } from './routes/atendimento.routes';
import { createConfigRoutes } from './routes/config.routes';
import { createMediaRoutes } from './routes/media.routes';
import baileysRoutes from './routes/baileys.routes';
import baileysSimpleRoutes from './routes/baileys-simple.routes';
import simpleConnectionsRoutes from './routes/simple-connections.routes';
import whatsappEventsRoutes from './routes/whatsapp-events.routes';
import webhookRoutes from './routes/webhook.routes';
import conversationsRoutes from './routes/conversations.routes';
import messagesRoutes from './routes/messages.routes';
import contactsRoutes from './routes/contacts.routes';
import whatsappIntegrationRoutes from './routes/whatsapp-integration.routes';
import whatsappBootstrapRoutes from './routes/whatsapp-bootstrap.routes';
import { whatsappV2Routes } from './routes/whatsapp-v2.routes';
import whatsappProfileRoutes from './routes/whatsapp-profile.routes';
import whatsappAdvancedRoutes from './routes/whatsapp-advanced.routes';
import aiRoutes from './routes/ai';
import webhooksRoutes from './routes/webhooks.routes';
import aiAgentRoutes from './routes/ai-agent.routes';
import { createIntegrationRoutes } from './routes/integration.routes';
import { createCalendarRoutes } from './routes/calendar.routes';
import { createGoogleCalendarRoutes } from './routes/google-calendar.routes';
import { createLeadsRoutes } from './routes/leads.routes';
import emailRoutes from './routes/email.routes';
import { WhatsAppController } from './controllers/whatsapp.controller';
import { AtendimentoController } from './controllers/atendimento.controller';
import { ConfigController } from './controllers/config.controller';
import { MediaController } from './controllers/media.controller';
import { WhatsAppService } from './services/whatsapp.service';
import { AtendimentoService } from './services/atendimento.service';
import { ConfigService } from './services/config.service';
import { MediaService } from './services/media.service';
import { getBaileysService } from './services/baileys.service';
import { getRealtimeEventsService } from './services/realtime-events.service';
import { PrismaClient } from '@prisma/client';

export function createApp(io: any) {
  const app = express();
  const prisma = new PrismaClient();

  // Middlewares de segurança
  app.use(helmet());
  app.use(cors({
    origin: env.WEB_ORIGIN,
    credentials: true
  }));

  // Middlewares de parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Servir arquivos estáticos
  app.use('/uploads', express.static(path.join(process.cwd(), env.UPLOAD_DIR)));

  // Log de requisições
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    next();
  });

  // Inicializar serviços
  const whatsappService = new WhatsAppService(io, prisma);
  const atendimentoService = new AtendimentoService(prisma);
  const configService = new ConfigService(prisma);
  const mediaService = new MediaService(prisma);
  const baileysService = getBaileysService(prisma);
  const realtimeEventsService = getRealtimeEventsService(io);

  // Inicializar controladores
  const whatsappController = new WhatsAppController(whatsappService);
  const atendimentoController = new AtendimentoController(atendimentoService);
  const configController = new ConfigController(configService);
  const mediaController = new MediaController(mediaService);

  // Rotas da API
  app.use('/api/whatsapp', createWhatsAppRoutes(whatsappController));
  app.use('/api/atendimento', createAtendimentoRoutes(atendimentoController));
  app.use('/api/config', createConfigRoutes(configController));
  app.use('/api/media', createMediaRoutes(mediaController));
  app.use('/api/baileys', baileysRoutes);
  app.use('/api/baileys-simple', simpleConnectionsRoutes);
  app.use('/api/whatsapp-events', whatsappEventsRoutes);
  app.use('/api/webhook', webhookRoutes);
  app.use('/api/conversations', conversationsRoutes);
  app.use('/api/messages', messagesRoutes);
  app.use('/api/contacts', contactsRoutes);
  app.use('/api/whatsapp-integration', whatsappIntegrationRoutes);
  app.use('/api/whatsapp-bootstrap', whatsappBootstrapRoutes);
  app.use('/api/whatsapp-v2', whatsappV2Routes);
  app.use('/api/whatsapp-profile', whatsappProfileRoutes);
  app.use('/api/whatsapp-advanced', whatsappAdvancedRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/ai-agent', aiAgentRoutes);
  app.use('/api/integrations', createIntegrationRoutes(prisma));
  app.use('/api/calendar', createCalendarRoutes(prisma));
  app.use('/api/integrations/google', createGoogleCalendarRoutes(prisma));
  app.use('/api/leads', createLeadsRoutes(prisma));
  app.use('/api/email', emailRoutes);
  app.use('/webhooks', webhooksRoutes);

  // Rota de health check
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'WhatsApp Module API está funcionando',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // Middleware de tratamento de erros
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM recebido, encerrando aplicação...');
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT recebido, encerrando aplicação...');
    await prisma.$disconnect();
    process.exit(0);
  });

  return app;
}
