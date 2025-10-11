import { SocketIOServer } from 'socket.io';
import { getBaileysSimpleService } from '../services/baileys-simple.service';
import { ConnectionsPersistenceService } from '../services/connections-persistence.service';
import { PrismaClient } from '@prisma/client';
import logger from '../logger';

export function setupBaileysSocketIO(io: SocketIOServer) {
  // Namespace para Baileys
  const baileysNamespace = io.of('/baileys');

  baileysNamespace.on('connection', (socket) => {
    logger.info('Cliente conectado ao namespace Baileys', {
      socketId: socket.id
    });

    // Join connection room
    socket.on('join-connection', (connectionId: string) => {
      socket.join(`connection:${connectionId}`);
      logger.info(`Cliente ${socket.id} entrou na sala da conexão ${connectionId}`);
    });

    // Leave connection room
    socket.on('leave-connection', (connectionId: string) => {
      socket.leave(`connection:${connectionId}`);
      logger.info(`Cliente ${socket.id} saiu da sala da conexão ${connectionId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`Cliente ${socket.id} desconectado do namespace Baileys`);
    });
  });

  // Configurar eventos do BaileysSimpleService
  const prisma = new PrismaClient();
  const persistenceService = new ConnectionsPersistenceService(prisma);
  const baileysService = getBaileysSimpleService(persistenceService);
  
  if (baileysService) {
    baileysService.on('qrCode', (data: { connectionId: string, qrCode: string }) => {
      logger.info('QR Code gerado, enviando para clientes', { connectionId });
      baileysNamespace.to(`connection:${data.connectionId}`).emit('qrCode', data);
    });

    baileysService.on('connectionUpdate', (data: { connectionId: string, update: any }) => {
      logger.info('Atualização de conexão, enviando para clientes', { connectionId });
      baileysNamespace.to(`connection:${data.connectionId}`).emit('connectionUpdate', data);
    });
  } else {
    logger.warn('BaileysSimpleService não foi inicializado corretamente');
  }

  logger.info('Socket.IO Baileys configurado com sucesso');
}

