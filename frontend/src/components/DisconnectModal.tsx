import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { CheckCircle } from 'lucide-react';

interface DisconnectModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export const DisconnectModal: React.FC<DisconnectModalProps> = ({
  isOpen,
  message,
  onClose
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Desconexão Realizada
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600 text-center">
            {message}
          </p>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={onClose} className="text-white hover:opacity-90" style={{ backgroundColor: '#4A5477' }}>
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DisconnectModal;
