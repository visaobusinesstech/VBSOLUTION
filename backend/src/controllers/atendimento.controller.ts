import { Request, Response } from 'express';
import { AtendimentoService } from '../services/atendimento.service';
import { z } from 'zod';
import logger from '../logger';

const responderSchema = z.object({
  tipo: z.enum(['TEXTO', 'IMAGEM', 'AUDIO', 'VIDEO', 'DOCUMENTO', 'LOCALIZACAO', 'CONTATO']),
  texto: z.string().optional(),
  fileId: z.string().optional()
});

const criarTarefaSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória')
});

const agendarSchema = z.object({
  data: z.string().datetime('Data deve ser uma data válida'),
  observacoes: z.string().optional()
});

export class AtendimentoController {
  constructor(private atendimentoService: AtendimentoService) {}

  async getAtendimentosAtivos(req: Request, res: Response) {
    try {
      const { status, atendenteId, search } = req.query;
      
      const filters: any = {};
      if (status) filters.status = status;
      if (atendenteId) filters.atendenteId = atendenteId as string;
      if (search) filters.search = search as string;

      const atendimentos = await this.atendimentoService.getAtendimentosAtivos(filters);
      
      res.json({
        success: true,
        data: atendimentos
      });
    } catch (error) {
      logger.error('Erro ao buscar atendimentos ativos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar atendimentos'
      });
    }
  }

  async getAtendimentoById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { cursor, limit } = req.query;
      
      const limitNum = limit ? parseInt(limit as string) : 30;
      const atendimento = await this.atendimentoService.getAtendimentoById(
        id, 
        cursor as string, 
        limitNum
      );
      
      res.json({
        success: true,
        data: atendimento
      });
    } catch (error) {
      logger.error('Erro ao buscar atendimento:', error);
      
      if (error instanceof Error && error.message === 'Atendimento não encontrado') {
        res.status(404).json({
          success: false,
          error: 'Atendimento não encontrado'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Erro ao buscar atendimento'
        });
      }
    }
  }

  async responderAtendimento(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { tipo, texto, fileId } = responderSchema.parse(req.body);
      
      // Por enquanto, implementação básica
      // Em uma implementação real, você precisaria:
      // 1. Processar o arquivo se fileId for fornecido
      // 2. Enviar via WhatsApp
      // 3. Salvar no banco
      
      const mensagem = await this.atendimentoService.responderAtendimento(
        id,
        texto || 'Mídia enviada',
        tipo,
        undefined, // remetente padrão ATENDENTE
        undefined, // mediaUrl
        undefined, // mediaTipo
        undefined, // mediaNome
        undefined  // mediaTamanho
      );
      
      res.json({
        success: true,
        data: mensagem,
        message: 'Mensagem enviada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao responder atendimento:', error);
      
      if (error instanceof Error && error.message.includes('não encontrado')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof Error && error.message.includes('finalizado')) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Erro ao enviar mensagem'
        });
      }
    }
  }

  async finalizarAtendimento(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const atendimento = await this.atendimentoService.finalizarAtendimento(id);
      
      res.json({
        success: true,
        data: atendimento,
        message: 'Atendimento finalizado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao finalizar atendimento:', error);
      
      if (error instanceof Error && error.message.includes('não encontrado')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Erro ao finalizar atendimento'
        });
      }
    }
  }

  async criarTarefa(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { descricao } = criarTarefaSchema.parse(req.body);
      
      const tarefa = await this.atendimentoService.criarTarefa(id, descricao);
      
      res.json({
        success: true,
        data: tarefa,
        message: 'Tarefa criada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao criar tarefa:', error);
      
      if (error instanceof Error && error.message.includes('não encontrado')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Erro ao criar tarefa'
        });
      }
    }
  }

  async agendarAtendimento(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { data, observacoes } = agendarSchema.parse(req.body);
      
      const agendamento = await this.atendimentoService.agendarAtendimento(
        id, 
        new Date(data), 
        observacoes
      );
      
      res.json({
        success: true,
        data: agendamento,
        message: 'Agendamento criado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao agendar atendimento:', error);
      
      if (error instanceof Error && error.message.includes('não encontrado')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Erro ao criar agendamento'
        });
      }
    }
  }

  async getClienteInfo(req: Request, res: Response) {
    try {
      const { numero } = req.params;
      
      const cliente = await this.atendimentoService.getClienteInfo(numero);
      
      res.json({
        success: true,
        data: cliente
      });
    } catch (error) {
      logger.error('Erro ao buscar informações do cliente:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar informações do cliente'
      });
    }
  }
}
