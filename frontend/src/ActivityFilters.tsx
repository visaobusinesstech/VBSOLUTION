
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SafeSelectItem } from '@/components/ui/safe-select-item';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, User, Briefcase, RotateCcw } from 'lucide-react';
import { createSafeSelectItems } from '@/utils/selectValidation';

interface ActivityFiltersProps {
  filters: {
    cargo: string;
    mes: string;
    ano: string;
    semana: string;
    dia: string;
    data: string;
    hora: string;
  };
  onFiltersChange: (filters: any) => void;
}

const ActivityFilters = ({ filters, onFiltersChange }: ActivityFiltersProps) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  
  const months = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  const weeks = Array.from({ length: 52 }, (_, i) => ({
    value: `${i + 1}`,
    label: `Semana ${i + 1}`
  }));

  const cargos = [
    'Desenvolvedor',
    'Designer', 
    'Gerente',
    'Analista',
    'Coordenador',
    'Diretor'
  ];

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleFilterChange = (key: string, value: string) => {
    // Convert placeholder values back to empty strings for the parent component
    const actualValue = value.startsWith('all-') || value.startsWith('no-') ? '' : value;
    onFiltersChange({
      ...filters,
      [key]: actualValue
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      cargo: '',
      mes: '',
      ano: '',
      semana: '',
      dia: '',
      data: '',
      hora: ''
    });
  };

  // Create safe select items with enhanced validation
  const cargoItems = createSafeSelectItems(
    cargos,
    (cargo) => cargo,
    (cargo) => cargo,
    'cargo'
  );

  const monthItems = createSafeSelectItems(
    months,
    (month) => month.value,
    (month) => month.label,
    'month'
  );

  const yearItems = createSafeSelectItems(
    years,
    (year) => year.toString(),
    (year) => year.toString(),
    'year'
  );

  const weekItems = createSafeSelectItems(
    weeks.slice(0, 10),
    (week) => week.value,
    (week) => week.label,
    'week'
  );

  const dayItems = createSafeSelectItems(
    days,
    (day) => day.toString(),
    (day) => day.toString(),
    'day'
  );

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Filtros Profissionais
          </h3>
          <Button 
            variant="outline" 
            size="compact" 
            onClick={clearFilters}
            className="bg-white border-gray-300 hover:bg-gray-50"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Limpar Filtros
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {/* Cargo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              Cargo
            </label>
            <Select value={filters.cargo || 'all-cargos'} onValueChange={(value) => handleFilterChange('cargo', value)}>
              <SelectTrigger className="bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                <SafeSelectItem value="all-cargos">Todos os cargos</SafeSelectItem>
                {cargoItems.map((item) => (
                  <SafeSelectItem key={item.key} value={item.value}>
                    {item.label}
                  </SafeSelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mês */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Mês</label>
            <Select value={filters.mes || 'all-months'} onValueChange={(value) => handleFilterChange('mes', value)}>
              <SelectTrigger className="bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                <SafeSelectItem value="all-months">Todos os meses</SafeSelectItem>
                {monthItems.map((item) => (
                  <SafeSelectItem key={item.key} value={item.value}>
                    {item.label}
                  </SafeSelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ano */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Ano</label>
            <Select value={filters.ano || 'all-years'} onValueChange={(value) => handleFilterChange('ano', value)}>
              <SelectTrigger className="bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                <SafeSelectItem value="all-years">Todos os anos</SafeSelectItem>
                {yearItems.map((item) => (
                  <SafeSelectItem key={item.key} value={item.value}>
                    {item.label}
                  </SafeSelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Semana */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Semana</label>
            <Select value={filters.semana || 'all-weeks'} onValueChange={(value) => handleFilterChange('semana', value)}>
              <SelectTrigger className="bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                <SafeSelectItem value="all-weeks">Todas as semanas</SafeSelectItem>
                {weekItems.map((item) => (
                  <SafeSelectItem key={item.key} value={item.value}>
                    {item.label}
                  </SafeSelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dia */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Dia</label>
            <Select value={filters.dia || 'all-days'} onValueChange={(value) => handleFilterChange('dia', value)}>
              <SelectTrigger className="bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                <SafeSelectItem value="all-days">Todos os dias</SafeSelectItem>
                {dayItems.map((item) => (
                  <SafeSelectItem key={item.key} value={item.value}>
                    {item.label}
                  </SafeSelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Data</label>
            <Input
              type="date"
              value={filters.data}
              onChange={(e) => handleFilterChange('data', e.target.value)}
              className="bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500"
            />
          </div>

          {/* Hora */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Hora
            </label>
            <Input
              type="time"
              value={filters.hora}
              onChange={(e) => handleFilterChange('hora', e.target.value)}
              className="bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityFilters;
