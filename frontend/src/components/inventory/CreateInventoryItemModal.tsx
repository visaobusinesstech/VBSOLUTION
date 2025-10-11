import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RightDrawerModal,
  ModalSection,
  InfoField
} from '@/components/ui/right-drawer-modal';
import { 
  Save,
  X
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ImageUpload } from './ImageUpload';

interface CreateInventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemData: any) => void;
  mode?: 'create' | 'adjust';
  item?: any;
}

const CreateInventoryItemModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  mode = 'create',
  item 
}: CreateInventoryItemModalProps) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    category: item?.category || '',
    price: item?.price || '',
    stock: item?.stock || '',
    minStock: item?.minStock || '',
    supplier: item?.supplier || '',
    description: item?.description || '',
    image_url: item?.image_url || '',
    adjustmentType: mode === 'adjust' ? 'add' : '',
    adjustmentQuantity: mode === 'adjust' ? '' : '',
    adjustmentReason: mode === 'adjust' ? '' : ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.name.trim()) {
      toast.error("Nome do produto é obrigatório");
      return;
    }

    if (mode === 'adjust') {
      if (!formData.adjustmentQuantity || parseInt(formData.adjustmentQuantity) <= 0) {
        toast.error("Quantidade de ajuste deve ser maior que zero");
        return;
      }
      
      if (!formData.adjustmentReason.trim()) {
        toast.error("Motivo do ajuste é obrigatório");
        return;
      }
    }

    const submitData = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock) || 0,
      minStock: parseInt(formData.minStock) || 0,
      adjustmentQuantity: mode === 'adjust' ? parseInt(formData.adjustmentQuantity) : undefined
    };

    onSubmit(submitData);
    onClose();
    
    // Reset form
    setFormData({
      name: '',
      category: '',
      price: '',
      stock: '',
      minStock: '',
      supplier: '',
      description: '',
      image_url: '',
      adjustmentType: mode === 'adjust' ? 'add' : '',
      adjustmentQuantity: '',
      adjustmentReason: ''
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUploaded = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image_url: imageUrl }));
  };

  const handleImageRemoved = () => {
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  const title = mode === 'adjust' ? 'Criar Ajuste de Estoque' : 'Criar Item de Estoque';
  const id = mode === 'adjust' ? `ID #AJUSTE` : `ID #NEW`;

  return (
    <RightDrawerModal
      open={isOpen}
      onClose={onClose}
      title={title}
      id={id}
      actions={[
        {
          label: "Cancelar",
          variant: "outline",
          onClick: onClose,
          icon: <X className="h-4 w-4" />
        },
        {
          label: mode === 'adjust' ? "Criar Ajuste" : "Criar Item",
          variant: "primary",
          onClick: handleSubmit,
          icon: <Save className="h-4 w-4" />
        }
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <ModalSection title="Informações Básicas">
          <div className="space-y-5">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-600 mb-2 block">
                Nome do Produto*
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Digite o nome do produto"
                required
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-sm font-medium text-gray-600 mb-2 block">
                Categoria
              </Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eletronicos">Eletrônicos</SelectItem>
                  <SelectItem value="roupas">Roupas</SelectItem>
                  <SelectItem value="alimentacao">Alimentação</SelectItem>
                  <SelectItem value="livros">Livros</SelectItem>
                  <SelectItem value="casa-jardim">Casa e Jardim</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </ModalSection>

        {mode !== 'adjust' && (
          <ModalSection title="Detalhes do Produto">
            <div className="space-y-5">
              <div>
                <Label htmlFor="price" className="text-sm font-medium text-gray-600 mb-2 block">
                  Preço (R$)
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0,00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock" className="text-sm font-medium text-gray-600 mb-2 block">
                    Estoque Atual
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => handleInputChange('stock', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="minStock" className="text-sm font-medium text-gray-600 mb-2 block">
                    Estoque Mínimo
                  </Label>
                  <Input
                    id="minStock"
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => handleInputChange('minStock', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="supplier" className="text-sm font-medium text-gray-600 mb-2 block">
                  Fornecedor
                </Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => handleInputChange('supplier', e.target.value)}
                  placeholder="Nome do fornecedor"
                />
              </div>
            </div>
          </ModalSection>
        )}

        {mode === 'adjust' && (
          <ModalSection title="Detalhes do Ajuste">
            <div className="space-y-5">
              <div>
                <Label htmlFor="adjustmentType" className="text-sm font-medium text-gray-600 mb-2 block">
                  Tipo de Ajuste
                </Label>
                <Select value={formData.adjustmentType} onValueChange={(value) => handleInputChange('adjustmentType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Adicionar</SelectItem>
                    <SelectItem value="remove">Remover</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="adjustmentQuantity" className="text-sm font-medium text-gray-600 mb-2 block">
                  Quantidade*
                </Label>
                <Input
                  id="adjustmentQuantity"
                  type="number"
                  value={formData.adjustmentQuantity}
                  onChange={(e) => handleInputChange('adjustmentQuantity', e.target.value)}
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <Label htmlFor="adjustmentReason" className="text-sm font-medium text-gray-600 mb-2 block">
                  Motivo do Ajuste*
                </Label>
                <Input
                  id="adjustmentReason"
                  value={formData.adjustmentReason}
                  onChange={(e) => handleInputChange('adjustmentReason', e.target.value)}
                  placeholder="Descreva o motivo"
                  required
                />
              </div>
            </div>
          </ModalSection>
        )}

        <ModalSection title="Informações Adicionais">
          <div className="space-y-5">
            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-600 mb-2 block">
                Descrição
              </Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descrição do produto"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600 mb-2 block">
                Imagem do Produto
              </Label>
              <ImageUpload
                onImageUploaded={handleImageUploaded}
                onImageRemoved={handleImageRemoved}
                currentImageUrl={formData.image_url}
              />
            </div>
          </div>
        </ModalSection>
      </form>
    </RightDrawerModal>
  );
};

export default CreateInventoryItemModal;