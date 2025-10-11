import { AtendimentoStatus, Remetente, TipoMensagem } from '@prisma/client';

export interface Atendimento {
  id: number;
  numero: string;
  clienteNome?: string;
  atendenteId?: number;
  status: AtendimentoStatus;
  canal: string;
  dataInicio: Date;
  dataFim?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Mensagem {
  id: number;
  atendimentoId: number;
  remetente: Remetente;
  tipo: TipoMensagem;
  conteudo?: string;
  midiaPath?: string;
  mimeType?: string;
  createdAt: Date;
}

export interface AtendimentoWithMessages extends Atendimento {
  mensagens: Mensagem[];
}

export interface AtendimentoWithLastMessage extends Atendimento {
  ultimaMensagem?: Mensagem;
  totalMensagens: number;
}

export interface CreateAtendimentoRequest {
  numero: string;
  clienteNome?: string;
  canal?: string;
}

export interface UpdateAtendimentoRequest {
  atendenteId?: number;
  status?: AtendimentoStatus;
  dataFim?: Date;
}

export interface AtendimentoFilters {
  status?: AtendimentoStatus;
  atendenteId?: number;
  dataInicio?: Date;
  dataFim?: Date;
  search?: string;
}

export interface AtendimentoListItem {
  id: number;
  numero: string;
  clienteNome?: string;
  status: AtendimentoStatus;
  dataInicio: Date;
  ultimaMensagem?: {
    conteudo: string;
    remetente: Remetente;
    createdAt: Date;
  };
}

export interface ResponderRequest {
  tipo: TipoMensagem;
  texto?: string;
  fileId?: string;
}

export interface OpcaoAtendimento {
  id: number;
  ordem: number;
  titulo: string;
  atendenteId: number;
  ativo: boolean;
}

export interface ConfiguracaoAtendimento {
  id: number;
  mensagemPadrao: string;
  opcoes: OpcaoAtendimento[];
  ativo: boolean;
}

export interface UpdateConfigRequest {
  mensagemPadrao: string;
  opcoes: Array<{
    ordem: number;
    titulo: string;
    atendenteId: number;
    ativo?: boolean;
  }>;
}

export interface TarefaResponse {
  ok: boolean;
  tarefaId: number;
  message: string;
}

export interface AgendamentoResponse {
  ok: boolean;
  agendamentoId: number;
  message: string;
}

export interface ClientePerfil {
  numero: string;
  nome?: string;
  atendimentos: number;
  ultimaAtividade?: Date;
}
