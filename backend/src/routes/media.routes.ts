import { Router } from 'express';
import { MediaController } from '../controllers/media.controller';
import { authMiddleware } from '../middlewares/auth';
import { upload, uploadErrorHandler } from '../middlewares/upload';

export function createMediaRoutes(mediaController: MediaController) {
  const router = Router();

  // Aplicar middleware de autenticação em todas as rotas
  router.use(authMiddleware);

  // Upload de arquivo
  router.post('/upload', upload.single('file'), uploadErrorHandler, (req, res) => mediaController.uploadFile(req, res));

  // Obter informações de um arquivo
  router.get('/:fileId', (req, res) => mediaController.getFileInfo(req, res));

  // Excluir arquivo
  router.delete('/:fileId', (req, res) => mediaController.deleteFile(req, res));

  // Estatísticas de arquivos
  router.get('/stats/files', (req, res) => mediaController.getFileStats(req, res));

  return router;
}
