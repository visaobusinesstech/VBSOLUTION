import { Request, Response, NextFunction } from 'express';
import logger from '../logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Erro interno do servidor';

  logger.error('Erro capturado pelo middleware:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    statusCode
  });

  // Se for erro de validação Zod
  if (error.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: 'Erro de validação',
      details: (error as any).errors
    });
  }

  // Se for erro do Prisma
  if (error.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      success: false,
      error: 'Erro no banco de dados',
      details: 'Verifique os dados fornecidos'
    });
  }

  // Se for erro de arquivo não encontrado
  if (error.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      error: 'Erro no upload de arquivo',
      details: error.message
    });
  }

  // Resposta padrão
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn(`Rota não encontrada: ${req.method} ${req.path}`);
  
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada'
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
