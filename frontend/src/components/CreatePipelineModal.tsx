
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Settings } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';

interface CreatePipelineModalProps {
  open: boolean;
  onClose: () => void;
  onPipelineCreated: (pipeline: any) => void;
}

interface Stage {
  id: string;
  name: string;
  color: string;
}

export function CreatePipelineModal({ open, onClose, onPipelineCreated }: CreatePipelineModalProps) {
  const { products } = useProducts();
  
  const [formData, setFormData] = useState({
    name: '',
    productId: '',
    description: ''
  });

  const [stages, setStages] = useState<Stage[]>([
    { id: '1', name: 'Contato Inicial', color: '#3b82f6' },
    { id: '2', name: 'Qualificação', color: '#8b5cf6' },
    { id: '3', name: 'Proposta', color: '#f59e0b' },
    { id: '4', name: 'Negociação', color: '#10b981' }
  ]);

  const [newStageName, setNewStageName] = useState('');

  const colorOptions = [
    { value: '#3b82f6', label: 'Azul' },
    { value: '#8b5cf6', label: 'Roxo' },
    { value: '#f59e0b', label: 'Amarelo' },
    { value: '#10b981', label: 'Verde' },
    { value: '#ef4444', label: 'Vermelho' },
    { value: '#f97316', label: 'Laranja' },
    { value: '#06b6d4', label: 'Ciano' },
    { value: '#84cc16', label: 'Lima' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || stages.length === 0) {
      return;
    }

    const pipeline = {
      id: Date.now().toString(),
      name: formData.name,
      productId: formData.productId,
      description: formData.description,
      stages: stages,
      createdAt: new Date().toISOString()
    };

    onPipelineCreated(pipeline);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      productId: '',
      description: ''
    });
    setStages([
      { id: '1', name: 'Contato Inicial', color: '#3b82f6' },
      { id: '2', name: 'Qualificação', color: '#8b5cf6' },
      { id: '3', name: 'Proposta', color: '#f59e0b' },
      { id: '4', name: 'Negociação', color: '#10b981' }
    ]);
    setNewStageName('');
  };

  const addStage = () => {
    if (newStageName.trim()) {
      const newStage: Stage = {
        id: (stages.length + 1).toString(),
        name: newStageName,
        color: colorOptions[stages.length % colorOptions.length].value
      };
      setStages([...stages, newStage]);
      setNewStageName('');
    }
  };

  const removeStage = (id: string) => {
    setStages(stages.filter(stage => stage.id !== id));
  };

  const updateStageColor = (id: string, color: string) => {
    setStages(stages.map(stage => 
      stage.id === id ? { ...stage, color } : stage
    ));
  };

  const selectedProduct = products.find(p => p.id === formData.productId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Criar Novo Pipeline
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Pipeline *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Pipeline de Vendas B2B"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product">Produto Relacionado (opcional)</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, productId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - R$ {Number(product.base_price).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProduct && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <h4 className="font-medium text-blue-900">Produto Selecionado:</h4>
                  <p className="text-blue-800">{selectedProduct.name}</p>
                  <p className="text-sm text-blue-600">R$ {Number(selectedProduct.base_price).toFixed(2)}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Etapas do Pipeline */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Etapas do Pipeline</h3>
              <Badge variant="secondary" className="bg-gray-100">
                {stages.length} etapas
              </Badge>
            </div>

            {/* Etapas Existentes */}
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {stages.map((stage, index) => (
                <Card key={stage.id} className="border-l-4" style={{ borderLeftColor: stage.color }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          <span className="font-medium">{stage.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select onValueChange={(color) => updateStageColor(stage.id, color)}>
                          <SelectTrigger className="w-24 h-8">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: stage.color }}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {colorOptions.map((color) => (
                              <SelectItem key={color.value} value={color.value}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: color.value }}
                                  />
                                  <span>{color.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {stages.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStage(stage.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Adicionar Nova Etapa */}
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Input
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    placeholder="Nome da nova etapa"
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && addStage()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addStage}
                    disabled={!newStageName.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview do Pipeline */}
          {formData.name && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <h4 className="font-medium text-green-900 mb-2">Preview do Pipeline:</h4>
                <div className="flex items-center gap-2 flex-wrap">
                  {stages.map((stage, index) => (
                    <div key={stage.id} className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className="text-white"
                        style={{ backgroundColor: stage.color }}
                      >
                        {stage.name}
                      </Badge>
                      {index < stages.length - 1 && (
                        <span className="text-green-600">→</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700"
              disabled={!formData.name.trim() || stages.length === 0}
            >
              Criar Pipeline
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
