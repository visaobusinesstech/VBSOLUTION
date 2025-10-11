import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RightDrawerModal,
  ModalSection
} from '@/components/ui/right-drawer-modal';
import { useProject } from '@/contexts/ProjectContext';
import { Save, X, Users } from 'lucide-react';
import { toast } from 'sonner';

interface CreateWorkGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (workGroupData: any) => void;
}

export function CreateWorkGroupModal({ isOpen, onClose, onSubmit }: CreateWorkGroupModalProps) {
  const { state } = useProject();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    department: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const colors = [
    { name: 'Azul', value: '#3B82F6' },
    { name: 'Verde', value: '#10B981' },
    { name: 'Roxo', value: '#8B5CF6' },
    { name: 'Rosa', value: '#EC4899' },
    { name: 'Laranja', value: '#F59E0B' },
    { name: 'Vermelho', value: '#EF4444' },
    { name: 'Cinza', value: '#6B7280' },
    { name: 'Indigo', value: '#6366F1' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name.trim()) {
      toast.error('Nome do grupo é obrigatório');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
      // Reset form
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        department: ''
      });
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RightDrawerModal
      open={isOpen}
      onClose={onClose}
      title="Criar Novo Grupo de Trabalho"
      id="NEW"
      actions={[
        {
          label: "Cancelar",
          variant: "outline",
          onClick: onClose,
          icon: <X className="h-4 w-4" />
        },
        {
          label: "Criar Grupo",
          variant: "primary",
          onClick: handleSubmit,
          disabled: isSubmitting,
          icon: <Save className="h-4 w-4" />
        }
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <ModalSection title="Informações Básicas">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-600 mb-2 block">
                Nome do Grupo*
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Digite o nome do grupo"
                className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-600 mb-2 block">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o propósito do grupo..."
                rows={3}
                className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </ModalSection>

        {/* Configurações */}
        <ModalSection title="Configurações">
          <div className="space-y-4">
            <div>
              <Label htmlFor="department" className="text-sm font-medium text-gray-600 mb-2 block">
                Setor
              </Label>
              <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                <SelectTrigger className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="vendas">Vendas</SelectItem>
                  <SelectItem value="suporte">Suporte</SelectItem>
                  <SelectItem value="recursos_humanos">Recursos Humanos</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="nao_definido">Não definido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600 mb-3 block">
                Cor do Grupo
              </Label>
              <div className="grid grid-cols-4 gap-3">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`
                      w-12 h-12 rounded-lg border-2 transition-all duration-200
                      ${formData.color === color.value 
                        ? 'border-gray-400 scale-110 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Selecione uma cor para identificar o grupo
              </p>
            </div>
          </div>
        </ModalSection>

        {/* Preview */}
        <ModalSection title="Pré-visualização">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div 
              className="h-12 w-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: formData.color }}
            >
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">
                {formData.name || 'Nome do grupo'}
              </h4>
              <p className="text-sm text-gray-600">
                {formData.description || 'Descrição do grupo'}
              </p>
            </div>
          </div>
        </ModalSection>
      </form>
    </RightDrawerModal>
  );
}
