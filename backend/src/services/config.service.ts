import { PrismaClient } from '@prisma/client';
import logger from '../logger';

export class ConfigService {
  constructor(private prisma: PrismaClient) {}

  async getConfiguracaoAtendimento() {
    try {
      let config = await this.prisma.configuracaoAtendimento.findFirst({
        where: { ativo: true }
      });

      if (!config) {
        // Criar configuração padrão
        config = await this.prisma.configuracaoAtendimento.create({
          data: {
            nome: 'Padrão',
            mensagemBoasVindas: 'Olá! Bem-vindo ao nosso atendimento. Como posso ajudá-lo hoje?',
            mensagemMenu: '1) Suporte Técnico\n2) Vendas\n3) Financeiro\n4) Outros assuntos',
            mensagemDespedida: 'Obrigado por nos contatar. Tenha um ótimo dia!',
            tempoResposta: 300,
            maxTentativas: 3,
            ativo: true
          }
        });
      }

      return config;
    } catch (error) {
      logger.error('Erro ao buscar configuração de atendimento:', error);
      throw error;
    }
  }

  async updateConfiguracaoAtendimento(
    nome: string,
    mensagemBoasVindas: string,
    mensagemMenu: string,
    mensagemDespedida: string,
    tempoResposta: number = 300,
    maxTentativas: number = 3
  ) {
    try {
      // Desativar configuração atual
      await this.prisma.configuracaoAtendimento.updateMany({
        where: { ativo: true },
        data: { ativo: false }
      });

      // Criar nova configuração
      const novaConfig = await this.prisma.configuracaoAtendimento.create({
        data: {
          nome,
          mensagemBoasVindas,
          mensagemMenu,
          mensagemDespedida,
          tempoResposta,
          maxTentativas,
          ativo: true
        }
      });

      logger.info('Configuração de atendimento atualizada');
      return novaConfig;
    } catch (error) {
      logger.error('Erro ao atualizar configuração de atendimento:', error);
      throw error;
    }
  }

  async getOpcoesAtendimento() {
    try {
      const opcoes = await this.prisma.opcaoAtendimento.findMany({
        where: { ativo: true },
        orderBy: { numero: 'asc' }
      });

      return opcoes;
    } catch (error) {
      logger.error('Erro ao buscar opções de atendimento:', error);
      throw error;
    }
  }

  async createOpcaoAtendimento(
    atendimentoId: string,
    numero: number,
    texto: string,
    acao?: string
  ) {
    try {
      const opcao = await this.prisma.opcaoAtendimento.create({
        data: {
          atendimentoId,
          numero,
          texto,
          acao: acao || null,
          ativo: true
        }
      });

      logger.info(`Opção de atendimento criada: ${texto}`);
      return opcao;
    } catch (error) {
      logger.error('Erro ao criar opção de atendimento:', error);
      throw error;
    }
  }

  async updateOpcaoAtendimento(
    id: string,
    data: {
      numero?: number;
      texto?: string;
      acao?: string;
      ativo?: boolean;
    }
  ) {
    try {
      // Filtrar campos undefined
      const updateData: any = {};
      if (data.numero !== undefined) updateData.numero = data.numero;
      if (data.texto !== undefined) updateData.texto = data.texto;
      if (data.acao !== undefined) updateData.acao = data.acao;
      if (data.ativo !== undefined) updateData.ativo = data.ativo;

      const opcao = await this.prisma.opcaoAtendimento.update({
        where: { id },
        data: updateData
      });

      logger.info(`Opção de atendimento atualizada: ${id}`);
      return opcao;
    } catch (error) {
      logger.error('Erro ao atualizar opção de atendimento:', error);
      throw error;
    }
  }

  async deleteOpcaoAtendimento(id: string) {
    try {
      await this.prisma.opcaoAtendimento.delete({
        where: { id }
      });

      logger.info(`Opção de atendimento removida: ${id}`);
      return true;
    } catch (error) {
      logger.error('Erro ao remover opção de atendimento:', error);
      throw error;
    }
  }
}
