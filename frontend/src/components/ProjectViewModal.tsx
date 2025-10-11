import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RightDrawerModal,
  ModalSection,
  PersonalDetailSection,
  InfoField
} from '@/components/ui/right-drawer-modal';
import { 
  Calendar, 
  User, 
  Building2, 
  Clock, 
  Tag,
  FileText,
  Edit,
  Trash2,
  DollarSign,
  Users
} from 'lucide-react';

interface ProjectViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onEdit?: (project: any) => void;
  onDelete?: (projectId: string) => void;
  employees?: any[];
  companies?: any[];
}

export function ProjectViewModal({
  isOpen,
  onClose,
  project,
  onEdit,
  onDelete,
  employees = [],
  companies = []
}: ProjectViewModalProps) {
  if (!project) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'done':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
      case 'doing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
      case 'todo':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
      case 'done':
        return 'Concluído';
      case 'in_progress':
      case 'doing':
        return 'Em Progresso';
      case 'pending':
      case 'todo':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      case 'low':
        return 'Baixa';
      default:
        return priority;
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.name || 'Não atribuído';
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || 'Não informado';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Não definido';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Não definido';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    if (!value && value !== 0) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <RightDrawerModal
      open={isOpen}
      onClose={onClose}
      title="Detalhes do Projeto"
      id={`ID #${project.id?.slice(-6) || 'N/A'}`}
      actions={[
        ...(onEdit ? [{
          label: "Editar",
          variant: "outline" as const,
          onClick: () => {
            onEdit(project);
            onClose();
          },
          icon: <Edit className="h-4 w-4" />
        }] : []),
        ...(onDelete ? [{
          label: "Excluir",
          variant: "destructive" as const,
          onClick: () => {
            if (confirm('Tem certeza que deseja excluir este projeto?')) {
              onDelete(project.id);
              onClose();
            }
          },
          icon: <Trash2 className="h-4 w-4" />
        }] : [])
      ]}
    >
      {/* Personal Detail Section */}
      <ModalSection title="Personal Detail">
        <PersonalDetailSection
          avatar={
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center border border-gray-200">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          }
          name={project.name || project.title}
          contact={{
            phone: undefined,
            email: undefined
          }}
        />
        <div className="mt-4 flex items-center gap-3">
          <Badge className={`px-2.5 py-0.5 text-xs font-medium ${getStatusColor(project.status)}`}>
            {getStatusLabel(project.status)}
          </Badge>
          {project.priority && (
            <Badge className={`px-2.5 py-0.5 text-xs font-medium ${getPriorityColor(project.priority)}`}>
              {getPriorityLabel(project.priority)}
            </Badge>
          )}
        </div>
      </ModalSection>

      {/* Description Section */}
      {project.description && (
        <ModalSection title="Description">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {project.description}
            </p>
          </div>
        </ModalSection>
      )}

      {/* Project Information Section */}
      <ModalSection title="Project Information">
        <div className="space-y-4">
          {project.manager_id && (
            <InfoField
              label="Gerente/Responsável"
              value={getEmployeeName(project.manager_id)}
              icon={<User className="h-4 w-4 text-gray-500" />}
            />
          )}
          
          {project.company_id && (
            <InfoField
              label="Cliente"
              value={getCompanyName(project.company_id)}
              icon={<Building2 className="h-4 w-4 text-gray-500" />}
            />
          )}

          {project.start_date && (
            <InfoField
              label="Data de Início"
              value={formatDate(project.start_date)}
              icon={<Calendar className="h-4 w-4 text-gray-500" />}
            />
          )}

          {project.end_date && (
            <InfoField
              label="Data de Término"
              value={formatDate(project.end_date)}
              icon={<Calendar className="h-4 w-4 text-gray-500" />}
            />
          )}

          {project.deadline && (
            <InfoField
              label="Prazo"
              value={formatDateTime(project.deadline)}
              icon={<Clock className="h-4 w-4 text-gray-500" />}
            />
          )}

          {project.category && (
            <InfoField
              label="Categoria"
              value={project.category}
              icon={<Tag className="h-4 w-4 text-gray-500" />}
            />
          )}
        </div>
      </ModalSection>

      {/* Budget Section */}
      {(project.budget || project.budget === 0) && (
        <ModalSection title="Budget Information">
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
            <DollarSign className="h-6 w-6 text-green-600" />
            <div>
              <p className="text-xs text-green-700">Orçamento Total</p>
              <p className="text-lg font-semibold text-green-800">{formatCurrency(project.budget)}</p>
            </div>
          </div>
        </ModalSection>
      )}

      {/* Team Section */}
      {project.team && project.team.length > 0 && (
        <ModalSection title="Team Members">
          <div className="flex flex-wrap gap-2">
            {project.team.map((memberId: string, index: number) => (
              <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-200">
                {getEmployeeName(memberId)}
              </Badge>
            ))}
          </div>
        </ModalSection>
      )}

      {/* System Information */}
      {project.created_at && (
        <ModalSection title="System Information">
          <InfoField
            label="Criado em"
            value={formatDateTime(project.created_at)}
            icon={<Calendar className="h-4 w-4 text-gray-500" />}
          />
        </ModalSection>
      )}
    </RightDrawerModal>
  );
}

