import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, RefreshCw, CheckCircle, AlertCircle, Clock, Smartphone, Settings as SettingsIcon, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
// import io from 'socket.io-client'; // ✅ DESABILITADO temporariamente

const API = (import.meta as any).env?.VITE_API_URL || '';

interface Props {
  open: boolean;
  onClose: () => void;
  connectionId: string | null;
  connectionName?: string;
  onSuccess?: () => void;
  onConnectionSuccess?: () => void; // New prop for connection success
}

export default function OptimizedQRModal({ 
  open, 
  onClose, 
  connectionId,
  connectionName = 'WhatsApp',
  onSuccess,
  onConnectionSuccess
}: Props) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState(90);
  const [isClient, setIsClient] = useState(false);

  // Fetch QR code from Baileys backend - Otimizado (removed, using Socket.IO only)
  const fetchQRCode = useCallback(async () => {
    // Socket.IO is the primary method, no need for fetch
    console.log('🔄 QR code will be received via Socket.IO');
  }, []);

  // Handle connection success
  const handleSuccess = useCallback(() => {
    console.log('🎉 handleSuccess called!');
    setIsConnected(true);
    setQrCode(null);
    setError(null);
    
    // Call connection success callback to reload connections list
    if (onConnectionSuccess) {
      console.log('🔄 Calling onConnectionSuccess...');
      onConnectionSuccess();
    } else {
      console.log('❌ onConnectionSuccess not provided');
    }
    
    if (onSuccess) {
      console.log('🔄 Calling onSuccess...');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 3000);
    } else {
      console.log('🔄 Auto-closing modal in 3 seconds...');
      setTimeout(onClose, 3000);
    }
  }, [onSuccess, onClose, onConnectionSuccess]);

  // Check connection status - Otimizado
  const checkConnectionStatus = useCallback(async () => {
    if (!connectionId) return;
    
    try {
        // ✅ DESABILITADO: Backend não está rodando
        console.log('🔧 Backend desabilitado - usando apenas Supabase');
        // const response = await fetch(`${API}/api/baileys-simple/connections/${connectionId}/info`);
        
        // Mock response para evitar erro
        const response = {
          ok: false,
          status: 503,
          json: () => Promise.resolve({ success: false, error: 'Backend desabilitado' })
        };
      const data = await response.json();
      
      if (data.success && data.data.isConnected) {
        console.log('🔍 Connection status check: Connected!');
        setIsConnected(true);
        setQrCode(null);
        setError(null);
        handleSuccess();
      }
    } catch (err) {
      // Silently ignore errors - Socket.IO is the primary method
      console.log('Status check failed, using Socket.IO only');
    }
  }, [connectionId, handleSuccess]);

  // ALL useEffect hooks MUST be called BEFORE any early returns
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Set isClient to true immediately for SSR compatibility
  if (typeof window === 'undefined') {
    return null;
  }

  // Reset states when modal opens/closes - only when actually needed
  useEffect(() => {
    if (open && connectionId) {
      setQrCode(null);
      setError(null);
      setIsLoading(true);
      setIsConnected(false);
      setExpiresIn(90);
    }
  }, [open, connectionId]);

  // Timer countdown - starts when QR is first received, doesn't restart on refresh
  useEffect(() => {
    if (!open || !qrCode || isConnected || !connectionId) return;
    
    const timer = setInterval(() => {
      setExpiresIn(prev => {
        if (prev <= 1) {
          console.log('⏰ QR Code expirado');
          setQrCode(null);
          setError('QR Code expirado. Fechando modal...');
          setTimeout(() => {
            onClose();
          }, 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [open, qrCode, isConnected, connectionId, onClose]);

  // Socket.IO listeners for real-time QR codes (Baileys-master approach)
  useEffect(() => {
    if (!open || !connectionId) return;

    // ✅ DESABILITADO: Socket.IO temporariamente para evitar erros
    console.log('🔧 Socket.IO desabilitado - usando Supabase Realtime');
    // const socket = io('http://localhost:3000');

        // // Listen for QR code events
        // socket.on('qrCode', (data) => {
        //   console.log('🔍 QR Code recebido via Socket.IO:', data);
        //   // Accept QR code from any connection ID since the backend might change it
        //   if (data.qrCode && !qrCode) { // Only set if we don't already have a QR code
        //     console.log('✅ QR Code recebido! Definindo QR code...');
        //     setQrCode(data.qrCode);
        //     setIsLoading(false);
        //     setExpiresIn(data.expiresIn || 90);
        //   }
        // });

    // // Listen for connection success
    // socket.on('connectionSuccess', (data) => {
    //   console.log('🔍 Connection success received via Socket.IO:', data);
    //   console.log('🎉 Calling handleSuccess...');
    //   // Accept any connection success since we might have multiple connections
    //   handleSuccess();
    // });

    // return () => {
    //   socket.disconnect();
    // };
  }, [open, connectionId, handleSuccess, qrCode]);

  // PRINCIPAL: Aguardar QR code via Socket.IO
  useEffect(() => {
    if (!open || isConnected) {
      return;
    }
    
    console.log('🔄 Modal aberto, aguardando QR code via Socket.IO...');
    
    // Set up interval for QR refresh (every 20 seconds) - ONLY if we have a QR code
    const qrRefreshInterval = setInterval(() => {
      if (!isConnected && open && connectionId && qrCode) {
        console.log('🔄 Refreshing QR code...');
        // Request new QR code from backend
        // ✅ DESABILITADO: Backend não está rodando
        console.log('🔧 Backend desabilitado - QR refresh cancelado');
        // fetch(`${API}/api/baileys-simple/connections/${connectionId}/refresh-qr`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' }
        // }).catch(err => {
        //   console.log('QR refresh failed, using Socket.IO only');
        // });
      }
    }, 20000);
    
    // Set up interval for connection status check (every 3 seconds) as fallback
    const statusInterval = setInterval(() => {
      if (!isConnected && open && connectionId) {
        checkConnectionStatus();
      }
    }, 3000);

    return () => {
      clearInterval(qrRefreshInterval);
      clearInterval(statusInterval);
    };
  }, [open, isConnected, checkConnectionStatus, connectionId, qrCode]);

  // Early return if modal is not open - AFTER ALL hooks
  if (!open) {
    return null;
  }

  // Format timer display
  const mm = Math.floor(expiresIn / 60).toString().padStart(2, '0');
  const ss = (expiresIn % 60).toString().padStart(2, '0');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000]">
      <div className={`${isConnected ? 'bg-white/10 backdrop-blur-lg border border-white/20' : 'bg-white'} rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 transform transition-all duration-300 scale-100 opacity-100`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-semibold flex items-center gap-2 ${isConnected ? 'text-white' : 'text-gray-900'}`}>
            <QrCode className={`h-6 w-6 ${isConnected ? 'text-green-400' : 'text-green-600'}`} />
            {isConnected ? 'Conectado' : 'Conectar WhatsApp'}: {connectionName}
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-full transition-colors ${isConnected ? 'hover:bg-white/20' : 'hover:bg-gray-100'}`}
          >
            <X className={`h-5 w-5 ${isConnected ? 'text-white' : 'text-gray-500'}`} />
          </button>
        </div>

        <div className="space-y-4">
          {/* QR Code Section */}
          {!isConnected && (
            <div className="text-center space-y-4">
              {qrCode ? (
                <div className="space-y-4">
                  {/* QR Code Display - Gradient Background like example */}
                  <div className="flex justify-center p-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded-xl">
                    <div className="bg-white p-3 rounded-lg">
                      <QRCodeSVG 
                        value={qrCode} 
                        size={200} 
                        includeMargin={false}
                        level="M"
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                      />
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600 font-medium">
                      Escaneie o QR Code com seu WhatsApp
                    </p>
                    <p className="text-xs text-gray-500">
                      Abra o WhatsApp &gt;&gt; Configurações &gt;&gt; WhatsApp Web
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Loading state */}
                  <div className="flex justify-center p-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded-xl">
                    <div className="bg-white p-3 rounded-lg flex items-center justify-center w-[200px] h-[200px]">
                      <RefreshCw className="h-12 w-12 animate-spin text-gray-400" />
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600 font-medium">
                      Aguardando geração do QR Code...
                    </p>
                    <p className="text-xs text-gray-500">
                      Abra o WhatsApp &gt;&gt; Configurações &gt;&gt; WhatsApp Web
                    </p>
                  </div>
                </div>
              )}

              {error && !isLoading && (
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <AlertCircle className="h-16 w-16 text-red-500" />
                  </div>
                  <p className="text-lg font-semibold text-red-600">
                    {error}
                  </p>
                  <Button 
                    onClick={fetchQRCode}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar novamente
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Connected State */}
          {isConnected && (
            <div className="text-center space-y-8">
              {/* Success Animation */}
              <div className="relative">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                  <CheckCircle className="h-12 w-12 text-white" />
                </div>
                {/* Ripple Effect */}
                <div className="absolute inset-0 w-24 h-24 mx-auto bg-green-400 rounded-full animate-ping opacity-20"></div>
                <div className="absolute inset-0 w-24 h-24 mx-auto bg-green-300 rounded-full animate-ping opacity-10" style={{animationDelay: '0.5s'}}></div>
              </div>
              
              {/* Success Message */}
              <div className="space-y-3">
                <h3 className="text-3xl font-bold text-white">
                  Conectado com sucesso!
                </h3>
                <p className="text-white/80 text-lg">
                  Sua conexão WhatsApp está ativa e pronta para uso
                </p>
              </div>
              
              {/* Glassmorphism Button */}
              <button
                onClick={onClose}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Concluído
              </button>
            </div>
          )}

          {/* How to Connect Instructions - Always show */}
          {!isConnected && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 text-center">
                Como conectar:
              </h4>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">1</span>
                  <span>Abra o WhatsApp no seu celular</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">2</span>
                  <div className="flex items-center gap-1">
                    <span>Toque em</span>
                    <SettingsIcon className="h-3 w-3 text-gray-500" />
                    <span>Configurações</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">3</span>
                  <span>Toque em WhatsApp Web</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">4</span>
                  <span>Aponte a câmera para o QR Code</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">5</span>
                  <span>Aguarde a confirmação</span>
                </div>
              </div>
            </div>
          )}

          {/* Timer and Info */}
          {qrCode && !isConnected && (
            <div className="space-y-4">
              {/* Timer */}
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-gray-600">Expira em</span>
                <span className="font-bold text-orange-600 text-lg">{mm}:{ss}</span>
              </div>

              {/* WhatsApp Web info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-700 text-sm">
                  <Smartphone className="h-4 w-4" />
                  <span>Conectando via WhatsApp Web - Versão 2.2412.11</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Button - Simple like example */}
          {!isConnected && (
            <div className="mt-4">
              <button 
                onClick={onClose} 
                className="w-full px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}