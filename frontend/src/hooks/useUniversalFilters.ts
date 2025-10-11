
import { useState } from 'react';

export interface UniversalFiltersState {
  workGroup: string;
  department: string;
  project: string;
}

export const useUniversalFilters = (initialState?: Partial<UniversalFiltersState>) => {
  const [filters, setFilters] = useState<UniversalFiltersState>({
    workGroup: initialState?.workGroup || '',
    department: initialState?.department || '',
    project: initialState?.project || ''
  });

  const updateWorkGroup = (value: string) => {
    setFilters(prev => ({ ...prev, workGroup: value }));
  };

  const updateDepartment = (value: string) => {
    setFilters(prev => ({ ...prev, department: value }));
  };

  const updateProject = (value: string) => {
    setFilters(prev => ({ ...prev, project: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      workGroup: '',
      department: '',
      project: ''
    });
  };

  const hasActiveFilters = () => {
    return filters.workGroup || filters.department || filters.project;
  };

  return {
    filters,
    updateWorkGroup,
    updateDepartment,
    updateProject,
    clearAllFilters,
    hasActiveFilters
  };
};
