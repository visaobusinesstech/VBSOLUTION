import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar,
  Users,
  AlertCircle,
  Target,
  TrendingUp
} from 'lucide-react';

interface DashboardFiltersProps {
  filters: {
    dateRange: string;
    status: string;
    priority: string;
    responsible: string;
    type: string;
  };
  onFilterChange: (key: string, value: string) => void;
  activities: any[];
  employees: any[];
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  filters,
  onFilterChange,
  activities,
  employees
}) => {
  const filterVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
    hover: { scale: 1.02, transition: { duration: 0.2 } }
  };

  // Contar quantos filtros estão ativos
  const activeFiltersCount = Object.values(filters).filter(value => value !== 'all').length;

  // Obter dados únicos para os filtros
  const uniqueStatuses = [...new Set(activities.map(a => a.status))];
  const uniquePriorities = [...new Set(activities.map(a => a.priority))];
  const uniqueTypes = [...new Set(activities.map(a => a.type))];
  const uniqueResponsibles = [...new Set(activities.map(a => a.responsible_id).filter(Boolean))];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluídas';
      case 'in_progress': return 'Em Progresso';
      case 'pending': return 'Pendentes';
      case 'open': return 'Abertas';
      case 'cancelled': return 'Canceladas';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : `Usuário ${employeeId.slice(0, 8)}`;
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={filterVariants}
      className="p-4 pt-6"
      style={{ fontFamily: 'Helvetica Neue, sans-serif' }}
    >
      {activeFiltersCount > 0 && (
        <div className="flex items-center justify-start mb-4">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} ativo{activeFiltersCount > 1 ? 's' : ''}
          </Badge>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Filtro de Período */}
        <motion.div
          variants={filterVariants}
          whileHover="hover"
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4 inline mr-1" />
            Período
          </label>
          <Select value={filters.dateRange} onValueChange={(value) => onFilterChange('dateRange', value)}>
            <SelectTrigger className="w-full bg-transparent border-gray-300">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os períodos</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Últimos 7 dias</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Filtro de Status */}
        <motion.div
          variants={filterVariants}
          whileHover="hover"
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <AlertCircle className="h-4 w-4 inline mr-1" />
            Status
          </label>
          <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
            <SelectTrigger className="w-full bg-transparent border-gray-300">
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {uniqueStatuses.map(status => (
                <SelectItem key={status} value={status}>
                  {getStatusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Filtro de Prioridade */}
        <motion.div
          variants={filterVariants}
          whileHover="hover"
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Target className="h-4 w-4 inline mr-1" />
            Prioridade
          </label>
          <Select value={filters.priority} onValueChange={(value) => onFilterChange('priority', value)}>
            <SelectTrigger className="w-full bg-transparent border-gray-300">
              <SelectValue placeholder="Selecione a prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as prioridades</SelectItem>
              {uniquePriorities.map(priority => (
                <SelectItem key={priority} value={priority}>
                  {getPriorityLabel(priority)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Filtro de Responsável */}
        <motion.div
          variants={filterVariants}
          whileHover="hover"
          transition={{ delay: 0.3 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="h-4 w-4 inline mr-1" />
            Responsável
          </label>
          <Select value={filters.responsible} onValueChange={(value) => onFilterChange('responsible', value)}>
            <SelectTrigger className="w-full bg-transparent border-gray-300">
              <SelectValue placeholder="Selecione o responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os responsáveis</SelectItem>
              {uniqueResponsibles.map(responsibleId => (
                <SelectItem key={responsibleId} value={responsibleId}>
                  {getEmployeeName(responsibleId)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Filtro de Tipo */}
        <motion.div
          variants={filterVariants}
          whileHover="hover"
          transition={{ delay: 0.4 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <TrendingUp className="h-4 w-4 inline mr-1" />
            Tipo
          </label>
          <Select value={filters.type} onValueChange={(value) => onFilterChange('type', value)}>
            <SelectTrigger className="w-full bg-transparent border-gray-300">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {uniqueTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>
      </div>

      {/* Informação do total de atividades */}
      <div className="flex items-center justify-end mt-4 pt-3 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Total de atividades: <span className="font-medium text-gray-900">{activities.length}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardFilters;
