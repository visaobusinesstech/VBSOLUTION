
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SafeSelectItem } from '@/components/ui/safe-select-item';
import { toast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';
import { Activity } from '@/hooks/useActivities';
import { createSafeSelectItems } from '@/utils/selectValidation';

interface ActivityFormProps {
  companies: any[];
  employees: any[];
  onSubmit: (formData: any) => void;
  initialData?: Activity;
}

const ActivityForm = ({ companies, employees, onSubmit, initialData }: ActivityFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    responsible_id: '',
    company_id: '',
    type: 'task' as 'task' | 'meeting' | 'call' | 'email' | 'other',
    notes: ''
  });

  // Populate form with initial data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        due_date: initialData.due_date ? new Date(initialData.due_date).toISOString().slice(0, 16) : '',
        priority: initialData.priority || 'medium',
        responsible_id: initialData.responsible_id || '',
        company_id: initialData.company_id || '',
        type: initialData.type || 'task',
        notes: initialData.notes || ''
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.due_date || !formData.responsible_id) {
      toast({
        title: "Erro",
        description: "Título, data de vencimento e responsável são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const activityData = {
      ...formData,
      due_date: new Date(formData.due_date).toISOString(),
    };

    onSubmit(activityData);
  };

  // Create safe select items with enhanced validation
  const companyItems = createSafeSelectItems(
    (companies || []).filter(company => company && company.id && (company.fantasyName || company.cnpj)),
    (company) => company.id,
    (company) => `${company.fantasyName} - ${company.cnpj}`,
    'company'
  );

  const employeeItems = createSafeSelectItems(
    (employees || []).filter(employee => employee && employee.id && employee.name),
    (employee) => employee.id,
    (employee) => `${employee.name} - ${employee.position || 'N/A'}`,
    'employee'
  );

  const selectedCompany = companies.find(c => c.id === formData.company_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Título */}
      <div className="space-y-2">
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Digite o título da atividade"
          required
        />
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descreva a atividade"
          rows={3}
        />
      </div>

      {/* Tipo */}
      <div className="space-y-2">
        <Label htmlFor="type">Tipo *</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as any })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
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

      {/* Data de Vencimento */}
      <div className="space-y-2">
        <Label htmlFor="due_date">Data de Vencimento *</Label>
        <Input
          id="due_date"
          type="datetime-local"
          value={formData.due_date}
          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          required
        />
      </div>

      {/* Prioridade */}
      <div className="space-y-2">
        <Label htmlFor="priority">Prioridade *</Label>
        <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as any })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SafeSelectItem value="low">Baixa</SafeSelectItem>
            <SafeSelectItem value="medium">Média</SafeSelectItem>
            <SafeSelectItem value="high">Alta</SafeSelectItem>
            <SafeSelectItem value="urgent">Urgente</SafeSelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Responsável */}
      <div className="space-y-2">
        <Label htmlFor="responsible_id">Responsável *</Label>
        <Select value={formData.responsible_id} onValueChange={(value) => setFormData({ ...formData, responsible_id: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o responsável" />
          </SelectTrigger>
          <SelectContent>
            {employeeItems.map((item) => (
              <SafeSelectItem key={item.value} value={item.value}>
                {item.label}
              </SafeSelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empresa */}
      <div className="space-y-2">
        <Label htmlFor="company_id">Empresa</Label>
        <Select value={formData.company_id} onValueChange={(value) => setFormData({ ...formData, company_id: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a empresa" />
          </SelectTrigger>
          <SelectContent>
            <SafeSelectItem value="">Sem empresa</SafeSelectItem>
            {companyItems.map((item) => (
              <SafeSelectItem key={item.value} value={item.value}>
                {item.label}
              </SafeSelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Notas adicionais"
          rows={2}
        />
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          Salvar Atividade
        </Button>
      </div>
    </form>
  );
};

export default ActivityForm;
