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
  atividades: null,
  projetos: null,
  empresas: null,
  inventario: null,
  leads_vendas: null,
  calendario: null,
  colaboracao: null,
  funcionarios: null,
  grupos_trabalho: null,
  arquivos: null,
  relatorios: null,
  configuracoes: null
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
    console.log('useEffect executado');
    console.log('Dependências:', { companyId, user: user?.id });
    
    isMountedRef.current = true;
    loadData();
    
    return () => {
      console.log('🧹 useEffect cleanup');
      isMountedRef.current = false;
    };
  }, [companyId, user]);

  const loadData = async () => {
    console.log('Iniciando loadData...');
    console.log('Props recebidas:', { companyId, user: user?.id });
    
    try {
      if (isMountedRef.current) {
        setLoading(true);
      }
      
      // Usar company ID fixo para teste
      const finalCompanyId = '11111111-1111-1111-1111-111111111111';
      console.log('Usando Company ID fixo:', finalCompanyId);

      // Carregar todos os dados em paralelo para melhor performance
      console.log('Fazendo requisições para o Supabase...');
      
      const [rolesResult, permissionsResult, rolePermissionsResult] = await Promise.all([
        // Carregar cargos da empresa
        supabase
          .from('company_roles')
          .select('*')
          .eq('company_id', finalCompanyId)
          .order('level', { ascending: false }),
          
        // Carregar TODAS as permissões do sistema (garantindo as 52)
        supabase
          .from('system_permissions')
          .select('*')
          .order('module', { ascending: true }),
          
        // Carregar permissões dos cargos
        supabase
          .from('role_permissions')
          .select('*')
      ]);

      console.log('📥 Resultados recebidos:');
      console.log('   - Roles:', rolesResult);
      console.log('   - Permissions:', permissionsResult);
      console.log('   - Role Permissions:', rolePermissionsResult);

      if (rolesResult.error) {
        console.error('Erro nos cargos:', rolesResult.error);
        throw rolesResult.error;
      }
      if (permissionsResult.error) {
        console.error('Erro nas permissões:', permissionsResult.error);
        throw permissionsResult.error;
      }
      if (rolePermissionsResult.error) {
        console.error('Erro nas permissões de cargos:', rolePermissionsResult.error);
        throw rolePermissionsResult.error;
      }

      if (isMountedRef.current) {
        console.log('Atualizando estado do componente...');
        
        setRoles(rolesResult.data || []);
        setPermissions(permissionsResult.data || []);
        setRolePermissions(rolePermissionsResult.data || []);
        
        console.log(`Estado atualizado:`, {
          cargos: rolesResult.data?.length || 0,
          permissões: permissionsResult.data?.length || 0,
          permissões_cargos: rolePermissionsResult.data?.length || 0
        });
        
        console.log('Cargos encontrados:', rolesResult.data?.map(r => `${r.name} (ID: ${r.id})`));
        console.log('Permissões encontradas:', permissionsResult.data?.length);
      } else {
        console.log('Componente não está montado, não atualizando estado');
      }
      
      if (rolesResult.data && rolesResult.data.length > 0 && isMountedRef.current) {
        setSelectedRoleId(rolesResult.data[0].id);
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showError('Erro ao carregar dados das permissões');
    } finally {
      if (isMountedRef.current) {
        console.log('Finalizando carregamento...');
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

      // Atualizar estado local
      if (isMountedRef.current) {
        setRolePermissions(prev => {
          const filtered = prev.filter(rp => !(rp.role_id === selectedRoleId && rp.permission_id === permissionId));
          return [...filtered, {
            id: existingPermission?.id || '',
            role_id: selectedRoleId,
            permission_id: permissionId,
            granted
          }];
        });
      }

    } catch (error) {
      console.error('Erro ao alterar permissão:', error);
      showError('Erro ao alterar permissão');
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

  const getRolePermissionCount = (roleId: string): number => {
    return rolePermissions.filter(
      rp => rp.role_id === roleId && rp.granted
    ).length;
  };

  const hasRoleBeenEdited = (roleId: string): boolean => {
    return rolePermissions.some(rp => rp.role_id === roleId);
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

  console.log('Renderizando componente:', { loading, roles: roles.length, permissions: permissions.length });

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
          {/* Seleção de Cargo com Indicadores */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecionar Cargo
            </label>
            <Select value={selectedRoleId} onValueChange={(value) => {
              console.log('🔄 Cargo selecionado:', value);
              setSelectedRoleId(value);
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um cargo para configurar as permissões" />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex items-center gap-2 w-full">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        Nível {role.level}
                      </span>
                      <span className="flex-1">{role.name}</span>
                      {hasRoleBeenEdited(role.id) && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          ✓ {getRolePermissionCount(role.id)} configuradas
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estatísticas do Cargo Selecionado */}
          {selectedRoleId && (
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{getGrantedCount()}</span> de{' '}
                <span className="font-medium">{permissions.length}</span> permissões concedidas
              </div>
              <div className="text-sm text-gray-500">
                ({Math.round((getGrantedCount() / permissions.length) * 100)}% configurado)
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissões por Módulo */}
      {selectedRoleId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(getPermissionsByModule()).map(([module, modulePermissions]) => (
            <Card key={module}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {moduleLabels[module as keyof typeof moduleLabels]}
                  <Badge variant="outline" className="ml-auto">
                    {modulePermissions.length}
                  </Badge>
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
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
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

      {/* Mensagem quando nenhum cargo está selecionado */}
      {!selectedRoleId && roles.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum cargo encontrado
            </h3>
            <p className="text-gray-600">
              Crie cargos na seção "Cargos" acima para configurar permissões.
            </p>
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
              <strong>Debug:</strong> Verifique o console do navegador para mais informações sobre o carregamento dos dados.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando nenhuma permissão está disponível */}
      {permissions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma permissão encontrada
            </h3>
            <p className="text-gray-600">
              Execute o script SQL para inserir as permissões do sistema.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
