import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Calendar, 
  User, 
  Building2,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DetailedCardProps {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue' | 'draft' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  date?: string;
  responsible?: {
    name: string;
    avatar?: string;
  };
  company?: {
    name: string;
    logo?: string;
  };
  total?: number;
  customer?: string;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  className?: string;
  children?: ReactNode;
}

export function DetailedCard({
  id,
  title,
  description,
  status,
  priority,
  date,
  responsible,
  company,
  total,
  customer,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  className = "",
  children
}: DetailedCardProps) {
  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
      'in-progress': { label: 'Em Andamento', className: 'bg-blue-100 text-blue-800 border-blue-300', icon: AlertCircle },
      completed: { label: 'Concluído', className: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
      overdue: { label: 'Atrasado', className: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
      draft: { label: 'Rascunho', className: 'bg-gray-100 text-gray-800 border-gray-300', icon: Clock },
      confirmed: { label: 'Confirmado', className: 'bg-blue-100 text-blue-800 border-blue-300', icon: CheckCircle },
      shipped: { label: 'Enviado', className: 'bg-purple-100 text-purple-800 border-purple-300', icon: AlertCircle },
      delivered: { label: 'Entregue', className: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
      cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800 border-red-300', icon: XCircle }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const getPriorityConfig = (priority: string) => {
    const configs = {
      low: { label: 'Baixa', className: 'bg-gray-100 text-gray-600' },
      medium: { label: 'Média', className: 'bg-blue-100 text-blue-600' },
      high: { label: 'Alta', className: 'bg-orange-100 text-orange-600' },
      urgent: { label: 'Urgente', className: 'bg-red-100 text-red-600' }
    };
    return configs[priority as keyof typeof configs] || configs.medium;
  };

  const statusConfig = getStatusConfig(status);
  const priorityConfig = getPriorityConfig(priority);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className={`border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 truncate">
              {title}
            </CardTitle>
            {description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status and Priority */}
        <div className="flex items-center gap-2">
          <Badge className={`${statusConfig.className} font-medium flex items-center gap-1`}>
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
          <Badge variant="outline" className={`${priorityConfig.className} text-xs`}>
            {priorityConfig.label}
          </Badge>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {new Date(date).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}
          
          {responsible && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={responsible.avatar} />
                  <AvatarFallback className="text-xs">
                    {responsible.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-gray-600 truncate">{responsible.name}</span>
              </div>
            </div>
          )}
          
          {company && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              <div className="flex items-center gap-2">
                {company.logo && (
                  <img src={company.logo} alt={company.name} className="h-5 w-5 object-contain" />
                )}
                <span className="text-gray-600 truncate">{company.name}</span>
              </div>
            </div>
          )}
          
          {customer && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600 truncate">{customer}</span>
            </div>
          )}
          
          {total && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">R$</span>
              <span className="font-semibold text-gray-900">
                {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {/* Custom Content */}
        {children}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
          {onView && (
            <Button variant="ghost" size="sm" onClick={() => onView(id)}>
              <Eye className="h-4 w-4 mr-1" />
              Ver
            </Button>
          )}
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(id)}>
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
          )}
          {onStatusChange && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onStatusChange(id, status)}
              className="text-xs"
            >
              Alterar Status
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 
