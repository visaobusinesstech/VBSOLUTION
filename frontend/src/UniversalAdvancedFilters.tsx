
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SafeSelectItem } from '@/components/ui/safe-select-item';
import { Label } from '@/components/ui/label';
import { Filter, X } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { createSafeSelectItems } from '@/utils/selectValidation';

interface UniversalAdvancedFiltersProps {
  selectedWorkGroup?: string;
  selectedDepartment?: string;
  selectedProject?: string;
  onWorkGroupChange?: (value: string) => void;
  onDepartmentChange?: (value: string) => void;
  onProjectChange?: (value: string) => void;
  onClearAll?: () => void;
}

const UniversalAdvancedFilters = ({
  selectedWorkGroup = '',
  selectedDepartment = '',
  selectedProject = '',
  onWorkGroupChange = () => {},
  onDepartmentChange = () => {},
  onProjectChange = () => {},
  onClearAll
}: UniversalAdvancedFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { state } = useProject();

  const handleWorkGroupChange = (value: string) => {
    onWorkGroupChange(value === 'all-groups' ? '' : value);
  };

  const handleDepartmentChange = (value: string) => {
    onDepartmentChange(value === 'all-departments' ? '' : value);
  };

  const handleProjectChange = (value: string) => {
    onProjectChange(value === 'all-projects' ? '' : value);
  };

  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    } else {
      handleWorkGroupChange('all-groups');
      handleDepartmentChange('all-departments');
      handleProjectChange('all-projects');
    }
  };

  const hasActiveFilters = selectedWorkGroup || selectedDepartment || selectedProject;

  // Create safe select items with enhanced validation
  const workGroupItems = createSafeSelectItems(
    state.workGroups || [],
    (group) => group,
    (group) => group,
    'universal-workgroup'
  );

  const departmentItems = createSafeSelectItems(
    state.departments || [],
    (dept) => dept,
    (dept) => dept,
    'universal-department'
  );

  const projectItems = createSafeSelectItems(
    (state.projects || []).filter(project => project && project.id && project.name),
    (project) => project.id,
    (project) => project.name,
    'universal-project'
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="compact"
          className={`gap-2 ${hasActiveFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : ''}`}
        >
          <Filter className="h-3 w-3" />
          Filtros
          {hasActiveFilters && (
            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {[selectedWorkGroup, selectedDepartment, selectedProject].filter(Boolean).length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-white shadow-lg border border-gray-200" align="start">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Filtros Avançados</h4>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="compact" 
                onClick={handleClearAll}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-gray-700">Grupo de Trabalho</Label>
              <Select value={selectedWorkGroup || 'all-groups'} onValueChange={handleWorkGroupChange}>
                <SelectTrigger className="h-6 bg-white">
                  <SelectValue placeholder="Todos os grupos" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SafeSelectItem value="all-groups">Todos os grupos</SafeSelectItem>
                  {workGroupItems.map((item) => (
                    <SafeSelectItem key={item.key} value={item.value}>
                      {item.label}
                    </SafeSelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-700">Setor</Label>
              <Select value={selectedDepartment || 'all-departments'} onValueChange={handleDepartmentChange}>
                <SelectTrigger className="h-6 bg-white">
                  <SelectValue placeholder="Todos os setores" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SafeSelectItem value="all-departments">Todos os setores</SafeSelectItem>
                  {departmentItems.map((item) => (
                    <SafeSelectItem key={item.key} value={item.value}>
                      {item.label}
                    </SafeSelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-700">Projeto</Label>
              <Select value={selectedProject || 'all-projects'} onValueChange={handleProjectChange}>
                <SelectTrigger className="h-6 bg-white">
                  <SelectValue placeholder="Todos os projetos" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SafeSelectItem value="all-projects">Todos os projetos</SafeSelectItem>
                  {projectItems.map((item) => (
                    <SafeSelectItem key={item.key} value={item.value}>
                      {item.label}
                    </SafeSelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UniversalAdvancedFilters;
