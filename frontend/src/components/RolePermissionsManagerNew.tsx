import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  CheckCircle, 
  AlertCircle,
  ChevronDown,
  ChevronUp
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
  description?: string;
  level: number;
  company_id: string;
  status: string;
}

interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  granted: boolean;
}

const RolePermissionsManagerNew: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [permissions, setPermissions] = useState<SystemPermission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [isMinimized, setIsMinimized] = useState(true);
  const [minimizedModules, setMinimizedModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Carregando dados...');
      
      const companyId = '11111111-1111-1111-1111-111111111111';
      
      // Carregar dados em paralelo
      const [rolesResult, permissionsResult, rolePermissionsResult] = await Promise.all([
        supabase
          .from('company_roles')
          .select('*')
          .eq('company_id', companyId)
          .eq('status', 'active')
          .order('level', { ascending: false }),
        
        supabase
          .from('system_permissions')
          .select('*')
          .order('module', { ascending: true }),
        
        supabase
          .from('role_permissions')
          .select('*')
      ]);

      console.log('Resultados:', {
        roles: rolesResult.data?.length || 0,
        permissions: permissionsResult.data?.length || 0,
        rolePermissions: rolePermissionsResult.data?.length || 0
      });

      if (rolesResult.error) throw rolesResult.error;
      if (permissionsResult.error) throw permissionsResult.error;
      if (rolePermissionsResult.error) throw rolePermissionsResult.error;

      setRoles(rolesResult.data || []);
      setPermissions(permissionsResult.data || []);
      setRolePermissions(rolePermissionsResult.data || []);
      
      // Selecionar o primeiro cargo se disponível
      if (rolesResult.data && rolesResult.data.length > 0) {
        setSelectedRoleId(rolesResult.data[0].id);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
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

      if (existingPermission) {
        // Atualizar permissão existente
        const { error } = await supabase
          .from('role_permissions')
          .update({ granted })
          .eq('id', existingPermission.id);

        if (error) throw error;
      } else {
        // Criar nova permissão
        const { error } = await supabase
          .from('role_permissions')
          .insert({
            role_id: selectedRoleId,
            permission_id: permissionId,
            granted
          });

        if (error) throw error;
      }

      // Recarregar dados
      await loadData();

    } catch (error) {
      console.error('Erro ao salvar permissão:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleModuleMinimize = (module: string) => {
    setMinimizedModules(prev => ({
      ...prev,
      [module]: !prev[module]
    }));
  };

  const handleSelectAllPermissions = async () => {
    if (!selectedRoleId || permissions.length === 0) return;

    try {
      setSaving(true);

      // Criar todas as permissões como concedidas
      const permissionsToInsert = permissions.map(permission => ({
        role_id: selectedRoleId,
        permission_id: permission.id,
        granted: true
      }));

      const { error } = await supabase
        .from('role_permissions')
        .upsert(permissionsToInsert, {
          onConflict: 'role_id,permission_id'
        });

      if (error) throw error;

      // Recarregar dados
      await loadData();

    } catch (error) {
      console.error('Erro ao conceder todas as permissões:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeAllPermissions = async () => {
    if (!selectedRoleId) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', selectedRoleId);

      if (error) throw error;

      // Recarregar dados
      await loadData();

    } catch (error) {
      console.error('Erro ao revogar todas as permissões:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAllChanges = async () => {
    if (!selectedRoleId) return;

    try {
      setSaving(true);
      
      // Recarregar dados para garantir que tudo está salvo
      await loadData();
      
      console.log('Todas as alterações foram salvas com sucesso!');

    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
    } finally {
      setSaving(false);
    }
  };

  // Computed values
  const selectedRole = roles.find(role => role.id === selectedRoleId);
  const selectedRolePermissions = rolePermissions.filter(rp => rp.role_id === selectedRoleId);

  const getRolePermissionCount = (roleId: string) => {
    return rolePermissions.filter(rp => rp.role_id === roleId && rp.granted).length;
  };

  const hasRoleBeenEdited = (roleId: string) => {
    return rolePermissions.some(rp => rp.role_id === roleId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Carregando permissões...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Bloco Unificado de Cargo e Permissões */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900">🔧 Configuração de Permissões</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 px-3 text-sm border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {isMinimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllPermissions}
                disabled={saving || !selectedRoleId}
                className="h-8 px-3 text-sm border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Conceder Todas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevokeAllPermissions}
                disabled={saving || !selectedRoleId}
                className="h-8 px-3 text-sm border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Revogar Todas
              </Button>
              <Button
                onClick={handleSaveAllChanges}
                disabled={saving || !selectedRoleId}
                className="h-8 px-4 text-sm text-white hover:opacity-90"
                style={{ backgroundColor: '#4A5477' }}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
        
        {!isMinimized && (
          <div className="p-6 space-y-6">
            {/* Seleção de Cargo */}
            {roles.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <h4 className="font-medium text-gray-900 mb-2">Nenhum cargo encontrado</h4>
                <p className="text-sm text-gray-500">
                  Crie cargos na seção "Cargos" acima para configurar permissões.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecionar Cargo
                  </label>
                  <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                    <SelectTrigger className="w-full h-11 border-gray-300 focus:border-gray-400 focus:ring-gray-400">
                      <SelectValue placeholder="Selecione um cargo para configurar as permissões" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium text-gray-900">{role.name}</span>
                            <div className="flex items-center gap-2 ml-4">
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                Nível {role.level}
                              </span>
                              {hasRoleBeenEdited(role.id) && (
                                <span className="text-xs text-white bg-gray-600 px-2 py-1 rounded">
                                  {getRolePermissionCount(role.id)} permissões
                                </span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedRole && (
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-1">{selectedRole.name}</h4>
                    <p className="text-sm text-gray-600">
                      Nível {selectedRole.level} • {getRolePermissionCount(selectedRole.id)} permissões configuradas
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Permissões */}
            {selectedRoleId && permissions.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Permissões do Sistema</h4>
                  <span className="text-sm text-gray-500">
                    {permissions.length} permissões disponíveis
                  </span>
                </div>
                
                {/* Agrupar permissões por módulo/página */}
                {Object.entries(
                  permissions.reduce((acc, permission) => {
                    if (!acc[permission.module]) {
                      acc[permission.module] = [];
                    }
                    acc[permission.module].push(permission);
                    return acc;
                  }, {} as Record<string, SystemPermission[]>)
                ).map(([module, modulePermissions]) => {
                  // Mapear módulos para páginas
                  const getPageLabel = (module: string) => {
                    const pageMap: Record<string, string> = {
                      'arquivos': 'Arquivos',
                      'atividades': 'Atividades',
                      'calendario': 'Calendário',
                      'colaboracao': 'Colaboração',
                      'configuracoes': 'Configurações',
                      'empresas': 'Empresas',
                      'funcionarios': 'Funcionários',
                      'grupos_trabalho': 'Grupos de Trabalho',
                      'inventario': 'Inventário',
                      'leads_vendas': 'Leads & Vendas',
                      'projetos': 'Projetos',
                      'relatorios': 'Relatórios'
                    };
                    return pageMap[module] || module;
                  };

                  const isModuleMinimized = minimizedModules[module];

                  return (
                    <div key={module} className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                        <h5 className="font-medium text-gray-900">{getPageLabel(module)}</h5>
                        <div className="flex-1 h-px bg-gray-200 ml-2"></div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleModuleMinimize(module)}
                          className="h-6 w-6 p-0 border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          {isModuleMinimized ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                        </Button>
                      </div>
                      
                      {!isModuleMinimized && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ml-6">
                        {modulePermissions.map((permission) => {
                          const rolePermission = selectedRolePermissions.find(
                            rp => rp.permission_id === permission.id
                          );
                          const isGranted = rolePermission?.granted || false;

                          return (
                            <div key={permission.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              <Checkbox
                                id={permission.id}
                                checked={isGranted}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(permission.id, checked as boolean)
                                }
                                disabled={saving}
                                className="border-gray-300 mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <label 
                                  htmlFor={permission.id}
                                  className="text-sm font-medium text-gray-900 cursor-pointer block leading-tight"
                                >
                                  {permission.description}
                                </label>
                              </div>
                              {isGranted && (
                                <CheckCircle className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
                              )}
                            </div>
                          );
                        })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RolePermissionsManagerNew;
