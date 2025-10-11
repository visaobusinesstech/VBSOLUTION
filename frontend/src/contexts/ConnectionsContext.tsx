"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { connectSocket, getSocket, safeEmit } from '@/lib/socketManager';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';

// Socket / API base
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL?.trim() || "http://localhost:3000";
const API_URL = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3000';

export interface WhatsAppConnection {
  id: string;
  name: string;
  type?: string;
  connectionState: 'disconnected' | 'connecting' | 'connected';
  isConnected: boolean;
  phoneNumber?: string;
  whatsappId?: string;
  whatsappInfo?: any;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
  connectedAt?: string;
  owner_id?: string;
}

interface ConnectionsContextType {
  connections: WhatsAppConnection[];
  activeConnection: WhatsAppConnection | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadConnections: (userId?: string) => Promise<void>;
  createConnection: (name: string, type: string, userId: string) => Promise<WhatsAppConnection | null>;
  deleteConnection: (connectionId: string, userId: string) => Promise<void>;
  connectWhatsApp: (connectionId: string) => Promise<void>;
  disconnectWhatsApp: (connectionId: string, userId: string) => Promise<void>;
  generateQRCode: (connectionId: string) => Promise<string | null>;
  refreshQRCode: (connectionId: string) => Promise<void>;
  
  // Modal management
  openDisconnectModal: (connectionId: string) => void;
  closeDisconnectModal: () => void;
  isDisconnectModalOpen: boolean;
  connectionToDisconnect: string | null;
  
  // Delete modal management
  showDeleteConnectionModal: boolean;
  deleteConnectionData: WhatsAppConnection | null;
  openDeleteConnectionModal: (connection: WhatsAppConnection) => void;
  closeDeleteConnectionModal: () => void;
}

const ConnectionsContext = createContext<ConnectionsContextType | undefined>(undefined);

