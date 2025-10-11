import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  RightDrawerModal,
  ModalSection
} from '@/components/ui/right-drawer-modal';
import { Upload, Search, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface CreateSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
}

export function CreateSupplierModal({
  isOpen,
  onClose,
  onSubmit
}: CreateSupplierModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    cnpj: '',
    phone: '',
    cep: '',
    address: '',
    city: '',
    state: '',
    activity: '',
    comments: '',
    responsible_id: '',
    photo_url: '',
    file_url: ''
  });

  const [cnpjInfo, setCnpjInfo] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Nome do fornecedor é obrigatório');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
      // Reset form
      setFormData({
        name: '',
        company_name: '',
        cnpj: '',
        phone: '',
        cep: '',
        address: '',
        city: '',
        state: '',
        activity: '',
        comments: '',
        responsible_id: '',
        photo_url: '',
        file_url: ''
      });
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCnpjLookup = async () => {
    if (formData.cnpj.length >= 14) {
      toast.info('Buscando informações do CNPJ...');
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setCnpjInfo({
          company_name: 'Empresa Exemplo Ltda',
          address: 'Rua Exemplo, 123',
          city: 'São Paulo',
          state: 'SP',
          activity: 'Comércio'
        });
        toast.success('Informações do CNPJ encontradas!');
      } catch (error) {
        toast.error('Erro ao buscar CNPJ');
      }
    } else {
      toast.error('CNPJ deve ter pelo menos 14 dígitos');
    }
  };

  return (
    <RightDrawerModal
      open={isOpen}
      onClose={onClose}
      title="Cadastrar Novo Fornecedor"
      id="NEW"
      actions={[
        {
          label: "Cancelar",
          variant: "outline",
          onClick: onClose,
          icon: <X className="h-4 w-4" />
        },
        {
          label: "Salvar Fornecedor",
          variant: "primary",
          onClick: handleSubmit,
          disabled: isSubmitting,
          icon: <Save className="h-4 w-4" />
        }
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <ModalSection title="Informações Básicas">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-600 mb-2 block">
                Nome do Fornecedor*
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Digite o nome do fornecedor"
                className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <Label htmlFor="company_name" className="text-sm font-medium text-gray-600 mb-2 block">
                Razão Social
              </Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Digite a razão social"
                className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="activity" className="text-sm font-medium text-gray-600 mb-2 block">
                Atividade Principal
              </Label>
              <Input
                id="activity"
                value={formData.activity}
                onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                placeholder="Digite a atividade principal"
                className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </ModalSection>

        {/* CNPJ e Documentos */}
        <ModalSection title="CNPJ e Documentos">
          <div className="space-y-4">
            <div>
              <Label htmlFor="cnpj" className="text-sm font-medium text-gray-600 mb-2 block">
                CNPJ
              </Label>
              <div className="flex gap-2">
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                  className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCnpjLookup}
                  className="px-4"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-600 mb-2 block">
                Telefone
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </ModalSection>

        {/* Endereço */}
        <ModalSection title="Endereço">
          <div className="space-y-4">
            <div>
              <Label htmlFor="cep" className="text-sm font-medium text-gray-600 mb-2 block">
                CEP
              </Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                placeholder="00000-000"
                className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="address" className="text-sm font-medium text-gray-600 mb-2 block">
                Endereço
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua, número, bairro"
                className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className="text-sm font-medium text-gray-600 mb-2 block">
                  Cidade
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Cidade"
                  className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="state" className="text-sm font-medium text-gray-600 mb-2 block">
                  Estado
                </Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Estado"
                  className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </ModalSection>

        {/* Observações */}
        <ModalSection title="Observações">
          <div>
            <Label htmlFor="comments" className="text-sm font-medium text-gray-600 mb-2 block">
              Comentários
            </Label>
            <Textarea
              id="comments"
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              placeholder="Observações sobre o fornecedor..."
              rows={3}
              className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </ModalSection>
      </form>
    </RightDrawerModal>
  );
}
