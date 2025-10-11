import { Request, Response, NextFunction } from 'express';
import env from '../env';
import logger from '../logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    token: string;
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Token de autorização não fornecido'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (token !== env.API_BEARER) {
      logger.warn(`Tentativa de acesso com token inválido: ${token.substring(0, 10)}...`);
      return res.status(401).json({
        success: false,
        error: 'Token de autorização inválido'
      });
    }

    // Mock user para desenvolvimento
    req.user = {
      id: 'dev-user-1',
      email: 'dev@vbsolution.com',
      token: token
    };

    next();
  } catch (error) {
    logger.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno de autenticação'
    });
  }
};

export const socketAuthMiddleware = (socket: any, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token || token !== env.API_BEARER) {
      logger.warn(`Tentativa de conexão Socket.IO com token inválido: ${token?.substring(0, 10)}...`);
      return next(new Error('Token de autorização inválido'));
    }

    socket.user = {
      id: 'dev-user-1',
      email: 'dev@vbsolution.com',
      token: token
    };

    next();
  } catch (error) {
    logger.error('Erro na autenticação Socket.IO:', error);
    next(new Error('Erro interno de autenticação'));
  }
};
