import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  RightDrawerModal,
  ModalSection,
  InfoField
} from '@/components/ui/right-drawer-modal';
import { 
  Edit,
  Save,
  X,
  Users,
  Calendar,
  Tag,
  Building2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WorkGroupDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  workGroup: {
    id: string;
    name: string;
    description: string;
    color: string;
    sector: string;
    members: any[];
    status: string;
    createdAt?: string;
  } | null;
  onUpdate: (id: string, data: any) => Promise<void>;
}

const WorkGroupDetailModal = ({ isOpen, onClose, workGroup, onUpdate }: WorkGroupDetailModalProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    sector: ''
  });

  useEffect(() => {
    if (workGroup) {
      console.log('🔄 [MODAL] Carregando dados do grupo:', workGroup);
      
      setFormData({
        name: workGroup.name,
        description: workGroup.description,
        color: workGroup.color,
        sector: workGroup.sector
      });
    }
  }, [workGroup]);

  if (!workGroup) return null;

  const handleSave = async () => {
    try {
      console.log('💾 [MODAL] Iniciando salvamento do grupo:', workGroup?.id);

      const updateData = {
        ...formData
      };

      console.log('📋 [MODAL] Dados para atualização:', updateData);

      await onUpdate(workGroup.id, updateData);
      
      console.log('✅ [MODAL] Grupo atualizado com sucesso');
      
      setIsEditing(false);
      toast({
        title: "Grupo atualizado",
        description: "As informações foram salvas com sucesso!",
      });
    } catch (error) {
      console.error('❌ [MODAL] Erro ao salvar:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      name: workGroup.name,
      description: workGroup.description,
      color: workGroup.color,
      sector: workGroup.sector
    });
    setIsEditing(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { 
        label: 'Ativo', 
        className: 'bg-green-100 text-green-800 border-green-200'
      },
      inactive: { 
        label: 'Inativo', 
        className: 'bg-gray-100 text-gray-800 border-gray-200'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;

    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <RightDrawerModal
      open={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Grupo de Trabalho" : "Detalhes do Grupo"}
      id={`ID #${workGroup.id.slice(-6)}`}
      actions={[
        {
          label: "Fechar",
          variant: "outline",
          onClick: onClose,
          icon: <X className="h-4 w-4" />
        },
        ...(isEditing ? [
          {
            label: "Cancelar",
            variant: "outline" as const,
            onClick: handleCancel,
            icon: <X className="h-4 w-4" />
          },
          {
            label: "Salvar",
            variant: "primary" as const,
            onClick: handleSave,
            icon: <Save className="h-4 w-4" />
          }
        ] : [
          {
            label: "Editar",
            variant: "primary" as const,
            onClick: () => setIsEditing(true),
            icon: <Edit className="h-4 w-4" />
          }
        ])
      ]}
    >
      <div className="space-y-6">
        {/* Status */}
        <ModalSection title="Status">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {workGroup.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Criado em {workGroup.createdAt ? new Date(workGroup.createdAt).toLocaleDateString('pt-BR') : 'Data não disponível'}
              </p>
            </div>
            <div className="text-right">
              {getStatusBadge(workGroup.status)}
            </div>
          </div>
        </ModalSection>

        {/* Informações principais */}
        <ModalSection title="Informações do Grupo">
          {isEditing ? (
            <div className="space-y-5">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-600 mb-2 block">
                  Nome do Grupo*
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Digite o nome do grupo"
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
                  placeholder="Descreva o propósito do grupo"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="sector" className="text-sm font-medium text-gray-600 mb-2 block">
                  Setor
                </Label>
                <Input
                  id="sector"
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  placeholder="Digite o setor"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoField
                label="Nome do Grupo"
                value={workGroup.name}
                icon={<Tag className="h-4 w-4" />}
              />
              <InfoField
                label="Setor"
                value={workGroup.sector}
                icon={<Building2 className="h-4 w-4" />}
              />
              <InfoField
                label="Membros"
                value={workGroup.members?.length?.toString() || '0'}
                icon={<Users className="h-4 w-4" />}
              />
              <InfoField
                label="Data de Criação"
                value={workGroup.createdAt ? new Date(workGroup.createdAt).toLocaleDateString('pt-BR') : 'Não disponível'}
                icon={<Calendar className="h-4 w-4" />}
              />
            </div>
          )}
        </ModalSection>

        {/* Descrição */}
        {workGroup.description && (
          <ModalSection title="Descrição">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-gray-700">{workGroup.description}</p>
            </div>
          </ModalSection>
        )}

        {/* Cor do Grupo */}
        <ModalSection title="Identidade Visual">
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-full border border-gray-300" 
              style={{ backgroundColor: workGroup.color }}
            />
            <span className="text-sm text-gray-600">
              Cor identificadora do grupo
            </span>
          </div>
        </ModalSection>

        {/* Membros */}
        {workGroup.members && workGroup.members.length > 0 && (
          <ModalSection title="Membros do Grupo">
            <div className="space-y-3">
              {workGroup.members.map((member, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <Users className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.name || 'Membro'}</p>
                    <p className="text-sm text-gray-500">{member.role || 'Membro'}</p>
                  </div>
                </div>
              ))}
            </div>
          </ModalSection>
        )}
      </div>
    </RightDrawerModal>
  );
};

export default WorkGroupDetailModal;