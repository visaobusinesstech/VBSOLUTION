
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

interface ResponsibleFilterProps {
  employees: any[];
  selectedResponsibles: string[];
  onResponsibleChange: (responsibles: string[]) => void;
}

const ResponsibleFilter = ({
  employees,
  selectedResponsibles,
  onResponsibleChange
}: ResponsibleFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.name || 'Funcionário não encontrado';
  };

  const handleToggleResponsible = (responsibleId: string) => {
    if (selectedResponsibles.includes(responsibleId)) {
      onResponsibleChange(selectedResponsibles.filter(id => id !== responsibleId));
    } else {
      onResponsibleChange([...selectedResponsibles, responsibleId]);
    }
  };

  const clearAllFilters = () => {
    onResponsibleChange([]);
  };

  const handleSelectAll = () => {
    if (selectedResponsibles.length === employees.length) {
      onResponsibleChange([]);
    } else {
      onResponsibleChange(employees.map(e => e.id));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="text-gray-600 h-8 px-3 text-xs border-gray-200 flex items-center gap-2 hover:bg-gray-50"
          >
            <User className="h-4 w-4" />
            Responsável
            {selectedResponsibles.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs bg-blue-100 text-blue-700">
                {selectedResponsibles.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Filtrar por Responsável</h4>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
                >
                  {selectedResponsibles.length === employees.length ? 'Desmarcar' : 'Todos'}
                </Button>
                {selectedResponsibles.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-6 px-2 text-xs text-gray-600 hover:text-gray-700"
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {employees.map((employee) => (
                <div key={employee.id} className="flex items-center space-x-2 hover:bg-gray-50 p-1 rounded">
                  <Checkbox
                    id={employee.id}
                    checked={selectedResponsibles.includes(employee.id)}
                    onCheckedChange={() => handleToggleResponsible(employee.id)}
                  />
                  <label
                    htmlFor={employee.id}
                    className="text-sm cursor-pointer flex-1 flex items-center gap-2"
                  >
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-medium">
                        {employee.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {employee.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active filters display */}
      {selectedResponsibles.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {selectedResponsibles.slice(0, 3).map((responsibleId) => (
            <Badge
              key={responsibleId}
              variant="secondary"
              className="text-xs flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors"
            >
              {getEmployeeName(responsibleId)}
              <X
                className="h-3 w-3 cursor-pointer hover:text-blue-900"
                onClick={() => handleToggleResponsible(responsibleId)}
              />
            </Badge>
          ))}
          {selectedResponsibles.length > 3 && (
            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
              +{selectedResponsibles.length - 3}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default ResponsibleFilter;
