import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { CompanyArea, CompanyRole, CreateUserData } from '@/hooks/useCompanySettings';

interface AddUserModalProps {
  areas: CompanyArea[];
  roles: CompanyRole[];
  onAdd: (userData: CreateUserData) => Promise<{ success: boolean; error?: Error }>;
  trigger?: React.ReactNode;
}

export function AddUserModal({ areas, roles, onAdd, trigger }: AddUserModalProps) {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    birth_date: '',
    phone: '',
    role_id: '',
    area_id: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.email.trim() || !formData.password.trim()) return;

    setLoading(true);
    try {
      const result = await onAdd({
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        birth_date: formData.birth_date || undefined,
        phone: formData.phone || undefined,
        role_id: formData.role_id || undefined,
        area_id: formData.area_id || undefined,
      });
      
      if (result.success) {
        setFormData({
          full_name: '',
          email: '',
          password: '',
          birth_date: '',
          phone: '',
          role_id: '',
          area_id: '',
        });
        setOpen(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      password: '',
      birth_date: '',
      phone: '',
      role_id: '',
      area_id: '',
    });
    setShowPassword(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white">
            <UserPlus className="h-4 w-4" />
            Novo Usuário
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">Novo Usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">
                Nome Completo *
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="Digite o nome completo"
                className="h-10 rounded-md border-gray-300 focus:border-primary focus:ring-primary"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                E-mail *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="usuario@empresa.com"
                className="h-10 rounded-md border-gray-300 focus:border-primary focus:ring-primary"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Senha *
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Digite a senha"
                  className="h-10 rounded-md border-gray-300 focus:border-primary focus:ring-primary pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-10 px-3 py-2 hover:bg-gray-100"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_date" className="text-sm font-medium text-gray-700">
                Data de Nascimento
              </Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleInputChange('birth_date', e.target.value)}
                className="h-10 rounded-md border-gray-300 focus:border-primary focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Telefone
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(99) 99999-9999"
                className="h-10 rounded-md border-gray-300 focus:border-primary focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role_id" className="text-sm font-medium text-gray-700">
                Cargo
              </Label>
              <Select value={formData.role_id} onValueChange={(value) => handleInputChange('role_id', value)}>
                <SelectTrigger className="h-10 rounded-md border-gray-300 focus:border-primary focus:ring-primary">
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="area_id" className="text-sm font-medium text-gray-700">
                Área
              </Label>
              <Select value={formData.area_id} onValueChange={(value) => handleInputChange('area_id', value)}>
                <SelectTrigger className="h-10 rounded-md border-gray-300 focus:border-primary focus:ring-primary">
                  <SelectValue placeholder="Selecione a área" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
              disabled={loading}
              className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.full_name.trim() || !formData.email.trim() || !formData.password.trim()}
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-white"
            >
              {loading ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
