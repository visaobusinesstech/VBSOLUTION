// Hook para Chat instantaneo - VERSÃO ULTRA SIMPLIFICADA SEM LOOPS
import { useCallback, useEffect, useRef, useState } from 'react';
import { connectSocket, getSocket, safeEmit } from '@/lib/socketManager';
import { logger } from '@/utils/logging';

interface StreamMessage {
  id: string;
  chat_id: string;
  conteudo: string;
  remetente: string;
  timestamp: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  message_type: string;
  tempId?: string;
}

interface StreamChatConfig {
  ownerId: string;
  connectionId: string;
  onMessage?: (message: StreamMessage) => void;
  onMessageUpdate?: (messageId: string, update: Partial<StreamMessage>) => void;
  onTyping?: (chatId: string, isTyping: boolean) => void;
}

/**
 * Hook para Chat instantaneo - SEM LOOPS - SEM RE-RENDERIZAÇÕES
 */
export function useStreamChat(config: StreamChatConfig) {
  const { ownerId, connectionId, onMessage, onMessageUpdate, onTyping } = config;
  
  // ✅ Estados básicos - SEM dependências que causam loops
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const socketRef = useRef<any | null>(null);
  const isInitializedRef = useRef(false);
  const callbacksRef = useRef({ onMessage, onMessageUpdate, onTyping });

  // ✅ Atualizar callbacks sem causar re-renderização
  useEffect(() => {
    callbacksRef.current = { onMessage, onMessageUpdate, onTyping };
  });

  // ✅ Função de conexão - SEM dependências
  const connectStream = useCallback(() => {
    // Evitar múltiplas conexões
    if (isConnecting || isConnected || isInitializedRef.current) {
      return;
    }

    // Validar parâmetros
    if (!ownerId || !connectionId || ownerId === '' || connectionId === '') {
      return;
    }

    isInitializedRef.current = true;
    setIsConnecting(true);
    // Conectando ao stream

    try {
      const socket = connectSocket(import.meta.env.VITE_SOCKET_URL || '', { ownerId });
      if (!socket) {
        logger.error('❌ [STREAM] Falha ao conectar via SocketManager');
        setIsConnecting(false);
        return;
      }

      socketRef.current = socket;

      // TODO: Migrar para Supabase Realtime
      // ✅ DESABILITADO: Socket.IO listeners temporariamente
      // socket.on('connect', () => {
      //   logger.debug('✅ [STREAM] Conectado');
      //   setIsConnected(true);
      //   setIsConnecting(false);
      // });

      // socket.on('disconnect', () => {
      //   logger.debug('❌ [STREAM] Desconectado');
      //   setIsConnected(false);
      //   setIsConnecting(false);
      // });

      // socket.on('connect_error', (error) => {
      //   logger.error('❌ [STREAM] Erro:', error);
      //   setIsConnected(false);
      //   setIsConnecting(false);
      // });

      // Listeners de mensagens usando refs para evitar re-renderização
      // REMOVED: 'message' listener to prevent duplication with useWhatsAppConversations
      // The useWhatsAppConversations hook already handles all message events

      // socket.on('messageUpdate', (data: { messageId: string; update: Partial<StreamMessage> }) => {
      //   if (callbacksRef.current.onMessageUpdate) {
      //     callbacksRef.current.onMessageUpdate(data.messageId, data.update);
      //   }
      // });

      // socket.on('typing', (data: { chatId: string; isTyping: boolean }) => {
      //   if (callbacksRef.current.onTyping) {
      //     callbacksRef.current.onTyping(data.chatId, data.isTyping);
      //   }
      // });

      // Simular conexão para manter compatibilidade
      setIsConnected(true);
      setIsConnecting(false);

    } catch (error) {
      logger.error('❌ [STREAM] Erro na conexão:', error);
      setIsConnecting(false);
    }
  }, []); // ✅ SEM dependências

  // ✅ Função de desconexão - SEM dependências
  const disconnectStream = useCallback(() => {
    if (socketRef.current && typeof socketRef.current.removeAllListeners === 'function') {
      // Desconectando do stream
      socketRef.current.removeAllListeners();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    isInitializedRef.current = false;
  }, []); // ✅ SEM dependências

  // ✅ Função de envio de mensagem - SEM dependências
  const sendMessage = useCallback((message: Omit<StreamMessage, 'id' | 'timestamp' | 'status'>) => {
    if (!socketRef.current?.connected) {
      logger.error('❌ [STREAM] Socket não conectado');
      return;
    }

    const messageId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tempMessage: StreamMessage = {
      ...message,
      id: messageId,
      timestamp: new Date().toISOString(),
      status: 'pending',
      tempId: messageId
    };

    // Enviar mensagem optimistic
    if (callbacksRef.current.onMessage) {
      callbacksRef.current.onMessage(tempMessage);
    }

    // Enviar via socket
    socketRef.current.emit('sendMessage', {
      ...message,
      tempId: messageId
    });

    logger.debug('📤 [STREAM] Mensagem enviada:', tempMessage);
  }, []); // ✅ SEM dependências

  // ✅ EFEITO PRINCIPAL - Conectar UMA VEZ apenas
  useEffect(() => {
    // Só conectar se tiver parâmetros válidos e não estiver já conectado
    if (ownerId && connectionId && ownerId !== '' && connectionId !== '' && !isConnected && !isConnecting && !isInitializedRef.current) {
      connectStream();
    }

    // Cleanup no unmount - SEM chamar disconnectStream para evitar loops
    return () => {
      if (socketRef.current && typeof socketRef.current.removeAllListeners === 'function') {
        socketRef.current.removeAllListeners();
        socketRef.current = null;
      }
      setIsConnected(false);
      setIsConnecting(false);
      isInitializedRef.current = false;
    };
  }, [ownerId, connectionId]); // ✅ APENAS ownerId e connectionId

  // ✅ Cleanup final - SEM dependências para evitar loops
  useEffect(() => {
    return () => {
      if (socketRef.current && typeof socketRef.current.removeAllListeners === 'function') {
        socketRef.current.removeAllListeners();
        socketRef.current = null;
      }
      setIsConnected(false);
      setIsConnecting(false);
      isInitializedRef.current = false;
    };
  }, []); // ✅ SEM dependências

  return {
    isConnected,
    isConnecting,
    sendMessage,
    connect: connectStream,
    disconnect: disconnectStream
  };
}