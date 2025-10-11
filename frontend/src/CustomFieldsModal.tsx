
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SafeSelectItem } from '@/components/ui/safe-select-item';
import { X } from 'lucide-react';

interface CustomFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddField: (field: {name: string; type: string}) => void;
}

export function CustomFieldsModal({ isOpen, onClose, onAddField }: CustomFieldsModalProps) {
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('text');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fieldName.trim()) {
      onAddField({
        name: fieldName.trim(),
        type: fieldType
      });
      setFieldName('');
      setFieldType('text');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Configurar campos personalizados
            <Button
              variant="ghost"
              onClick={onClose}
              className="p-1 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="field-name">Nome do Campo</Label>
            <Input
              id="field-name"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="Digite o nome do campo"
              className="border-gray-300"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-type">Tipo do Campo</Label>
            <Select value={fieldType} onValueChange={setFieldType}>
              <SelectTrigger className="border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SafeSelectItem value="text">Texto</SafeSelectItem>
                <SafeSelectItem value="number">Número</SafeSelectItem>
                <SafeSelectItem value="date">Data</SafeSelectItem>
                <SafeSelectItem value="select">Seleção</SafeSelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button
              type="submit"
              className="bg-black hover:bg-gray-800 text-white"
            >
              Adicionar Campo
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-300"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
