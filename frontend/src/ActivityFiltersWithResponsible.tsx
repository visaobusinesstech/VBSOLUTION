
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Filter, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import ResponsibleFilter from '@/components/ResponsibleFilter';

interface ActivityFiltersWithResponsibleProps {
  employees: any[];
  selectedResponsibles: string[];
  onResponsibleChange: (responsibles: string[]) => void;
  selectedPriorities: string[];
  onPriorityChange: (priorities: string[]) => void;
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;
}

const priorities = [
  { id: 'low', label: 'Baixa', color: 'bg-green-100 text-green-700' },
  { id: 'medium', label: 'Média', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'high', label: 'Alta', color: 'bg-red-100 text-red-700' }
];

const statuses = [
  { id: 'pending', label: 'Pendente', color: 'bg-gray-100 text-gray-700' },
  { id: 'in_progress', label: 'Em Progresso', color: 'bg-blue-100 text-blue-700' },
  { id: 'completed', label: 'Concluída', color: 'bg-green-100 text-green-700' },
  { id: 'cancelled', label: 'Cancelada', color: 'bg-red-100 text-red-700' }
];

const ActivityFiltersWithResponsible = ({
  employees,
  selectedResponsibles,
  onResponsibleChange,
  selectedPriorities,
  onPriorityChange,
  selectedStatuses,
  onStatusChange
}: ActivityFiltersWithResponsibleProps) => {
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const handleTogglePriority = (priorityId: string) => {
    if (selectedPriorities.includes(priorityId)) {
      onPriorityChange(selectedPriorities.filter(id => id !== priorityId));
    } else {
      onPriorityChange([...selectedPriorities, priorityId]);
    }
  };

  const handleToggleStatus = (statusId: string) => {
    if (selectedStatuses.includes(statusId)) {
      onStatusChange(selectedStatuses.filter(id => id !== statusId));
    } else {
      onStatusChange([...selectedStatuses, statusId]);
    }
  };

  const clearAllFilters = () => {
    onResponsibleChange([]);
    onPriorityChange([]);
    onStatusChange([]);
  };

  const hasActiveFilters = selectedResponsibles.length > 0 || selectedPriorities.length > 0 || selectedStatuses.length > 0;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Responsible Filter */}
      <ResponsibleFilter
        employees={employees}
        selectedResponsibles={selectedResponsibles}
        onResponsibleChange={onResponsibleChange}
      />

      {/* Priority Filter */}
      <Popover open={isPriorityOpen} onOpenChange={setIsPriorityOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="text-gray-600 h-8 px-3 text-xs border-gray-200 flex items-center gap-2 hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            Prioridade
            {selectedPriorities.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs bg-orange-100 text-orange-700">
                {selectedPriorities.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="start">
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Filtrar por Prioridade</h4>
            <div className="space-y-2">
              {priorities.map((priority) => (
                <div key={priority.id} className="flex items-center space-x-2 hover:bg-gray-50 p-1 rounded">
                  <Checkbox
                    id={priority.id}
                    checked={selectedPriorities.includes(priority.id)}
                    onCheckedChange={() => handleTogglePriority(priority.id)}
                  />
                  <label
                    htmlFor={priority.id}
                    className="text-sm cursor-pointer flex-1"
                  >
                    <Badge className={priority.color}>{priority.label}</Badge>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Status Filter */}
      <Popover open={isStatusOpen} onOpenChange={setIsStatusOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="text-gray-600 h-8 px-3 text-xs border-gray-200 flex items-center gap-2 hover:bg-gray-50"
          >
            <Calendar className="h-4 w-4" />
            Status
            {selectedStatuses.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs bg-purple-100 text-purple-700">
                {selectedStatuses.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="start">
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Filtrar por Status</h4>
            <div className="space-y-2">
              {statuses.map((status) => (
                <div key={status.id} className="flex items-center space-x-2 hover:bg-gray-50 p-1 rounded">
                  <Checkbox
                    id={status.id}
                    checked={selectedStatuses.includes(status.id)}
                    onCheckedChange={() => handleToggleStatus(status.id)}
                  />
                  <label
                    htmlFor={status.id}
                    className="text-sm cursor-pointer flex-1"
                  >
                    <Badge className={status.color}>{status.label}</Badge>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="text-gray-500 h-8 px-2 text-xs hover:text-gray-700"
        >
          <X className="h-3 w-3 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
};

export default ActivityFiltersWithResponsible;
