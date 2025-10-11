import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SafeSelectItem } from '@/components/ui/safe-select-item';
import { 
  RightDrawerModal,
  ModalSection,
  InfoField
} from '@/components/ui/right-drawer-modal';
import { 
  Save,
  X
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { createSafeSelectItems } from '@/utils/selectValidation';
import { useProject } from '@/contexts/ProjectContext';

interface CreateActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  companies: any[];
  employees: any[];
  initialData?: any;
}

export function CreateActivityModal({
  isOpen,
  onClose,
  onSubmit,
  companies,
  employees,
  initialData
}: CreateActivityModalProps) {
  const { state } = useProject();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    priority: 'medium',
    responsibleId: '',
    companyId: '',
    projectId: '',
    workGroup: '',
    department: '',
    type: 'task'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form with initial data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        date: initialData.date || initialData.due_date ? new Date(initialData.due_date || initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        priority: initialData.priority || 'medium',
        responsibleId: initialData.responsibleId || initialData.responsible_id || '',
        companyId: initialData.companyId || initialData.company_id || '',
        projectId: initialData.projectId || initialData.project_id || '',
        workGroup: initialData.workGroup || initialData.work_group || '',
        department: initialData.department || '',
        type: initialData.type || 'task'
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica - apenas título é obrigatório
    if (!formData.title.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O título da atividade é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Se não houver responsável selecionado, usar o primeiro funcionário disponível ou deixar vazio
      const activityData = {
        ...formData,
        responsibleId: formData.responsibleId || (employees.length > 0 ? employees[0].id : '')
      };

      await onSubmit(activityData);
      
      // Reset do formulário apenas se não for edição
      if (!initialData) {
        setFormData({
          title: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          priority: 'medium',
          responsibleId: '',
          companyId: '',
          projectId: '',
          workGroup: '',
          department: '',
          type: 'task'
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar atividade:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create safe select items with enhanced validation
  const employeeItems = createSafeSelectItems(
    (employees || []).filter(employee => employee && employee.id && employee.name),
    (employee) => employee.id,
    (employee) => employee.name,
    'employee'
  );
    
  const projectItems = createSafeSelectItems(
    (state.projects || []).filter(project => project && project.id && project.name),
    (project) => project.id,
    (project) => project.name,
    'project'
  );
    
  const workGroupItems = createSafeSelectItems(
    state.workGroups || [],
    (group) => group,
    (group) => group,
    'workgroup'
  );

  const departmentItems = createSafeSelectItems(
    state.departments || [],
    (dept) => dept,
    (dept) => dept,
    'department'
  );
    
  const companyItems = createSafeSelectItems(
    (companies || []).filter(company => company && company.id && (company.fantasyName || company.corporateName)),
    (company) => company.id,
    (company) => company.fantasyName || company.corporateName,
    'company'
  );


  return (
    <RightDrawerModal
      open={isOpen}
      onClose={onClose}
      title={initialData ? "Editar Atividade" : "Criar Nova Atividade"}
      id={`ID #${initialData?.id?.slice(-6) || 'NEW'}`}
      actions={[
        {
          label: "Cancelar",
          variant: "outline",
          onClick: onClose,
          icon: <X className="h-4 w-4" />
        },
        {
          label: initialData ? "Salvar Alterações" : "Criar Atividade",
          variant: "primary",
          onClick: handleSubmit,
          disabled: isSubmitting,
          icon: <Save className="h-4 w-4" />
        }
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <ModalSection title="Informações Básicas">
          <div className="space-y-5">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-gray-600 mb-2 block">
                Título da Atividade*
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Digite o título da atividade"
                className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-600 mb-2 block">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva os detalhes da atividade..."
                rows={3}
                className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </ModalSection>

        {/* Date and Priority */}
        <ModalSection title="Data e Prioridade">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="date" className="text-sm font-medium text-gray-600 mb-2 block">
                Data
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="priority" className="text-sm font-medium text-gray-600 mb-2 block">
                Prioridade
              </Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SafeSelectItem value="low">Baixa</SafeSelectItem>
                  <SafeSelectItem value="medium">Média</SafeSelectItem>
                  <SafeSelectItem value="high">Alta</SafeSelectItem>
                  <SafeSelectItem value="urgent">Urgente</SafeSelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </ModalSection>

        {/* Type and Responsible */}
        <ModalSection title="Tipo e Responsável">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="type" className="text-sm font-medium text-gray-600 mb-2 block">
                Tipo
              </Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SafeSelectItem value="task">Tarefa</SafeSelectItem>
                  <SafeSelectItem value="meeting">Reunião</SafeSelectItem>
                  <SafeSelectItem value="call">Ligação</SafeSelectItem>
                  <SafeSelectItem value="email">Email</SafeSelectItem>
                  <SafeSelectItem value="other">Outro</SafeSelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="responsibleId" className="text-sm font-medium text-gray-600 mb-2 block">
                Responsável
              </Label>
              <Select value={formData.responsibleId || 'no-responsible'} onValueChange={(value) => setFormData({ ...formData, responsibleId: value === 'no-responsible' ? '' : value })}>
                <SelectTrigger className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  <SelectValue placeholder="Selecionar responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SafeSelectItem value="no-responsible">Selecionar responsável</SafeSelectItem>
                  {employeeItems.map((item) => (
                    <SafeSelectItem key={item.key} value={item.value}>
                      {item.label}
                    </SafeSelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </ModalSection>

        {/* Project and Company */}
        <ModalSection title="Projeto e Empresa">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="projectId" className="text-sm font-medium text-gray-600 mb-2 block">
                Projeto
              </Label>
              <Select value={formData.projectId || 'no-project'} onValueChange={(value) => setFormData({ ...formData, projectId: value === 'no-project' ? '' : value })}>
                <SelectTrigger className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  <SelectValue placeholder="Selecionar projeto (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SafeSelectItem value="no-project">Sem projeto</SafeSelectItem>
                  {projectItems.map((item) => (
                    <SafeSelectItem key={item.key} value={item.value}>
                      {item.label}
                    </SafeSelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="companyId" className="text-sm font-medium text-gray-600 mb-2 block">
                Empresa
              </Label>
              <Select value={formData.companyId || 'no-company'} onValueChange={(value) => setFormData({ ...formData, companyId: value === 'no-company' ? '' : value })}>
                <SelectTrigger className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  <SelectValue placeholder="Selecionar empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SafeSelectItem value="no-company">Nenhuma empresa</SafeSelectItem>
                  {companyItems.map((item) => (
                    <SafeSelectItem key={item.key} value={item.value}>
                      {item.label}
                    </SafeSelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </ModalSection>

        {/* Work Group and Department */}
        <ModalSection title="Grupo de Trabalho e Setor">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="workGroup" className="text-sm font-medium text-gray-600 mb-2 block">
                Grupo de Trabalho
              </Label>
              <Select value={formData.workGroup || 'no-group'} onValueChange={(value) => setFormData({ ...formData, workGroup: value === 'no-group' ? '' : value })}>
                <SelectTrigger className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  <SelectValue placeholder="Selecionar grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SafeSelectItem value="no-group">Nenhum grupo</SafeSelectItem>
                  {workGroupItems.map((item) => (
                    <SafeSelectItem key={item.key} value={item.value}>
                      {item.label}
                    </SafeSelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="department" className="text-sm font-medium text-gray-600 mb-2 block">
                Setor
              </Label>
              <Select value={formData.department || 'no-department'} onValueChange={(value) => setFormData({ ...formData, department: value === 'no-department' ? '' : value })}>
                <SelectTrigger className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  <SelectValue placeholder="Selecionar setor" />
                </SelectTrigger>
                <SelectContent>
                  <SafeSelectItem value="no-department">Nenhum setor</SafeSelectItem>
                  {departmentItems.map((item) => (
                    <SafeSelectItem key={item.key} value={item.value}>
                      {item.label}
                    </SafeSelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </ModalSection>
      </form>
    </RightDrawerModal>
  );
}
