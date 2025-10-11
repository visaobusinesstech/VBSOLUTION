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

  const [activityData, setActivityData] = useState({
    name: '',
    responsible: '',
    description: '',
    comment: '',
    file: null as File | null,
    date: '',
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
        is_supplier: false, // This field is not in the Company interface, so defaulting to false
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

    const submissionData = {
      ...formData,
      activity: activityData.name ? activityData : null
    };

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setActivityData({
        ...activityData,
        file: e.target.files[0]
      });
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
                <Label htmlFor="sector">Nicho/Setor *</Label>
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

        {/* Criar Atividade */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Criar Atividade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="activity_name">Nome da Atividade</Label>
              <Input
                id="activity_name"
                value={activityData.name}
                onChange={(e) => setActivityData({ ...activityData, name: e.target.value })}
                placeholder="Ex: Reunião de apresentação"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsible">Responsável</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="responsible"
                  value={activityData.responsible}
                  onChange={(e) => setActivityData({ ...activityData, responsible: e.target.value })}
                  placeholder="Nome do responsável"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity_description">Descrição</Label>
              <Textarea
                id="activity_description"
                value={activityData.description}
                onChange={(e) => setActivityData({ ...activityData, description: e.target.value })}
                placeholder="Descreva a atividade..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Comentário</Label>
              <Textarea
                id="comment"
                value={activityData.comment}
                onChange={(e) => setActivityData({ ...activityData, comment: e.target.value })}
                placeholder="Comentários adicionais..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity_file">Arquivo</Label>
              <div className="relative">
                <Input
                  id="activity_file"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('activity_file')?.click()}
                  className="w-full border-dashed"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {activityData.file ? activityData.file.name : 'Selecionar Arquivo'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity_date">Data e Hora</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="activity_date"
                  type="datetime-local"
                  value={activityData.date}
                  onChange={(e) => setActivityData({ ...activityData, date: e.target.value })}
                  className="pl-10"
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
          className="bg-green-500 hover:bg-green-600 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : initialData ? 'Atualizar Empresa' : 'Cadastrar Empresa'}
        </Button>
      </div>
    </form>
  );
};

export default ImprovedCompanyForm;
