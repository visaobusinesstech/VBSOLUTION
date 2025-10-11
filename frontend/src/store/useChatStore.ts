import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  Atendimento,
  AtendimentoWithMessages,
  WhatsAppStatus,
  WhatsAppMessage,
} from '@/types';

interface ChatState {
  // Estado do WhatsApp
  whatsappStatus: WhatsAppStatus;
  qrCode: string | null;
  
  // Atendimentos
  atendimentos: Atendimento[];
  atendimentoAtual: AtendimentoWithMessages | null;
  
  // Mensagens
  mensagens: Record<string, WhatsAppMessage[]>;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setWhatsAppStatus: (status: WhatsAppStatus) => void;
  setQRCode: (qrCode: string | null) => void;
  setAtendimentos: (atendimentos: Atendimento[]) => void;
  addAtendimento: (atendimento: Atendimento) => void;
  updateAtendimento: (id: string, updates: Partial<Atendimento>) => void;
  setAtendimentoAtual: (atendimento: AtendimentoWithMessages | null) => void;
  addMensagem: (atendimentoId: string, mensagem: WhatsAppMessage) => void;
  setMensagens: (atendimentoId: string, mensagens: WhatsAppMessage[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Computed values
  getAtendimentosAtivos: () => Atendimento[];
  getMensagensAtendimento: (atendimentoId: string) => WhatsAppMessage[];
}

export const useChatStore = create<ChatState>()(
  devtools(
    (set, get) => ({
      // Estado inicial
      whatsappStatus: {
        connected: false,
        sessionName: null,
        qrCode: null,
        lastError: null,
      },
      qrCode: null,
      atendimentos: [],
      atendimentoAtual: null,
      mensagens: {},
      isLoading: false,
      error: null,

      // Actions
      setWhatsAppStatus: (status) =>
        set({ whatsappStatus: status }, false, 'setWhatsAppStatus'),

      setQRCode: (qrCode) =>
        set({ qrCode }, false, 'setQRCode'),

      setAtendimentos: (atendimentos) =>
        set({ atendimentos }, false, 'setAtendimentos'),

      addAtendimento: (atendimento) =>
        set(
          (state) => ({
            atendimentos: [atendimento, ...state.atendimentos],
          }),
          false,
          'addAtendimento'
        ),

      updateAtendimento: (id, updates) =>
        set(
          (state) => ({
            atendimentos: state.atendimentos.map((a) =>
              a.id === id ? { ...a, ...updates } : a
            ),
            atendimentoAtual:
              state.atendimentoAtual?.id === id
                ? { ...state.atendimentoAtual, ...updates }
                : state.atendimentoAtual,
          }),
          false,
          'updateAtendimento'
        ),

      setAtendimentoAtual: (atendimento) =>
        set({ atendimentoAtual: atendimento }, false, 'setAtendimentoAtual'),

      addMensagem: (atendimentoId, mensagem) =>
        set(
          (state) => ({
            mensagens: {
              ...state.mensagens,
              [atendimentoId]: [
                ...(state.mensagens[atendimentoId] || []),
                mensagem,
              ],
            },
          }),
          false,
          'addMensagem'
        ),

      setMensagens: (atendimentoId, mensagens) =>
        set(
          (state) => ({
            mensagens: {
              ...state.mensagens,
              [atendimentoId]: mensagens,
            },
          }),
          false,
          'setMensagens'
        ),

      setLoading: (loading) =>
        set({ isLoading: loading }, false, 'setLoading'),

      setError: (error) =>
        set({ error }, false, 'setError'),

      clearError: () =>
        set({ error: null }, false, 'clearError'),

      // Computed values
      getAtendimentosAtivos: () =>
        get().atendimentos.filter((a) => a.status === 'ATIVO'),

      getMensagensAtendimento: (atendimentoId) =>
        get().mensagens[atendimentoId] || [],
    }),
    {
      name: 'chat-store',
    }
  )
);
