import React from 'react';
import { Filter, Package, Tag, Building2, ChevronDown, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface InventoryFilterState {
  category: 'all' | string;
  status: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  supplier: 'all' | string;
  dateRange: 'all' | 'today' | 'week' | 'month' | 'overdue';
  search: string;
}

interface InventoryFilterBarProps {
  filters: InventoryFilterState;
  onFilterChange: (key: keyof InventoryFilterState, value: any) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  categories: string[];
  suppliers: string[];
  searchPlaceholder?: string;
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

const InventoryFilterBar: React.FC<InventoryFilterBarProps> = ({
  filters,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  categories,
  suppliers,
  searchPlaceholder = "Filtrar por nome do item, SKU ou categoria...",
  searchInputRef
}) => {
  return (
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        {/* Campo de busca */}
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            <Input
              ref={searchInputRef}
              placeholder={searchPlaceholder}
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="pl-10 h-8 text-sm border-0 bg-transparent focus:border-0 focus:ring-0 text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Filtros funcionais */}
        <div className="flex items-center gap-2">
          {/* Filtro de Categoria */}
           <Select value={filters.category} onValueChange={(value) => onFilterChange('category', value)}>
             <SelectTrigger className="h-7 w-20 border-0 bg-transparent text-gray-900 text-xs shadow-none pl-0 pr-1 hover:bg-blue-50 focus:bg-blue-50 flex items-center justify-between">
               <div className="flex items-center gap-0">
                 <Tag className="h-3 w-3" />
                 <SelectValue placeholder="Categoria" />
               </div>
               <ChevronDown className="h-3 w-3 flex-shrink-0" />
             </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Categoria</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category} className="hover:bg-gray-100 focus:bg-gray-100 text-xs">
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

                     {/* Filtro de Status do Estoque */}
           <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
             <SelectTrigger className="h-7 w-20 border-0 bg-transparent text-gray-900 text-xs shadow-none pl-2 pr-1 hover:bg-blue-50 focus:bg-blue-50 flex items-center justify-between">
               <div className="flex items-center gap-1">
                 <AlertTriangle className="h-3 w-3" />
                 <SelectValue placeholder="Status" />
               </div>
               <ChevronDown className="h-3 w-3 flex-shrink-0" />
             </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Status</SelectItem>
              <SelectItem value="in_stock" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Em Estoque</SelectItem>
              <SelectItem value="low_stock" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Estoque Baixo</SelectItem>
              <SelectItem value="out_of_stock" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Sem Estoque</SelectItem>
            </SelectContent>
          </Select>

                                           {/* Filtro de Fornecedor */}
            <Select value={filters.supplier} onValueChange={(value) => onFilterChange('supplier', value)}>
              <SelectTrigger className="h-7 w-24 border-0 bg-transparent text-gray-900 text-xs shadow-none pl-0 pr-1 hover:bg-blue-50 focus:bg-blue-50 flex items-center justify-between">
                <div className="flex items-center gap-0">
                  <Building2 className="h-3 w-3" />
                  <SelectValue placeholder="Fornecedor" />
                </div>
                <ChevronDown className="h-3 w-3 flex-shrink-0" />
              </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Fornecedor</SelectItem>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier} value={supplier} className="hover:bg-gray-100 focus:bg-gray-100 text-xs">
                  {supplier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default InventoryFilterBar;
