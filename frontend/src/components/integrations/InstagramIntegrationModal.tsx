import React, { useState } from 'react';
import { Camera, Image, MessageCircle, BarChart3, Shield, CheckCircle, AlertCircle } from 'lucide-react';

interface InstagramIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
  onSuccess?: (data: any) => void;
}

export default function InstagramIntegrationModal({
  isOpen,
  onClose,
  onConnect,
  onSuccess
}: InstagramIntegrationModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [step, setStep] = useState<'permissions' | 'connecting' | 'success' | 'error'>('permissions');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setIsConnecting(true);
    setStep('connecting');
    setError(null);

    try {
      const response = await fetch('/api/integrations/meta/auth', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar URL de autorização');
      }

      const data = await response.json();
      
      if (data.success && data.data.authUrl) {
        // Abrir popup para autorização
        const popup = window.open(
          data.data.authUrl,
          'instagram-auth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        // Monitorar fechamento do popup
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            setIsConnecting(false);
            setStep('permissions');
            
            // Verificar se a conexão foi bem-sucedida
            setTimeout(() => {
              onSuccess?.({ platform: 'instagram', connected: true });
            }, 1000);
          }
        }, 1000);

        // Timeout de 5 minutos
        setTimeout(() => {
          if (!popup?.closed) {
            popup?.close();
            clearInterval(checkClosed);
            setIsConnecting(false);
            setStep('permissions');
          }
        }, 300000);
      } else {
        throw new Error('URL de autorização não gerada');
      }
    } catch (err: any) {
      setError(err.message);
      setStep('error');
      setIsConnecting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'permissions':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Conectar com Instagram
              </h3>
              <p className="text-gray-600">
                Conecte sua conta Instagram para gerenciar mídia, comentários e insights
              </p>
            </div>

            <div className="bg-pink-50 rounded-xl p-6">
              <h4 className="font-semibold text-pink-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Permissões que serão solicitadas:
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Image className="w-5 h-5 text-pink-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-pink-900">Gerenciar Mídia</p>
                    <p className="text-sm text-pink-700">
                      Publicar fotos e vídeos no seu perfil
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-pink-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-pink-900">Gerenciar Comentários</p>
                    <p className="text-sm text-pink-700">
                      Responder comentários automaticamente
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-5 h-5 text-pink-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-pink-900">Visualizar Insights</p>
                    <p className="text-sm text-pink-700">
                      Acessar estatísticas e métricas do perfil
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Camera className="w-5 h-5 text-pink-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-pink-900">Gerenciar Stories</p>
                    <p className="text-sm text-pink-700">
                      Publicar e gerenciar stories
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Importante</p>
                  <p className="text-sm text-yellow-700">
                    Você precisa ter uma conta Instagram Business ou Creator para usar esta integração. 
                    O perfil deve estar conectado a uma página do Facebook.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'connecting':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 rounded-full flex items-center justify-center mx-auto">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Conectando...
              </h3>
              <p className="text-gray-600">
                Aguarde enquanto redirecionamos você para o Instagram
              </p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Conectado com sucesso!
              </h3>
              <p className="text-gray-600">
                Sua conta Instagram foi conectada e está pronta para uso
              </p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Erro na conexão
              </h3>
              <p className="text-gray-600 mb-2">
                {error || 'Ocorreu um erro ao conectar com o Instagram'}
              </p>
              <button
                onClick={() => setStep('permissions')}
                className="text-pink-600 hover:text-pink-700 font-medium"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {renderStep()}
          
          <div className="flex gap-3 mt-8">
            {step === 'permissions' && (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="flex-1 px-4 py-3 text-white bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 rounded-xl hover:from-pink-600 hover:via-purple-600 hover:to-orange-600 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      Conectar Instagram
                    </>
                  )}
                </button>
              </>
            )}
            
            {step === 'success' && (
              <button
                onClick={() => {
                  onSuccess?.({ platform: 'instagram', connected: true });
                  onClose();
                }}
                className="w-full px-4 py-3 text-white bg-gradient-to-r from-green-600 to-green-700 rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-medium"
              >
                Continuar
              </button>
            )}
            
            {step === 'error' && (
              <button
                onClick={onClose}
                className="w-full px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
