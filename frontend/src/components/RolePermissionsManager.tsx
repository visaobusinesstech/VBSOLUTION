import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { 
  Shield, 
  Save, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface SystemPermission {
  id: string;
  module: string;
  action: string;
  description: string;
}

interface CompanyRole {
  id: string;
  name: string;
  level: number;
  company_id: string;
}

interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  granted: boolean;
  permission?: SystemPermission;
}

interface RolePermissionsManagerProps {
  companyId?: string;
}

const RolePermissionsManager: React.FC<RolePermissionsManagerProps> = ({ companyId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMountedRef = useRef(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [permissions, setPermissions] = useState<SystemPermission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  useEffect(() => {
    isMountedRef.current = true;
    
    if (user?.id) {
      loadData();
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [user?.id, companyId]);

  const loadData = async () => {
    try {
      if (isMountedRef.current) {
        setLoading(true);
      }

      console.log('🔍 Iniciando carregamento de dados...');

      // Buscar company_id do usuário logado
      let finalCompanyId = companyId;
      
      if (!finalCompanyId && user?.id) {
        console.log('🔍 Buscando company_id do usuário...');
        
        const { data: userCompany, error: userError } = await supabase
          .from('company_users')
          .select('company_id')
          .eq('auth_user_id', user.id)
          .single();

        if (userError) {
          console.error('Erro ao buscar company_id:', userError);
          // Fallback: buscar company_id da tabela companies
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('id')
            .limit(1)
            .single();
          
          if (companyError) {
            console.error('Erro no fallback:', companyError);
            throw companyError;
          }
          
          finalCompanyId = companyData?.id;
        } else {
          finalCompanyId = userCompany?.company_id;
        }
      }

      console.log('Company ID encontrado:', finalCompanyId);

      if (!finalCompanyId) {
        throw new Error('Company ID não encontrado');
      }

      // Carregar dados em paralelo
      const [rolesResult, permissionsResult, rolePermissionsResult] = await Promise.all([
        supabase
          .from('company_roles')
          .select('*')
          .eq('company_id', finalCompanyId)
          .eq('status', 'active')
          .order('level', { ascending: false }),
        
        supabase
          .from('system_permissions')
          .select('*')
          .order('module', { ascending: true }),
        
        supabase
          .from('role_permissions')
          .select(`
            *,
            permission:system_permissions(*)
          `)
      ]);

      if (rolesResult.error) throw rolesResult.error;
      if (permissionsResult.error) throw permissionsResult.error;
      if (rolePermissionsResult.error) throw rolePermissionsResult.error;

      console.log('Dados carregados:', {
        roles: rolesResult.data?.length || 0,
        permissions: permissionsResult.data?.length || 0,
        rolePermissions: rolePermissionsResult.data?.length || 0
      });

      console.log('🔍 Detalhes das permissões carregadas:');
      if (permissionsResult.data) {
        permissionsResult.data.forEach((perm, index) => {
          console.log(`  ${index + 1}. ${perm.description} (${perm.module}:${perm.action})`);
        });
      }

      if (isMountedRef.current) {
        setRoles(rolesResult.data || []);
        setPermissions(permissionsResult.data || []);
        setRolePermissions(rolePermissionsResult.data || []);
        
        // Selecionar o primeiro cargo se disponível
        if (rolesResult.data && rolesResult.data.length > 0) {
          setSelectedRoleId(rolesResult.data[0].id);
        }
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados. Verifique o console para mais detalhes.',
        variant: 'destructive'
      });
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handlePermissionChange = async (permissionId: string, granted: boolean) => {
    if (!selectedRoleId) return;

    try {
      setSaving(true);

      // Verificar se já existe uma permissão para este cargo
      const existingPermission = rolePermissions.find(
        rp => rp.role_id === selectedRoleId && rp.permission_id === permissionId
      );

      let result;
      if (existingPermission) {
        // Atualizar permissão existente
        result = await supabase
          .from('role_permissions')
          .update({ granted })
          .eq('id', existingPermission.id);
      } else {
        // Criar nova permissão
        result = await supabase
          .from('role_permissions')
          .insert({
            role_id: selectedRoleId,
            permission_id,
            granted
          });
      }

      if (result.error) throw result.error;

      // Atualizar estado local
      if (existingPermission) {
        setRolePermissions(prev => 
          prev.map(rp => 
            rp.id === existingPermission.id 
              ? { ...rp, granted }
              : rp
          )
        );
      } else {
        // Recarregar permissões para obter o ID da nova permissão
        const { data: newPermissions } = await supabase
          .from('role_permissions')
          .select(`
            *,
            permission:system_permissions(*)
          `);
        
        if (newPermissions) {
          setRolePermissions(newPermissions);
        }
      }

      setHasChanges(true);

      toast({
        title: 'Sucesso',
        description: 'Permissão salva automaticamente!',
        variant: 'default'
      });

    } catch (error) {
      console.error('Erro ao salvar permissão:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar permissão',
        variant: 'destructive'
      });
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  const handleSaveAllChanges = async () => {
    try {
      setSaving(true);
      
      // Recarregar dados para sincronizar
      await loadData();
      setHasChanges(false);
      
      toast({
        title: 'Sucesso',
        description: 'Todas as alterações foram salvas!',
        variant: 'default'
      });
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar alterações',
        variant: 'destructive'
      });
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  const handleSelectAllPermissions = async () => {
    if (!selectedRoleId) return;

    try {
      setSaving(true);

      // Obter todas as permissões que não estão concedidas
      const unGrantedPermissions = permissions.filter(permission => {
        const rolePermission = rolePermissions.find(
          rp => rp.role_id === selectedRoleId && rp.permission_id === permission.id
        );
        return !rolePermission || !rolePermission.granted;
      });

      // Conceder todas as permissões
      for (const permission of unGrantedPermissions) {
        await handlePermissionChange(permission.id, true);
      }

      toast({
        title: 'Sucesso',
        description: 'Todas as permissões foram concedidas!',
        variant: 'default'
      });

    } catch (error) {
      console.error('Erro ao conceder todas as permissões:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao conceder todas as permissões',
        variant: 'destructive'
      });
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  const handleRevokeAllPermissions = async () => {
    if (!selectedRoleId) return;

    try {
      setSaving(true);

      // Obter todas as permissões que estão concedidas
      const grantedPermissions = rolePermissions.filter(
        rp => rp.role_id === selectedRoleId && rp.granted
      );

      // Revogar todas as permissões
      for (const rolePermission of grantedPermissions) {
        await handlePermissionChange(rolePermission.permission_id, false);
      }

      toast({
        title: 'Sucesso',
        description: 'Todas as permissões foram revogadas!',
        variant: 'default'
      });

    } catch (error) {
      console.error('Erro ao revogar todas as permissões:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao revogar todas as permissões',
        variant: 'destructive'
      });
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  const getRolePermissionCount = (roleId: string) => {
    return rolePermissions.filter(rp => rp.role_id === roleId && rp.granted).length;
  };

  const hasRoleBeenEdited = (roleId: string) => {
    return rolePermissions.some(rp => rp.role_id === roleId);
  };

  const selectedRole = roles.find(role => role.id === selectedRoleId);
  const selectedRolePermissions = rolePermissions.filter(rp => rp.role_id === selectedRoleId);
  
  console.log('🔍 Estado atual do componente:', {
    roles: roles.length,
    permissions: permissions.length,
    rolePermissions: rolePermissions.length,
    selectedRoleId,
    selectedRole: selectedRole?.name,
    selectedRolePermissions: selectedRolePermissions.length
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-gray-600">Carregando permissões...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Shield className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Permissões por Cargo (RBAC)</h2>
          <p className="text-gray-500">Configure as permissões para cada cargo da empresa</p>
        </div>
        {hasChanges && (
          <Badge variant="outline" className="ml-auto">
            Alterações pendentes
          </Badge>
        )}
        {!hasChanges && !saving && (
          <Badge variant="default" className="ml-auto bg-green-600">
            Salvo
          </Badge>
        )}
      </div>

      {/* Seleção de Cargo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Selecionar Cargo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum cargo encontrado</h3>
              <p className="text-gray-600 mb-4">
                Crie cargos na seção "Cargos" acima para configurar permissões.
              </p>
              <p className="text-sm text-gray-500">
                Debug: Verifique o console do navegador para mais informações sobre o carregamento dos dados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um cargo para configurar as permissões" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{role.name}</span>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant="outline" className="text-xs">
                            Nível {role.level}
                          </Badge>
                          {hasRoleBeenEdited(role.id) && (
                            <Badge variant="default" className="text-xs bg-blue-600">
                              {getRolePermissionCount(role.id)} permissões
                            </Badge>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedRole && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">{selectedRole.name}</h4>
                  <p className="text-sm text-blue-700">
                    Nível {selectedRole.level} • {getRolePermissionCount(selectedRole.id)} permissões configuradas
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuração de Permissões */}
      {selectedRoleId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                Permissões do Cargo: {selectedRole?.name}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllPermissions}
                  disabled={saving}
                >
                  Conceder Todas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRevokeAllPermissions}
                  disabled={saving}
                >
                  Revogar Todas
                </Button>
                <Button
                  onClick={handleSaveAllChanges}
                  disabled={saving || !hasChanges}
                  size="sm"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {permissions.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma permissão encontrada</h3>
                  <p className="text-gray-600">
                    Execute o script de inserção de permissões no Supabase.
                  </p>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>{permissions.length}</strong> permissões carregadas para este cargo
                  </p>
                </div>
              )}
              
              {permissions.length > 0 && (
                Object.entries(
                  permissions.reduce((acc, permission) => {
                    if (!acc[permission.module]) {
                      acc[permission.module] = [];
                    }
                    acc[permission.module].push(permission);
                    return acc;
                  }, {} as Record<string, SystemPermission[]>)
                ).map(([module, modulePermissions]) => (
                  <div key={module} className="space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      {module.charAt(0).toUpperCase() + module.slice(1)}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {modulePermissions.map((permission) => {
                        const rolePermission = selectedRolePermissions.find(
                          rp => rp.permission_id === permission.id
                        );
                        const isGranted = rolePermission?.granted || false;

                        return (
                          <div key={permission.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <Checkbox
                              id={permission.id}
                              checked={isGranted}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(permission.id, checked as boolean)
                              }
                              disabled={saving}
                            />
                            <div className="flex-1">
                              <label 
                                htmlFor={permission.id}
                                className="text-sm font-medium text-gray-900 cursor-pointer"
                              >
                                {permission.description}
                              </label>
                              <p className="text-xs text-gray-500">
                                {permission.module} • {permission.action}
                              </p>
                            </div>
                            {isGranted && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RolePermissionsManager;
