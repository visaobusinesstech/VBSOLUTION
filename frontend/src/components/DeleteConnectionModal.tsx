import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  connectionName: string;
  isDeleting?: boolean;
}

const DeleteConnectionModal: React.FC<DeleteConnectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  connectionName,
  isDeleting = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 bg-white rounded-lg shadow-xl">
        <DialogHeader className="flex flex-row items-center justify-between p-6 pb-4 border-b border-gray-200">
          <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-red-600" />
            Excluir Conexão
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Pergunta principal */}
          <div className="text-center">
            <p className="text-lg text-gray-700 mb-6">
              Tem certeza que deseja excluir esta conexão?
            </p>
          </div>

          {/* Aviso de perigo */}
          <div className="bg-red-600 text-white p-4 rounded-lg flex items-start gap-3">
            <Trash2 className="w-6 h-6 text-white flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm mb-1">Atenção!</p>
              <p className="text-sm">
                Esta ação não pode ser desfeita. Você está prestes a excluir permanentemente a conexão{' '}
                <span className="font-bold">"{connectionName}"</span> e todos os dados associados.
              </p>
            </div>
          </div>

          {/* Informações adicionais */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">O que será excluído:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Dados da sessão WhatsApp</li>
              <li>• Histórico de mensagens</li>
              <li>• Configurações da conexão</li>
              <li>• QR codes e tokens de autenticação</li>
            </ul>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-3 p-6 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="px-6 py-2"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-6 py-2 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Excluir Conexão
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConnectionModal;
