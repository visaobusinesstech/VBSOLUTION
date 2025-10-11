import { Router } from 'express';
import { WhatsAppController } from '../controllers/whatsapp.controller';
import { authMiddleware } from '../middlewares/auth';

export function createWhatsAppRoutes(whatsappController: WhatsAppController) {
  const router = Router();

  // Aplicar middleware de autenticação em todas as rotas
  router.use(authMiddleware);

  // Iniciar sessão WhatsApp
  router.post('/start-session', (req, res) => whatsappController.startSession(req, res));

  // Obter status da sessão
  router.get('/status', (req, res) => whatsappController.getStatus(req, res));

  // Encerrar sessão WhatsApp
  router.post('/stop-session', (req, res) => whatsappController.stopSession(req, res));

  // Listar todas as sessões
  router.get('/sessions', (req, res) => whatsappController.getSessions(req, res));

  // Remover sessão
  router.delete('/sessions/:sessionName', (req, res) => whatsappController.deleteSession(req, res));

  // Enviar mensagem de texto
  router.post('/send-text', (req, res) => whatsappController.sendText(req, res));

  // Enviar arquivo
  router.post('/send-file', (req, res) => whatsappController.sendFile(req, res));

  // Buscar mensagens de uma sessão
  router.get('/messages', (req, res) => whatsappController.getMessages(req, res));

  return router;
}
