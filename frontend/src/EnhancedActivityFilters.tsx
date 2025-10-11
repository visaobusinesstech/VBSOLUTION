
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SafeSelectItem } from '@/components/ui/safe-select-item';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, User, Briefcase, RotateCcw, Users, Building } from 'lucide-react';

interface EnhancedActivityFiltersProps {
  filters: {
    cargo: string;
    mes: string;
    ano: string;
    semana: string;
    dia: string;
    data: string;
    hora: string;
    grupoTrabalho: string;
    setor: string;
  };
  onFiltersChange: (filters: any) => void;
}

const EnhancedActivityFilters = ({ filters, onFiltersChange }: EnhancedActivityFiltersProps) => {
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

  // Mock data for Work Groups and Departments (these would come from Settings page)
  const gruposTrabalho = [
    'Equipe de Desenvolvimento',
    'Equipe de Marketing',
    'Equipe de Vendas',
    'Equipe de Suporte',
    'Equipe Executiva'
  ];

  const setores = [
    'Tecnologia',
    'Marketing',
    'Vendas',
    'Recursos Humanos',
    'Financeiro',
    'Operações'
  ];

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
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
      hora: '',
      grupoTrabalho: '',
      setor: ''
    });
  };

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

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Grupo de Trabalho */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <Users className="h-3 w-3" />
              Grupo de Trabalho
            </label>
            <Select value={filters.grupoTrabalho || 'no-selection'} onValueChange={(value) => handleFilterChange('grupoTrabalho', value === 'no-selection' ? '' : value)}>
              <SelectTrigger className="bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                <SafeSelectItem value="no-selection">Selecionar grupo</SafeSelectItem>
                {gruposTrabalho.map((grupo) => (
                  <SafeSelectItem key={grupo} value={grupo}>
                    {grupo}
                  </SafeSelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Setor */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <Building className="h-3 w-3" />
              Setor
            </label>
            <Select value={filters.setor || 'no-selection'} onValueChange={(value) => handleFilterChange('setor', value === 'no-selection' ? '' : value)}>
              <SelectTrigger className="bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                <SafeSelectItem value="no-selection">Selecionar setor</SafeSelectItem>
                {setores.map((setor) => (
                  <SafeSelectItem key={setor} value={setor}>
                    {setor}
                  </SafeSelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cargo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              Cargo
            </label>
            <Select value={filters.cargo || 'no-selection'} onValueChange={(value) => handleFilterChange('cargo', value === 'no-selection' ? '' : value)}>
              <SelectTrigger className="bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                <SafeSelectItem value="no-selection">Selecionar cargo</SafeSelectItem>
                {cargos.map((cargo) => (
                  <SafeSelectItem key={cargo} value={cargo}>
                    {cargo}
                  </SafeSelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mês */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Mês</label>
            <Select value={filters.mes || 'no-selection'} onValueChange={(value) => handleFilterChange('mes', value === 'no-selection' ? '' : value)}>
              <SelectTrigger className="bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                <SafeSelectItem value="no-selection">Selecionar mês</SafeSelectItem>
                {months.map((month) => (
                  <SafeSelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SafeSelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ano */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Ano</label>
            <Select value={filters.ano || 'no-selection'} onValueChange={(value) => handleFilterChange('ano', value === 'no-selection' ? '' : value)}>
              <SelectTrigger className="bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                <SafeSelectItem value="no-selection">Selecionar ano</SafeSelectItem>
                {years.map((year) => (
                  <SafeSelectItem key={year} value={year.toString()}>
                    {year}
                  </SafeSelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Second row for additional filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {/* Semana */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Semana</label>
            <Select value={filters.semana || 'no-selection'} onValueChange={(value) => handleFilterChange('semana', value === 'no-selection' ? '' : value)}>
              <SelectTrigger className="bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                <SafeSelectItem value="no-selection">Selecionar semana</SafeSelectItem>
                {weeks.slice(0, 10).map((week) => (
                  <SafeSelectItem key={week.value} value={week.value}>
                    {week.label}
                  </SafeSelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dia */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Dia</label>
            <Select value={filters.dia || 'no-selection'} onValueChange={(value) => handleFilterChange('dia', value === 'no-selection' ? '' : value)}>
              <SelectTrigger className="bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                <SafeSelectItem value="no-selection">Selecionar dia</SafeSelectItem>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <SafeSelectItem key={day} value={day.toString()}>
                    {day}
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

export default EnhancedActivityFilters;
