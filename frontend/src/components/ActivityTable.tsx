import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Building2, 
  User, 
  Calendar, 
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ActivityTableProps {
  activities: any[];
  companies: any[];
  employees: any[];
  onActivityClick?: (activityId: string) => void;
}

const ActivityTable = ({ activities, companies, employees, onActivityClick }: ActivityTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const getCompanyName = (companyId?: string) => {
    if (!companyId) return 'Sem empresa';
    const company = companies.find(c => c.id === companyId);
    return company?.fantasyName || 'Empresa não encontrada';
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.name || 'Funcionário não encontrado';
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      'completed': 'bg-green-100 text-green-700 border-green-200',
      'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
      'pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'backlog': 'bg-gray-100 text-gray-700 border-gray-200',
      'overdue': 'bg-red-100 text-red-700 border-red-200'
    };
    return statusColors[status as keyof typeof statusColors] || statusColors.pending;
  };

  const getStatusText = (status: string) => {
    const statusTexts = {
      'completed': 'Concluída',
      'in-progress': 'Em Andamento',
      'pending': 'Pendente',
      'backlog': 'Backlog',
      'overdue': 'Atrasada'
    };
    return statusTexts[status as keyof typeof statusTexts] || 'Pendente';
  };

  const getPriorityColor = (priority: string) => {
    const priorityColors = {
      'high': 'bg-red-100 text-red-700 border-red-200',
      'medium': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'low': 'bg-green-100 text-green-700 border-green-200'
    };
    return priorityColors[priority as keyof typeof priorityColors] || priorityColors.medium;
  };

  const getPriorityText = (priority: string) => {
    const priorityTexts = {
      'high': 'Alta',
      'medium': 'Média',
      'low': 'Baixa'
    };
    return priorityTexts[priority as keyof typeof priorityTexts] || 'Média';
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getCompanyName(activity.companyId).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleRowClick = (activityId: string, companyId?: string) => {
    if (onActivityClick) {
      onActivityClick(activityId);
    } else {
      setExpandedRow(expandedRow === activityId ? null : activityId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-4 p-4 border-b border-gray-200/50">
        <div className="flex-1">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar atividades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-200"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 bg-white border-gray-200">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="completed">Concluídas</SelectItem>
            <SelectItem value="in-progress">Em Andamento</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="backlog">Backlog</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 border-gray-200">
              <TableHead className="font-semibold text-gray-700">Atividade</TableHead>
              <TableHead className="font-semibold text-gray-700">Empresa</TableHead>
              <TableHead className="font-semibold text-gray-700">Responsável</TableHead>
              <TableHead className="font-semibold text-gray-700">Data</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="font-semibold text-gray-700">Prioridade</TableHead>
              <TableHead className="font-semibold text-gray-700 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredActivities.map((activity) => (
              <>
                <TableRow 
                  key={activity.id}
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer border-gray-200"
                  onClick={() => handleRowClick(activity.id, activity.companyId)}
                >
                  <TableCell className="font-medium">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
                      {activity.description && (
                        <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                          {activity.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {getCompanyName(activity.companyId)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {getEmployeeName(activity.responsibleId)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {activity.date.toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                      {getStatusText(activity.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${getPriorityColor(activity.priority)}`}>
                      {getPriorityText(activity.priority)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className={`h-4 w-4 transition-transform ${
                        expandedRow === activity.id ? 'rotate-90' : ''
                      }`} />
                    </Button>
                  </TableCell>
                </TableRow>
                
                {!onActivityClick && expandedRow === activity.id && (
                  <TableRow className="bg-gray-50/30">
                    <TableCell colSpan={7} className="py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Detalhes da Atividade</h4>
                          <div className="space-y-1">
                            <p><span className="font-medium">Tipo:</span> {activity.type || 'Não especificado'}</p>
                            <p><span className="font-medium">Cliente:</span> {activity.clientName || 'Não especificado'}</p>
                            <p><span className="font-medium">Criado em:</span> {activity.createdAt?.toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Comentários</h4>
                          <p className="text-gray-600">
                            {activity.comments || 'Nenhum comentário adicional.'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
        
        {filteredActivities.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Nenhuma atividade encontrada</h3>
            <p className="text-sm">Tente ajustar os filtros ou criar uma nova atividade.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTable;