export function ConnectionsProvider({ children }: { children: React.ReactNode }) {
  // Inicialização silenciosa
  const { profile, loading: profileLoading } = useUserProfile();
  
  // Verificar se AuthContext está disponível
  let user = null;
  try {
    const authContext = useAuth();
    user = authContext.user;
  } catch (error) {
    // Silent: AuthContext não disponível, continuando sem user
  }

  // Fallback: usar owner_id da primeira conexão se user não estiver disponível
  const effectiveUserId = user?.id;
  
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [activeConnection, setActiveConnection] = useState<WhatsAppConnection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [connectionToDisconnect, setConnectionToDisconnect] = useState<string | null>(null);
  
  // Delete modal states
  const [showDeleteConnectionModal, setShowDeleteConnectionModal] = useState(false);
  const [deleteConnectionData, setDeleteConnectionData] = useState<WhatsAppConnection | null>(null);

  // Circuit breaker to prevent excessive retries
  const [lastFailureTime, setLastFailureTime] = useState<number>(0);
  const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds

  // Load connections from simple-baileys-server with retry logic
  const loadConnections = useCallback(async (userId?: string, retryCount = 0) => {
    // Silent: loadConnections called
    
    // Circuit breaker check
    if (Date.now() - lastFailureTime < CIRCUIT_BREAKER_TIMEOUT && retryCount === 0) {
      // Silent: Circuit breaker active, skipping request
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (userId) {
        headers['x-user-id'] = userId;
      }
      
      // Silent: Making request to connections endpoint
      const response = await fetch(`${API_URL}/api/baileys-simple/connections`, {
        headers
      });
      // Silent: Response received
      
      if (!response.ok) {
        throw new Error(`Failed to load connections: ${response.status}`);
      }
      
      const data = await response.json();
      const connections = data.data || [];
      
        // Silent: Loaded connections successfully
        
        if (connections.length > 0) {
          setConnections(connections);
          
          // Set first connection as active if none is selected
          const firstConnection = connections[0];
          // Silent: First connection details processed
          
          setActiveConnection(firstConnection);
          // Silent: Active connection set
          
          // Force UI update to show connected status
          setConnections(prevConnections => [...connections]);
          // Silent: Connections updated in state
        } else {
          setConnections([]);
          setActiveConnection(null);
          // Silent: No connections found
        }
    } catch (err: any) {
      // Silent: Error loading connections (only set error state)
      
      // Set circuit breaker on failure
      setLastFailureTime(Date.now());
      
      // Retry logic for connection refused errors with exponential backoff
      if (err.message.includes('Failed to fetch') && retryCount < 3) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 seconds
        // Silent: Retrying connection request
        setTimeout(() => {
          loadConnections(userId, retryCount + 1);
        }, delay);
        return;
      }
      
      // After max retries, stop and show error
      if (retryCount >= 3) {
        // Silent: Max retries reached, stopping retry loop
        setError('Não foi possível conectar ao servidor após várias tentativas');
        return;
      }
      
      setError(err.message);
      setConnections([]);
      setActiveConnection(null);
    } finally {
      setLoading(false);
    }
  }, [lastFailureTime]);

  // Create new connection
  const createConnection = useCallback(async (name: string, type: string, userId: string): Promise<WhatsAppConnection | null> => {
    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ name, type })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create connection');
      }
      
      const data = await response.json();
      const newConnection = data.data;
      
      setConnections(prev => [...prev, newConnection]);
      setActiveConnection(newConnection);
      
      return newConnection;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [API_URL]);

  // Delete connection
  const deleteConnection = useCallback(async (connectionId: string, userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${connectionId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete connection');
      }
      
      const result = await response.json();
      
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
      
      if (activeConnection?.id === connectionId) {
        setActiveConnection(null);
      }
      
      return { success: true, data: result };
    } catch (err: any) {
      // Silent: Error deleting connection
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [activeConnection, API_URL]);

  // Connect WhatsApp - INSTANT BAILEYS START RULE: Should start immediately when user clicks
  const connectWhatsApp = useCallback(async (connectionId: string) => {
    try {
      // Silent: CONECTANDO - Iniciando Baileys IMEDIATAMENTE
      
      // STEP 1: Instant Baileys Start - The key rule: Start Baileys when user clicks to connect  
      const startResponse = await fetch(`${API_URL}/api/baileys-simple/auto-connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ connectionId })
      });
      
      if (!startResponse.ok) {
        throw new Error(`HTTP ${startResponse.status}: Auto-connect failed`);
      }
      
      const startData = await startResponse.json();
      // Silent: Auto-connect response received
      
      // STEP 2: Generate QR Code immediately after Baileys starts
      // Silent: Baileys iniciado! Gerando QR Code...
      const qrCode = await generateQRCode(connectionId);
      
      if (qrCode) {
        // Silent: QR Code pronto para leitura!
        
        // Update connection state to connecting and show QR IMMEDIATELY
        setConnections(prev => 
          prev.map(conn => 
            conn.id === connectionId 
              ? { ...conn, connectionState: 'connecting', qrCode }
              : conn
          )
        );
        
        // Update active connection if it's the one being connected
        if (activeConnection?.id === connectionId) {
          setActiveConnection(prev => prev ? { 
            ...prev, 
            connectionState: 'connecting', 
            qrCode,
            // Force-show QR immediately
            qrGenerated: true 
          } : null);
        }
        
        // Silent: WhatsApp pronto para leitura de QR !
        
        // Force immediate reload after 500ms to catch any state changes
        setTimeout(() => {
          // Silent: Forced reload para confirmar conexão
        }, 500);
        
      } else {
        // Silent: QR Code não gerado ainda - aguarde...
        
        // Update state as connecting (QR can be read from socket events) 
        setConnections(prev => 
          prev.map(conn => 
            conn.id === connectionId 
              ? { ...conn, connectionState: 'connecting' }
              : conn
          )
        );
        
        if (activeConnection?.id === connectionId) {
          setActiveConnection(prev => prev ? { 
            ...prev, 
            connectionState: 'connecting' /* , qrGenerated: true */
          } : null);
        }
      }
      
    } catch (err: any) {
      // Silent: Erro ao iniciar WhatsApp instantaneamente
      setError(`Falha na conexão: ${err.message}`);
      
      // Set as disconnected on error
      setConnections(prev => 
        prev.map(conn => 
          conn.id === connectionId 
            ? { ...conn, connectionState: 'disconnected', qrCode: undefined }
            : conn
        )
      );
      
      if (activeConnection?.id === connectionId) {
        setActiveConnection(prev => prev ? { 
          ...prev, 
          connectionState: 'disconnected', 
          qrCode: undefined 
        } : null);
      }
    }
  }, [API_URL, activeConnection]);

  // Disconnect WhatsApp
  const disconnectWhatsApp = useCallback(async (connectionId: string, userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${connectionId}/abort`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }
      
      // Update local state
      setConnections(prev => 
        prev.map(conn => 
          conn.id === connectionId 
            ? { ...conn, connectionState: 'disconnected', isConnected: false, qrCode: undefined }
            : conn
        )
      );
      
      if (activeConnection?.id === connectionId) {
        setActiveConnection(prev => prev ? { ...prev, connectionState: 'disconnected', isConnected: false, qrCode: undefined } : null);
      }
      
      return { success: true };
    } catch (err: any) {
      // Silent: Error disconnecting WhatsApp
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [activeConnection, API_URL]);

  // Generate QR Code
  const generateQRCode = useCallback(async (connectionId: string): Promise<string | null> => {
    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${connectionId}/qr`);
      
      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }
      
      const data = await response.json();
      return data.data?.qrCode || null;
    } catch (err: any) {
      // Silent: Error generating QR code
      setError(err.message);
      return null;
    }
  }, [API_URL]);

  // Refresh QR Code
  const refreshQRCode = useCallback(async (connectionId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${connectionId}/refresh-qr`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh QR code');
      }
    } catch (err: any) {
      // Silent: Error refreshing QR code
      setError(err.message);
    }
  }, [API_URL]);

  // Modal management
  const openDisconnectModal = useCallback((connectionId: string) => {
    setConnectionToDisconnect(connectionId);
    setIsDisconnectModalOpen(true);
  }, []);

  const closeDisconnectModal = useCallback(() => {
    setIsDisconnectModalOpen(false);
    setConnectionToDisconnect(null);
  }, []);

  // Delete modal management
  const openDeleteConnectionModal = useCallback((connection: WhatsAppConnection) => {
    setDeleteConnectionData(connection);
    setShowDeleteConnectionModal(true);
  }, []);

  const closeDeleteConnectionModal = useCallback(() => {
    setShowDeleteConnectionModal(false);
    setDeleteConnectionData(null);
  }, []);

  // Socket.IO connection usando SocketManager - SEM dependências que causam loops
  useEffect(() => {
    // Debug log removido para console silencioso
    
    // Só conectar se tivermos um user ID válido
    if (!user?.id) return;
    
    // Conectar usando o SocketManager com o ID real do usuário
    const socket = connectSocket(SOCKET_URL, { ownerId: user.id });
    setSocket(socket);

    if (socket) {
      // Configurar listeners específicos do ConnectionsContext
      const handleQRCode = (data: { connectionId: string; qrCode: string }) => {
        // Silent: QR Code recebido
        setConnections(prev => 
          prev.map(conn => 
            conn.id === data.connectionId 
              ? { ...conn, qrCode: data.qrCode, connectionState: 'connecting' }
              : conn
          )
        );
        
        if (activeConnection?.id === data.connectionId) {
          setActiveConnection(prev => prev ? { ...prev, qrCode: data.qrCode, connectionState: 'connecting' } : null);
        }
      };

      const handleConnectionUpdate = (data: { connectionId: string; update: any }) => {
        // Silent: Atualização de conexão
        if (data.update.connection === 'open') {
          setConnections(prev => 
            prev.map(conn => 
              conn.id === data.connectionId 
                ? { ...conn, connectionState: 'connected', isConnected: true, qrCode: undefined }
                : conn
            )
          );
          
          if (activeConnection?.id === data.connectionId) {
            setActiveConnection(prev => prev ? { ...prev, connectionState: 'connected', isConnected: true, qrCode: undefined } : null);
          }
        }
      };

      const handleConnectionRemoved = (data: { connectionId: string }) => {
        // Silent: Conexão removida
        setConnections(prev => prev.filter(conn => conn.id !== data.connectionId));
        
        if (activeConnection?.id === data.connectionId) {
          setActiveConnection(null);
        }
      };

      // TODO: Migrar para Supabase Realtime
      // socket.on('qrCode', handleQRCode);
      // socket.on('connectionUpdate', handleConnectionUpdate);
      // socket.on('connectionRemoved', handleConnectionRemoved);

      return () => {
        // TODO: Implementar cleanup com Supabase Realtime
        // socket.off('qrCode', handleQRCode);
        // socket.off('connectionUpdate', handleConnectionUpdate);
        // socket.off('connectionRemoved', handleConnectionRemoved);
      };
    }
  }, [user?.id]); // ✅ Reconectar quando user.id mudar

  // QR Code renewal with timeout
  const startQRCodeRenewal = useCallback((connectionId: string) => {
    const renewalInterval = setInterval(async () => {
      try {
        await refreshQRCode(connectionId);
      } catch (error) {
        // Silent: Error renewing QR code
        clearInterval(renewalInterval);
      }
    }, 30000); // Renew every 30 seconds

    // Stop renewal after 90 seconds
    setTimeout(() => {
      clearInterval(renewalInterval);
    }, 90000);

    return renewalInterval;
  }, [refreshQRCode]);

  // Auto-load connections when user is available and profile is loaded
  useEffect(() => {
    // Silent: User/Profile check
    
    // Load connections regardless of user authentication status
    if (!profileLoading) {
      // Silent: Auto-loading connections...
      // Add a small delay to ensure backend is fully ready
      setTimeout(() => {
        loadConnections(effectiveUserId);
      }, 1000);
    } else {
      // Silent: Waiting for profile to load...
    }
  }, [effectiveUserId, profileLoading, loadConnections]);

  const value: ConnectionsContextType = {
    connections,
    activeConnection,
    loading,
    error,
    loadConnections,
    createConnection,
    deleteConnection,
    connectWhatsApp,
    disconnectWhatsApp,
    generateQRCode,
    refreshQRCode,
    openDisconnectModal,
    closeDisconnectModal,
    isDisconnectModalOpen,
    connectionToDisconnect,
    showDeleteConnectionModal,
    deleteConnectionData,
    openDeleteConnectionModal,
    closeDeleteConnectionModal
  };

  return (
    <ConnectionsContext.Provider value={value}>
      {children}
    </ConnectionsContext.Provider>
  );
}

export function useConnections() {
  const context = useContext(ConnectionsContext);
  if (context === undefined) {
    throw new Error('useConnections must be used within a ConnectionsProvider');
  }
  return context;
}
