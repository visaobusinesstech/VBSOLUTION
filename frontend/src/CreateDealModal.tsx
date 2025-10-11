
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Package, DollarSign, Calendar, Clock } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCompanies } from '@/hooks/useCompanies';

interface CreateDealModalProps {
  open: boolean;
  onClose: () => void;
}

interface ProductItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export function CreateDealModal({ open, onClose }: CreateDealModalProps) {
  const { products } = useProducts();
  const { companies } = useCompanies();
  
  const [formData, setFormData] = useState({
    clientName: '',
    company: '',
    observation: '',
    date: '',
    time: '',
  });

  const [selectedProducts, setSelectedProducts] = useState<ProductItem[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Deal created:', { ...formData, products: selectedProducts });
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      clientName: '',
      company: '',
      observation: '',
      date: '',
      time: '',
    });
    setSelectedProducts([]);
    setShowAddProduct(false);
    setNewProduct({ name: '', price: 0, description: '' });
  };

  const addProductFromInventory = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const newItem: ProductItem = {
        id: product.id,
        name: product.name,
        price: Number(product.base_price),
        quantity: 1,
        total: Number(product.base_price)
      };
      setSelectedProducts([...selectedProducts, newItem]);
    }
  };

  const addCustomProduct = () => {
    if (newProduct.name && newProduct.price > 0) {
      const customItem: ProductItem = {
        id: `custom-${Date.now()}`,
        name: newProduct.name,
        price: newProduct.price,
        quantity: 1,
        total: newProduct.price
      };
      setSelectedProducts([...selectedProducts, customItem]);
      setNewProduct({ name: '', price: 0, description: '' });
      setShowAddProduct(false);
    }
  };

  const updateProductQuantity = (id: string, quantity: number) => {
    setSelectedProducts(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, quantity, total: item.price * quantity }
          : item
      )
    );
  };

  const removeProduct = (id: string) => {
    setSelectedProducts(prev => prev.filter(item => item.id !== id));
  };

  const totalValue = selectedProducts.reduce((sum, item) => sum + item.total, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Criar Novo Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Nome do Cliente *</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Digite o nome do cliente"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, company: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.fantasy_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Hora</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observation">Observação</Label>
            <Textarea
              id="observation"
              value={formData.observation}
              onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
              placeholder="Digite observações sobre este lead..."
              rows={3}
            />
          </div>

          {/* Produtos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Produtos/Serviços</h3>
              <div className="flex gap-2">
                <Select onValueChange={addProductFromInventory}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Adicionar produto do estoque" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span>{product.name} - R$ {Number(product.base_price).toFixed(2)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddProduct(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Produto
                </Button>
              </div>
            </div>

            {/* Produtos Selecionados */}
            {selectedProducts.length > 0 && (
              <div className="space-y-3">
                {selectedProducts.map((item) => (
                  <Card key={item.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-gray-600">R$ {item.price.toFixed(2)} por unidade</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Qtd:</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateProductQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-20"
                            />
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">R$ {item.total.toFixed(2)}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProduct(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-lg">Total:</span>
                      <span className="font-bold text-xl text-blue-600">
                        R$ {totalValue.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Modal Criar Produto Customizado */}
            {showAddProduct && (
              <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Criar Produto/Serviço
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Produto/Serviço</Label>
                      <Input
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        placeholder="Digite o nome"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Preço</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                          placeholder="0,00"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição (opcional)</Label>
                    <Textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      placeholder="Descrição do produto/serviço..."
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" onClick={addCustomProduct}>
                      Adicionar Produto
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddProduct(false)}>
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Criar Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
