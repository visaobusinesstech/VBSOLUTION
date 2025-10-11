
import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Upload, Plus, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  currency: string;
  image_url?: string;
  type: string;
  category?: string;
  unit: string;
}

interface ProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProductsModal({
  isOpen,
  onClose
}: ProductsModalProps) {
  const [selectedStage, setSelectedStage] = useState('produtos');
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Form states for creating new product
  const [productName, setProductName] = useState('');
  const [value, setValue] = useState('');
  const [currency, setCurrency] = useState('BRL');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageUploading, setImageUploading] = useState(false);

  const stages = ['Produtos'];

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSaveImage = async () => {
    if (!imageFile) {
      toast.error('Selecione uma imagem primeiro');
      return;
    }

    try {
      setImageUploading(true);
      const uploadedUrl = await uploadImage(imageFile);
      if (uploadedUrl) {
        setImageUrl(uploadedUrl);
        toast.success('Imagem salva com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao salvar imagem');
    } finally {
      setImageUploading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!productName.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }

    try {
      setLoading(true);
      let finalImageUrl = imageUrl;
      
      if (imageFile && !imageUrl) {
        finalImageUrl = await uploadImage(imageFile) || '';
      }

      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: productName,
          description: description || null,
          base_price: parseFloat(value) || 0,
          currency: currency,
          image_url: finalImageUrl,
          type: 'product',
          unit: 'unidade'
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Produto criado com sucesso!');

      // Reset form
      setProductName('');
      setValue('');
      setDescription('');
      setImageFile(null);
      setImageUrl('');
      setCurrency('BRL');

      // Refresh products list
      await fetchProducts();

      // Switch back to select mode
      setMode('select');
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Erro ao criar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = () => {
    if (!selectedProduct) {
      toast.error('Selecione um produto');
      return;
    }
    const product = products.find(p => p.id === selectedProduct);
    if (product) {
      toast.success(`Produto "${product.name}" selecionado!`);
      onClose();
    }
  };

  const renderSelectMode = () => (
    <div className="p-6 overflow-y-auto max-h-[60vh]">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Selecionar Produto</h3>
          <Button
            onClick={() => setMode('create')}
            className="flex items-center gap-2 text-sm"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            Criar Novo
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-500">Carregando produtos...</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="product-select" className="text-sm font-medium text-gray-700">
                Produtos Disponíveis
              </Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{product.name}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {product.currency === 'BRL' ? 'R$' : product.currency} {product.base_price.toFixed(2)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProduct && (
              <div className="p-4 bg-gray-50 rounded-lg">
                {(() => {
                  const product = products.find(p => p.id === selectedProduct);
                  if (!product) return null;
                  return (
                    <div className="space-y-2">
                      <h4 className="font-medium">{product.name}</h4>
                      {product.description && <p className="text-sm text-gray-600">{product.description}</p>}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">
                          {product.currency === 'BRL' ? 'R$' : product.currency} {product.base_price.toFixed(2)}
                        </span>
                        <span className="text-gray-500">Unidade: {product.unit}</span>
                        {product.category && <span className="text-gray-500">Categoria: {product.category}</span>}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  const renderCreateMode = () => (
    <div className="p-6 overflow-y-auto max-h-[60vh]">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Criar Novo Produto</h3>
          <Button onClick={() => setMode('select')} variant="outline" className="text-sm">
            Voltar
          </Button>
        </div>

        {/* Nome do Produto */}
        <div className="space-y-2">
          <Label htmlFor="product-name" className="text-sm font-medium text-gray-700">
            Nome do Produto *
          </Label>
          <Input
            id="product-name"
            placeholder="Digite o nome do produto"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full"
            required
          />
        </div>

        {/* Valor e Moeda */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Valor e Moeda</Label>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="0,00"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full"
                type="number"
                step="0.01"
              />
            </div>
            <div className="w-40">
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">Real (R$)</SelectItem>
                  <SelectItem value="USD">Dólar (US$)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Foto do Produto */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-700">Foto do Produto</Label>
          
          {imageUrl ? (
            <div className="relative inline-block">
              <img
                src={imageUrl}
                alt="Produto"
                className="w-32 h-32 object-cover rounded-lg border border-gray-200"
              />
              <Button
                type="button"
                onClick={() => {
                  setImageUrl('');
                  setImageFile(null);
                }}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 bg-red-500 hover:bg-red-600 text-white"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button type="button" variant="outline" className="text-sm cursor-pointer">
                      Selecionar arquivo
                    </Button>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    PNG, JPG ou JPEG até 5MB
                  </p>
                  {imageFile && (
                    <p className="text-xs text-green-600 mt-1">
                      Arquivo selecionado: {imageFile.name}
                    </p>
                  )}
                </div>
              </div>
              
              {imageFile && (
                <div className="text-center">
                  <Button
                    onClick={handleSaveImage}
                    disabled={imageUploading}
                    className="bg-black hover:bg-gray-800 text-white px-6 py-2"
                  >
                    {imageUploading ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-gray-700">
            Descrição
          </Label>
          <Textarea
            id="description"
            placeholder="Descreva as características do produto"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full min-h-[120px] resize-none"
          />
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-white p-0 overflow-hidden rounded-lg">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onClose} className="p-1 h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-medium text-gray-900">Produtos</h2>
              <span className="text-sm text-gray-500">
                {mode === 'select' ? 'Selecionar' : 'Criar'} Produto
              </span>
            </div>
          </div>

          {/* Stage selector */}
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2">
              {stages.map((stage) => (
                <Button
                  key={stage}
                  variant="ghost"
                  className="px-4 py-2 text-sm rounded bg-gray-200 text-gray-900"
                >
                  {stage}
                </Button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4">
            <div className="flex items-center gap-6 border-b">
              <button className="px-0 py-3 text-sm border-b-2 border-blue-500 text-blue-600 font-medium">
                Produtos
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {mode === 'select' ? renderSelectMode() : renderCreateMode()}

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center gap-3 border-t">
          {mode === 'select' ? (
            <Button
              onClick={handleSelectProduct}
              disabled={!selectedProduct || loading}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 text-sm"
            >
              <Check className="h-4 w-4 mr-2" />
              SELECIONAR
            </Button>
          ) : (
            <Button
              onClick={handleCreateProduct}
              disabled={!productName.trim() || loading}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 text-sm"
            >
              {loading ? 'SALVANDO...' : 'SALVAR'}
            </Button>
          )}
          <Button variant="outline" onClick={onClose} className="px-6 py-2 text-sm">
            CANCELAR
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
