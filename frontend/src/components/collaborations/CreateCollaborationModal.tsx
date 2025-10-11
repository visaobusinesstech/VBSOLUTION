import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Calendar, DollarSign, Users, Building2, User, Target, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CreateCollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCollaborationCreated: () => void;
}

const CreateCollaborationModal: React.FC<CreateCollaborationModalProps> = ({
  isOpen,
  onClose,
  onCollaborationCreated
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    partner_company: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    collaboration_type: '',
    status: 'planning',
    priority: 'medium',
    category: '',
    start_date: '',
    expected_end_date: '',
    budget_estimate: '',
    notes: '',
    objectives: [] as string[],
    deliverables: [] as string[]
  });

  const [currentObjective, setCurrentObjective] = useState('');
  const [currentDeliverable, setCurrentDeliverable] = useState('');

  const collaborationTypes = [
    { value: 'strategic_partnership', label: 'Parceria Estratégica' },
    { value: 'joint_venture', label: 'Joint Venture' },
    { value: 'supplier_collaboration', label: 'Colaboração com Fornecedor' },
    { value: 'client_project', label: 'Projeto com Cliente' },
    { value: 'technology_partnership', label: 'Parceria Tecnológica' },
    { value: 'marketing_collaboration', label: 'Colaboração de Marketing' },
    { value: 'research_development', label: 'Pesquisa & Desenvolvimento' },
    { value: 'distribution_partnership', label: 'Parceria de Distribuição' },
    { value: 'licensing_agreement', label: 'Acordo de Licenciamento' },
    { value: 'other', label: 'Outros' }
  ];

  const statusOptions = [
    { value: 'planning', label: 'Planejamento' },
    { value: 'active', label: 'Em Andamento' },
    { value: 'on_hold', label: 'Pausado' },
    { value: 'completed', label: 'Concluído' },
    { value: 'cancelled', label: 'Cancelado' }
  ];

  const priorityOptions = [
    { value: 'high', label: 'Alta' },
    { value: 'medium', label: 'Média' },
    { value: 'low', label: 'Baixa' }
  ];

  const categoryOptions = [
    { value: 'development', label: 'Desenvolvimento' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'design', label: 'Design' },
    { value: 'research', label: 'Pesquisa' },
    { value: 'sales', label: 'Vendas' },
    { value: 'technology', label: 'Tecnologia' },
    { value: 'consulting', label: 'Consultoria' },
    { value: 'training', label: 'Treinamento' },
    { value: 'other', label: 'Outros' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addObjective = () => {
    if (currentObjective.trim() && !formData.objectives.includes(currentObjective.trim())) {
      setFormData(prev => ({
        ...prev,
        objectives: [...prev.objectives, currentObjective.trim()]
      }));
      setCurrentObjective('');
    }
  };

  const removeObjective = (index: number) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== index)
    }));
  };

  const addDeliverable = () => {
    if (currentDeliverable.trim() && !formData.deliverables.includes(currentDeliverable.trim())) {
      setFormData(prev => ({
        ...prev,
        deliverables: [...prev.deliverables, currentDeliverable.trim()]
      }));
      setCurrentDeliverable('');
    }
  };

  const removeDeliverable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Erro de validação",
        description: "O título da colaboração é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.partner_company.trim()) {
      toast({
        title: "Erro de validação",
        description: "A empresa parceira é obrigatória.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Preparar dados para inserção
      const collaborationData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        partner_company: formData.partner_company.trim(),
        contact_person: formData.contact_person.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        collaboration_type: formData.collaboration_type || null,
        status: formData.status,
        priority: formData.priority,
        category: formData.category || null,
        start_date: formData.start_date || null,
        expected_end_date: formData.expected_end_date || null,
        budget_estimate: formData.budget_estimate ? parseFloat(formData.budget_estimate) : null,
        notes: formData.notes.trim() || null,
        objectives: formData.objectives.length > 0 ? formData.objectives : null,
        deliverables: formData.deliverables.length > 0 ? formData.deliverables : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Inserir no Supabase
      const { data, error } = await supabase
        .from('collaborations')
        .insert([collaborationData])
        .select();

      if (error) {
        console.error('Erro ao criar colaboração:', error);
        toast({
          title: "Erro",
          description: "Erro ao criar colaboração. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Colaboração criada com sucesso!",
      });

      // Limpar formulário
      setFormData({
        title: '',
        description: '',
        partner_company: '',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        collaboration_type: '',
        status: 'planning',
        priority: 'medium',
        category: '',
        start_date: '',
        expected_end_date: '',
        budget_estimate: '',
        notes: '',
        objectives: [],
        deliverables: []
      });

    onCollaborationCreated();
      onClose();

    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar colaboração.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      partner_company: '',
      contact_person: '',
      contact_email: '',
      contact_phone: '',
      collaboration_type: '',
      status: 'planning',
      priority: 'medium',
      category: '',
      start_date: '',
      expected_end_date: '',
      budget_estimate: '',
      notes: '',
      objectives: [],
      deliverables: []
    });
    setCurrentObjective('');
    setCurrentDeliverable('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Users className="h-5 w-5 text-blue-600" />
            Criar Nova Colaboração
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Informações Básicas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Título da Colaboração *
              </Label>
              <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ex: Parceria estratégica para desenvolvimento de produto"
                  className="mt-1"
                required
              />
            </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descreva os detalhes da colaboração..."
                  className="mt-1 min-h-[80px]"
                />
              </div>

              <div>
                <Label htmlFor="partner_company" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Empresa Parceira *
                </Label>
                <Input
                  id="partner_company"
                  value={formData.partner_company}
                  onChange={(e) => handleInputChange('partner_company', e.target.value)}
                  placeholder="Nome da empresa parceira"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="contact_person" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Pessoa de Contato
                </Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => handleInputChange('contact_person', e.target.value)}
                  placeholder="Nome do responsável"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="contact_email">E-mail de Contato</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  placeholder="email@empresa.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="contact_phone">Telefone de Contato</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Categorização */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Categorização
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="collaboration_type">Tipo de Colaboração</Label>
                <Select value={formData.collaboration_type} onValueChange={(value) => handleInputChange('collaboration_type', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {collaborationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {priorityOptions.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              </div>
            </div>
          </div>

          {/* Cronograma e Orçamento */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Cronograma e Orçamento
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="start_date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Início
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="expected_end_date" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Previsão de Término
                </Label>
                <Input
                  id="expected_end_date"
                  type="date"
                  value={formData.expected_end_date}
                  onChange={(e) => handleInputChange('expected_end_date', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="budget_estimate" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Estimativa de Orçamento (R$)
                </Label>
                <Input
                  id="budget_estimate"
                  type="number"
                  step="0.01"
                  value={formData.budget_estimate}
                  onChange={(e) => handleInputChange('budget_estimate', e.target.value)}
                  placeholder="0,00"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Objetivos */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Objetivos
            </h3>
            
            <div className="flex gap-2">
              <Input
                value={currentObjective}
                onChange={(e) => setCurrentObjective(e.target.value)}
                placeholder="Adicionar objetivo..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
              />
              <Button type="button" onClick={addObjective} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {formData.objectives.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.objectives.map((objective, index) => (
                  <Badge key={index} variant="secondary" className="pr-1">
                    {objective}
                    <button
                      type="button"
                      onClick={() => removeObjective(index)}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Entregáveis */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Entregáveis Esperados
            </h3>
            
            <div className="flex gap-2">
              <Input
                value={currentDeliverable}
                onChange={(e) => setCurrentDeliverable(e.target.value)}
                placeholder="Adicionar entregável..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDeliverable())}
              />
              <Button type="button" onClick={addDeliverable} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {formData.deliverables.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.deliverables.map((deliverable, index) => (
                  <Badge key={index} variant="secondary" className="pr-1">
                    {deliverable}
                    <button
                      type="button"
                      onClick={() => removeDeliverable(index)}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Observações Adicionais
            </h3>
            
            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Informações adicionais, observações importantes..."
                className="mt-1 min-h-[80px]"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="text-white hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-200"
              style={{ backgroundColor: '#021529' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#031a35';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#021529';
              }}
            >
              {loading ? 'Criando...' : 'Criar Colaboração'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCollaborationModal;
