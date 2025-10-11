import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompanyRole } from '@/hooks/useCompanySettings';
import { Save } from 'lucide-react';

interface PermissionsSelectorProps {
  roles: CompanyRole[];
  onSavePermissions: (roleId: string, permissions: Record<string, boolean>) => Promise<{ success: boolean; error?: Error }>;
}

const PERMISSIONS = {
  dashboard: {
    title: 'Dashboard',
    permissions: [
      { key: 'view_dashboard', label: 'Ver dashboard' },
      { key: 'hide_dashboard', label: 'Ocultar dashboard' },
    ],
  },
  tasks: {
    title: 'Tarefas',
    permissions: [
      { key: 'create_tasks', label: 'Criar tarefas' },
      { key: 'edit_tasks', label: 'Editar tarefas' },
      { key: 'delete_tasks', label: 'Excluir tarefas' },
    ],
  },
  reports: {
    title: 'Relatórios',
    permissions: [
      { key: 'access_reports', label: 'Acessar relatórios' },
    ],
  },
  settings: {
    title: 'Configurações',
    permissions: [
      { key: 'manage_settings', label: 'Gerenciar configurações' },
    ],
  },
  clients: {
    title: 'Clientes',
    permissions: [
      { key: 'create_edit_clients', label: 'Criar e editar clientes' },
      { key: 'view_own_data', label: 'Ver somente dados próprios' },
    ],
  },
  whatsapp: {
    title: 'WhatsApp',
    permissions: [
      { key: 'send_messages', label: 'Enviar mensagens' },
    ],
  },
};

export function PermissionsSelector({ roles, onSavePermissions }: PermissionsSelectorProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const selectedRole = roles.find(role => role.id === selectedRoleId);

  useEffect(() => {
    if (selectedRole) {
      setPermissions(selectedRole.permissions || {});
    }
  }, [selectedRole]);

  const handlePermissionChange = (key: string, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [key]: checked,
    }));
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;

    setLoading(true);
    try {
      const result = await onSavePermissions(selectedRoleId, permissions);
      if (result.success) {
        // Feedback visual de sucesso
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="role-select">Selecionar Cargo</Label>
        <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um cargo para configurar permissões" />
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

      {selectedRole && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Permissões para: {selectedRole.name}</h4>
            <Button onClick={handleSave} disabled={loading} className="flex items-center gap-2 text-white hover:opacity-90" style={{ backgroundColor: '#4A5477' }}>
              <Save className="h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar Permissões'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(PERMISSIONS).map(([category, categoryData]) => (
              <div key={category} className="space-y-3 p-4 border rounded-lg">
                <h5 className="font-medium text-gray-900">{categoryData.title}</h5>
                <div className="space-y-2">
                  {categoryData.permissions.map((permission) => (
                    <div key={permission.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={permission.key}
                        checked={permissions[permission.key] || false}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(permission.key, checked as boolean)
                        }
                      />
                      <Label htmlFor={permission.key} className="text-sm font-normal">
                        {permission.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
