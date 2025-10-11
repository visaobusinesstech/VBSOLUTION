import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RightDrawerModal,
  ModalSection
} from '@/components/ui/right-drawer-modal';
import { 
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useWriteoffs } from '@/hooks/useWriteoffs';

// Modal atualizado para RightDrawerModal
interface CreateWriteoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWriteoffCreated: () => void;
}

export default function CreateWriteoffModal({ 
  isOpen, 
  onClose, 
  onWriteoffCreated 
}: CreateWriteoffModalProps) {
  const { createWriteoff } = useWriteoffs();
  
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error("Nome da baixa é obrigatório");
      return;
    }

    if (!formData.reason) {
      toast.error("Motivo da baixa é obrigatório");
      return;
    }

    if (formData.quantity <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }

    setIsSubmitting(true);

    try {
      const newWriteoff = await createWriteoff({
        name: formData.name,
        quantity: formData.quantity,
        reason: formData.reason,
        status: 'pending'
      });

      if (newWriteoff) {
        onWriteoffCreated();
        toast.success('Baixa criada com sucesso!');
        onClose();
        
        // Reset form
        setFormData({
          name: '',
          quantity: 1,
          reason: ''
        });
      } else {
        toast.error('Erro ao criar baixa. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao criar writeoff:', error);
      toast.error('Erro ao criar baixa. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: field === 'quantity' ? parseInt(value) || 1 : value 
    }));
  };

  return (
    <RightDrawerModal
      open={isOpen}
      onClose={onClose}
      title="Criar Nova Baixa"
      id="ID #NEW"
      actions={[
        {
          label: "Cancelar",
          variant: "outline",
          onClick: onClose,
          icon: <X className="h-4 w-4" />
        },
        {
          label: isSubmitting ? "Criando..." : "Criar Baixa",
          variant: "primary",
          onClick: handleSubmit,
          disabled: isSubmitting,
          icon: <Save className="h-4 w-4" />
        }
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <ModalSection title="Informações da Baixa">
          <div className="space-y-5">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-600 mb-2 block">
                Nome da Baixa*
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Digite o nome da baixa"
                required
              />
            </div>

            <div>
              <Label htmlFor="quantity" className="text-sm font-medium text-gray-600 mb-2 block">
                Quantidade*
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                placeholder="Digite a quantidade"
                required
              />
            </div>

            <div>
              <Label htmlFor="reason" className="text-sm font-medium text-gray-600 mb-2 block">
                Motivo da Baixa*
              </Label>
              <Select value={formData.reason} onValueChange={(value) => handleInputChange('reason', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="damage">Produto Danificado</SelectItem>
                  <SelectItem value="expiry">Produto Vencido</SelectItem>
                  <SelectItem value="loss">Perda/Roubo</SelectItem>
                  <SelectItem value="return">Devolução</SelectItem>
                  <SelectItem value="quality">Problema de Qualidade</SelectItem>
                  <SelectItem value="other">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </ModalSection>
      </form>
    </RightDrawerModal>
  );
}