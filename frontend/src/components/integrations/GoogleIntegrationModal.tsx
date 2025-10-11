import React, { useState } from 'react';
import { Globe, Calendar, Mail, Video, FileText, Shield, CheckCircle, AlertCircle } from 'lucide-react';

interface GoogleIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
  onSuccess?: (data: any) => void;
}

export default function GoogleIntegrationModal({
  isOpen,
  onClose,
  onConnect,
  onSuccess
}: GoogleIntegrationModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [step, setStep] = useState<'permissions' | 'connecting' | 'success' | 'error'>('permissions');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setIsConnecting(true);
    setStep('connecting');
    setError(null);

    try {
      const response = await fetch('/api/integrations/google/auth', {
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
          'google-auth',
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
              onSuccess?.({ platform: 'google', connected: true });
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
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Conectar com Google
              </h3>
              <p className="text-gray-600">
                Conecte sua conta Google para automatizar tarefas no Calendar, Gmail e Drive
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Permissões que serão solicitadas:
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Google Calendar</p>
                    <p className="text-sm text-blue-700">
                      Criar, editar e gerenciar eventos no seu calendário
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Video className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Google Meet</p>
                    <p className="text-sm text-blue-700">
                      Gerar links de reuniões automaticamente
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Gmail</p>
                    <p className="text-sm text-blue-700">
                      Enviar emails automaticamente
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Google Drive</p>
                    <p className="text-sm text-blue-700">
                      Salvar arquivos e documentos
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
                    Você será redirecionado para o Google para autorizar o acesso. 
                    Todas as ações serão realizadas em seu nome e você pode revogar 
                    o acesso a qualquer momento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'connecting':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Conectando...
              </h3>
              <p className="text-gray-600">
                Aguarde enquanto redirecionamos você para o Google
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
                Sua conta Google foi conectada e está pronta para uso
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
                {error || 'Ocorreu um erro ao conectar com o Google'}
              </p>
              <button
                onClick={() => setStep('permissions')}
                className="text-blue-600 hover:text-blue-700 font-medium"
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
                  className="flex-1 px-4 py-3 text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      Conectar Google
                    </>
                  )}
                </button>
              </>
            )}
            
            {step === 'success' && (
              <button
                onClick={() => {
                  onSuccess?.({ platform: 'google', connected: true });
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
