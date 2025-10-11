import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Mail, 
  Phone, 
  Edit, 
  Trash2, 
  Crown, 
  Shield, 
  User, 
  GraduationCap,
  Users,
  Plus
} from 'lucide-react';
import { Employee } from '@/types/employee';

interface EmployeesListProps {
  employees: Employee[];
  onDeleteEmployee: (employeeId: string) => void;
  onAddNew: () => void;
}

const EmployeesList = ({ employees, onDeleteEmployee, onAddNew }: EmployeesListProps) => {
  const getRoleInfo = (role: string) => {
    const roleMap = {
      admin: { name: 'Administrador', icon: Crown, color: 'bg-purple-100 text-purple-800' },
      manager: { name: 'Gestor', icon: Shield, color: 'bg-blue-100 text-blue-800' },
      employee: { name: 'Colaborador', icon: User, color: 'bg-green-100 text-green-800' },
      intern: { name: 'Estagiário', icon: GraduationCap, color: 'bg-yellow-100 text-yellow-800' }
    };
    return roleMap[role as keyof typeof roleMap] || roleMap.employee;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  if (employees.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhum funcionário encontrado</h3>
        <p className="text-muted-foreground mb-4">
          Comece cadastrando sua equipe no sistema
        </p>
        <Button onClick={onAddNew} className="vb-button-primary">
          <Plus className="mr-2 h-4 w-4" />
          Cadastrar Primeiro Funcionário
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {employees.map((employee) => {
        const roleInfo = getRoleInfo(employee.role);
        const RoleIcon = roleInfo.icon;

        return (
          <Card key={employee.id} className="vb-card hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={employee.photo} />
                  <AvatarFallback className="bg-vb-secondary text-vb-primary font-medium">
                    {getInitials(employee.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg leading-tight truncate">{employee.name}</CardTitle>
                  <CardDescription className="text-sm truncate">
                    {employee.position} - {employee.department}
                  </CardDescription>
                  <Badge className={`mt-1 text-xs ${roleInfo.color}`}>
                    <RoleIcon className="w-3 h-3 mr-1" />
                    {roleInfo.name}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{employee.email}</span>
                </div>
                {employee.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{employee.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  Desde {employee.createdAt.toLocaleDateString('pt-BR')}
                </span>
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => onDeleteEmployee(employee.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default EmployeesList;
