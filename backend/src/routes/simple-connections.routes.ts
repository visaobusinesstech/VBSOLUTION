import { Router } from 'express';
import { SimpleConnectionsController } from '../controllers/simple-connections.controller';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const controller = new SimpleConnectionsController(prisma);

// Listar conexões
router.get('/connections', controller.listConnections.bind(controller));

// Criar nova conexão
router.post('/connections', controller.createConnection.bind(controller));

// Obter informações da conexão
router.get('/connections/:connectionId', controller.getConnectionInfo.bind(controller));

// Atualizar status da conexão
router.put('/connections/:connectionId/status', controller.updateConnectionStatus.bind(controller));

// Deletar conexão
router.delete('/connections/:connectionId', controller.deleteConnection.bind(controller));

export default router;
