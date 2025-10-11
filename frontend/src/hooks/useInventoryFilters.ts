import { useState, useCallback } from 'react';

export interface InventoryFilterState {
  category: 'all' | string;
  status: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  supplier: 'all' | string;
  dateRange: 'all' | 'today' | 'week' | 'month' | 'overdue';
  search: string;
}

export interface InventoryFilterOptions {
  category?: 'all' | string;
  status?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  supplier?: 'all' | string;
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'overdue';
  search?: string;
}

export const useInventoryFilters = (initialFilters?: InventoryFilterOptions) => {
  const [filters, setFilters] = useState<InventoryFilterState>({
    category: 'all',
    status: 'all',
    supplier: 'all',
    dateRange: 'all',
    search: '',
    ...initialFilters
  });

  const updateFilter = useCallback((key: keyof InventoryFilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<InventoryFilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      category: 'all',
      status: 'all',
      supplier: 'all',
      dateRange: 'all',
      search: ''
    });
  }, []);

  const getDateRangeFilter = useCallback(() => {
    if (filters.dateRange === 'all') return null;
    
    const now = new Date();
    switch (filters.dateRange) {
      case 'today':
        return {
          start_date: now.toISOString().split('T')[0],
          end_date: now.toISOString().split('T')[0]
        };
      case 'week':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const weekEnd = new Date(now.setDate(now.getDate() + 6));
        return {
          start_date: weekStart.toISOString().split('T')[0],
          end_date: weekEnd.toISOString().split('T')[0]
        };
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          start_date: monthStart.toISOString().split('T')[0],
          end_date: monthEnd.toISOString().split('T')[0]
        };
      case 'overdue':
        return {
          start_date: '1900-01-01',
          end_date: now.toISOString().split('T')[0]
        };
      default:
        return null;
    }
  }, [filters.dateRange]);

  const getFilterParams = useCallback(() => {
    const params: any = {};
    
    // Filtro de data
    const dateRange = getDateRangeFilter();
    if (dateRange) {
      params.start_date = dateRange.start_date;
      params.end_date = dateRange.end_date;
    }
    
    // Filtro de categoria
    if (filters.category !== 'all') {
      params.category = filters.category;
    }
    
    // Filtro de status
    if (filters.status !== 'all') {
      params.status = filters.status;
    }
    
    // Filtro de fornecedor
    if (filters.supplier !== 'all') {
      params.supplier = filters.supplier;
    }
    
    // Filtro de busca
    if (filters.search.trim()) {
      params.search = filters.search.trim();
    }
    
    return params;
  }, [filters, getDateRangeFilter]);

  return {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    getFilterParams,
    getDateRangeFilter
  };
};
