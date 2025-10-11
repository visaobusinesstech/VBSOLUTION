import { useEffect, useRef } from 'react';

interface UseChatSocketProps {
  tenantId: string;
  connectionId?: string;
  conversationId?: string;
  onMessage: (message: any) => void;
  onTyping: (typing: any) => void;
  onStatus: (status: any) => void;
}

export function useChatSocket({
  tenantId,
  connectionId,
  conversationId,
  onMessage,
  onTyping,
  onStatus
}: UseChatSocketProps) {
  const socketRef = useRef<any | null>(null);

  useEffect(() => {
    // Socket.IO removido - usando apenas Supabase Realtime
    console.log('ℹ️ Usando Supabase Realtime para chat socket');
    
    // Mock socket para compatibilidade
    socketRef.current = {
      connected: true,
      emit: (event: string, payload: any) => {
        console.log('ℹ️ Mock emit:', event, payload);
      },
      on: (event: string, callback: Function) => {
        console.log('ℹ️ Mock on:', event);
      },
      disconnect: () => {
        console.log('ℹ️ Mock disconnect');
      }
    };

    // Simular status conectado
    onStatus({ connected: true });

    return () => {
      if (socketRef.current) {
        socketRef.current = null;
      }
    };
  }, [tenantId, connectionId, conversationId, onMessage, onTyping, onStatus]);

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current = null;
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false
  };
}
