// Tipos do WhatsApp
export interface WhatsAppStatus {
  connected: boolean;
  sessionName: string | null;
  qrCode: string | null;
  lastError: string | null;
}

export interface WhatsAppMessage {
  id: string;
  atendimentoId: string;
  conteudo: string;
  tipo: 'TEXTO' | 'IMAGEM' | 'AUDIO' | 'VIDEO' | 'DOCUMENTO';
  remetente: 'CLIENTE' | 'ATENDENTE' | 'SISTEMA';
  timestamp: Date;
  mediaUrl?: string;
  mediaType?: string;
  mediaSize?: number;
}

// Tipos de Atendimento
export interface Atendimento {
  id: string;
  numeroCliente: string;
  nomeCliente?: string;
  status: 'ATIVO' | 'FINALIZADO' | 'CANCELADO';
  atendenteId?: string;
  createdAt: Date;
  updatedAt: Date;
  ultimaMensagem?: string;
  ultimaMensagemAt?: Date;
}

export interface AtendimentoWithMessages extends Atendimento {
  mensagens: WhatsAppMessage[];
}

export interface AtendimentoWithLastMessage extends Atendimento {
  ultimaMensagem: string;
  ultimaMensagemAt: Date;
}

// Tipos de Configuração
export interface ConfiguracaoAtendimento {
  id: string;
  nome: string;
  mensagemBoasVindas: string;
  mensagemMenu: string;
  mensagemDespedida: string;
  tempoResposta: number;
  maxTentativas: number;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OpcaoAtendimento {
  id: string;
  numero: number;
  descricao: string;
  atendenteId: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos de API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Tipos de Filtros
export interface AtendimentoFilters {
  status?: 'ATIVO' | 'FINALIZADO' | 'CANCELADO';
  atendenteId?: string;
  dataInicio?: Date;
  dataFim?: Date;
  search?: string;
}

// Tipos de Formulários
export interface CreateAtendimentoData {
  numeroCliente: string;
  nomeCliente?: string;
}

export interface SendMessageData {
  atendimentoId: string;
  conteudo: string;
  tipo: 'TEXTO' | 'IMAGEM' | 'AUDIO' | 'VIDEO' | 'DOCUMENTO';
  mediaFile?: File;
}

export interface UpdateConfiguracaoData {
  nome: string;
  mensagemBoasVindas: string;
  mensagemMenu: string;
  mensagemDespedida: string;
  tempoResposta: number;
  maxTentativas: number;
}

export interface CreateOpcaoData {
  numero: number;
  descricao: string;
  atendenteId: string;
}

export interface UpdateOpcaoData {
  numero?: number;
  descricao?: string;
  atendenteId?: string;
  ativo?: boolean;
}

// Tipos de Socket.IO
export interface SocketEvents {
  'chat:qr': (qrCode: string) => void;
  'chat:session_status': (status: WhatsAppStatus) => void;
  'chat:message_in': (message: WhatsAppMessage) => void;
  'chat:typing': (data: { atendimentoId: string; isTyping: boolean }) => void;
}

export interface ClientToServerEvents {
  'chat:subscribe': (atendimentoId: string) => void;
  'chat:typing': (data: { atendimentoId: string; isTyping: boolean }) => void;
}
