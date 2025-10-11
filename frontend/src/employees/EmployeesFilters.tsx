
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SafeSelectItem } from '@/components/ui/safe-select-item';
import { Search, Filter } from 'lucide-react';
import UniversalAdvancedFilters from '@/components/UniversalAdvancedFilters';

interface EmployeesFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedDepartment: string;
  onDepartmentChange: (value: string) => void;
  selectedRole: string;
  onRoleChange: (value: string) => void;
  departments: string[];
  selectedWorkGroup?: string;
  selectedProject?: string;
  onWorkGroupChange?: (value: string) => void;
  onProjectChange?: (value: string) => void;
}

const EmployeesFilters = ({
  searchTerm,
  onSearchChange,
  selectedDepartment,
  onDepartmentChange,
  selectedRole,
  onRoleChange,
  departments,
  selectedWorkGroup = '',
  selectedProject = '',
  onWorkGroupChange = () => {},
  onProjectChange = () => {}
}: EmployeesFiltersProps) => {
  // Ensure we have valid arrays and filter out any empty/invalid values
  const validDepartments = React.useMemo(() => {
    if (!Array.isArray(departments)) return [];
    return departments.filter(dept => dept && typeof dept === 'string' && dept.trim() !== '');
  }, [departments]);

  const validRoles = ['admin', 'manager', 'employee', 'intern'];

  // Ensure selected values are never empty strings
  const safeRoleValue = selectedRole || 'all-roles';

  const handleRoleChange = (value: string) => {
    onRoleChange(value === 'all-roles' ? '' : value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar funcionários por nome, e-mail ou cargo..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={safeRoleValue} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SafeSelectItem value="all-roles">Todas as permissões</SafeSelectItem>
            {validRoles.map((role, index) => (
              <SafeSelectItem key={`role-${index}`} value={role}>
                {role === 'admin' ? 'Administrador' : 
                 role === 'manager' ? 'Gestor' : 
                 role === 'employee' ? 'Colaborador' : 'Estagiário'}
              </SafeSelectItem>
            ))}
          </SelectContent>
        </Select>

        <UniversalAdvancedFilters
          selectedWorkGroup={selectedWorkGroup}
          selectedDepartment={selectedDepartment}
          selectedProject={selectedProject}
          onWorkGroupChange={onWorkGroupChange}
          onDepartmentChange={onDepartmentChange}
          onProjectChange={onProjectChange}
        />
      </div>
    </div>
  );
};

export default EmployeesFilters;
