import { Request, Response } from 'express';
import { ConfigService } from '../services/config.service';
import { z } from 'zod';
import logger from '../logger';

const updateConfigSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  mensagemBoasVindas: z.string().min(1, 'Mensagem de boas-vindas é obrigatória'),
  mensagemMenu: z.string().min(1, 'Mensagem do menu é obrigatória'),
  mensagemDespedida: z.string().min(1, 'Mensagem de despedida é obrigatória'),
  tempoResposta: z.number().min(60, 'Tempo de resposta deve ser pelo menos 60 segundos').max(3600, 'Tempo de resposta deve ser no máximo 3600 segundos'),
  maxTentativas: z.number().min(1, 'Máximo de tentativas deve ser pelo menos 1').max(10, 'Máximo de tentativas deve ser no máximo 10')
});

const createOpcaoSchema = z.object({
  atendimentoId: z.string().min(1, 'ID do atendimento é obrigatório'),
  numero: z.number().min(1, 'Número da opção deve ser pelo menos 1').max(99, 'Número da opção deve ser no máximo 99'),
  texto: z.string().min(1, 'Texto da opção é obrigatório'),
  acao: z.string().optional()
});

const updateOpcaoSchema = z.object({
  numero: z.number().min(1, 'Número da opção deve ser pelo menos 1').max(99, 'Número da opção deve ser no máximo 99').optional(),
  texto: z.string().min(1, 'Texto da opção é obrigatório').optional(),
  acao: z.string().optional(),
  ativo: z.boolean().optional()
}).refine((data) => {
  // Pelo menos um campo deve ser fornecido
  return Object.keys(data).length > 0;
}, {
  message: 'Pelo menos um campo deve ser fornecido para atualização'
});

export class ConfigController {
  constructor(private configService: ConfigService) {}

  async getConfiguracaoAtendimento(req: Request, res: Response) {
    try {
      const config = await this.configService.getConfiguracaoAtendimento();
      
      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      logger.error('Erro ao buscar configuração de atendimento:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar configuração'
      });
    }
  }

  async updateConfiguracaoAtendimento(req: Request, res: Response) {
    try {
      const {
        nome,
        mensagemBoasVindas,
        mensagemMenu,
        mensagemDespedida,
        tempoResposta,
        maxTentativas
      } = updateConfigSchema.parse(req.body);

      const config = await this.configService.updateConfiguracaoAtendimento(
        nome,
        mensagemBoasVindas,
        mensagemMenu,
        mensagemDespedida,
        tempoResposta,
        maxTentativas
      );
      
      res.json({
        success: true,
        data: config,
        message: 'Configuração atualizada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao atualizar configuração de atendimento:', error);
      
      if (error instanceof Error && error.message.includes('validation')) {
        res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Erro ao atualizar configuração'
        });
      }
    }
  }

  async getOpcoesAtendimento(req: Request, res: Response) {
    try {
      const opcoes = await this.configService.getOpcoesAtendimento();
      
      res.json({
        success: true,
        data: opcoes
      });
    } catch (error) {
      logger.error('Erro ao buscar opções de atendimento:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar opções'
      });
    }
  }

  async createOpcaoAtendimento(req: Request, res: Response) {
    try {
      const { atendimentoId, numero, texto, acao } = createOpcaoSchema.parse(req.body);

      const opcao = await this.configService.createOpcaoAtendimento(
        atendimentoId,
        numero,
        texto,
        acao
      );
      
      res.json({
        success: true,
        data: opcao,
        message: 'Opção criada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao criar opção de atendimento:', error);
      
      if (error instanceof Error && error.message.includes('validation')) {
        res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Erro ao criar opção'
        });
      }
    }
  }

  async updateOpcaoAtendimento(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID da opção é obrigatório'
        });
      }
      
      const data = updateOpcaoSchema.parse(req.body);

      const opcao = await this.configService.updateOpcaoAtendimento(id, data);
      
      res.json({
        success: true,
        data: opcao,
        message: 'Opção atualizada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao atualizar opção de atendimento:', error);
      
      if (error instanceof Error && error.message.includes('validation')) {
        res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.message
        });
      } else if (error instanceof Error && error.message.includes('não encontrado')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Erro ao atualizar opção'
        });
      }
    }
  }

  async deleteOpcaoAtendimento(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID da opção é obrigatório'
        });
      }

      await this.configService.deleteOpcaoAtendimento(id);
      
      res.json({
        success: true,
        message: 'Opção removida com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao remover opção de atendimento:', error);
      
      if (error instanceof Error && error.message.includes('não encontrado')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Erro ao remover opção'
        });
      }
    }
  }
}
