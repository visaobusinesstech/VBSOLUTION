import React from 'react';
import { X, AlertTriangle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DuplicateConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: {
    activeConnections: number;
    supabaseConnections: number;
  };
}

export const DuplicateConnectionModal: React.FC<DuplicateConnectionModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Conexão Já Ativa
              </h3>
              <p className="text-sm text-gray-500">
                Não é possível criar múltiplas conexões
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-amber-800 font-medium">
                    Já existe uma conexão WhatsApp ativa no sistema.
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Para criar uma nova conexão, você precisa primeiro desconectar a conexão atual.
                  </p>
                </div>
              </div>
            </div>

            {/* Status Info */}
            {data && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Status das Conexões
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Wifi className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Conexões ativas no servidor:</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {data.activeConnections}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <WifiOff className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Conexões no banco de dados:</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {data.supabaseConnections}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Como proceder:
              </h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Vá para a página de conexões</li>
                <li>Localize a conexão ativa</li>
                <li>Clique em "Desconectar"</li>
                <li>Depois crie uma nova conexão</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6"
          >
            Entendi
          </Button>
          <Button
            onClick={() => {
              // Redirecionar para a página de conexões
              window.location.href = '/settings?tab=connections';
              onClose();
            }}
            className="px-6 bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Ir para Conexões
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DuplicateConnectionModal;
