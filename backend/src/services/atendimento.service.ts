import { PrismaClient, AtendimentoStatus, Remetente, TipoMensagem } from '@prisma/client';
import logger from '../logger';

export class AtendimentoService {
  constructor(private prisma: PrismaClient) {}

  async getAtendimentosAtivos(filters?: {
    status?: AtendimentoStatus;
    atendenteId?: string;
    search?: string;
  }) {
    try {
      const where: any = {
        status: { not: 'FINALIZADO' }
      };

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.atendenteId) {
        where.atendenteId = filters.atendenteId;
      }

      if (filters?.search) {
        where.OR = [
          { numeroCliente: { contains: filters.search } },
          { nomeCliente: { contains: filters.search } }
        ];
      }

      const atendimentos = await this.prisma.atendimento.findMany({
        where,
        include: {
          mensagens: {
            orderBy: { timestamp: 'desc' },
            take: 1
          }
        },
        orderBy: { ultimaMensagem: 'desc' }
      });

      return atendimentos.map(atendimento => ({
        ...atendimento,
        ultimaMensagem: atendimento.mensagens[0] || null,
        totalMensagens: atendimento.mensagens.length
      }));
    } catch (error) {
      logger.error('Erro ao buscar atendimentos ativos:', error);
      throw error;
    }
  }

  async getAtendimentoById(id: string, cursor?: string, limit: number = 30) {
    try {
      const atendimento = await this.prisma.atendimento.findUnique({
        where: { id },
        include: {
          mensagens: {
            orderBy: { timestamp: 'desc' },
            take: limit,
            ...(cursor && { cursor: { id: cursor } })
          }
        }
      });

      if (!atendimento) {
        throw new Error('Atendimento não encontrado');
      }

      return atendimento;
    } catch (error) {
      logger.error('Erro ao buscar atendimento:', error);
      throw error;
    }
  }

  async responderAtendimento(
    atendimentoId: string,
    conteudo: string,
    tipo: TipoMensagem,
    remetente: Remetente = Remetente.ATENDENTE,
    mediaUrl?: string,
    mediaTipo?: string,
    mediaNome?: string,
    mediaTamanho?: number
  ) {
    try {
      // Verificar se o atendimento existe e está ativo
      const atendimento = await this.prisma.atendimento.findUnique({
        where: { id: atendimentoId }
      });

      if (!atendimento) {
        throw new Error('Atendimento não encontrado');
      }

      if (atendimento.status === 'FINALIZADO') {
        throw new Error('Atendimento já foi finalizado');
      }

      // Salvar mensagem
      const mensagem = await this.prisma.mensagem.create({
        data: {
          atendimentoId,
          conteudo,
          tipo,
          remetente,
          midiaUrl: mediaUrl || null,
          midiaTipo: mediaTipo || null,
          midiaNome: mediaNome || null,
          midiaTamanho: mediaTamanho || null
        }
      });

      // Atualizar última mensagem do atendimento
      await this.prisma.atendimento.update({
        where: { id: atendimentoId },
        data: { ultimaMensagem: new Date() }
      });

      logger.info(`Mensagem enviada para atendimento ${atendimentoId}`);
      return mensagem;
    } catch (error) {
      logger.error('Erro ao responder atendimento:', error);
      throw error;
    }
  }

  async finalizarAtendimento(id: string) {
    try {
      const atendimento = await this.prisma.atendimento.update({
        where: { id },
        data: {
          status: 'FINALIZADO',
          dataFim: new Date()
        }
      });

      logger.info(`Atendimento ${id} finalizado`);
      return atendimento;
    } catch (error) {
      logger.error('Erro ao finalizar atendimento:', error);
      throw error;
    }
  }

  async criarTarefa(atendimentoId: string, descricao: string) {
    try {
      // Placeholder para integração com sistema de tarefas
      logger.info(`Tarefa criada para atendimento ${atendimentoId}: ${descricao}`);
      
      return {
        ok: true,
        tarefaId: `task-${Date.now()}`,
        descricao,
        atendimentoId
      };
    } catch (error) {
      logger.error('Erro ao criar tarefa:', error);
      throw error;
    }
  }

  async agendarAtendimento(atendimentoId: string, data: Date, observacoes?: string) {
    try {
      // Placeholder para integração com sistema de agendamento
      logger.info(`Agendamento criado para atendimento ${atendimentoId} em ${data}`);
      
      return {
        ok: true,
        agendamentoId: `sched-${Date.now()}`,
        data,
        observacoes,
        atendimentoId
      };
    } catch (error) {
      logger.error('Erro ao agendar atendimento:', error);
      throw error;
    }
  }

  async getClienteInfo(numero: string) {
    try {
      // Placeholder para integração com sistema de clientes
      const atendimentos = await this.prisma.atendimento.findMany({
        where: { numeroCliente: numero },
        orderBy: { dataInicio: 'desc' },
        take: 5
      });

      return {
        numero,
        nome: atendimentos[0]?.nomeCliente || 'Cliente',
        totalAtendimentos: atendimentos.length,
        ultimoAtendimento: atendimentos[0]?.dataInicio,
        atendimentos
      };
    } catch (error) {
      logger.error('Erro ao buscar informações do cliente:', error);
      throw error;
    }
  }
}
