
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SafeSelectItem } from '@/components/ui/safe-select-item';
import { useProject } from '@/contexts/ProjectContext';
import { createSafeSelectItems } from '@/utils/selectValidation';
import { toast } from '@/hooks/use-toast';
import { 
  Calendar, 
  User, 
  Building2, 
  Target, 
  Users, 
  Briefcase, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  Video,
  FileText
} from 'lucide-react';

interface BitrixActivityFormProps {
  companies: any[];
  employees: any[];
  onSubmit: (data: any) => void;
  preSelectedStatus?: string;
  onCancel?: () => void;
  initialData?: {
    title: string;
    description: string;
    date: string;
    priority: string;
    status: string;
    responsibleId: string;
    companyId: string;
    projectId: string;
    workGroup: string;
    department: string;
    type: string;
  };
}

const BitrixActivityForm = ({ companies, employees, onSubmit, preSelectedStatus, onCancel, initialData }: BitrixActivityFormProps) => {
  const { state } = useProject();
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    priority: initialData?.priority || 'medium',
    status: initialData?.status || preSelectedStatus || 'todo',
    responsibleId: initialData?.responsibleId || '',
    companyId: initialData?.companyId || '',
    projectId: initialData?.projectId || '',
    workGroup: initialData?.workGroup || '',
    department: initialData?.department || '',
    type: initialData?.type || 'task'
  });

  // Atualizar formData quando initialData mudar
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        date: initialData.date || new Date().toISOString().split('T')[0],
        priority: initialData.priority || 'medium',
        status: initialData.status || preSelectedStatus || 'todo',
        responsibleId: initialData.responsibleId || '',
        companyId: initialData.companyId || '',
        projectId: initialData.projectId || '',
        workGroup: initialData.workGroup || '',
        department: initialData.department || '',
        type: initialData.type || 'task'
      });
    }
  }, [initialData, preSelectedStatus]);

  const handleSubmit = (e: React.FormEvent) => {
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

    // Se não houver responsável selecionado, usar o primeiro funcionário disponível ou deixar vazio
    const activityData = {
      ...formData,
      responsibleId: formData.responsibleId || (employees.length > 0 ? employees[0].id : ''),
      status: formData.status
    };

    onSubmit(activityData);
    
    // Reset do formulário
    setFormData({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      priority: 'medium',
      status: preSelectedStatus || 'todo',
      responsibleId: '',
      companyId: '',
      projectId: '',
      workGroup: '',
      department: '',
      type: 'task'
    });
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'meeting': return <Video className="h-4 w-4" />;
      case 'task': return <FileText className="h-4 w-4" />;
      case 'email': return <FileText className="h-4 w-4" />;
      case 'other': return <Target className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center pb-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Nova Atividade</h3>
        <p className="text-sm text-gray-600 mt-1">Preencha os detalhes da nova atividade</p>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="title" className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            Título da Atividade*
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Digite o título da atividade"
            className="mt-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-sm font-medium text-gray-700">
            Descrição
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descreva os detalhes da atividade..."
            rows={3}
            className="mt-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Date and Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date" className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-green-500" />
            Data
          </Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="mt-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div>
          <Label htmlFor="priority" className="text-sm font-medium text-gray-700 flex items-center gap-2">
            {getPriorityIcon(formData.priority)}
            Prioridade
          </Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger className="mt-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SafeSelectItem value="low" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Baixa
              </SafeSelectItem>
              <SafeSelectItem value="medium" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                Média
              </SafeSelectItem>
              <SafeSelectItem value="high" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Alta
              </SafeSelectItem>
              <SafeSelectItem value="urgent" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Urgente
              </SafeSelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status */}
      <div>
        <Label htmlFor="status" className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-blue-500" />
          Status
        </Label>
        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
          <SelectTrigger className="mt-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SafeSelectItem value="todo">A Fazer</SafeSelectItem>
            <SafeSelectItem value="doing">Fazendo</SafeSelectItem>
            <SafeSelectItem value="done">Feito</SafeSelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Type and Responsible */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type" className="text-sm font-medium text-gray-700 flex items-center gap-2">
            {getTypeIcon(formData.type)}
            Tipo
          </Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger className="mt-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SafeSelectItem value="task" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Tarefa
              </SafeSelectItem>
              <SafeSelectItem value="meeting" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Reunião
              </SafeSelectItem>
              <SafeSelectItem value="call" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Ligação
              </SafeSelectItem>
              <SafeSelectItem value="email" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Email
              </SafeSelectItem>
              <SafeSelectItem value="other" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Outro
              </SafeSelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="responsibleId" className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <User className="h-4 w-4 text-purple-500" />
            Responsável*
          </Label>
          <Select value={formData.responsibleId || 'no-responsible'} onValueChange={(value) => setFormData({ ...formData, responsibleId: value === 'no-responsible' ? '' : value })}>
            <SelectTrigger className="mt-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
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

      {/* Project and Company */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="projectId" className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Target className="h-4 w-4 text-indigo-500" />
            Projeto
          </Label>
          <Select value={formData.projectId || 'no-project'} onValueChange={(value) => setFormData({ ...formData, projectId: value === 'no-project' ? '' : value })}>
            <SelectTrigger className="mt-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
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
          <Label htmlFor="companyId" className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-orange-500" />
            Empresa
          </Label>
          <Select value={formData.companyId || 'no-company'} onValueChange={(value) => setFormData({ ...formData, companyId: value === 'no-company' ? '' : value })}>
            <SelectTrigger className="mt-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
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

      {/* Work Group and Department */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="workGroup" className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            Grupo de Trabalho
          </Label>
          <Select value={formData.workGroup || 'no-group'} onValueChange={(value) => setFormData({ ...formData, workGroup: value === 'no-group' ? '' : value })}>
            <SelectTrigger className="mt-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
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
          <Label htmlFor="department" className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-green-500" />
            Setor
          </Label>
          <Select value={formData.department || 'no-department'} onValueChange={(value) => setFormData({ ...formData, department: value === 'no-department' ? '' : value })}>
            <SelectTrigger className="mt-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
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

      {/* Submit Button */}
      <div className="pt-4 border-t border-gray-100 flex gap-3">
        {onCancel && (
          <Button 
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 py-3 rounded-lg font-medium transition-all duration-200"
          >
            Cancelar
          </Button>
        )}
        <Button 
          type="submit" 
          className={`${onCancel ? 'flex-1' : 'w-full'} bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200`}
        >
          <Target className="h-4 w-4 mr-2" />
          {initialData ? 'Atualizar Atividade' : 'Criar Atividade'}
        </Button>
      </div>
    </form>
  );
};

export default BitrixActivityForm;
