
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Package, MapPin, DollarSign, Calendar, User, Tag } from 'lucide-react';

interface InventoryViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
}

export function InventoryViewModal({ isOpen, onClose, item }: InventoryViewModalProps) {
  if (!item) return null;

  const getStatusBadge = (status: string, quantity: number, minStock: number) => {
    if (quantity === 0) {
      return <Badge className="bg-red-100 text-red-800 border-red-300">Sem estoque</Badge>;
    } else if (quantity <= minStock) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Estoque baixo</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800 border-green-300">Em estoque</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Detalhes do Item</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Nome do Produto</p>
                <p className="font-medium">{item.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">SKU</p>
                <p className="font-mono text-sm">{item.sku}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Localização</p>
                <p className="font-medium">{item.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Fornecedor</p>
                <p className="font-medium">{item.supplier}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Quantidade</p>
                <p className="font-medium">{item.quantity} unidades</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Estoque Mínimo</p>
                <p className="font-medium">{item.minStock} unidades</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Preço Unitário</p>
                <p className="font-medium">{formatCurrency(item.price)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Valor Total</p>
                <p className="font-medium">{formatCurrency(item.total)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              {getStatusBadge(item.status, item.quantity, item.minStock)}
            </div>
            <div>
              <p className="text-sm text-gray-500">Categoria</p>
              <Badge variant="outline">{item.category}</Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
