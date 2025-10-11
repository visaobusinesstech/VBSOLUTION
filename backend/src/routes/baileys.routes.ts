import { Router } from 'express';
import { baileysController } from '../controllers/baileys.controller';

const router = Router();

// Criar nova conexão Baileys
router.post('/connections', baileysController.createConnection.bind(baileysController));

// Obter informações da conexão
router.get('/connections/:connectionId', baileysController.getConnectionInfo.bind(baileysController));

// Obter QR Code
router.get('/connections/:connectionId/qr', baileysController.getQRCode.bind(baileysController));

// Solicitar código de pareamento
router.post('/connections/:connectionId/pairing-code', baileysController.requestPairingCode.bind(baileysController));

// Enviar mensagem
router.post('/connections/:connectionId/send-message', baileysController.sendMessage.bind(baileysController));

// Desconectar
router.delete('/connections/:connectionId', baileysController.disconnect.bind(baileysController));

// Listar todas as conexões
router.get('/connections', baileysController.getAllConnections.bind(baileysController));

// Testar webhook
router.post('/test-webhook', baileysController.testWebhook.bind(baileysController));

// Histórico de mensagens e dados do WhatsApp
router.get('/connections/:connectionId/message-history', baileysController.getMessageHistory.bind(baileysController));
router.get('/connections/:connectionId/chats', baileysController.getChats.bind(baileysController));
router.get('/connections/:connectionId/contacts', baileysController.getContacts.bind(baileysController));
router.get('/connections/:connectionId/profile-picture', baileysController.getProfilePicture.bind(baileysController));
router.get('/connections/:connectionId/chat-metadata', baileysController.getChatMetadata.bind(baileysController));

// Mensagens em tempo real
router.post('/connections/:connectionId/send-message', baileysController.sendMessage.bind(baileysController));
router.post('/connections/:connectionId/mark-read', baileysController.markMessageAsRead.bind(baileysController));
router.get('/connections/:connectionId/presence', baileysController.getPresence.bind(baileysController));
router.post('/connections/:connectionId/presence', baileysController.updatePresence.bind(baileysController));

// Tipos específicos de mensagens
router.post('/connections/:connectionId/send-text', baileysController.sendTextMessage.bind(baileysController));
router.post('/connections/:connectionId/send-media', baileysController.sendMediaMessage.bind(baileysController));
router.post('/connections/:connectionId/send-location', baileysController.sendLocationMessage.bind(baileysController));
router.post('/connections/:connectionId/send-contact', baileysController.sendContactMessage.bind(baileysController));

export default router;
