import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RightDrawerModal,
  ModalSection
} from '@/components/ui/right-drawer-modal';
import { 
  Save,
  X
} from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { filterValidStringArray } from '@/utils/selectValidation';
import { toast } from '@/hooks/use-toast';

interface WorkGroupCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (workGroupData: any) => void;
}

const WorkGroupCreateModal = ({ isOpen, onClose, onSubmit }: WorkGroupCreateModalProps) => {
  const { state } = useProject();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    department: ''
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 [MODAL] handleSubmit chamado');
    console.log('📝 [MODAL] formData:', formData);
    
    // Validação básica
    if (!formData.name.trim()) {
      console.log('❌ [MODAL] Nome vazio, cancelando');
      toast({
        title: "Erro",
        description: "Nome do grupo é obrigatório",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ [MODAL] Validação passou, chamando onSubmit');
    onSubmit(formData);
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      department: ''
    });
    
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const availableDepartments = filterValidStringArray(state?.departments || []);

  return (
    <RightDrawerModal
      open={isOpen}
      onClose={onClose}
      title="Criar Grupo de Trabalho"
      id="ID #NEW"
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
          icon: <Save className="h-4 w-4" />
        }
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <ModalSection title="Informações Básicas">
          <div className="space-y-5">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-600 mb-2 block">
                Nome do Grupo*
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Digite o nome do grupo"
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
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva o propósito do grupo"
                rows={3}
              />
            </div>
          </div>
        </ModalSection>

        <ModalSection title="Configurações">
          <div className="space-y-5">
            <div>
              <Label htmlFor="color" className="text-sm font-medium text-gray-600 mb-2 block">
                Cor do Grupo
              </Label>
              <Select value={formData.color} onValueChange={(value) => handleInputChange('color', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma cor" />
                </SelectTrigger>
                <SelectContent>
                  {colors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300" 
                          style={{ backgroundColor: color.value }}
                        />
                        {color.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="department" className="text-sm font-medium text-gray-600 mb-2 block">
                Departamento
              </Label>
              <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um departamento" />
                </SelectTrigger>
                <SelectContent>
                  {availableDepartments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </ModalSection>
      </form>
    </RightDrawerModal>
  );
};

export default WorkGroupCreateModal;