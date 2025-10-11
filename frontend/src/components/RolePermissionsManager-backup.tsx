import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { 
  Shield, 
  Save, 
  Users, 
  Building2, 
  Package, 
  Handshake, 
  FileText, 
  Calendar, 
  User, 
  Users2, 
  FolderOpen, 
  BarChart3,
  Settings as SettingsIcon,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface SystemPermission {
  id: string;
  module: string;
  action: string;
  description: string;
}

interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  granted: boolean;
}

interface CompanyRole {
  id: string;
  name: string;
  description: string;
  level: number;
}

interface RolePermissionsManagerProps {
  companyId?: string;
}

const moduleIcons = {
  atividades: <Calendar className="h-4 w-4" />,
  projetos: <Building2 className="h-4 w-4" />,
  empresas: <Building2 className="h-4 w-4" />,
  inventario: <Package className="h-4 w-4" />,
  leads_vendas: <Handshake className="h-4 w-4" />,
  calendario: <Calendar className="h-4 w-4" />,
  colaboracao: <Users className="h-4 w-4" />,
  funcionarios: <User className="h-4 w-4" />,
  grupos_trabalho: <Users2 className="h-4 w-4" />,
  arquivos: <FileText className="h-4 w-4" />,
  relatorios: <BarChart3 className="h-4 w-4" />,
  configuracoes: <SettingsIcon className="h-4 w-4" />
};

const moduleLabels = {
  atividades: 'Atividades',
  projetos: 'Projetos', 
  empresas: 'Empresas',
  inventario: 'Inventário',
  leads_vendas: 'Leads e Vendas',
  calendario: 'Calendário',
  colaboracao: 'Colaboração',
  funcionarios: 'Funcionários',
  grupos_trabalho: 'Grupos de Trabalho',
  arquivos: 'Arquivos',
  relatorios: 'Relatórios',
  configuracoes: 'Configurações'
};

export default function RolePermissionsManager({ companyId }: RolePermissionsManagerProps) {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const isMountedRef = useRef(true);
  
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [permissions, setPermissions] = useState<SystemPermission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    isMountedRef.current = true;
    loadData();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [companyId, user]);

  const loadData = async () => {
    try {
      if (isMountedRef.current) {
        setLoading(true);
      }
      
      // Buscar company_id do usuário
      const { data: userCompany } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('auth_user_id', user?.id)
        .single();

      if (!userCompany) {
        throw new Error('Usuário não está associado a nenhuma empresa');
      }

      // Carregar cargos da empresa
      const { data: rolesData, error: rolesError } = await supabase
        .from('company_roles')
        .select('*')
        .eq('company_id', userCompany.company_id)
        .order('level', { ascending: false });

      if (rolesError) throw rolesError;

      // Carregar permissões do sistema
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('system_permissions')
        .select('*')
        .order('module', { ascending: true });

      if (permissionsError) throw permissionsError;

      // Carregar permissões dos cargos
      const { data: rolePermissionsData, error: rolePermissionsError } = await supabase
        .from('role_permissions')
        .select('*');

      if (rolePermissionsError) throw rolePermissionsError;

      if (isMountedRef.current) {
        setRoles(rolesData || []);
        setPermissions(permissionsData || []);
        setRolePermissions(rolePermissionsData || []);
      }
      
      if (rolesData && rolesData.length > 0 && isMountedRef.current) {
        setSelectedRoleId(rolesData[0].id);
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showError('Erro ao carregar dados das permissões');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handlePermissionChange = async (permissionId: string, granted: boolean) => {
    if (!selectedRoleId) return;

    try {
      // Verificar se a permissão já existe
      const existingPermission = rolePermissions.find(
        rp => rp.role_id === selectedRoleId && rp.permission_id === permissionId
      );

      if (existingPermission) {
        // Atualizar permissão existente
        const { error } = await supabase
          .from('role_permissions')
          .update({ granted })
          .eq('id', existingPermission.id);

        if (error) throw error;

        if (isMountedRef.current) {
          setRolePermissions(prev => 
            prev.map(rp => 
              rp.id === existingPermission.id 
                ? { ...rp, granted }
                : rp
            )
          );
        }
      } else {
        // Criar nova permissão
        const { data, error } = await supabase
          .from('role_permissions')
          .insert({
            role_id: selectedRoleId,
            permission_id: permissionId,
            granted
          })
          .select()
          .single();

        if (error) throw error;

        if (isMountedRef.current) {
          setRolePermissions(prev => [...prev, data]);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar permissão:', error);
      showError('Erro ao atualizar permissão');
    }
  };

  const handleGrantAll = async () => {
    if (!selectedRoleId) return;

    if (isMountedRef.current) {
      setSaving(true);
    }
    try {
      for (const permission of permissions) {
        await handlePermissionChange(permission.id, true);
      }
      success('Todas as permissões foram concedidas!');
    } catch (error) {
      showError('Erro ao conceder todas as permissões');
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  const handleRevokeAll = async () => {
    if (!selectedRoleId) return;

    if (isMountedRef.current) {
      setSaving(true);
    }
    try {
      for (const permission of permissions) {
        await handlePermissionChange(permission.id, false);
      }
      success('Todas as permissões foram revogadas!');
    } catch (error) {
      showError('Erro ao revogar todas as permissões');
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  const getPermissionStatus = (permissionId: string): boolean => {
    const rolePermission = rolePermissions.find(
      rp => rp.role_id === selectedRoleId && rp.permission_id === permissionId
    );
    return rolePermission?.granted || false;
  };

  const getGrantedCount = (): number => {
    return rolePermissions.filter(
      rp => rp.role_id === selectedRoleId && rp.granted
    ).length;
  };

  const getPermissionsByModule = () => {
    const grouped: { [key: string]: SystemPermission[] } = {};
    permissions.forEach(permission => {
      if (!grouped[permission.module]) {
        grouped[permission.module] = [];
      }
      grouped[permission.module].push(permission);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Permissões por Cargo (RBAC)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seleção de Cargo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecionar Cargo
            </label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um cargo para configurar as permissões" />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        Nível {role.level}
                      </Badge>
                      {role.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contador de Permissões */}
          {selectedRoleId && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-600">
                  {getGrantedCount()} de {permissions.length} permissões concedidas
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGrantAll}
                  disabled={saving}
                >
                  Conceder Todas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRevokeAll}
                  disabled={saving}
                >
                  Revogar Todas
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissões por Módulo */}
      {selectedRoleId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(getPermissionsByModule()).map(([module, modulePermissions]) => (
            <Card key={module}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  {moduleIcons[module as keyof typeof moduleIcons]}
                  {moduleLabels[module as keyof typeof moduleLabels]}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {modulePermissions.map(permission => (
                  <div key={permission.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={permission.id}
                      checked={getPermissionStatus(permission.id)}
                      onCheckedChange={(checked) => 
                        handlePermissionChange(permission.id, checked as boolean)
                      }
                    />
                    <label 
                      htmlFor={permission.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {permission.description}
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Aviso quando nenhum cargo está selecionado */}
      {!selectedRoleId && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-600">
                Selecione um cargo para configurar as permissões
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
