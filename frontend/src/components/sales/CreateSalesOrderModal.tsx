
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from '@/utils/dateUtils';
import { ptBR } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SalesOrderItem {
  id: string;
  product: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface CreateSalesOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

const CreateSalesOrderModal = ({ isOpen, onClose, onOrderCreated }: CreateSalesOrderModalProps) => {
  const [orderData, setOrderData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    orderDate: new Date(),
    deliveryDate: undefined as Date | undefined,
    status: 'draft',
    priority: 'medium',
    warehouse: '',
    paymentMethod: '',
    paymentTerms: '',
    discount: 0,
    shippingCost: 0,
    notes: '',
  });

  const [items, setItems] = useState<SalesOrderItem[]>([]);
  const [newItem, setNewItem] = useState({
    product: '',
    quantity: 1,
    unitPrice: 0,
  });

  const calculateItemTotal = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  const calculateOrderTotal = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * orderData.discount) / 100;
    return subtotal - discountAmount + orderData.shippingCost;
  };

  const addItem = () => {
    if (!newItem.product || newItem.quantity <= 0 || newItem.unitPrice <= 0) {
      toast.error('Preencha todos os campos do item');
      return;
    }

    const item: SalesOrderItem = {
      id: Date.now().toString(),
      product: newItem.product,
      quantity: newItem.quantity,
      unitPrice: newItem.unitPrice,
      total: calculateItemTotal(newItem.quantity, newItem.unitPrice),
    };

    setItems([...items, item]);
    setNewItem({ product: '', quantity: 1, unitPrice: 0 });
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const handleSubmit = () => {
    if (!orderData.customerName || items.length === 0) {
      toast.error('Preencha os campos obrigatórios e adicione pelo menos um item');
      return;
    }

    // Here you would typically save to a database
    toast.success('Pedido de venda criado com sucesso!');
    onOrderCreated();
    onClose();
    
    // Reset form
    setOrderData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      orderDate: new Date(),
      deliveryDate: undefined,
      status: 'draft',
      priority: 'medium',
      warehouse: '',
      paymentMethod: '',
      paymentTerms: '',
      discount: 0,
      shippingCost: 0,
      notes: '',
    });
    setItems([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Criar Pedido de Venda</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customerName">Nome do Cliente *</Label>
                <Input
                  id="customerName"
                  value={orderData.customerName}
                  onChange={(e) => setOrderData({ ...orderData, customerName: e.target.value })}
                  placeholder="Digite o nome do cliente"
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={orderData.customerEmail}
                  onChange={(e) => setOrderData({ ...orderData, customerEmail: e.target.value })}
                  placeholder="cliente@email.com"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Telefone</Label>
                <Input
                  id="customerPhone"
                  value={orderData.customerPhone}
                  onChange={(e) => setOrderData({ ...orderData, customerPhone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label htmlFor="customerAddress">Endereço</Label>
                <Textarea
                  id="customerAddress"
                  value={orderData.customerAddress}
                  onChange={(e) => setOrderData({ ...orderData, customerAddress: e.target.value })}
                  placeholder="Endereço completo do cliente"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data do Pedido</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !orderData.orderDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {orderData.orderDate ? format(orderData.orderDate, "PPP", { locale: ptBR }) : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={orderData.orderDate}
                        onSelect={(date) => date && setOrderData({ ...orderData, orderDate: date })}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Data de Entrega</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !orderData.deliveryDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {orderData.deliveryDate ? format(orderData.deliveryDate, "PPP", { locale: ptBR }) : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={orderData.deliveryDate}
                        onSelect={(date) => setOrderData({ ...orderData, deliveryDate: date })}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={orderData.status} onValueChange={(value) => setOrderData({ ...orderData, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="shipped">Enviado</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Select value={orderData.priority} onValueChange={(value) => setOrderData({ ...orderData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="warehouse">Depósito</Label>
                <Select value={orderData.warehouse} onValueChange={(value) => setOrderData({ ...orderData, warehouse: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar depósito" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Depósito Principal</SelectItem>
                    <SelectItem value="secondary">Depósito Secundário</SelectItem>
                    <SelectItem value="warehouse3">Depósito 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                  <Select value={orderData.paymentMethod} onValueChange={(value) => setOrderData({ ...orderData, paymentMethod: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">À Vista</SelectItem>
                      <SelectItem value="credit">Cartão de Crédito</SelectItem>
                      <SelectItem value="debit">Cartão de Débito</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="bank-slip">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paymentTerms">Prazo de Pagamento</Label>
                  <Input
                    id="paymentTerms"
                    value={orderData.paymentTerms}
                    onChange={(e) => setOrderData({ ...orderData, paymentTerms: e.target.value })}
                    placeholder="Ex: 30 dias"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Itens do Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add Item Form */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
              <div>
                <Label htmlFor="newProduct">Produto</Label>
                <Input
                  id="newProduct"
                  value={newItem.product}
                  onChange={(e) => setNewItem({ ...newItem, product: e.target.value })}
                  placeholder="Nome do produto"
                />
              </div>
              <div>
                <Label htmlFor="newQuantity">Quantidade</Label>
                <Input
                  id="newQuantity"
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label htmlFor="newUnitPrice">Preço Unitário</Label>
                <Input
                  id="newUnitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newItem.unitPrice}
                  onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addItem} className="w-full text-white hover:opacity-90" style={{ backgroundColor: '#4A5477' }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>

            {/* Items List */}
            {items.length > 0 && (
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 grid grid-cols-4 gap-4">
                      <div>
                        <span className="font-medium">{item.product}</span>
                      </div>
                      <div className="text-center">
                        {item.quantity}
                      </div>
                      <div className="text-center">
                        R$ {item.unitPrice.toFixed(2)}
                      </div>
                      <div className="text-center font-medium">
                        R$ {item.total.toFixed(2)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-800 ml-4"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="discount">Desconto (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={orderData.discount}
                  onChange={(e) => setOrderData({ ...orderData, discount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="shipping">Frete (R$)</Label>
                <Input
                  id="shipping"
                  type="number"
                  min="0"
                  step="0.01"
                  value={orderData.shippingCost}
                  onChange={(e) => setOrderData({ ...orderData, shippingCost: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Total do Pedido</Label>
                <div className="text-2xl font-bold text-green-600 mt-2">
                  R$ {calculateOrderTotal().toFixed(2)}
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={orderData.notes}
                onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })}
                placeholder="Observações adicionais sobre o pedido"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="text-white hover:opacity-90" style={{ backgroundColor: '#4A5477' }}>
            Criar Pedido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSalesOrderModal;
