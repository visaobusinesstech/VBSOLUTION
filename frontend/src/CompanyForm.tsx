
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Upload, Search } from 'lucide-react';

interface CompanyFormProps {
  onSubmit: (formData: any) => void;
  settings?: any;
}

const CompanyForm = ({ onSubmit }: CompanyFormProps) => {
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
  });

  const [cnpjInfo, setCnpjInfo] = useState<any>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fantasy_name || !formData.email) {
      toast({
        title: "Erro",
        description: "Nome fantasia e e-mail são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    onSubmit(formData);
  };

  const handleCnpjLookup = async () => {
    if (formData.cnpj.length >= 14) {
      toast({
        title: "Buscando dados...",
        description: "Consultando informações do CNPJ",
      });
      
      // Simular dados encontrados
      setTimeout(() => {
        const mockData = {
          company_name: "Empresa Exemplo LTDA",
          address: "Rua Exemplo, 123",
          city: "São Paulo",
          state: "SP",
          cep: "01234-567"
        };
        
        setCnpjInfo(mockData);
        setFormData({
          ...formData,
          company_name: mockData.company_name,
          address: mockData.address,
          city: mockData.city,
          state: mockData.state,
          cep: mockData.cep
        });
        
        toast({
          title: "Dados encontrados!",
          description: "Informações do CNPJ foram preenchidas automaticamente",
        });
      }, 1500);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fantasy_name">Nome Empresa/Instituição *</Label>
          <Input
            id="fantasy_name"
            value={formData.fantasy_name}
            onChange={(e) => setFormData({ ...formData, fantasy_name: e.target.value })}
            placeholder="Ex: Tech Solutions"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="sector">Nicho/Setor</Label>
          <Input
            id="sector"
            value={formData.sector}
            onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
            placeholder="Ex: Tecnologia, Saúde, Educação"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cnpj">CNPJ</Label>
        <div className="flex gap-2">
          <Input
            id="cnpj"
            value={formData.cnpj}
            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
            placeholder="00.000.000/0000-00"
            className="flex-1"
          />
          <Button type="button" onClick={handleCnpjLookup} variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
        </div>
        {cnpjInfo && (
          <div className="p-3 bg-green-50 rounded-lg text-sm text-green-800">
            ✓ Dados encontrados e preenchidos automaticamente
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company_name">Razão Social</Label>
        <Input
          id="company_name"
          value={formData.company_name}
          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
          placeholder="Será preenchido automaticamente com CNPJ"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="contato@empresa.com.br"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Número de Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cep">CEP</Label>
          <Input
            id="cep"
            value={formData.cep}
            onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
            placeholder="00000-000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="São Paulo"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            placeholder="SP"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Endereço Completo</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Rua, número, bairro"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reference">Referência</Label>
        <Input
          id="reference"
          value={formData.reference}
          onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
          placeholder="Como chegou até nós"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Informações adicionais sobre a empresa..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" className="text-white hover:opacity-90" style={{ backgroundColor: '#4A5477' }}>
          Cadastrar Empresa
        </Button>
      </div>
    </form>
  );
};

export default CompanyForm;
