import { useState, useCallback } from 'react';

export interface SuppliersFilterState {
  dateRange: 'all' | 'today' | 'week' | 'month' | 'recent';
  city: 'all' | string;
  state: 'all' | string;
  activity: 'all' | string;
  search: string;
}

export interface SuppliersFilterOptions {
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'recent';
  city?: 'all' | string;
  state?: 'all' | string;
  activity?: 'all' | string;
  search?: string;
}

export const useSuppliersFilters = (initialFilters?: SuppliersFilterOptions) => {
  const [filters, setFilters] = useState<SuppliersFilterState>({
    dateRange: 'all',
    city: 'all',
    state: 'all',
    activity: 'all',
    search: '',
    ...initialFilters
  });

  const updateFilter = useCallback((key: keyof SuppliersFilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<SuppliersFilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      dateRange: 'all',
      city: 'all',
      state: 'all',
      activity: 'all',
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
      case 'recent':
        const recentStart = new Date(now.setDate(now.getDate() - 30));
        return {
          start_date: recentStart.toISOString().split('T')[0],
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
    
    // Filtro de cidade
    if (filters.city !== 'all') {
      params.city = filters.city;
    }
    
    // Filtro de estado
    if (filters.state !== 'all') {
      params.state = filters.state;
    }
    
    // Filtro de atividade
    if (filters.activity !== 'all') {
      params.activity = filters.activity;
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
