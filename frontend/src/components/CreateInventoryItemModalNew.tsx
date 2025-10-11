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
import { Save, X, Package } from 'lucide-react';
import { toast } from 'sonner';

interface CreateInventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemData: any) => void;
  mode?: 'create' | 'adjust';
  item?: any;
}

export function CreateInventoryItemModalNew({ 
  isOpen, 
  onClose, 
  onSubmit, 
  mode = 'create',
  item 
}: CreateInventoryItemModalProps) {
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

  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } else {
      if (!formData.price || parseFloat(formData.price) <= 0) {
        toast.error("Preço deve ser maior que zero");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
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
        adjustmentType: '',
        adjustmentQuantity: '',
        adjustmentReason: ''
      });
    } catch (error) {
      console.error('Erro ao salvar item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RightDrawerModal
      open={isOpen}
      onClose={onClose}
      title={mode === 'adjust' ? 'Ajustar Estoque' : 'Adicionar Item ao Inventário'}
      id={mode === 'adjust' ? 'ADJUST' : 'NEW'}
      actions={[
        {
          label: "Cancelar",
          variant: "outline",
          onClick: onClose,
          icon: <X className="h-4 w-4" />
        },
        {
          label: mode === 'adjust' ? "Ajustar Estoque" : "Adicionar Item",
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
                Nome do Produto*
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Digite o nome do produto"
                className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-sm font-medium text-gray-600 mb-2 block">
                Categoria
              </Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eletronicos">Eletrônicos</SelectItem>
                  <SelectItem value="roupas">Roupas</SelectItem>
                  <SelectItem value="casa">Casa e Jardim</SelectItem>
                  <SelectItem value="esportes">Esportes</SelectItem>
                  <SelectItem value="livros">Livros</SelectItem>
                  <SelectItem value="automotivo">Automotivo</SelectItem>
                  <SelectItem value="beleza">Beleza e Saúde</SelectItem>
                  <SelectItem value="brinquedos">Brinquedos</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-600 mb-2 block">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o produto..."
                rows={3}
                className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </ModalSection>

        {/* Preço e Estoque */}
        <ModalSection title="Preço e Estoque">
          <div className="space-y-4">
            <div>
              <Label htmlFor="price" className="text-sm font-medium text-gray-600 mb-2 block">
                Preço Unitário*
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
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
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                  className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="minStock" className="text-sm font-medium text-gray-600 mb-2 block">
                  Estoque Mínimo
                </Label>
                <Input
                  id="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  placeholder="0"
                  className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </ModalSection>

        {/* Fornecedor */}
        <ModalSection title="Fornecedor">
          <div>
            <Label htmlFor="supplier" className="text-sm font-medium text-gray-600 mb-2 block">
              Fornecedor
            </Label>
            <Input
              id="supplier"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              placeholder="Nome do fornecedor"
              className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </ModalSection>

        {/* Ajuste de Estoque (apenas no modo adjust) */}
        {mode === 'adjust' && (
          <ModalSection title="Ajuste de Estoque">
            <div className="space-y-4">
              <div>
                <Label htmlFor="adjustmentType" className="text-sm font-medium text-gray-600 mb-2 block">
                  Tipo de Ajuste
                </Label>
                <Select value={formData.adjustmentType} onValueChange={(value) => setFormData({ ...formData, adjustmentType: value })}>
                  <SelectTrigger className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Adicionar</SelectItem>
                    <SelectItem value="remove">Remover</SelectItem>
                    <SelectItem value="set">Definir</SelectItem>
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
                  onChange={(e) => setFormData({ ...formData, adjustmentQuantity: e.target.value })}
                  placeholder="0"
                  className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="adjustmentReason" className="text-sm font-medium text-gray-600 mb-2 block">
                  Motivo do Ajuste
                </Label>
                <Textarea
                  id="adjustmentReason"
                  value={formData.adjustmentReason}
                  onChange={(e) => setFormData({ ...formData, adjustmentReason: e.target.value })}
                  placeholder="Descreva o motivo do ajuste..."
                  rows={2}
                  className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </ModalSection>
        )}
      </form>
    </RightDrawerModal>
  );
}
