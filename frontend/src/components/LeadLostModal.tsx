import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { Lead } from '@/hooks/useLeads-fixed';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from '@/hooks/use-toast';

interface LeadLostModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onConfirm: (leadId: string, deleteContact: boolean) => Promise<boolean>;
}

const LeadLostModal: React.FC<LeadLostModalProps> = ({ 
  isOpen, 
  onClose, 
  lead, 
  onConfirm 
}) => {
  const { topBarColor } = useTheme();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [deleteContact, setDeleteContact] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);

      const success = await onConfirm(lead.id, deleteContact);
      
      if (success) {
        toast({
          title: "Lead marcado como perdido",
          description: deleteContact 
            ? "Lead e contato removidos com sucesso." 
            : "Lead marcado como perdido. Contato mantido.",
        });
        onClose();
        setNotes('');
        setDeleteContact(false);
      } else {
        toast({
          title: "Erro",
          description: "Erro ao marcar lead como perdido. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao marcar lead como perdido. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm w-full mx-4">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <X className="h-5 w-5 text-red-600" />
              </div>
              Marcar Lead como Perdido
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          <Card className="border-0 shadow-sm bg-gray-50">
            <CardContent className="p-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-xs font-semibold text-gray-700">
                      {lead.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">{lead.name}</h3>
                    {lead.company && (
                      <p className="text-xs text-gray-600">{lead.company}</p>
                    )}
                  </div>
                </div>
                {lead.value && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                    <p className="text-xs font-medium text-red-800">
                      Valor perdido: R$ {lead.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
              Motivo da perda (opcional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descreva o motivo da perda do lead..."
              rows={3}
              className="resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-amber-800 mb-1">Atenção</p>
                <p className="text-amber-700">
                  Ao marcar como perdido, o lead será removido da pipeline, mas o contato 
                  será mantido na sua lista de contatos.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
              <Checkbox
                id="deleteContact"
                checked={deleteContact}
                onCheckedChange={(checked) => setDeleteContact(checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label 
                  htmlFor="deleteContact" 
                  className="text-xs font-medium text-gray-700 cursor-pointer"
                >
                  Também excluir o contato da lista de contatos
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  Esta ação removerá permanentemente o contato de todas as suas listas
                </p>
              </div>
            </div>
            
            {deleteContact && (
              <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Trash2 className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-red-800 mb-1">Exclusão permanente</p>
                    <p className="text-red-700">
                      Esta ação removerá permanentemente o contato de todas as suas listas. 
                      Esta ação não pode ser desfeita.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
              className="px-3 py-1 text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading}
              variant="destructive"
              className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processando...
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <X className="h-3 w-3" />
                  Confirmar Perda
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeadLostModal;

