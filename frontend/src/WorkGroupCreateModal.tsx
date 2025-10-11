import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Users } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { filterValidStringArray } from '@/utils/selectValidation';
import { toast } from '@/hooks/use-toast';

interface WorkGroupCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (workGroupData: any) => void;
}

const WorkGroupCreateModal = ({ isOpen, onClose, onSubmit }: WorkGroupCreateModalProps) => {
  const { state } = useProject();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    photo: '',
    color: '#3B82F6',
    collaborators: [] as string[],
    department: ''
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colors = [
    { name: 'Azul', value: '#3B82F6' },
    { name: 'Verde', value: '#10B981' },
    { name: 'Amarelo', value: '#F59E0B' },
    { name: 'Vermelho', value: '#EF4444' },
    { name: 'Roxo', value: '#8B5CF6' },
    { name: 'Rosa', value: '#EC4899' },
    { name: 'Cinza', value: '#6B7280' }
  ];

  // Mock collaborators - in real app, this would come from API
  const mockCollaborators = [
    'Ana Silva',
    'Carlos Lima',
    'Maria Santos',
    'João Costa',
    'Paulo Oliveira',
    'Sandra Ferreira',
    'Lucas Mendes',
    'Roberto Dias',
    'Juliana Costa'
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "O arquivo deve ter no máximo 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      
      // Create object URL for preview
      const imageUrl = URL.createObjectURL(file);
      
      setFormData(prev => ({
        ...prev,
        photo: imageUrl
      }));

      toast({
        title: "Sucesso",
        description: "Imagem carregada com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload da imagem",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      name: '',
      description: '',
      photo: '',
      color: '#3B82F6',
      collaborators: [],
      department: ''
    });
    onClose();
  };

  const handleCollaboratorToggle = (collaborator: string) => {
    setFormData(prev => ({
      ...prev,
      collaborators: prev.collaborators.includes(collaborator)
        ? prev.collaborators.filter(c => c !== collaborator)
        : [...prev.collaborators, collaborator]
    }));
  };

  const handleRemoveCollaborator = (collaborator: string) => {
    setFormData(prev => ({
      ...prev,
      collaborators: prev.collaborators.filter(c => c !== collaborator)
    }));
  };

  // Use utility function for filtering departments
  const validDepartments = filterValidStringArray(state.departments || []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-black" />
            Criar Grupo de Trabalho
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome do Grupo */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Grupo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o nome do grupo"
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o objetivo e função do grupo"
              rows={3}
            />
          </div>

          {/* Foto do Grupo */}
          <div className="space-y-2">
            <Label>Foto do Grupo</Label>
            {formData.photo ? (
              <div className="flex items-center gap-3">
                <img
                  src={formData.photo}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}
                >
                  Remover
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Input
                  value={formData.photo}
                  onChange={(e) => setFormData(prev => ({ ...prev, photo: e.target.value }))}
                  placeholder="URL da foto ou use o upload"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Carregando...' : 'Upload'}
                </Button>
              </div>
            )}
          </div>

          {/* Cor do Grupo */}
          <div className="space-y-2">
            <Label>Cor do Grupo</Label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === color.value ? 'border-gray-400' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: formData.color }}
              />
              Cor selecionada
            </div>
          </div>

          {/* Setor (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="department">Setor (opcional)</Label>
            <Select value={formData.department || 'no-department'} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value === 'no-department' ? '' : value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-department">Nenhum setor</SelectItem>
                {validDepartments.map((dept) => (
                  <SelectItem key={`modal-department-${dept}`} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Colaboradores Selecionados */}
          {formData.collaborators.length > 0 && (
            <div className="space-y-2">
              <Label>Colaboradores Selecionados ({formData.collaborators.length})</Label>
              <div className="flex flex-wrap gap-2">
                {formData.collaborators.map((collaborator) => (
                  <Badge key={collaborator} variant="secondary" className="flex items-center gap-1">
                    {collaborator}
                    <button
                      type="button"
                      onClick={() => handleRemoveCollaborator(collaborator)}
                      className="hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Selecionar Colaboradores */}
          <div className="space-y-2">
            <Label>Selecionar Colaboradores</Label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-lg p-3">
              {mockCollaborators.map((collaborator) => (
                <label key={collaborator} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.collaborators.includes(collaborator)}
                    onChange={() => handleCollaboratorToggle(collaborator)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{collaborator}</span>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-black hover:bg-gray-800 text-white">
              Criar Grupo de Trabalho
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WorkGroupCreateModal;
