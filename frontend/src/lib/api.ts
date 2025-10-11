import {
  ApiResponse,
  PaginatedResponse,
  Atendimento,
  AtendimentoWithMessages,
  WhatsAppStatus,
  WhatsAppMessage,
  ConfiguracaoAtendimento,
  OpcaoAtendimento,
  CreateAtendimentoData,
  SendMessageData,
  UpdateConfiguracaoData,
  CreateOpcaoData,
  UpdateOpcaoData,
} from '@/types';
import { safeFetch } from './apiHelpers';

const API_BASE_URL = '/api';
const AUTH_TOKEN = 'vb_dev_token_12345'; // Token de desenvolvimento

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AUTH_TOKEN}`,
        ...options.headers,
      },
      ...options,
    };

    try {
      return await safeFetch<ApiResponse<T>>(url, config);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // WhatsApp
  async getWhatsAppStatus(): Promise<ApiResponse<WhatsAppStatus>> {
    return this.request<WhatsAppStatus>('/whatsapp/status');
  }

  async startWhatsAppSession(): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/whatsapp/start', {
      method: 'POST',
    });
  }

  async stopWhatsAppSession(): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/whatsapp/stop', {
      method: 'POST',
    });
  }

  async sendWhatsAppMessage(data: SendMessageData): Promise<ApiResponse<WhatsAppMessage>> {
    const formData = new FormData();
    formData.append('atendimentoId', data.atendimentoId);
    formData.append('conteudo', data.conteudo);
    formData.append('tipo', data.tipo);
    
    if (data.mediaFile) {
      formData.append('media', data.mediaFile);
    }

    return this.request<WhatsAppMessage>('/whatsapp/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: formData,
    });
  }

  // Atendimentos
  async getAtendimentos(
    page = 1,
    limit = 20,
    filters?: Record<string, any>
  ): Promise<ApiResponse<PaginatedResponse<Atendimento>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });

    return this.request<PaginatedResponse<Atendimento>>(`/atendimento?${params}`);
  }

  async getAtendimento(id: string): Promise<ApiResponse<AtendimentoWithMessages>> {
    return this.request<AtendimentoWithMessages>(`/atendimento/${id}`);
  }

  async createAtendimento(data: CreateAtendimentoData): Promise<ApiResponse<Atendimento>> {
    return this.request<Atendimento>('/atendimento', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async respondToAtendimento(
    id: string,
    data: SendMessageData
  ): Promise<ApiResponse<WhatsAppMessage>> {
    const formData = new FormData();
    formData.append('conteudo', data.conteudo);
    formData.append('tipo', data.tipo);
    
    if (data.mediaFile) {
      formData.append('media', data.mediaFile);
    }

    return this.request<WhatsAppMessage>(`/atendimento/${id}/respond`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: formData,
    });
  }

  async finalizeAtendimento(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/atendimento/${id}/finalize`, {
      method: 'POST',
    });
  }

  // Configuração
  async getConfiguracaoAtendimento(): Promise<ApiResponse<ConfiguracaoAtendimento>> {
    return this.request<ConfiguracaoAtendimento>('/config/atendimento');
  }

  async updateConfiguracaoAtendimento(
    data: UpdateConfiguracaoData
  ): Promise<ApiResponse<ConfiguracaoAtendimento>> {
    return this.request<ConfiguracaoAtendimento>('/config/atendimento', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getOpcoesAtendimento(): Promise<ApiResponse<OpcaoAtendimento[]>> {
    return this.request<OpcaoAtendimento[]>('/config/opcoes');
  }

  async createOpcaoAtendimento(data: CreateOpcaoData): Promise<ApiResponse<OpcaoAtendimento>> {
    return this.request<OpcaoAtendimento>('/config/opcoes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOpcaoAtendimento(
    id: string,
    data: UpdateOpcaoData
  ): Promise<ApiResponse<OpcaoAtendimento>> {
    return this.request<OpcaoAtendimento>(`/config/opcoes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOpcaoAtendimento(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/config/opcoes/${id}`, {
      method: 'DELETE',
    });
  }

  // Media
  async uploadMedia(file: File): Promise<ApiResponse<{
    id: string;
    url: string;
    filename: string;
    mimeType: string;
    size: number;
  }>> {
    const formData = new FormData();
    formData.append('media', file);

    return this.request('/media/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: formData,
    });
  }

  // Placeholders para integração com VBsolution
  async criarTarefa(atendimentoId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/atendimento/${atendimentoId}/criar-tarefa`, {
      method: 'POST',
    });
  }

  async agendarAtendimento(
    atendimentoId: string,
    data: { data: string; hora: string; observacoes?: string }
  ): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/atendimento/${atendimentoId}/agendar`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getClienteInfo(atendimentoId: string): Promise<ApiResponse<{
    nome: string;
    email?: string;
    telefone: string;
    historico: any[];
  }>> {
    return this.request(`/atendimento/${atendimentoId}/cliente-info`);
  }
}

export const apiClient = new ApiClient();
