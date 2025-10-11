import { useEffect, useRef } from 'react';

interface UseSocketProps {
  connectionId?: string;
  conversationId?: string;
  onMessage?: (message: any) => void;
  onConnectionStatus?: (status: any) => void;
  onTyping?: (typing: any) => void;
}

export function useSocket({
  connectionId,
  conversationId,
  onMessage,
  onConnectionStatus,
  onTyping
}: UseSocketProps) {
  const socketRef = useRef<any | null>(null);

  useEffect(() => {
    if (!connectionId) return;

    // Socket.IO removido - usando apenas Supabase Realtime
    console.log('ℹ️ Usando Supabase Realtime para funcionalidades em tempo real');
    
    // Mock socket para compatibilidade
    socketRef.current = {
      connected: true,
      emit: (event: string, data: any) => {
        console.log('ℹ️ Mock emit:', event, data);
      },
      on: (event: string, callback: Function) => {
        console.log('ℹ️ Mock on:', event);
      },
      disconnect: () => {
        console.log('ℹ️ Mock disconnect');
      }
    };

    return () => {
      socketRef.current = null;
    };
  }, [connectionId, conversationId, onMessage, onConnectionStatus, onTyping]);

  const joinConversation = (newConversationId: string) => {
    console.log('ℹ️ Usando Supabase Realtime para join conversation:', newConversationId);
  };

  return {
    socket: socketRef.current,
    joinConversation
  };
}
