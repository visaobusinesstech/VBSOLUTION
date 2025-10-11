
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Project } from '@/hooks/useProjects';

interface ProjectData {
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date?: string;
  due_date?: string;
  budget?: number;
  company_id?: string;
  tags?: string[];
  notes?: string;
  currency?: string;
  progress?: number;
}

interface ProjectCreateModalProps {
  onSubmit: (projectData: ProjectData) => Promise<any>;
  onClose: () => void;
}

const ProjectCreateModal = ({ onSubmit, onClose }: ProjectCreateModalProps) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<ProjectData>({
    name: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    start_date: '',
    due_date: '',
    budget: undefined,
    company_id: '',
    tags: [],
    notes: '',
    currency: 'BRL',
    progress: 0
  });
  
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dados de exemplo para empresas (serão substituídos por dados reais do Supabase)
  const companies = [
    { id: '1', name: 'TechCorp' },
    { id: '2', name: 'MarketingPro' },
    { id: '3', name: 'SalesForce Inc' },
    { id: '4', name: 'Digital Agency' },
    { id: '5', name: 'ConsultingGroup' }
  ];

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || []
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para criar projetos",
        variant: "destructive"
      });
      return;
    }

    if (!formData.name || !formData.description) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e descrição são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar dados do projeto com todos os campos necessários
      const projectData = {
        ...formData,
        responsible_id: user.id,
        progress: formData.progress || 0,
        currency: formData.currency || 'BRL'
      };

      console.log('ProjectCreateModal - Dados do projeto:', projectData);

      // SALVAR NO SUPABASE usando a prop onSubmit
      const savedProject = await onSubmit(projectData);
      
      console.log('Projeto criado:', savedProject);
      
      toast({
        title: "Projeto criado com sucesso!",
        description: "O projeto foi salvo no Supabase e está disponível na sua conta"
      });

      // Limpar formulário
      setFormData({
        name: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        start_date: '',
        due_date: '',
        budget: undefined,
        company_id: '',
        tags: [],
        notes: '',
        currency: 'BRL',
        progress: 0
      });

      // Fechar modal
      onClose();

    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      toast({
        title: "Erro ao criar projeto",
        description: "Verifique os dados e tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nome do Projeto */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Nome do Projeto *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Digite o nome do projeto"
            className="w-full"
            required
          />
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-gray-700">
            Descrição *
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descreva o projeto"
            rows={3}
            className="w-full"
            required
          />
        </div>

        {/* Status e Prioridade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium text-gray-700">
              Status
            </Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
              Prioridade
            </Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as any })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a prioridade" />
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

        {/* Datas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_date" className="text-sm font-medium text-gray-700">
              Data de Início
            </Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date" className="text-sm font-medium text-gray-700">
              Data de Vencimento
            </Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full"
            />
          </div>
        </div>

        {/* Orçamento */}
        <div className="space-y-2">
          <Label htmlFor="budget" className="text-sm font-medium text-gray-700">
            Orçamento
          </Label>
          <Input
            id="budget"
            type="number"
            value={formData.budget || ''}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="0.00"
            className="w-full"
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Tags</Label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite uma tag e pressione Enter"
              className="flex-1"
            />
            <Button type="button" onClick={handleAddTag} variant="outline">
              Adicionar
            </Button>
          </div>
          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Notas */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
            Notas
          </Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Adicione notas sobre o projeto"
            rows={3}
            className="w-full"
          />
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Criando...' : 'Criar Projeto'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProjectCreateModal;
