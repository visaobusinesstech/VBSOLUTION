import { Request, Response } from 'express';
import { MediaService } from '../services/media.service';
import logger from '../logger';

export class MediaController {
  constructor(private mediaService: MediaService) {}

  async uploadFile(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Nenhum arquivo fornecido'
        });
      }

      const result = await this.mediaService.uploadFile(req.file);
      
      res.json({
        success: true,
        data: result,
        message: 'Arquivo enviado com sucesso'
      });
    } catch (error) {
      logger.error('Erro no upload de arquivo:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao processar upload'
      });
    }
  }

  async getFileInfo(req: Request, res: Response) {
    try {
      const { fileId } = req.params;
      
      if (!fileId) {
        return res.status(400).json({
          success: false,
          error: 'ID do arquivo é obrigatório'
        });
      }

      const fileInfo = await this.mediaService.getFileInfo(fileId);
      
      res.json({
        success: true,
        data: fileInfo
      });
    } catch (error) {
      logger.error('Erro ao obter informações do arquivo:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter informações do arquivo'
      });
    }
  }

  async deleteFile(req: Request, res: Response) {
    try {
      const { fileId } = req.params;
      
      if (!fileId) {
        return res.status(400).json({
          success: false,
          error: 'ID do arquivo é obrigatório'
        });
      }

      const result = await this.mediaService.deleteFile(fileId);
      
      res.json({
        success: true,
        data: result,
        message: 'Arquivo marcado para exclusão'
      });
    } catch (error) {
      logger.error('Erro ao excluir arquivo:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao excluir arquivo'
      });
    }
  }

  async getFileStats(req: Request, res: Response) {
    try {
      const stats = await this.mediaService.getFileStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Erro ao obter estatísticas de arquivos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter estatísticas'
      });
    }
  }
}
