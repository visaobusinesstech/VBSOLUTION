import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RightDrawerModal,
  ModalSection
} from '@/components/ui/right-drawer-modal';
import { Search, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
}

export function CreateCompanyModal({
  isOpen,
  onClose,
  onSubmit
}: CreateCompanyModalProps) {
  const [formData, setFormData] = useState({
    fantasy_name: '',
    company_name: '',
    cnpj: '',
    email: '',
    phone: '',
    cep: '',
    address: '',
    city: '',
    state: '',
    description: '',
    sector: '',
    reference: '',
    is_supplier: false,
  });

  const [cnpjInfo, setCnpjInfo] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fantasy_name) {
      toast.error('Nome fantasia é obrigatório');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
      // Reset form
      setFormData({
        fantasy_name: '',
        company_name: '',
        cnpj: '',
        email: '',
        phone: '',
        cep: '',
        address: '',
        city: '',
        state: '',
        description: '',
        sector: '',
        reference: '',
        is_supplier: false,
      });
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
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
          state: 'SP'
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
      title="Cadastrar Nova Empresa"
      id="NEW"
      actions={[
        {
          label: "Cancelar",
          variant: "outline",
          onClick: onClose,
          icon: <X className="h-4 w-4" />
        },
        {
          label: "Salvar Empresa",
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
              <Label htmlFor="fantasy_name" className="text-sm font-medium text-gray-600 mb-2 block">
                Nome Fantasia*
              </Label>
              <Input
                id="fantasy_name"
                value={formData.fantasy_name}
                onChange={(e) => setFormData({ ...formData, fantasy_name: e.target.value })}
                placeholder="Digite o nome fantasia"
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
              <Label htmlFor="sector" className="text-sm font-medium text-gray-600 mb-2 block">
                Setor
              </Label>
              <Select value={formData.sector} onValueChange={(value) => setFormData({ ...formData, sector: value })}>
                <SelectTrigger className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="saude">Saúde</SelectItem>
                  <SelectItem value="educacao">Educação</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="varejo">Varejo</SelectItem>
                  <SelectItem value="industria">Indústria</SelectItem>
                  <SelectItem value="servicos">Serviços</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </ModalSection>

        {/* CNPJ e Contato */}
        <ModalSection title="CNPJ e Contato">
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-600 mb-2 block">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contato@empresa.com"
                  className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
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

        {/* Informações Adicionais */}
        <ModalSection title="Informações Adicionais">
          <div className="space-y-4">
            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-600 mb-2 block">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da empresa..."
                rows={3}
                className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="reference" className="text-sm font-medium text-gray-600 mb-2 block">
                Referência
              </Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="Como conheceu a empresa?"
                className="focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_supplier"
                checked={formData.is_supplier}
                onChange={(e) => setFormData({ ...formData, is_supplier: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_supplier" className="text-sm font-medium text-gray-600">
                Esta empresa é também um fornecedor
              </Label>
            </div>
          </div>
        </ModalSection>
      </form>
    </RightDrawerModal>
  );
}
