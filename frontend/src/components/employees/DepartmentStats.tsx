import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Employee } from '@/types/employee';

interface DepartmentStatsProps {
  employees: Employee[];
  departments: string[];
}

const DepartmentStats = ({ employees, departments }: DepartmentStatsProps) => {
  const departmentStats = departments.map(dept => ({
    name: dept,
    count: employees.filter(emp => emp.department === dept).length
  }));

  if (departmentStats.length === 0) return null;

  return (
    <Card className="vb-card">
      <CardHeader>
        <CardTitle>Distribuição por Setor</CardTitle>
        <CardDescription>
          Quantidade de funcionários em cada departamento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {departmentStats.map((dept) => (
            <div key={dept.name} className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-vb-primary">{dept.count}</div>
              <div className="text-sm text-muted-foreground">{dept.name}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DepartmentStats;
