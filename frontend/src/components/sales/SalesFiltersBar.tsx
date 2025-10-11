
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, CheckCircle2, Archive, Trash2, SortAsc, SortDesc } from 'lucide-react';
import { Company } from '@/hooks/useCompanies';
import { FunnelStage } from '@/hooks/useFunnelStages';
import { useState } from 'react';

interface SalesFiltersBarProps {
  filters: {
    search: string;
    company: string;
    responsible: string;
    stage: string;
    status: string;
    priority: string;
  };
  onFiltersChange: (filters: any) => void;
  companies: Company[];
  stages: FunnelStage[];
  selectedCount?: number;
  onBulkAction?: (action: string) => void;
  onClearSelection?: () => void;
}

const SalesFiltersBar = ({
  filters,
  onFiltersChange,
  companies,
  stages,
  selectedCount = 0,
  onBulkAction = () => {},
  onClearSelection = () => {}
}: SalesFiltersBarProps) => {
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const updateFilter = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      company: 'all',
      responsible: 'all',
      stage: 'all',
      status: 'all',
      priority: 'all'
    });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => 
    key !== 'search' && value !== 'all' && value !== ''
  ) || filters.search !== '';

  const toggleSortDirection = () => {
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDirection);
  };

  return (
    <div className="space-y-4">
      {/* Linha principal de filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar oportunidades ou empresas..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-3 flex-wrap">
          <Select value={filters.company} onValueChange={(value) => updateFilter('company', value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.fantasy_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.stage} onValueChange={(value) => updateFilter('stage', value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {stages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                    {stage.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="open">Em Andamento</SelectItem>
              <SelectItem value="won">Ganho</SelectItem>
              <SelectItem value="lost">Perdido</SelectItem>
              <SelectItem value="frozen">Congelado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.priority} onValueChange={(value) => updateFilter('priority', value)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Data Criação</SelectItem>
              <SelectItem value="value">Valor</SelectItem>
              <SelectItem value="expected_close_date">Previsão</SelectItem>
              <SelectItem value="priority">Prioridade</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleSortDirection}
            className="flex items-center gap-1"
          >
            {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>

          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="text-red-600">
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Indicador de filtros ativos */}
      {hasActiveFilters && (
        <div className="flex gap-2 flex-wrap">
          {filters.search && (
            <Badge variant="secondary">
              "{filters.search}"
            </Badge>
          )}
          {filters.status !== 'all' && (
            <Badge variant="secondary">
              Status: {filters.status}
            </Badge>
          )}
          {filters.priority !== 'all' && (
            <Badge variant="secondary">
              Prioridade: {filters.priority}
            </Badge>
          )}
        </div>
      )}

      {/* Barra de ações em lote */}
      {selectedCount > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="default" className="bg-gray-900">
              {selectedCount} selecionados
            </Badge>
            <Button variant="outline" size="sm" onClick={onClearSelection}>
              Limpar seleção
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onBulkAction('won')}
              className="text-gray-700 hover:bg-gray-100"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Ganhou
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onBulkAction('lost')}
              className="text-gray-700 hover:bg-gray-100"
            >
              <X className="h-4 w-4 mr-1" />
              Perdeu
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onBulkAction('frozen')}
              className="text-gray-700 hover:bg-gray-100"
            >
              <Archive className="h-4 w-4 mr-1" />
              Congelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesFiltersBar;
