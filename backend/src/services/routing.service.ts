import { PrismaClient, AtendimentoStatus, Remetente, TipoMensagem } from '@prisma/client';
import logger from '../logger';

export class RoutingService {
  constructor(private prisma: PrismaClient) {}

  async sendWelcomeMessage(atendimentoId: string, numero: string): Promise<void> {
    try {
      // Buscar configuração ativa
      let config = await this.prisma.configuracaoAtendimento.findFirst({
        where: { ativo: true }
      });

      if (!config) {
        // Criar configuração padrão se não existir
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

      // Enviar mensagem de boas-vindas
      const mensagem = await this.prisma.mensagem.create({
        data: {
          atendimentoId: atendimentoId,
          remetente: Remetente.SISTEMA,
          tipo: TipoMensagem.TEXTO,
          conteudo: config.mensagemBoasVindas + '\n\n' + config.mensagemMenu
        }
      });

      logger.info(`Mensagem de boas-vindas enviada para atendimento ${atendimentoId}`);

    } catch (error) {
      logger.error('Erro ao enviar mensagem de boas-vindas:', error);
    }
  }

  async processRouting(atendimentoId: string, conteudo: string): Promise<void> {
    try {
      // Verificar se é uma resposta numérica
      const numero = parseInt(conteudo.trim());
      
      if (isNaN(numero)) {
        // Se não for número, enviar instruções novamente
        await this.sendWelcomeMessage(atendimentoId, '');
        return;
      }

      // Buscar configuração ativa
      const config = await this.prisma.configuracaoAtendimento.findFirst({
        where: { ativo: true }
      });

      if (!config) {
        logger.warn('Configuração de atendimento não encontrada');
        return;
      }

      // Buscar opções de atendimento para este atendimento
      const opcoes = await this.prisma.opcaoAtendimento.findMany({
        where: { 
          atendimentoId: atendimentoId,
          ativo: true 
        },
        orderBy: { numero: 'asc' }
      });

      const opcaoSelecionada = opcoes.find(op => op.numero === numero);

      if (opcaoSelecionada) {
        // Atualizar atendimento
        await this.prisma.atendimento.update({
          where: { id: atendimentoId },
          data: {
            status: AtendimentoStatus.EM_ATENDIMENTO
          }
        });

        // Enviar confirmação
        const mensagemConfirmacao = await this.prisma.mensagem.create({
          data: {
            atendimentoId: atendimentoId,
            remetente: Remetente.SISTEMA,
            tipo: TipoMensagem.TEXTO,
            conteudo: `Perfeito! Você foi direcionado para ${opcaoSelecionada.texto}. Em breve um atendente entrará em contato.`
          }
        });

        logger.info(`Atendimento ${atendimentoId} direcionado para ${opcaoSelecionada.texto}`);
      } else {
        // Opção inválida, enviar instruções novamente
        await this.sendWelcomeMessage(atendimentoId, '');
      }

    } catch (error) {
      logger.error('Erro ao processar roteamento:', error);
    }
  }

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
}
