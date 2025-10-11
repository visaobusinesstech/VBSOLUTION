import { Router } from 'express';
import { whatsappIntegrationController } from '../controllers/whatsapp-integration.controller';

const router = Router();

// Rotas de conexões
router.post('/connections', whatsappIntegrationController.createConnection.bind(whatsappIntegrationController));
router.get('/connections', whatsappIntegrationController.listConnections.bind(whatsappIntegrationController));
router.get('/connections/:connectionId', whatsappIntegrationController.getConnectionStatus.bind(whatsappIntegrationController));
router.delete('/connections/:connectionId', whatsappIntegrationController.removeConnection.bind(whatsappIntegrationController));
router.get('/connections/:connectionId/qr', whatsappIntegrationController.getQRCode.bind(whatsappIntegrationController));

// Rotas de mensagens
router.post('/messages/send', whatsappIntegrationController.sendMessage.bind(whatsappIntegrationController));
router.get('/messages/:atendimentoId', whatsappIntegrationController.getMessages.bind(whatsappIntegrationController));

// Rotas de atendimentos
router.get('/atendimentos/active', whatsappIntegrationController.getActiveAtendimentos.bind(whatsappIntegrationController));

// Rotas de sessões
router.get('/sessions/active', whatsappIntegrationController.getActiveSessions.bind(whatsappIntegrationController));

// Rotas de estatísticas e monitoramento
router.get('/stats/supabase', whatsappIntegrationController.getSupabaseStats.bind(whatsappIntegrationController));
router.post('/queue/clear', whatsappIntegrationController.clearMessageQueue.bind(whatsappIntegrationController));

export default router;
