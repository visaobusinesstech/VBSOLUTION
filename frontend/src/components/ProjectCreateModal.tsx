
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
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
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
  isOpen?: boolean;
  onSubmit: (projectData: ProjectData) => Promise<any>;
  onClose: () => void;
  companies?: any[];
  employees?: any[];
}

const ProjectCreateModal = ({ isOpen = true, onSubmit, onClose, companies = [], employees = [] }: ProjectCreateModalProps) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<ProjectData>({
    name: '',
    description: '',
    status: 'planning',
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

    if (!formData.name?.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Nome do projeto é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!formData.description?.trim()) {
      toast({
        title: "Campo obrigatório", 
        description: "Descrição do projeto é obrigatória",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar dados do projeto com todos os campos necessários
      const projectData = {
        ...formData,
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
        status: 'planning',
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

    } catch (error: any) {
      console.error('Erro ao criar projeto:', error);
      toast({
        title: "Erro ao criar projeto",
        description: error?.message || "Verifique os dados e tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header minimalista */}
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Novo Projeto</h2>
              <p className="text-sm text-gray-500 mt-1">Crie um novo projeto para sua equipe</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-105"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="p-8 pb-12">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Nome do Projeto */}
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-800">
                  Nome do Projeto *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Digite o nome do projeto"
                  className="w-full h-12 px-4 text-gray-900 placeholder-gray-400 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200"
                  required
                />
              </div>

              {/* Descrição */}
              <div className="space-y-3">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-800">
                  Descrição *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o projeto"
                  rows={4}
                  className="w-full px-4 py-3 text-gray-900 placeholder-gray-400 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200 resize-none"
                  required
                />
              </div>

              {/* Status e Prioridade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="status" className="text-sm font-semibold text-gray-800">
              Status
            </Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
              <SelectTrigger className="w-full h-12 px-4 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-200 shadow-lg">
                <SelectItem value="planning" className="rounded-lg">Planejamento</SelectItem>
                <SelectItem value="active" className="rounded-lg">Ativo</SelectItem>
                <SelectItem value="on_hold" className="rounded-lg">Em Pausa</SelectItem>
                <SelectItem value="completed" className="rounded-lg">Concluído</SelectItem>
                <SelectItem value="cancelled" className="rounded-lg">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="priority" className="text-sm font-semibold text-gray-800">
              Prioridade
            </Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as any })}>
              <SelectTrigger className="w-full h-12 px-4 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200">
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-200 shadow-lg">
                <SelectItem value="low" className="rounded-lg">Baixa</SelectItem>
                <SelectItem value="medium" className="rounded-lg">Média</SelectItem>
                <SelectItem value="high" className="rounded-lg">Alta</SelectItem>
                <SelectItem value="urgent" className="rounded-lg">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

              {/* Datas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="start_date" className="text-sm font-semibold text-gray-800">
              Data de Início
            </Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full h-12 px-4 text-gray-900 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="due_date" className="text-sm font-semibold text-gray-800">
              Data de Vencimento
            </Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full h-12 px-4 text-gray-900 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200"
            />
          </div>
        </div>

              {/* Orçamento */}
              <div className="space-y-3">
          <Label htmlFor="budget" className="text-sm font-semibold text-gray-800">
            Orçamento
          </Label>
          <Input
            id="budget"
            type="number"
            value={formData.budget || ''}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="0.00"
            className="w-full h-12 px-4 text-gray-900 placeholder-gray-400 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200"
          />
        </div>

              {/* Tags */}
              <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-800">Tags</Label>
          <div className="flex gap-3">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite uma tag e pressione Enter"
              className="flex-1 h-12 px-4 text-gray-900 placeholder-gray-400 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200"
            />
            <Button type="button" onClick={handleAddTag} variant="outline" className="h-12 px-6 border-gray-200 hover:bg-gray-50 rounded-xl transition-all duration-200">
              Adicionar
            </Button>
          </div>
          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 border-blue-200 rounded-full">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-600 transition-colors duration-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

              {/* Notas */}
              <div className="space-y-3">
          <Label htmlFor="notes" className="text-sm font-semibold text-gray-800">
            Notas
          </Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Adicione notas sobre o projeto"
            rows={4}
            className="w-full px-4 py-3 text-gray-900 placeholder-gray-400 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200 resize-none"
          />
        </div>

              {/* Botões */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="h-12 px-8 border-gray-200 hover:bg-gray-50 rounded-xl transition-all duration-200 font-medium"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="h-12 px-8 bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-900 hover:to-blue-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Criando...' : 'Criar Projeto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCreateModal;

