import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, WifiOff } from 'lucide-react';

interface DisconnectConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  connectionName: string;
  isDisconnecting?: boolean;
}

export const DisconnectConfirmModal: React.FC<DisconnectConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  connectionName,
  isDisconnecting = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 bg-white rounded-lg shadow-xl">
        <DialogHeader className="flex flex-row items-center justify-between p-6 pb-4 border-b border-gray-200">
          <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-amber-600" />
            Desconectar Conexão
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Pergunta principal */}
          <div className="text-center">
            <p className="text-lg text-gray-700 mb-2">
              Tem certeza que deseja desconectar esta conexão?
            </p>
            <p className="text-sm text-gray-500">
              A conexão será interrompida e o status será atualizado para "Desconectado".
            </p>
          </div>

          {/* Informações da conexão */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <WifiOff className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-amber-800 font-medium mb-1">
                  Conexão que será desconectada:
                </p>
                <p className="text-amber-700 font-semibold">
                  "{connectionName}"
                </p>
                <p className="text-amber-600 mt-1">
                  Esta ação irá interromper a conexão ativa e marcar como desconectada no sistema.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-3 p-6 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDisconnecting}
            className="px-6 py-2"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDisconnecting}
            className="px-6 py-2 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            {isDisconnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Desconectando...
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                Desconectar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DisconnectConfirmModal;
