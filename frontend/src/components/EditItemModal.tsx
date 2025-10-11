import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save, X } from 'lucide-react';
import { CompanyArea, CompanyRole } from '@/hooks/useCompanySettings';

interface EditItemModalProps {
  item: CompanyArea | CompanyRole;
  itemType: 'area' | 'role';
  onEdit: (id: string, updates: Partial<CompanyArea | CompanyRole>) => Promise<{ success: boolean; error?: Error }>;
  trigger?: React.ReactNode;
}

export function EditItemModal({ item, itemType, onEdit, trigger }: EditItemModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: item.name,
    description: item.description || '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData({
      name: item.name,
      description: item.description || '',
    });
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      const result = await onEdit(item.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
      if (result.success) {
        setOpen(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Editar {itemType === 'area' ? 'Área' : 'Cargo'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nome da {itemType === 'area' ? 'Área' : 'Cargo'} *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={`Digite o nome da ${itemType === 'area' ? 'área' : 'cargo'}`}
              className="h-10 rounded-md border-gray-300 focus:border-primary focus:ring-primary"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Descrição (opcional)
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder={`Descrição da ${itemType === 'area' ? 'área' : 'cargo'}`}
              rows={3}
              className="border-gray-300 focus:border-primary focus:ring-primary"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.name.trim()}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
