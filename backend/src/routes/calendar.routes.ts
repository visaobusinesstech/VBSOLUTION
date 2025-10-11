import { Router } from 'express';
import { CalendarController } from '../controllers/calendar.controller';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../services/encryption.service';
import { authMiddleware } from '../middlewares/auth';

export function createCalendarRoutes(prisma: PrismaClient) {
  const router = Router();
  const encryptionService = new EncryptionService();
  const calendarController = new CalendarController(prisma, encryptionService);

  // Aplicar middleware de autenticação em todas as rotas
  router.use(authMiddleware);

  // Rotas de eventos
  router.get('/events', (req, res) => calendarController.getEvents(req, res));
  router.post('/events', (req, res) => calendarController.createEvent(req, res));
  router.patch('/events/:eventId', (req, res) => calendarController.updateEvent(req, res));
  router.delete('/events/:eventId', (req, res) => calendarController.deleteEvent(req, res));

  return router;
}
