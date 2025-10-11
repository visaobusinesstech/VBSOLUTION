import { AtendimentoStatus, Remetente, TipoMensagem } from '@prisma/client';

export interface WhatsAppSession {
  id: string;
  connected: boolean;
  qrCode?: string;
  lastActivity: Date;
}

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  type: TipoMensagem;
  content?: string;
  mediaPath?: string;
  mimeType?: string;
  timestamp: Date;
}

export interface AtendimentoCreate {
  numero: string;
  clienteNome?: string;
  canal?: string;
}

export interface AtendimentoResponse {
  id: number;
  numero: string;
  clienteNome?: string;
  atendenteId?: number;
  status: AtendimentoStatus;
  canal: string;
  dataInicio: Date;
  dataFim?: Date;
  ultimaMensagem?: MensagemResponse;
  totalMensagens: number;
}

export interface MensagemCreate {
  atendimentoId: number;
  remetente: Remetente;
  tipo: TipoMensagem;
  conteudo?: string;
  midiaPath?: string;
  mimeType?: string;
}

export interface MensagemResponse {
  id: number;
  atendimentoId: number;
  remetente: Remetente;
  tipo: TipoMensagem;
  conteudo?: string;
  midiaPath?: string;
  mimeType?: string;
  createdAt: Date;
}

export interface ConfiguracaoAtendimentoUpdate {
  mensagemPadrao: string;
  opcoes: OpcaoAtendimento[];
}

export interface OpcaoAtendimento {
  ordem: number;
  titulo: string;
  atendenteId: number;
  ativo?: boolean;
}

export interface WhatsAppStatus {
  connected: boolean;
  sessionId: string;
  lastActivity: Date;
}

export interface SendMessageRequest {
  tipo: TipoMensagem;
  texto?: string;
  fileId?: string;
}

export interface FileUploadResponse {
  fileId: string;
  url: string;
  mimeType: string;
  filename: string;
  size: number;
}

// Enums do Prisma para uso nos tipos
export { AtendimentoStatus, Remetente, TipoMensagem };
