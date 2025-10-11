
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SafeSelectItem } from '@/components/ui/safe-select-item';
import { toast } from '@/hooks/use-toast';
import { Employee } from '@/types/employee';

interface EmployeeFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (employee: Omit<Employee, 'id' | 'createdAt'>) => void;
  departments: string[];
  positions: string[];
  employees: Employee[];
}

const EmployeeFormDialog = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  departments, 
  positions, 
  employees 
}: EmployeeFormDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    role: 'employee' as 'admin' | 'manager' | 'employee' | 'intern'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast({
        title: "Erro",
        description: "Nome e e-mail são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (employees.some(emp => emp.email === formData.email)) {
      toast({
        title: "Erro",
        description: "Este e-mail já está cadastrado",
        variant: "destructive",
      });
      return;
    }

    onSubmit(formData);
    setFormData({
      name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      role: 'employee'
    });
    onClose();
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      role: 'employee'
    });
    onClose();
  };

  // Ensure safe values for selects
  const safePositionValue = formData.position || 'no-position';
  const safeDepartmentValue = formData.department || 'no-department';

  const handlePositionChange = (value: string) => {
    setFormData({ ...formData, position: value === 'no-position' ? '' : value });
  };

  const handleDepartmentChange = (value: string) => {
    setFormData({ ...formData, department: value === 'no-department' ? '' : value });
  };

  const handleRoleChange = (value: string) => {
    setFormData({ ...formData, role: value as 'admin' | 'manager' | 'employee' | 'intern' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Funcionário</DialogTitle>
          <DialogDescription>
            Preencha os dados do funcionário para adicionar à equipe
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: João Silva"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="joao@empresa.com.br"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Cargo</Label>
            <Select value={safePositionValue} onValueChange={handlePositionChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cargo" />
              </SelectTrigger>
              <SelectContent>
                <SafeSelectItem value="no-position">Selecione um cargo</SafeSelectItem>
                {positions.filter(position => position && position.trim() !== '').map((position) => (
                  <SafeSelectItem key={position} value={position}>
                    {position}
                  </SafeSelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Setor</Label>
            <Select value={safeDepartmentValue} onValueChange={handleDepartmentChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um setor" />
              </SelectTrigger>
              <SelectContent>
                <SafeSelectItem value="no-department">Selecione um setor</SafeSelectItem>
                {departments.filter(dept => dept && dept.trim() !== '').map((dept) => (
                  <SafeSelectItem key={dept} value={dept}>
                    {dept}
                  </SafeSelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Permissão</Label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SafeSelectItem value="admin">Administrador</SafeSelectItem>
                <SafeSelectItem value="manager">Gestor</SafeSelectItem>
                <SafeSelectItem value="employee">Colaborador</SafeSelectItem>
                <SafeSelectItem value="intern">Estagiário</SafeSelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" className="vb-button-primary">
              Cadastrar Funcionário
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeFormDialog;
