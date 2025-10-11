import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface ProjectEditFormProps {
  project: any;
  companies?: any[];
  employees?: any[];
  onSubmit: (formData: any) => void;
  onCancel: () => void;
}

const ProjectEditForm = ({ project, companies = [], employees = [], onSubmit, onCancel }: ProjectEditFormProps) => {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'planning',
    priority: project?.priority || 'medium',
    start_date: project?.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
    due_date: project?.due_date ? new Date(project.due_date).toISOString().split('T')[0] : '',
    budget: project?.budget || '',
    company_id: project?.company_id || '',
    responsible_id: project?.responsible_id || '',
    tags: project?.tags || [],
    notes: project?.notes || '',
    progress: project?.progress || 0
  });

  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
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
    
    if (!formData.name?.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Nome do projeto é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar dados com validação rigorosa
      const projectData = {
        ...formData,
        // Validar progresso
        progress: formData.progress && !isNaN(parseInt(formData.progress.toString())) ? parseInt(formData.progress.toString()) : 0,
        // Validar orçamento
        budget: formData.budget && formData.budget !== '' && !isNaN(parseFloat(formData.budget.toString())) ? parseFloat(formData.budget.toString()) : undefined,
        // Garantir que campos vazios sejam enviados como string vazia para serem tratados no backend
        company_id: formData.company_id || '',
        responsible_id: formData.responsible_id || '',
        tags: Array.isArray(formData.tags) ? formData.tags : [],
        notes: formData.notes || '',
        // Garantir que datas estejam no formato correto
        start_date: formData.start_date || '',
        due_date: formData.due_date || ''
      };

      console.log('🔍 [PROJECT_FORM] Dados do formulário preparados:', projectData);

      onSubmit(projectData);
    } catch (error: any) {
      console.error('❌ [PROJECT_FORM] Erro ao preparar dados:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar projeto",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create safe select items
  const companyItems = companies
    .filter(company => company && company.id && (company.fantasyName || company.cnpj))
    .map(company => ({
      value: company.id,
      label: `${company.fantasyName || company.company_name || 'Empresa'} - ${company.cnpj || 'N/A'}`
    }));

  const employeeItems = employees
    .filter(employee => employee && employee.id && employee.name)
    .map(employee => ({
      value: employee.id,
      label: employee.name
    }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-semibold text-gray-800">
          Nome do Projeto *
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Digite o nome do projeto"
          className="w-full px-4 py-3 text-gray-900 placeholder-gray-400 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200"
          required
        />
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-semibold text-gray-800">
          Descrição
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descreva o projeto"
          rows={3}
          className="w-full px-4 py-3 text-gray-900 placeholder-gray-400 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200 resize-none"
        />
      </div>

      {/* Status e Prioridade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status" className="text-sm font-semibold text-gray-800">
            Status
          </Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger className="w-full px-4 py-3 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200">
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planning">Planejamento</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="on_hold">Pausado</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority" className="text-sm font-semibold text-gray-800">
            Prioridade
          </Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger className="w-full px-4 py-3 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200">
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
          <Label htmlFor="start_date" className="text-sm font-semibold text-gray-800">
            Data de Início
          </Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="w-full px-4 py-3 text-gray-900 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_date" className="text-sm font-semibold text-gray-800">
            Data de Vencimento
          </Label>
          <Input
            id="due_date"
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            className="w-full px-4 py-3 text-gray-900 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200"
          />
        </div>
      </div>

      {/* Orçamento e Progresso */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budget" className="text-sm font-semibold text-gray-800">
            Orçamento (R$)
          </Label>
          <Input
            id="budget"
            type="number"
            step="0.01"
            min="0"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            placeholder="0.00"
            className="w-full px-4 py-3 text-gray-900 placeholder-gray-400 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="progress" className="text-sm font-semibold text-gray-800">
            Progresso (%)
          </Label>
          <Input
            id="progress"
            type="number"
            min="0"
            max="100"
            value={formData.progress}
            onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-3 text-gray-900 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200"
          />
        </div>
      </div>

      {/* Empresa e Responsável */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company_id" className="text-sm font-semibold text-gray-800">
            Empresa
          </Label>
          <Select value={formData.company_id} onValueChange={(value) => setFormData({ ...formData, company_id: value })}>
            <SelectTrigger className="w-full px-4 py-3 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200">
              <SelectValue placeholder="Selecione a empresa" />
            </SelectTrigger>
            <SelectContent>
              {companyItems.map((company) => (
                <SelectItem key={company.value} value={company.value}>
                  {company.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsible_id" className="text-sm font-semibold text-gray-800">
            Responsável
          </Label>
          <Select value={formData.responsible_id} onValueChange={(value) => setFormData({ ...formData, responsible_id: value })}>
            <SelectTrigger className="w-full px-4 py-3 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200">
              <SelectValue placeholder="Selecione o responsável" />
            </SelectTrigger>
            <SelectContent>
              {employeeItems.map((employee) => (
                <SelectItem key={employee.value} value={employee.value}>
                  {employee.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <Label htmlFor="tags" className="text-sm font-semibold text-gray-800">
          Tags
        </Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite uma tag e pressione Enter"
            className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-400 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200"
          />
          <Button
            type="button"
            onClick={handleAddTag}
            variant="outline"
            className="px-4 py-3 border-gray-200 hover:bg-gray-50 rounded-xl transition-all duration-200"
          >
            Adicionar
          </Button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="px-3 py-1 rounded-full">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Notas */}
      <div className="space-y-2">
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
          onClick={onCancel}
          className="h-12 px-8 border-gray-200 hover:bg-gray-50 rounded-xl transition-all duration-200 font-medium"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="h-12 px-8 bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-900 hover:to-blue-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Atualizando...' : 'Atualizar Projeto'}
        </Button>
      </div>
    </form>
  );
};

export default ProjectEditForm;
