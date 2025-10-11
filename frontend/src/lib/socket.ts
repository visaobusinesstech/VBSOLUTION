// Socket.IO removido - usando apenas Supabase Realtime
// Este arquivo foi simplificado para remover todas as referências ao Socket.IO

export interface WhatsAppStatus {
  status: string;
  message?: string;
}

export interface WhatsAppMessage {
  id: string;
  content: string;
  timestamp: string;
  from: string;
  to: string;
}

// Mock client para compatibilidade com código existente
class RealtimeClient {
  private isConnected = false;

  connect(token?: string) {
    console.log('ℹ️ Usando Supabase Realtime para funcionalidades em tempo real');
    this.isConnected = true;
    return;
  }

  disconnect() {
    console.log('Supabase Realtime desconectado');
    this.isConnected = false;
  }

  subscribeToChat(atendimentoId: string) {
    console.log('ℹ️ Usando Supabase Realtime para chat:', atendimentoId);
  }

  sendTypingStatus(atendimentoId: string, isTyping: boolean) {
    console.log('ℹ️ Usando Supabase Realtime para status de digitação:', atendimentoId, isTyping);
  }

  get connected() {
    return this.isConnected;
  }

  get socketInstance() {
    return null; // Não há instância de socket
  }
}

// Instância singleton
export const socketClient = new RealtimeClient();

// Hook para usar o realtime (compatibilidade com código existente)
export const useSocket = () => {
  return {
    connect: socketClient.connect.bind(socketClient),
    disconnect: socketClient.disconnect.bind(socketClient),
    subscribeToChat: socketClient.subscribeToChat.bind(socketClient),
    sendTypingStatus: socketClient.sendTypingStatus.bind(socketClient),
    connected: socketClient.connected,
    socket: socketClient.socketInstance,
  };
};
