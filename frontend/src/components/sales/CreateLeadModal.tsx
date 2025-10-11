
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { useLeads, Lead } from '@/hooks/useLeads-fixed';
import { FunnelStage } from '@/hooks/useFunnelStages';
import { Company } from '@/hooks/useCompanies';
import { Plus, X, Building2, Mail, Phone, MapPin, Search } from 'lucide-react';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  stages: FunnelStage[];
  onLeadCreated: () => void;
}

const sourceOptions = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Indicação' },
  { value: 'social_media', label: 'Redes Sociais' },
  { value: 'cold_call', label: 'Ligação Fria' },
  { value: 'email', label: 'Email' },
  { value: 'event', label: 'Evento' },
  { value: 'partner', label: 'Parceiro' },
  { value: 'advertising', label: 'Publicidade' },
  { value: 'organic', label: 'Orgânico' },
  { value: 'other', label: 'Outro' }
];

const CreateLeadModal = ({ 
  isOpen, 
  onClose, 
  companies = [], 
  stages = [], 
  onLeadCreated = () => {}
}: CreateLeadModalProps) => {
  console.log('CreateLeadModal renderizado, isOpen:', isOpen);
  const { createLead } = useLeads();
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [formData, setFormData] = useState({
    // Campos obrigatórios
    name: '',
    company_id: '',
    value: 0,
    stage_id: stages[0]?.id || '',
    responsible_id: '',
    expected_close_date: '',
    status: 'open' as 'open' | 'won' | 'lost' | 'frozen',
    
    // Campos opcionais
    currency: 'BRL' as 'BRL' | 'USD' | 'EUR',
    priority: 'medium' as 'low' | 'medium' | 'high',
    source: '',
    conversion_rate: 50,
    notes: '',
    last_contact_date: ''
  });

  const filteredCompanies = companies.filter(company =>
    company.fantasy_name.toLowerCase().includes(companySearch.toLowerCase()) ||
    (company.company_name || '').toLowerCase().includes(companySearch.toLowerCase())
  );

  useEffect(() => {
    if (isOpen && stages.length > 0 && !formData.stage_id) {
      setFormData(prev => ({ ...prev, stage_id: stages[0].id }));
    }
  }, [isOpen, stages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Botão Salvar Tudo clicado!', formData);
    
    // Validação dos campos obrigatórios
    if (!formData.name.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Nome do lead é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!formData.company_id) {
      toast({
        title: "Campo obrigatório",
        description: "Empresa associada é obrigatória",
        variant: "destructive",
      });
      return;
    }

    if (!formData.stage_id) {
      toast({
        title: "Campo obrigatório",
        description: "Etapa atual é obrigatória",
        variant: "destructive",
      });
      return;
    }

    if (!formData.expected_close_date) {
      toast({
        title: "Campo obrigatório",
        description: "Previsão de fechamento é obrigatória",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const customFields = {
        tags,
        source: formData.source,
        notes: formData.notes
      };

      const leadData = {
        ...formData,
        custom_fields: customFields
      };

      await createLead(leadData);
      
      toast({
        title: "Lead criado",
        description: "Oportunidade de venda criada com sucesso!",
      });
      
      onLeadCreated();
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        company_id: '',
        value: 0,
        stage_id: stages[0]?.id || '',
        responsible_id: '',
        expected_close_date: '',
        status: 'open',
        currency: 'BRL',
        priority: 'medium',
        source: '',
        conversion_rate: 50,
        notes: '',
        last_contact_date: ''
      });
      setTags([]);
      setSelectedCompany(null);
      setCompanySearch('');
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar lead",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    setFormData(prev => ({ ...prev, company_id: company.id }));
    setCompanySearch(company.fantasy_name);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Novo Lead
          </DialogTitle>
          <DialogDescription>
            Crie uma nova oportunidade de venda
          </DialogDescription>
          <div className="pt-4 pb-2">
            <Button 
              type="button" 
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-lg shadow-lg"
            >
              {loading ? 'Salvando...' : 'Salvar Tudo'}
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="informacoes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="informacoes">Informações Básicas</TabsTrigger>
              <TabsTrigger value="empresa">Empresa</TabsTrigger>
              <TabsTrigger value="adicional">Campos Adicionais</TabsTrigger>
            </TabsList>

            <TabsContent value="informacoes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Obrigatórias</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Lead *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Digite o nome da oportunidade"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="value">Valor da Oportunidade *</Label>
                      <div className="flex gap-2">
                        <Select
                          value={formData.currency}
                          onValueChange={(value) => handleInputChange('currency', value)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BRL">R$</SelectItem>
                            <SelectItem value="USD">$</SelectItem>
                            <SelectItem value="EUR">€</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          value={formData.value}
                          onChange={(e) => handleInputChange('value', Number(e.target.value))}
                          placeholder="0"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stage">Etapa Atual *</Label>
                      <Select
                        value={formData.stage_id}
                        onValueChange={(value) => handleInputChange('stage_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma etapa" />
                        </SelectTrigger>
                        <SelectContent>
                          {stages.map((stage) => (
                            <SelectItem key={stage.id} value={stage.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: stage.color }}
                                />
                                {stage.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expected_close_date">Previsão de Fechamento *</Label>
                      <Input
                        id="expected_close_date"
                        type="date"
                        value={formData.expected_close_date}
                        onChange={(e) => handleInputChange('expected_close_date', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status *</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => handleInputChange('status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Em Andamento</SelectItem>
                          <SelectItem value="won">Ganho</SelectItem>
                          <SelectItem value="lost">Perdido</SelectItem>
                          <SelectItem value="frozen">Congelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Prioridade</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => handleInputChange('priority', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="empresa" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Empresa Associada</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa *</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Buscar empresa..."
                        value={companySearch}
                        onChange={(e) => setCompanySearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    {companySearch && filteredCompanies.length > 0 && (
                      <div className="border rounded-md max-h-48 overflow-y-auto">
                        {filteredCompanies.map((company) => (
                          <div
                            key={company.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => handleCompanySelect(company)}
                          >
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-gray-500" />
                              <div>
                                <div className="font-medium">{company.fantasy_name}</div>
                                <div className="text-sm text-gray-600">{company.company_name}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {companySearch && filteredCompanies.length === 0 && (
                      <div className="p-3 text-center border rounded-md">
                        <p className="text-gray-600 mb-2">Empresa não encontrada</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCreateCompany(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Nova Empresa
                        </Button>
                      </div>
                    )}
                  </div>

                  {selectedCompany && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Dados da Empresa</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-500" />
                          <span>{selectedCompany.fantasy_name}</span>
                        </div>
                        {selectedCompany.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span>{selectedCompany.email}</span>
                          </div>
                        )}
                        {selectedCompany.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span>{selectedCompany.phone}</span>
                          </div>
                        )}
                        {selectedCompany.city && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span>{selectedCompany.city}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="adicional" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Campos Adicionais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="source">Fonte de Entrada</Label>
                      <Select
                        value={formData.source}
                        onValueChange={(value) => handleInputChange('source', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a fonte" />
                        </SelectTrigger>
                        <SelectContent>
                          {sourceOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="last_contact_date">Data do Último Contato</Label>
                      <Input
                        id="last_contact_date"
                        type="date"
                        value={formData.last_contact_date}
                        onChange={(e) => handleInputChange('last_contact_date', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Adicionar tag"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      />
                      <Button type="button" onClick={handleAddTag} size="sm">
                        Adicionar
                      </Button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Observações sobre a oportunidade..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="text-white hover:opacity-90" style={{ backgroundColor: '#4A5477' }}>
              {loading ? 'Criando...' : 'Criar Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLeadModal;
