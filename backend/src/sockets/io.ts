import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { socketAuthMiddleware } from '../middlewares/auth';
import { setupBaileysSocketIO } from './baileys.io';
import logger from '../logger';
import env from '../env';

// Extender o tipo Socket para incluir user
interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    token: string;
  };
}

export function createSocketIO(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env['WEB_ORIGIN'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Middleware de autenticação para Socket.IO
  io.use(socketAuthMiddleware);

  // Namespace para chat
  const chatNamespace = io.of('/chat');

  chatNamespace.on('connection', (socket: AuthenticatedSocket) => {
    logger.info('Cliente conectado ao Socket.IO', {
      socketId: socket.id,
      userId: socket.user?.id
    });

    // Inscrever em sala de atendimento
    socket.on('chat:subscribe', (data: { atendimentoId: string }) => {
      try {
        const { atendimentoId } = data;
        
        // Sair de todas as salas anteriores
        socket.rooms.forEach(room => {
          if (room !== socket.id) {
            socket.leave(room);
          }
        });

        // Entrar na sala do atendimento
        const roomName = `atendimento-${atendimentoId}`;
        socket.join(roomName);
        
        logger.info('Cliente inscrito em sala de atendimento', {
          socketId: socket.id,
          atendimentoId,
          roomName
        });

        // Confirmar inscrição
        socket.emit('chat:subscribed', { atendimentoId, roomName });
      } catch (error) {
        logger.error('Erro ao inscrever em sala de atendimento:', error);
        socket.emit('chat:error', { error: 'Erro ao inscrever em sala' });
      }
    });

    // Indicador de digitação
    socket.on('chat:typing', (data: { atendimentoId: string; isTyping: boolean }) => {
      try {
        const { atendimentoId, isTyping } = data;
        const roomName = `atendimento-${atendimentoId}`;
        
        // Transmitir para outros na mesma sala
        socket.to(roomName).emit('chat:typing', {
          atendimentoId,
          isTyping,
          userId: socket.user?.id
        });
      } catch (error) {
        logger.error('Erro ao processar indicador de digitação:', error);
      }
    });

    // Desconexão
    socket.on('disconnect', (reason) => {
      logger.info('Cliente desconectado do Socket.IO', {
        socketId: socket.id,
        userId: socket.user?.id,
        reason
      });
    });

    // Erro de conexão
    socket.on('error', (error) => {
      logger.error('Erro no Socket.IO:', error);
    });
  });

  // Namespace para WhatsApp
  const whatsappNamespace = io.of('/whatsapp');

  whatsappNamespace.on('connection', (socket: AuthenticatedSocket) => {
    logger.info('Cliente conectado ao namespace WhatsApp', {
      socketId: socket.id,
      userId: socket.user?.id
    });

    // Inscrever em sala de sessão WhatsApp
    socket.on('whatsapp:subscribe', (data: { sessionName: string }) => {
      try {
        const { sessionName } = data;
        
        // Sair de todas as salas anteriores
        socket.rooms.forEach(room => {
          if (room !== socket.id) {
            socket.leave(room);
          }
        });

        // Entrar na sala da sessão WhatsApp
        const roomName = `whatsapp-${sessionName}`;
        socket.join(roomName);
        
        logger.info('Cliente inscrito em sala WhatsApp', {
          socketId: socket.id,
          sessionName,
          roomName
        });

        // Confirmar inscrição
        socket.emit('whatsapp:subscribed', { sessionName, roomName });
      } catch (error) {
        logger.error('Erro ao inscrever em sala WhatsApp:', error);
        socket.emit('whatsapp:error', { error: 'Erro ao inscrever em sala' });
      }
    });

    // Desconexão
    socket.on('disconnect', (reason) => {
      logger.info('Cliente desconectado do namespace WhatsApp', {
        socketId: socket.id,
        userId: socket.user?.id,
        reason
      });
    });

    // Erro de conexão
    socket.on('error', (error) => {
      logger.error('Erro no Socket.IO WhatsApp:', error);
    });
  });

  // Log de eventos do Socket.IO
  io.engine.on('connection_error', (err) => {
    logger.error('Erro de conexão Socket.IO:', err);
  });

  // Configurar namespace do Baileys
  setupBaileysSocketIO(io);

  logger.info('Socket.IO configurado com sucesso');

  return io;
}
