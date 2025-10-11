
import { useState } from 'react';

export interface AdvancedFiltersState {
  workGroup: string;
  department: string;
  project: string;
}

export const useAdvancedFilters = () => {
  const [filters, setFilters] = useState<AdvancedFiltersState>({
    workGroup: '',
    department: '',
    project: ''
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
