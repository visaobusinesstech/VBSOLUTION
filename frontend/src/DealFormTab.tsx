import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Building2, User, Calendar as CalendarIcon, Target, DollarSign, Search, X } from 'lucide-react';
import { format } from '@/utils/dateUtils';
import { ptBR } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { Deal } from '@/hooks/useDeals';
import { useCompanies } from '@/hooks/useCompanies';
import { useProducts } from '@/hooks/useProducts';

interface DealFormTabProps {
  onSubmit: (dealData: Omit<Deal, 'id' | 'created_at' | 'updated_at'>) => void;
  initialData?: Deal;
  isSubmitting?: boolean;
}

const stages = [
  { id: 'desenvolvimento', name: 'Em Desenvolvimento', color: '#2196F3' },
  { id: 'documentos', name: 'Criar documentos', color: '#2196F3' },
  { id: 'fatura', name: 'Fatura', color: '#00BCD4' },
  { id: 'andamento', name: 'Em andamento', color: '#4CAF50' },
  { id: 'fatura_final', name: 'Fatura final', color: '#FF9800' }
];

export function DealFormTab({ onSubmit, initialData, isSubmitting = false }: DealFormTabProps) {
  const { companies } = useCompanies();
  const { products } = useProducts();
  
  const [formData, setFormData] = useState({
    title: '',
    company_id: '',
    product_id: '',
    stage_id: 'desenvolvimento',
    value: 0,
    probability: 50,
    expected_close_date: undefined as Date | undefined,
    notes: '',
    status: 'active' as 'active' | 'won' | 'lost',
    responsible_id: undefined as string | undefined
  });

  const [showCompanySearch, setShowCompanySearch] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        company_id: initialData.company_id,
        product_id: initialData.product_id || '',
        stage_id: initialData.stage_id,
        value: Number(initialData.value),
        probability: initialData.probability,
        expected_close_date: initialData.expected_close_date ? new Date(initialData.expected_close_date) : undefined,
        notes: initialData.notes || '',
        status: initialData.status,
        responsible_id: initialData.responsible_id || undefined
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      return;
    }

    const dealData = {
      ...formData,
      product_id: formData.product_id || undefined,
      expected_close_date: formData.expected_close_date ? format(formData.expected_close_date, 'yyyy-MM-dd') : undefined,
      responsible_id: formData.responsible_id || undefined
    };

    onSubmit(dealData);
  };

  const filteredCompanies = companies.filter(company =>
    company.fantasy_name.toLowerCase().includes(companySearchTerm.toLowerCase()) ||
    company.company_name?.toLowerCase().includes(companySearchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const selectedCompany = companies.find(c => c.id === formData.company_id);
  const selectedProduct = products.find(p => p.id === formData.product_id);
  const selectedStage = stages.find(s => s.id === formData.stage_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Título do Negócio */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">
            Título do Negócio *
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ex: Venda de sistema ERP"
            className="w-full"
            required
          />
        </div>

        {/* Empresa */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Empresa *</Label>
          <div className="relative">
            <Popover open={showCompanySearch} onOpenChange={setShowCompanySearch}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setShowCompanySearch(true)}
                >
                  {selectedCompany ? (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{selectedCompany.fantasy_name}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500">Selecionar empresa</span>
                  )}
                  <Search className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0">
                <div className="p-4">
                  <Input
                    placeholder="Buscar empresa..."
                    value={companySearchTerm}
                    onChange={(e) => setCompanySearchTerm(e.target.value)}
                    className="mb-2"
                  />
                  <div className="max-h-48 overflow-y-auto">
                    {filteredCompanies.map((company) => (
                      <div
                        key={company.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer rounded"
                        onClick={() => {
                          setFormData({ ...formData, company_id: company.id });
                          setShowCompanySearch(false);
                          setCompanySearchTerm('');
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{company.fantasy_name}</div>
                            {company.company_name && (
                              <div className="text-xs text-gray-500">{company.company_name}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Produto (Opcional) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Produto</Label>
          <div className="relative">
            <Popover open={showProductSearch} onOpenChange={setShowProductSearch}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setShowProductSearch(true)}
                >
                  {selectedProduct ? (
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span>{selectedProduct.name}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500">Selecionar produto</span>
                  )}
                  <Search className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0">
                <div className="p-4">
                  <Input
                    placeholder="Buscar produto..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    className="mb-2"
                  />
                  <div className="max-h-48 overflow-y-auto">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer rounded"
                        onClick={() => {
                          setFormData({ ...formData, product_id: product.id });
                          setShowProductSearch(false);
                          setProductSearchTerm('');
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-gray-500">
                              R$ {Number(product.base_price).toLocaleString('pt-BR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Estágio */}
        <div className="space-y-2">
          <Label htmlFor="stage" className="text-sm font-medium">
            Estágio *
          </Label>
          <Select value={formData.stage_id} onValueChange={(value) => setFormData({ ...formData, stage_id: value })}>
            <SelectTrigger>
              <SelectValue>
                {selectedStage && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedStage.color }}
                    />
                    <span>{selectedStage.name}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {stages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span>{stage.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Valor */}
        <div className="space-y-2">
          <Label htmlFor="value" className="text-sm font-medium">
            Valor (R$)
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="value"
              type="number"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
              placeholder="0,00"
              className="pl-10"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Probabilidade */}
        <div className="space-y-2">
          <Label htmlFor="probability" className="text-sm font-medium">
            Probabilidade (%)
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="probability"
              type="number"
              value={formData.probability}
              onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) })}
              min="0"
              max="100"
              className="w-20"
            />
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${formData.probability}%` }}
              />
            </div>
          </div>
        </div>

        {/* Data de Fechamento Esperada */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Data de Fechamento Esperada</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.expected_close_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.expected_close_date ? (
                  format(formData.expected_close_date, "PPP", { locale: ptBR })
                ) : (
                  <span>Selecionar data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.expected_close_date}
                onSelect={(date) => setFormData({ ...formData, expected_close_date: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium">
          Notas
        </Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Adicione observações sobre este negócio..."
          className="min-h-[100px]"
        />
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="status" className="text-sm font-medium">
          Status
        </Label>
        <Select value={formData.status} onValueChange={(value: 'active' | 'won' | 'lost') => setFormData({ ...formData, status: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Ativo
              </Badge>
            </SelectItem>
            <SelectItem value="won">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Ganho
              </Badge>
            </SelectItem>
            <SelectItem value="lost">
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                Perdido
              </Badge>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resumo do Negócio */}
      {formData.title && formData.company_id && (
        <Card className="border-2 border-blue-100 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Resumo do Negócio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Título</p>
                <p className="font-medium">{formData.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Empresa</p>
                <p className="font-medium">{selectedCompany?.fantasy_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor</p>
                <p className="font-medium text-green-600">
                  R$ {formData.value.toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estágio</p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedStage?.color }}
                  />
                  <span className="font-medium">{selectedStage?.name}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões de Ação */}
      <div className="flex items-center gap-3 pt-6 border-t">
        <Button
          type="submit"
          className="bg-green-500 hover:bg-green-600 text-white px-8"
          disabled={isSubmitting || !formData.title.trim() || !formData.company_id}
        >
          {isSubmitting ? 'Salvando...' : initialData ? 'Atualizar Negócio' : 'Criar Negócio'}
        </Button>
        <Button type="button" variant="outline" className="px-8">
          Cancelar
        </Button>
      </div>
    </form>
  );
}
