import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Search, Upload, User, Calendar, FileText } from 'lucide-react';
import { Company } from '@/hooks/useCompanies';

interface ImprovedCompanyFormProps {
  onSubmit: (formData: any) => void;
  initialData?: Company;
  isSubmitting?: boolean;
}

const ImprovedCompanyForm = ({ onSubmit, initialData, isSubmitting = false }: ImprovedCompanyFormProps) => {
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

  // Initialize form with existing data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        fantasy_name: initialData.fantasy_name || '',
        company_name: initialData.company_name || '',
        cnpj: initialData.cnpj || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        cep: initialData.cep || '',
        address: initialData.address || '',
        city: initialData.city || '',
        state: initialData.state || '',
        description: initialData.description || '',
        sector: initialData.sector || '',
        reference: initialData.reference || '',
        is_supplier: initialData.is_supplier || false,
      });
    }
  }, [initialData]);

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

    // Preparar dados para envio (apenas campos válidos)
    const submissionData = {
      fantasy_name: formData.fantasy_name,
      company_name: formData.company_name || null,
      cnpj: formData.cnpj || null,
      email: formData.email,
      phone: formData.phone || null,
      cep: formData.cep || null,
      address: formData.address || null,
      city: formData.city || null,
      state: formData.state || null,
      description: formData.description || null,
      sector: formData.sector || null,
      reference: formData.reference || null,
      is_supplier: formData.is_supplier,
      status: 'active',
      settings: {},
      activity_data: {}
    };

    console.log('📝 Dados do formulário para envio:', submissionData);
    onSubmit(submissionData);
  };

  const handleCnpjLookup = async () => {
    if (formData.cnpj.length >= 14) {
      toast({
        title: "Buscando dados...",
        description: "Consultando informações do CNPJ",
      });
      
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
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <Select 
                  value={formData.sector} 
                  onValueChange={(value) => setFormData({ ...formData, sector: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nicho" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tecnologia">Tecnologia</SelectItem>
                    <SelectItem value="saude">Saúde</SelectItem>
                    <SelectItem value="educacao">Educação</SelectItem>
                    <SelectItem value="financas">Finanças</SelectItem>
                    <SelectItem value="varejo">Varejo</SelectItem>
                    <SelectItem value="servicos">Serviços</SelectItem>
                    <SelectItem value="industria">Indústria</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Referência</Label>
              <Select 
                value={formData.reference} 
                onValueChange={(value) => setFormData({ ...formData, reference: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Como chegou até nós?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="trafego-organico">Tráfego Orgânico</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>É fornecedor?</Label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="is_supplier"
                    value="true"
                    checked={formData.is_supplier === true}
                    onChange={() => setFormData({ ...formData, is_supplier: true })}
                    className="w-4 h-4"
                  />
                  <span>Sim</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="is_supplier"
                    value="false"
                    checked={formData.is_supplier === false}
                    onChange={() => setFormData({ ...formData, is_supplier: false })}
                    className="w-4 h-4"
                  />
                  <span>Não</span>
                </label>
              </div>
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
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Endereço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua, número, complemento"
              />
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
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline">
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="text-white shadow-lg hover:shadow-xl transition-all duration-200"
          style={{ backgroundColor: '#021529' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#031a35';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#021529';
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : initialData ? 'Atualizar Empresa' : 'Cadastrar Empresa'}
        </Button>
      </div>
    </form>
  );
};

export default ImprovedCompanyForm;
