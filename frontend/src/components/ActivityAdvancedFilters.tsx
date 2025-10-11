
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SafeSelectItem } from '@/components/ui/safe-select-item';
import { Label } from '@/components/ui/label';
import { useProject } from '@/contexts/ProjectContext';
import { createSafeSelectItems } from '@/utils/selectValidation';

interface ActivityAdvancedFiltersProps {
  selectedWorkGroup: string;
  selectedDepartment: string;
  selectedProject: string;
  onWorkGroupChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onProjectChange: (value: string) => void;
}

const ActivityAdvancedFilters = ({
  selectedWorkGroup,
  selectedDepartment,
  selectedProject,
  onWorkGroupChange,
  onDepartmentChange,
  onProjectChange
}: ActivityAdvancedFiltersProps) => {
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

  // Create safe select items with enhanced validation
  const workGroupItems = createSafeSelectItems(
    state.workGroups || [],
    (group) => group,
    (group) => group,
    'adv-workgroup'
  );

  const departmentItems = createSafeSelectItems(
    state.departments || [],
    (dept) => dept,
    (dept) => dept,
    'adv-department'
  );

  const projectItems = createSafeSelectItems(
    (state.projects || []).filter(project => project && project.id && project.name),
    (project) => project.id,
    (project) => project.name,
    'adv-project'
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Filtros Avançados</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="workGroup">Grupo de Trabalho</Label>
          <Select value={selectedWorkGroup || 'all-groups'} onValueChange={handleWorkGroupChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os grupos" />
            </SelectTrigger>
            <SelectContent>
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
          <Label htmlFor="department">Setor</Label>
          <Select value={selectedDepartment || 'all-departments'} onValueChange={handleDepartmentChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os setores" />
            </SelectTrigger>
            <SelectContent>
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
          <Label htmlFor="project">Projeto</Label>
          <Select value={selectedProject || 'all-projects'} onValueChange={handleProjectChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os projetos" />
            </SelectTrigger>
            <SelectContent>
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
  );
};

export default ActivityAdvancedFilters;
