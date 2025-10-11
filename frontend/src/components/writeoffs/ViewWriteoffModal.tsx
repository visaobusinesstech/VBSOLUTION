import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RightDrawerModal,
  ModalSection,
  InfoField
} from '@/components/ui/right-drawer-modal';
import { 
  Edit,
  Trash2,
  X,
  Calendar,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText
} from 'lucide-react';

interface ViewWriteoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  writeoff: any;
  onEdit?: (writeoff: any) => void;
  onDelete?: (writeoffId: string) => void;
}

const getStatusBadge = (status: string) => {
  const statusConfig = {
    pending: { 
      label: 'Pendente', 
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: <Clock className="w-3 h-3" />
    },
    approved: { 
      label: 'Aprovado', 
      className: 'bg-green-100 text-green-800 border-green-200',
      icon: <CheckCircle className="w-3 h-3" />
    },
    rejected: { 
      label: 'Rejeitado', 
      className: 'bg-red-100 text-red-800 border-red-200',
      icon: <AlertTriangle className="w-3 h-3" />
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <Badge className={`flex items-center gap-1 ${config.className}`}>
      {config.icon}
      {config.label}
    </Badge>
  );
};

const getReasonLabel = (reason: string) => {
  const reasonLabels: { [key: string]: string } = {
    damage: 'Produto Danificado',
    expiry: 'Produto Vencido',
    loss: 'Perda/Roubo',
    return: 'Devolução',
    quality: 'Problema de Qualidade',
    other: 'Outros'
  };
  return reasonLabels[reason] || reason;
};

export const ViewWriteoffModal: React.FC<ViewWriteoffModalProps> = ({
  isOpen,
  onClose,
  writeoff,
  onEdit,
  onDelete
}) => {
  if (!writeoff) return null;

  return (
    <RightDrawerModal
      open={isOpen}
      onClose={onClose}
      title="Detalhes da Baixa"
      id={`ID #${writeoff.id.slice(-6)}`}
      actions={[
        {
          label: "Fechar",
          variant: "outline",
          onClick: onClose,
          icon: <X className="h-4 w-4" />
        },
        ...(onEdit ? [{
          label: "Editar",
          variant: "primary" as const,
          onClick: () => onEdit(writeoff),
          icon: <Edit className="h-4 w-4" />
        }] : []),
        ...(onDelete ? [{
          label: "Excluir",
          variant: "destructive" as const,
          onClick: () => {
            if (confirm('Tem certeza que deseja excluir esta baixa?')) {
              onDelete(writeoff.id);
              onClose();
            }
          },
          icon: <Trash2 className="h-4 w-4" />
        }] : [])
      ]}
    >
      <div className="space-y-6">
        {/* Status */}
        <ModalSection title="Status">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {writeoff.name || `Baixa #${writeoff.id.slice(0, 8)}`}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Criada em {new Date(writeoff.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="text-right">
              {getStatusBadge(writeoff.status)}
            </div>
          </div>
        </ModalSection>

        {/* Informações principais */}
        <ModalSection title="Informações da Baixa">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField
              label="Nome da Baixa"
              value={writeoff.name}
              icon={<FileText className="h-4 w-4" />}
            />
            <InfoField
              label="Quantidade"
              value={writeoff.quantity?.toString()}
              icon={<Package className="h-4 w-4" />}
            />
            <InfoField
              label="Motivo"
              value={getReasonLabel(writeoff.reason)}
              icon={<AlertTriangle className="h-4 w-4" />}
            />
            <InfoField
              label="Data de Criação"
              value={new Date(writeoff.created_at).toLocaleDateString('pt-BR')}
              icon={<Calendar className="h-4 w-4" />}
            />
          </div>
        </ModalSection>

        {/* Observações */}
        {writeoff.notes && (
          <ModalSection title="Observações">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-gray-700">{writeoff.notes}</p>
            </div>
          </ModalSection>
        )}

        {/* Histórico de alterações */}
        {writeoff.updated_at && writeoff.updated_at !== writeoff.created_at && (
          <ModalSection title="Última Atualização">
            <InfoField
              label="Atualizado em"
              value={new Date(writeoff.updated_at).toLocaleDateString('pt-BR')}
              icon={<Calendar className="h-4 w-4" />}
            />
          </ModalSection>
        )}
      </div>
    </RightDrawerModal>
  );
};