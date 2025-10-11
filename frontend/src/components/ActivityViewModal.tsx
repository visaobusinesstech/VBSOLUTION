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
  Trash2
} from 'lucide-react';

interface ActivityViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: any;
  onEdit?: (activity: any) => void;
  onDelete?: (activityId: string) => void;
  employees?: any[];
  companies?: any[];
}

export function ActivityViewModal({
  isOpen,
  onClose,
  activity,
  onEdit,
  onDelete,
  employees = [],
  companies = []
}: ActivityViewModalProps) {
  if (!activity) return null;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'doing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'todo':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'done':
        return 'Concluída';
      case 'doing':
        return 'Em Progresso';
      case 'todo':
        return 'Pendente';
      default:
        return status;
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

  return (
    <RightDrawerModal
      open={isOpen}
      onClose={onClose}
      title="Detalhes da Atividade"
      id={`ID #${activity.id?.slice(-6) || 'N/A'}`}
      actions={[
        ...(onEdit ? [{
          label: "Editar",
          variant: "outline" as const,
          onClick: () => {
            onEdit(activity);
            onClose();
          },
          icon: <Edit className="h-4 w-4" />
        }] : []),
        ...(onDelete ? [{
          label: "Excluir",
          variant: "destructive" as const,
          onClick: () => {
            if (confirm('Tem certeza que deseja excluir esta atividade?')) {
              onDelete(activity.id);
              onClose();
            }
          },
          icon: <Trash2 className="h-4 w-4" />
        }] : [])
      ]}
    >
      {/* Personal Detail Section */}
      <ModalSection title="Detalhes Pessoais">
        <PersonalDetailSection
          avatar={
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center border border-gray-200">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
          }
          name={activity.title}
          contact={{
            phone: undefined,
            email: undefined
          }}
        />
        <div className="mt-4 flex items-center gap-3">
          <Badge className={`px-2.5 py-0.5 text-xs font-medium ${getStatusColor(activity.status)}`}>
            {getStatusLabel(activity.status)}
          </Badge>
          <Badge className={`px-2.5 py-0.5 text-xs font-medium ${getPriorityColor(activity.priority)}`}>
            {getPriorityLabel(activity.priority)}
          </Badge>
        </div>
      </ModalSection>

      {/* Description Section */}
      {activity.description && (
        <ModalSection title="Descrição">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              {activity.description}
            </p>
          </div>
        </ModalSection>
      )}

      {/* Activity Information Section */}
      <ModalSection title="Informações da Atividade">
        <div className="space-y-4">
          <InfoField
            label="Responsável"
            value={getEmployeeName(activity.responsible_id)}
            icon={<User className="h-4 w-4 text-gray-500" />}
          />
          
          {activity.company_id && (
            <InfoField
              label="Empresa"
              value={getCompanyName(activity.company_id)}
              icon={<Building2 className="h-4 w-4 text-gray-500" />}
            />
          )}

          {activity.start_date && (
            <InfoField
              label="Data de Início"
              value={formatDate(activity.start_date)}
              icon={<Calendar className="h-4 w-4 text-gray-500" />}
            />
          )}

          {activity.end_date && (
            <InfoField
              label="Data de Término"
              value={formatDate(activity.end_date)}
              icon={<Calendar className="h-4 w-4 text-gray-500" />}
            />
          )}

          {activity.deadline && (
            <InfoField
              label="Prazo"
              value={formatDateTime(activity.deadline)}
              icon={<Clock className="h-4 w-4 text-gray-500" />}
            />
          )}

          {activity.type && (
            <InfoField
              label="Tipo"
              value={activity.type}
              icon={<Tag className="h-4 w-4 text-gray-500" />}
            />
          )}
        </div>
      </ModalSection>

      {/* System Information */}
      {activity.created_at && (
        <ModalSection title="Informações do Sistema">
          <InfoField
            label="Criado em"
            value={formatDateTime(activity.created_at)}
            icon={<Calendar className="h-4 w-4 text-gray-500" />}
          />
        </ModalSection>
      )}
    </RightDrawerModal>
  );
}

