
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Upload, Search } from 'lucide-react';

interface SupplierFormProps {
  onSubmit: (formData: any) => void;
}

const SupplierForm = ({ onSubmit }: SupplierFormProps) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: "Erro",
        description: "Nome do fornecedor é obrigatório",
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
      
      setTimeout(() => {
        const mockData = {
          company_name: "Fornecedor Exemplo LTDA",
          address: "Rua Fornecedor, 456",
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
          <Label htmlFor="name">Nome do Fornecedor *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: João Silva"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="activity">Atividade</Label>
          <Input
            id="activity"
            value={formData.activity}
            onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
            placeholder="Ex: Fornecimento de equipamentos"
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
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(11) 99999-9999"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cep">CEP</Label>
          <Input
            id="cep"
            value={formData.cep}
            onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
            placeholder="00000-000"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <Label htmlFor="comments">Comentários</Label>
        <Textarea
          id="comments"
          value={formData.comments}
          onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
          placeholder="Informações adicionais sobre o fornecedor..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="photo_url">URL da Foto</Label>
          <Input
            id="photo_url"
            value={formData.photo_url}
            onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
            placeholder="https://exemplo.com/foto.jpg"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="file_url">URL do Arquivo</Label>
          <Input
            id="file_url"
            value={formData.file_url}
            onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
            placeholder="https://exemplo.com/arquivo.pdf"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button 
          type="submit" 
          className="text-white hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-200"
          style={{ backgroundColor: '#021529' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#031a35';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#021529';
          }}
        >
          Cadastrar Fornecedor
        </Button>
      </div>
    </form>
  );
};

export default SupplierForm;
