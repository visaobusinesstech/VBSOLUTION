import { Router } from 'express';
import { BaileysSimpleController } from '../controllers/baileys-simple.controller';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const controller = new BaileysSimpleController(prisma);

// Criar nova conexão
router.post('/connections', controller.createConnection.bind(controller));

// Obter informações da conexão
router.get('/connections/:connectionId', controller.getConnectionInfo.bind(controller));

// Obter QR Code
router.get('/connections/:connectionId/qr', controller.getQRCode.bind(controller));

// Listar conexões
router.get('/connections', controller.listConnections.bind(controller));

// Deletar conexão
router.delete('/connections/:connectionId', controller.deleteConnection.bind(controller));

// Obter chats
router.get('/connections/:connectionId/chats', controller.getChats.bind(controller));

// Obter mensagens
router.get('/connections/:connectionId/chats/:chatId/messages', controller.getMessages.bind(controller));

// Enviar mensagem
router.post('/connections/:connectionId/chats/:chatId/messages', controller.sendMessage.bind(controller));

export default router;
