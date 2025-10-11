import { Router } from 'express';
import { whatsappV2Controller } from '../controllers/whatsapp-v2.controller';
import { getWhatsAppHealth } from '../controllers/whatsapp-health.controller';
import { authMiddleware } from '../middlewares/auth';

export function createWhatsAppV2Routes() {
  const router = Router();

  // Aplicar middleware de autenticação em todas as rotas
  router.use(authMiddleware);

  // Session management
  router.post('/sessions', (req, res) => whatsappV2Controller.startSession(req, res));
  router.delete('/sessions/:sessionName', (req, res) => whatsappV2Controller.stopSession(req, res));
  router.get('/sessions/:sessionName/status', (req, res) => whatsappV2Controller.getStatus(req, res));
  router.get('/sessions', (req, res) => whatsappV2Controller.getAllSessions(req, res));

  // Messaging
  router.post('/send-message', (req, res) => whatsappV2Controller.sendMessage(req, res));

  // Conversations (Supabase data)
  router.get('/conversations', (req, res) => whatsappV2Controller.getConversations(req, res));
  router.get('/conversations/:atendimentoId/messages', (req, res) => whatsappV2Controller.getMessages(req, res));
  router.post('/conversations/:atendimentoId/mark-read', (req, res) => whatsappV2Controller.markAsRead(req, res));
  router.put('/conversations/:atendimentoId/status', (req, res) => whatsappV2Controller.updateAtendimentoStatus(req, res));

  // Configuration
  router.get('/configuration', (req, res) => whatsappV2Controller.getConfiguration(req, res));
  router.put('/configuration', (req, res) => whatsappV2Controller.updateConfiguration(req, res));
  router.post('/configuration/initialize', (req, res) => whatsappV2Controller.initializeConfig(req, res));

  // Health
  router.get('/health', (req, res) => whatsappV2Controller.getHealthStatus(req, res));
  router.get('/health/whatsapp', (req, res) => getWhatsAppHealth(req, res));

  return router;
}

export const whatsappV2Routes = createWhatsAppV2Routes();
