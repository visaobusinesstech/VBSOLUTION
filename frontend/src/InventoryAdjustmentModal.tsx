import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Settings, Search, Plus, Camera, BarChart3, ChevronDown, Trash2 } from 'lucide-react';
interface InventoryAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}
export function InventoryAdjustmentModal({
  isOpen,
  onClose
}: InventoryAdjustmentModalProps) {
  const [activeTab, setActiveTab] = useState('geral');
  const [adjustmentName, setAdjustmentName] = useState('Ajuste de estoque nº');
  const [currency, setCurrency] = useState('Brazilian Real');
  const [responsiblePerson, setResponsiblePerson] = useState('Visão Business');
  const [productSearch, setProductSearch] = useState('');
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('0');
  const [salePrice, setSalePrice] = useState('0');
  const [quantity, setQuantity] = useState('0');
  const tabs = [{
    id: 'geral',
    label: 'Geral'
  }, {
    id: 'produtos',
    label: 'Produtos'
  }];
  const renderGeralTab = () => <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
      <div className="flex items-center gap-4 mb-6">
        <span className="text-sm text-gray-600">GERAL</span>
        <span className="text-sm text-gray-400">/</span>
        <Button variant="ghost" className="text-sm text-gray-400 px-0">
          cancelar
        </Button>
      </div>

      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="adjustment-name" className="text-sm text-gray-900">Nome</Label>
        <div className="relative">
          <Input id="adjustment-name" value={adjustmentName} onChange={e => setAdjustmentName(e.target.value)} className="pr-8 border-gray-300" />
          <Button variant="ghost" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6">
            <Settings className="h-4 w-4 text-gray-400" />
          </Button>
        </div>
      </div>

      {/* Moeda */}
      <div className="space-y-2">
        <Label className="text-sm text-gray-900">Moeda</Label>
        <div className="relative">
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Brazilian Real">Brazilian Real</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="absolute right-8 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6">
            <Settings className="h-4 w-4 text-gray-400" />
          </Button>
        </div>
      </div>

      {/* Selecionar campo / Criar campo */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" className="text-sm text-gray-600 px-0">
          Selecionar campo
        </Button>
        <Button variant="ghost" className="text-sm text-gray-600 px-0">
          Criar campo
        </Button>
      </div>

      {/* Produtos Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-sm text-gray-600">PRODUTOS</span>
          <span className="text-sm text-gray-400">/</span>
          <Button variant="ghost" className="text-sm text-gray-400 px-0">
            cancelar
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-gray-900">Produtos</Label>
          <div className="relative">
            <Input placeholder="+ adicionar" className="border-gray-300 text-blue-600" readOnly />
            <Button variant="ghost" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6">
              <Settings className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-sm text-gray-600 px-0">
            Selecionar campo
          </Button>
          <Button variant="ghost" className="text-sm text-gray-600 px-0">
            Criar campo
          </Button>
        </div>
      </div>

      {/* Outras informações */}
      <div className="space-y-2">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-sm text-gray-600">OUTRAS INFORMAÇÕES</span>
          <span className="text-sm text-gray-400">/</span>
          <Button variant="ghost" className="text-sm text-gray-400 px-0">
            cancelar
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-gray-900">
            Pessoa responsável
            <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-xs text-gray-600">VB</span>
            </div>
            <span className="text-sm text-gray-900">{responsiblePerson}</span>
            <Button variant="ghost" className="text-xs text-gray-400 px-0">
              ALTERAR
            </Button>
          </div>
          <div className="relative">
            <Button variant="ghost" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6">
              <Settings className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-sm text-gray-600 px-0">
            Selecionar campo
          </Button>
          <Button variant="ghost" className="text-sm text-gray-600 px-0">
            Criar campo
          </Button>
        </div>
      </div>
    </div>;
  const renderProdutosTab = () => <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
      {/* Action Buttons */}
      <div className="flex items-center gap-2 mb-6">
        <Button className="bg-black hover:bg-gray-800 text-white px-4 py-2 text-sm">
          ADICIONAR LINHA
        </Button>
        <Button variant="outline" className="border-gray-300 text-gray-700 px-4 py-2 text-sm">
          CRIAR PRODUTO
        </Button>
        <Button variant="ghost" size="sm" className="p-2">
          <Settings className="h-4 w-4 text-gray-400" />
        </Button>
      </div>

      {/* Product Table Header */}
      <div className="grid grid-cols-12 gap-4 mb-4 text-sm text-gray-600 font-medium">
        <div className="col-span-1 flex items-center">
          <input type="checkbox" className="mr-2" />
          <Settings className="h-4 w-4 text-gray-400" />
        </div>
        <div className="col-span-3">Produto</div>
        <div className="col-span-2">Código de barras</div>
        <div className="col-span-2">Preço de compra</div>
        <div className="col-span-2">Preços de venda</div>
        <div className="col-span-2">Quantidade</div>
      </div>

      {/* Product Input Row */}
      <div className="grid grid-cols-12 gap-4 mb-4 items-center">
        <div className="col-span-1 flex items-center">
          <input type="checkbox" className="mr-2" />
          <span className="text-sm text-gray-600">1.</span>
        </div>
        <div className="col-span-3">
          <div className="relative">
            <Input placeholder="Encontrar ou criar um novo produto" value={productSearch} onChange={e => setProductSearch(e.target.value)} className="pr-16 border-gray-300" />
            <Button variant="ghost" size="sm" className="absolute right-8 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6">
              <Search className="h-4 w-4 text-gray-400" />
            </Button>
            <Button variant="ghost" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6">
              <Camera className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </div>
        <div className="col-span-2">
          <div className="relative">
            <Input placeholder="Encontrar produto por código" value={barcodeSearch} onChange={e => setBarcodeSearch(e.target.value)} className="pr-8 border-gray-300" />
            <Button variant="ghost" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6">
              <BarChart3 className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </div>
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <Input value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} className="border-gray-300 text-center" />
            <span className="text-sm text-gray-600">R$</span>
          </div>
        </div>
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <Input value={salePrice} onChange={e => setSalePrice(e.target.value)} className="border-gray-300 text-center" />
            <span className="text-sm text-gray-600">R$</span>
          </div>
        </div>
        <div className="col-span-2">
          <Input value={quantity} onChange={e => setQuantity(e.target.value)} className="border-gray-300 text-center" />
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" className="text-sm text-gray-600 px-0 flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          EXCLUIR
        </Button>
        <Button variant="ghost" className="text-sm text-gray-600 px-0 flex items-center gap-2">
          
          AÇÕES
        </Button>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" />
          PARA TODOS
        </label>
      </div>

      {/* Total Value */}
      <div className="flex justify-end items-center gap-4 mt-8">
        <span className="text-lg font-medium text-gray-900">Valor total:</span>
        <span className="text-lg font-medium text-gray-900">R$ 0</span>
      </div>
    </div>;
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0 bg-white">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onClose} className="p-1 h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-medium text-gray-900">Criar ajuste de estoque</h2>
              <Select defaultValue="ajuste-estoque">
                <SelectTrigger className="w-48 border-none bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ajuste-estoque">Ajuste de estoque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" className="text-sm text-gray-600">
              Feedback
            </Button>
          </div>

          {/* Tabs */}
          <div className="px-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-auto">
                {tabs.map(tab => <TabsTrigger key={tab.id} value={tab.id} className="px-6 py-3 text-sm border-b-2 border-transparent rounded-none data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent">
                    {tab.label}
                  </TabsTrigger>)}
              </TabsList>
              
              <TabsContent value="geral" className="mt-0">
                {renderGeralTab()}
              </TabsContent>
              
              <TabsContent value="produtos" className="mt-0">
                {renderProdutosTab()}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Panel - Comments */}
        

        {/* Footer */}
        <div className="bg-white px-6 py-4 flex items-center gap-3 border-t">
          <Button className="bg-black hover:bg-gray-800 text-white px-8 py-2 text-sm">
            SALVAR
          </Button>
          <Button variant="outline" className="border-gray-300 text-gray-700 px-8 py-2 text-sm">
            SALVAR E PROCESSAR
          </Button>
          <Button variant="outline" onClick={onClose} className="border-gray-300 text-gray-700 px-8 py-2 text-sm">
            CANCELAR
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
}
