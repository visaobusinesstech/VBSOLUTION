
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  const handleSubmit = (e: React.FormEvent) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Digite o nome do produto"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
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

            {mode !== 'adjust' && (
              <>
                <div>
                  <Label htmlFor="price">Preço (R$)</Label>
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
                    <Label htmlFor="stock">Estoque Atual</Label>
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
                    <Label htmlFor="minStock">Estoque Mínimo</Label>
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
                  <Label htmlFor="supplier">Fornecedor</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                    placeholder="Nome do fornecedor"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descrição do produto"
                  />
                </div>

                <div>
                  <ImageUpload
                    onImageUploaded={handleImageUploaded}
                    currentImageUrl={formData.image_url}
                    onImageRemoved={handleImageRemoved}
                  />
                </div>
              </>
            )}

            {mode === 'adjust' && (
              <>
                <div>
                  <Label>Tipo de Ajuste</Label>
                  <Select value={formData.adjustmentType} onValueChange={(value) => handleInputChange('adjustmentType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de ajuste" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add">Adicionar ao Estoque</SelectItem>
                      <SelectItem value="remove">Remover do Estoque</SelectItem>
                      <SelectItem value="correction">Correção de Inventário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="adjustmentQuantity">Quantidade *</Label>
                  <Input
                    id="adjustmentQuantity"
                    type="number"
                    min="1"
                    value={formData.adjustmentQuantity}
                    onChange={(e) => handleInputChange('adjustmentQuantity', e.target.value)}
                    placeholder="Digite a quantidade"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="adjustmentReason">Motivo do Ajuste *</Label>
                  <Select value={formData.adjustmentReason} onValueChange={(value) => handleInputChange('adjustmentReason', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compra">Nova Compra</SelectItem>
                      <SelectItem value="venda">Venda</SelectItem>
                      <SelectItem value="perda">Perda/Avaria</SelectItem>
                      <SelectItem value="devolucao">Devolução</SelectItem>
                      <SelectItem value="inventario">Acerto de Inventário</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="text-white hover:opacity-90" style={{ backgroundColor: '#4A5477' }}>
              {mode === 'adjust' ? 'Criar Ajuste' : 'Criar Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInventoryItemModal;
