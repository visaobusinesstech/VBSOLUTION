import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Crown, Shield, User, GraduationCap } from 'lucide-react';
import { Employee } from '@/types/employee';

interface EmployeesStatsProps {
  employees: Employee[];
}

const EmployeesStats = ({ employees }: EmployeesStatsProps) => {
  const getRoleInfo = (role: string) => {
    const roleMap = {
      admin: { name: 'Administrador', icon: Crown, color: 'bg-purple-100 text-purple-800' },
      manager: { name: 'Gestor', icon: Shield, color: 'bg-blue-100 text-blue-800' },
      employee: { name: 'Colaborador', icon: User, color: 'bg-green-100 text-green-800' },
      intern: { name: 'Estagiário', icon: GraduationCap, color: 'bg-yellow-100 text-yellow-800' }
    };
    return roleMap[role as keyof typeof roleMap] || roleMap.employee;
  };

  const roleStats = [
    { role: 'admin', count: employees.filter(emp => emp.role === 'admin').length },
    { role: 'manager', count: employees.filter(emp => emp.role === 'manager').length },
    { role: 'employee', count: employees.filter(emp => emp.role === 'employee').length },
    { role: 'intern', count: employees.filter(emp => emp.role === 'intern').length }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="vb-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{employees.length}</div>
          <p className="text-xs text-muted-foreground">
            +1 novo este mês
          </p>
        </CardContent>
      </Card>

      {roleStats.slice(0, 3).map((stat) => {
        const roleInfo = getRoleInfo(stat.role);
        return (
          <Card key={stat.role} className="vb-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{roleInfo.name}s</CardTitle>
              <roleInfo.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.count}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default EmployeesStats;
