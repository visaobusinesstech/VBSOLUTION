import React from 'react';
import { Filter, MapPin, Building2, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SuppliersFilterState } from '@/hooks/useSuppliersFilters';

interface SuppliersFilterBarProps {
  filters: SuppliersFilterState;
  onFilterChange: (key: keyof SuppliersFilterState, value: any) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  cities: string[];
  states: string[];
  activities: string[];
  searchPlaceholder?: string;
}

const SuppliersFilterBar: React.FC<SuppliersFilterBarProps> = ({
  filters,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  cities,
  states,
  activities,
  searchPlaceholder = "Filtrar fornecedores..."
}) => {
  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Campo de busca */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            <Input
              placeholder={searchPlaceholder}
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="pl-10 h-8 text-sm border-0 bg-transparent focus:border-0 focus:ring-0 text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Filtros funcionais */}
        <div className="flex items-center gap-2">
          {/* Filtro de Cidade */}
          <Select value={filters.city} onValueChange={(value) => onFilterChange('city', value)}>
            <SelectTrigger className="h-7 w-20 border-0 bg-transparent text-gray-900 text-xs shadow-none pl-2 pr-0.5 hover:bg-blue-50 focus:bg-blue-50">
              <MapPin className="h-3 w-3 mr-3" />
              <SelectValue placeholder="Cidade" />
              <ChevronDown className="h-3 w-3 ml-0.5" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Cidade</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city} className="hover:bg-gray-100 focus:bg-gray-100 text-xs">
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro de Estado */}
          <Select value={filters.state} onValueChange={(value) => onFilterChange('state', value)}>
            <SelectTrigger className="h-7 w-20 border-0 bg-transparent text-gray-900 text-xs shadow-none pl-2 pr-1 hover:bg-blue-50 focus:bg-blue-50">
              <MapPin className="h-3 w-3 mr-2" />
              <SelectValue placeholder="Estado" />
              <ChevronDown className="h-3 w-3 ml-1" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Estado</SelectItem>
              {states.map((state) => (
                <SelectItem key={state} value={state} className="hover:bg-gray-100 focus:bg-gray-100 text-xs">
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro de Atividade */}
          <Select value={filters.activity} onValueChange={(value) => onFilterChange('activity', value)}>
            <SelectTrigger className="h-7 w-24 border-0 bg-transparent text-gray-900 text-xs shadow-none pl-2 pr-1 hover:bg-blue-50 focus:bg-blue-50">
              <Building2 className="h-3 w-3 mr-2" />
              <SelectValue placeholder="Atividade" />
              <ChevronDown className="h-3 w-3 ml-1" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Atividade</SelectItem>
              {activities.map((activity) => (
                <SelectItem key={activity} value={activity} className="hover:bg-gray-100 focus:bg-gray-100 text-xs">
                  {activity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default SuppliersFilterBar;
