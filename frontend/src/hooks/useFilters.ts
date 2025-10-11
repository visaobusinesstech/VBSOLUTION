import { useState, useCallback } from 'react';

export interface FilterState {
  dateRange: 'all' | 'today' | 'week' | 'month' | 'overdue';
  responsibleId: 'all' | string;
  archived: boolean;
  workGroup: 'all' | string;
  search: string;
}

export interface FilterOptions {
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'overdue';
  responsibleId?: 'all' | string;
  archived?: boolean;
  workGroup?: 'all' | string;
  search?: string;
}

export const useFilters = (initialFilters?: FilterOptions) => {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'all',
    responsibleId: 'all',
    archived: false,
    workGroup: 'all',
    search: '',
    ...initialFilters
  });

  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      dateRange: 'all',
      responsibleId: 'all',
      archived: false,
      workGroup: 'all',
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
    
    // Filtro de responsável
    if (filters.responsibleId !== 'all') {
      params.responsible_id = filters.responsibleId;
    }
    
    // Filtro de arquivados
    if (filters.archived) {
      params.archived = true;
    }
    
    // Filtro de grupo de trabalho
    if (filters.workGroup !== 'all') {
      params.work_group = filters.workGroup;
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
