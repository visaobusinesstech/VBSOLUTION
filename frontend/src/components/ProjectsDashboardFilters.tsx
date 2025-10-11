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
  DollarSign,
  FolderOpen
} from 'lucide-react';

interface ProjectsDashboardFiltersProps {
  filters: {
    dateRange: string;
    status: string;
    priority: string;
    responsible: string;
    budget: string;
  };
  onFilterChange: (key: string, value: string) => void;
  projects: any[];
  employees: any[];
}

const ProjectsDashboardFilters: React.FC<ProjectsDashboardFiltersProps> = ({
  filters,
  onFilterChange,
  projects,
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
  const uniqueStatuses = [...new Set(projects.map(p => p.status))];
  const uniquePriorities = [...new Set(projects.map(p => p.priority))];
  const uniqueResponsibles = [...new Set(projects.map(p => p.responsible_id).filter(Boolean))];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluídos';
      case 'active': return 'Ativos';
      case 'planning': return 'Planejamento';
      case 'on_hold': return 'Pausados';
      case 'cancelled': return 'Cancelados';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente';
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  const getBudgetLabel = (budget: string) => {
    switch (budget) {
      case 'low': return 'Baixo (até R$ 10k)';
      case 'medium': return 'Médio (R$ 10k - R$ 50k)';
      case 'high': return 'Alto (R$ 50k - R$ 100k)';
      case 'very_high': return 'Muito Alto (acima de R$ 100k)';
      default: return budget;
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

        {/* Filtro de Orçamento */}
        <motion.div
          variants={filterVariants}
          whileHover="hover"
          transition={{ delay: 0.4 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="h-4 w-4 inline mr-1" />
            Orçamento
          </label>
          <Select value={filters.budget} onValueChange={(value) => onFilterChange('budget', value)}>
            <SelectTrigger className="w-full bg-transparent border-gray-300">
              <SelectValue placeholder="Selecione o orçamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os orçamentos</SelectItem>
              <SelectItem value="low">Baixo (até R$ 10k)</SelectItem>
              <SelectItem value="medium">Médio (R$ 10k - R$ 50k)</SelectItem>
              <SelectItem value="high">Alto (R$ 50k - R$ 100k)</SelectItem>
              <SelectItem value="very_high">Muito Alto (acima de R$ 100k)</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>
      </div>


      {/* Informação do total de projetos */}
      <div className="flex items-center justify-end mt-4 pt-3 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Total de projetos: <span className="font-medium text-gray-900">{projects.length}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectsDashboardFilters;
