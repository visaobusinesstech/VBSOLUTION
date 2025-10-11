import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';
import { Lead } from '@/hooks/useLeads-simple';

interface LeadsFiltersProps {
  filters: {
    search: string;
    priority: string;
    status: string;
    responsible: string;
    stage: string;
  };
  onFiltersChange: (filters: any) => void;
  leads: Lead[];
}

const LeadsFilters: React.FC<LeadsFiltersProps> = ({
  filters,
  onFiltersChange,
  leads
}) => {
  // Extrair valores únicos para os filtros
  const priorities = Array.from(new Set(leads.map(lead => lead.priority)));
  const statuses = Array.from(new Set(leads.map(lead => lead.status)));
  const stages = Array.from(new Set(leads.map(lead => lead.stage?.name).filter(Boolean)));

  const getFilterLabel = (type: string, value: string) => {
    switch (type) {
      case 'priority':
        const priorityLabels: Record<string, string> = {
          'low': 'Baixa',
          'medium': 'Média',
          'high': 'Alta',
          'urgent': 'Urgente'
        };
        return priorityLabels[value] || value;
      
      case 'status':
        const statusLabels: Record<string, string> = {
          'hot': 'Quente',
          'cold': 'Frio',
          'won': 'Ganho',
          'lost': 'Perdido'
        };
        return statusLabels[value] || value;
      
      default:
        return value;
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.priority !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.responsible !== 'all') count++;
    if (filters.stage !== 'all') count++;
    return count;
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      priority: 'all',
      status: 'all',
      responsible: 'all',
      stage: 'all'
    });
  };

  const clearFilter = (filterType: string) => {
    onFiltersChange({
      ...filters,
      [filterType]: 'all'
    });
  };

  return (
    <div className="space-y-4">
      {/* Barra de busca */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nome, empresa..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>
        
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Filtros ativos */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Filtros ativos:</span>
          
          {filters.priority !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Prioridade: {getFilterLabel('priority', filters.priority)}
              <button
                onClick={() => clearFilter('priority')}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Status: {getFilterLabel('status', filters.status)}
              <button
                onClick={() => clearFilter('status')}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.responsible !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Responsável: {filters.responsible}
              <button
                onClick={() => clearFilter('responsible')}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.stage !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Etapa: {filters.stage}
              <button
                onClick={() => clearFilter('stage')}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            Limpar todos
          </Button>
        </div>
      )}

      {/* Filtros dropdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Prioridade
          </label>
          <Select
            value={filters.priority}
            onValueChange={(value) => onFiltersChange({ ...filters, priority: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {priorities.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {getFilterLabel('priority', priority)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Status
          </label>
          <Select
            value={filters.status}
            onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {getFilterLabel('status', status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Responsável
          </label>
          <Select
            value={filters.responsible}
            onValueChange={(value) => onFiltersChange({ ...filters, responsible: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {/* Aqui você pode adicionar a lista de responsáveis */}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Etapa
          </label>
          <Select
            value={filters.stage}
            onValueChange={(value) => onFiltersChange({ ...filters, stage: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {stages.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default LeadsFilters;

