import React from 'react';
import { motion } from 'framer-motion';
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
  AlertTriangle,
  DollarSign,
  Package
} from 'lucide-react';

interface WriteoffsDashboardFiltersProps {
  filters: {
    dateRange: string;
    status: string;
    reason: string;
    value: string;
  };
  onFilterChange: (key: string, value: string) => void;
  writeoffs: any[];
}

const WriteoffsDashboardFilters: React.FC<WriteoffsDashboardFiltersProps> = ({
  filters,
  onFilterChange,
  writeoffs
}) => {
  const filterVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
    hover: { scale: 1.02, transition: { duration: 0.2 } }
  };

  // Contar quantos filtros estão ativos
  const activeFiltersCount = Object.values(filters).filter(value => value !== 'all').length;

  // Obter dados únicos para os filtros
  const uniqueStatuses = [...new Set(writeoffs.map(w => w.status))];
  const uniqueReasons = [...new Set(writeoffs.map(w => w.reason))];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluídas';
      case 'pending': return 'Pendentes';
      case 'draft': return 'Rascunho';
      case 'cancelled': return 'Canceladas';
      default: return status;
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'damage': return 'Danos';
      case 'expired': return 'Vencimento';
      case 'theft': return 'Roubo';
      case 'loss': return 'Perda';
      case 'other': return 'Outros';
      default: return reason;
    }
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
            <Package className="h-4 w-4 inline mr-1" />
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

        {/* Filtro de Motivo */}
        <motion.div
          variants={filterVariants}
          whileHover="hover"
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <AlertTriangle className="h-4 w-4 inline mr-1" />
            Motivo
          </label>
          <Select value={filters.reason} onValueChange={(value) => onFilterChange('reason', value)}>
            <SelectTrigger className="w-full bg-transparent border-gray-300">
              <SelectValue placeholder="Selecione o motivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os motivos</SelectItem>
              {uniqueReasons.map(reason => (
                <SelectItem key={reason} value={reason}>
                  {getReasonLabel(reason)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Filtro de Valor */}
        <motion.div
          variants={filterVariants}
          whileHover="hover"
          transition={{ delay: 0.3 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="h-4 w-4 inline mr-1" />
            Valor
          </label>
          <Select value={filters.value} onValueChange={(value) => onFilterChange('value', value)}>
            <SelectTrigger className="w-full bg-transparent border-gray-300">
              <SelectValue placeholder="Selecione o valor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os valores</SelectItem>
              <SelectItem value="low">Baixo (até R$ 100)</SelectItem>
              <SelectItem value="medium">Médio (R$ 100 - R$ 500)</SelectItem>
              <SelectItem value="high">Alto (R$ 500 - R$ 1.000)</SelectItem>
              <SelectItem value="very_high">Muito Alto (acima de R$ 1.000)</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>
      </div>

      {/* Informação do total de baixas */}
      <div className="flex items-center justify-end mt-4 pt-3 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Total de baixas: <span className="font-medium text-gray-900">{writeoffs.length}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default WriteoffsDashboardFilters;
