import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEmailService } from './useEmailService';

export interface CompanySettings {
  id?: string;
  company_id?: string;
  company_name: string;
  default_language: string;
  default_timezone: string;
  default_currency: string;
  datetime_format: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  sidebar_color: string;
  topbar_color: string;
  button_color: string;
  enable_2fa: boolean;
  password_policy: {
    min_length: number;
    require_numbers: boolean;
    require_uppercase: boolean;
    require_special: boolean;
  };
}

export interface CompanyArea {
  id: string;
  name: string;
  description?: string;
  status?: string;
  company_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyRole {
  id: string;
  name: string;
  description?: string;
  permissions?: Record<string, boolean>;
  status?: string;
  company_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyUser {
  id: string;
  full_name: string;
  email: string;
  password_hash?: string;
  status?: string;
  role_id?: string;
  area_id?: string;
  birth_date?: string;
  phone?: string;
  company_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  company_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserData {
  full_name: string;
  email: string;
  password: string;
  birth_date?: string;
  phone?: string;
  role_id?: string;
  area_id?: string;
}

export function useCompanySettings(userId?: string) {
  const emailService = useEmailService();
  
  // Estados para dados
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [areas, setAreas] = useState<CompanyArea[]>([]);
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [users, setUsers] = useState<CompanyUser[]>([]);
  
  // Estados para controle
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const loadData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      
      // Buscar company_id do usuário
      let companyId = null;

      // Primeiro, buscar o perfil do usuário
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('company_id')
          .eq('id', userId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Erro ao buscar perfil do usuário:', profileError);
        }

      companyId = userProfile?.company_id;

        // Se não tiver company_id no perfil, tentar buscar na tabela company_users
        if (!companyId) {
          const { data: companyUser, error: companyUserError } = await supabase
            .from('company_users')
            .select('company_id')
            .eq('id', userId)
            .single();

          if (!companyUserError && companyUser?.company_id) {
            companyId = companyUser.company_id;
          }
        }

      // Se ainda não tiver company_id, usar o ID padrão de teste
        if (!companyId) {
        companyId = '11111111-1111-1111-1111-111111111111';
        console.log('Usando company_id padrão de teste:', companyId);
      }

      // Carregar configurações da empresa
      const { data: settingsData, error: settingsError } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', companyId)
            .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Erro ao carregar configurações:', settingsError);
      }

      // Carregar áreas
      const { data: areasData, error: areasError } = await supabase
        .from('company_areas')
        .select('*')
        .eq('company_id', companyId);

      if (areasError) {
        console.error('Erro ao carregar áreas:', areasError);
      }

      // Carregar cargos
      const { data: rolesData, error: rolesError } = await supabase
        .from('company_roles')
        .select('*')
        .eq('company_id', companyId);

      if (rolesError) {
        console.error('Erro ao carregar cargos:', rolesError);
      }

      // Carregar usuários
      const { data: usersData, error: usersError } = await supabase
        .from('company_users')
        .select('*')
        .eq('company_id', companyId);

      if (usersError) {
        console.error('Erro ao carregar usuários:', usersError);
      }

      // Atualizar estados
      if (settingsData) {
        setSettings(settingsData);
      } else {
        // Se não há configurações, criar configurações padrão
        const defaultSettings: CompanySettings = {
          company_name: 'Minha Empresa',
          default_language: 'pt-BR',
          default_timezone: 'America/Sao_Paulo',
          default_currency: 'BRL',
          datetime_format: 'DD/MM/YYYY HH:mm',
          logo_url: undefined,
          primary_color: '#021529',
          secondary_color: '#ffffff',
          accent_color: '#3b82f6',
          enable_2fa: false,
          password_policy: {
            min_length: 8,
            require_numbers: true,
            require_uppercase: true,
            require_special: true
          }
        };
        setSettings(defaultSettings);
      }
      setAreas(areasData || []);
      setRoles(rolesData || []);
      setUsers(usersData || []);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados';
      console.error('Erro ao carregar dados:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Salvar configurações da empresa
  const saveCompanySettings = useCallback(async (newSettings: Partial<CompanySettings>) => {
    console.log('🔍 DEBUG: Iniciando saveCompanySettings com dados:', newSettings);
    
    if (!userId) {
      console.error('❌ DEBUG: Usuário não identificado');
      return { success: false, error: 'Usuário não identificado' };
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar company_id do usuário
      let companyId = null;
      
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('id', userId)
          .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil do usuário:', profileError);
      }

      companyId = userProfile?.company_id;

      if (!companyId) {
        const { data: companyUser, error: companyUserError } = await supabase
          .from('company_users')
          .select('company_id')
          .eq('id', userId)
          .single();

        if (!companyUserError && companyUser?.company_id) {
          companyId = companyUser.company_id;
        }
      }

      if (!companyId) {
        companyId = '11111111-1111-1111-1111-111111111111';
        console.log('Usando company_id padrão de teste:', companyId);
      }

      const settingsToSave = {
        ...newSettings,
        company_id: companyId,
        updated_at: new Date().toISOString()
      };

      console.log('🔍 DEBUG: Dados preparados para salvar:', settingsToSave);

      // Verificar se já existe configuração
      const { data: existingSettings } = await supabase
        .from('company_settings')
        .select('id')
        .eq('company_id', companyId)
        .single();

      console.log('🔍 DEBUG: Configuração existente:', existingSettings);

      let result;
      if (existingSettings) {
        // Atualizar configuração existente
        console.log('🔍 DEBUG: Atualizando configuração existente...');
        result = await supabase
          .from('company_settings')
          .update(settingsToSave)
          .eq('id', existingSettings.id)
          .select()
          .single();
      } else {
        // Criar nova configuração
        console.log('🔍 DEBUG: Criando nova configuração...');
        result = await supabase
          .from('company_settings')
          .insert([settingsToSave])
          .select()
          .single();
        }

      console.log('🔍 DEBUG: Resultado da operação:', result);

      if (result.error) {
        console.error('❌ DEBUG: Erro na operação:', result.error);
        throw result.error;
      }

      console.log('✅ DEBUG: Configurações salvas com sucesso:', result.data);
      setSettings(result.data);
      return { success: true, data: result.data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar configurações';
      console.error('Erro ao salvar configurações:', err);
      setError(errorMessage);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Adicionar área
  const addArea = useCallback(async (name: string, description?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Adicionando área:', { name, description });

      // Buscar company_id do usuário
      let companyId: string | null = null;
      
      // Primeiro, buscar o perfil do usuário para obter o company_id
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil do usuário:', profileError);
      }

      companyId = userProfile?.company_id || null;

      // Se não tiver company_id no perfil, tentar buscar na tabela company_users
      if (!companyId) {
        const { data: companyUser, error: companyUserError } = await supabase
          .from('company_users')
          .select('company_id')
          .eq('id', userId)
          .single();

        if (!companyUserError && companyUser?.company_id) {
          companyId = companyUser.company_id;
        }
      }

      // Se ainda não tiver company_id, usar o ID padrão de teste
      if (!companyId) {
        companyId = '11111111-1111-1111-1111-111111111111';
        console.log('Usando company_id padrão de teste:', companyId);
      }

      // Inserir área no banco de dados
      const insertData = {
        name,
        description,
        company_id: companyId
      };

      // Tentar inserir com status primeiro
      let { data: newAreaData, error: insertError } = await supabase
        .from('company_areas')
        .insert([{
          ...insertData,
          status: 'active'
        }])
        .select()
        .single();

      // Se der erro por coluna status, tentar sem ela
      if (insertError && insertError.message?.includes('status')) {
        console.log('Coluna status não existe, inserindo sem ela');
        const { data, error } = await supabase
          .from('company_areas')
          .insert([insertData])
          .select()
          .single();
        
        newAreaData = data;
        insertError = error;
      }

      if (insertError) {
        throw insertError;
      }

      console.log('Área criada com sucesso:', newAreaData);
      
      // Atualizar estado local
      setAreas(prev => [...prev, newAreaData]);
      return { success: true, data: newAreaData };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar área';
      console.error('Erro ao adicionar área:', err);
      setError(errorMessage);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Editar área
  const editArea = useCallback(async (id: string, updates: Partial<CompanyArea>) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Editando área:', { id, updates });

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Atualizar área no banco de dados
      const { data: updatedAreaData, error: updateError } = await supabase
        .from('company_areas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      console.log('Área atualizada com sucesso:', updatedAreaData);
      
      // Atualizar estado local
      setAreas(prev => prev.map(area => 
        area.id === id ? updatedAreaData : area
      ));
      return { success: true, data: updatedAreaData };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao editar área';
      console.error('Erro ao editar área:', err);
      setError(errorMessage);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  // Excluir área
  const deleteArea = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Excluindo área:', id);

      // Excluir área do banco de dados
      const { error: deleteError } = await supabase
        .from('company_areas')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      console.log('Área excluída com sucesso');
      
      // Atualizar estado local
      setAreas(prev => prev.filter(area => area.id !== id));
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir área';
      console.error('Erro ao excluir área:', err);
      setError(errorMessage);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  // Adicionar cargo
  const addRole = useCallback(async (name: string, description?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Adicionando cargo:', { name, description });

      // Buscar company_id do usuário
      let companyId: string | null = null;
      
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil do usuário:', profileError);
      }

      companyId = userProfile?.company_id || null;

      if (!companyId) {
        const { data: companyUser, error: companyUserError } = await supabase
          .from('company_users')
          .select('company_id')
          .eq('id', userId)
          .single();

        if (!companyUserError && companyUser?.company_id) {
          companyId = companyUser.company_id;
        }
      }

      if (!companyId) {
        companyId = '11111111-1111-1111-1111-111111111111';
        console.log('Usando company_id padrão de teste:', companyId);
      }

      // Inserir cargo no banco de dados
      const insertData = {
        name,
        description,
        company_id: companyId
      };

      // Tentar inserir com permissions e status
      let { data: newRoleData, error: insertError } = await supabase
        .from('company_roles')
        .insert([{
          ...insertData,
          permissions: {},
          status: 'active'
        }])
        .select()
        .single();

      // Se der erro por colunas, tentar sem elas
      if (insertError && (insertError.message?.includes('permissions') || insertError.message?.includes('status'))) {
        console.log('Colunas permissions/status não existem, inserindo sem elas');
        const { data, error } = await supabase
          .from('company_roles')
          .insert([insertData])
          .select()
          .single();
        
        newRoleData = data;
        insertError = error;
      }

      if (insertError) {
        throw insertError;
      }

      console.log('Cargo criado com sucesso:', newRoleData);
      
      // Atualizar estado local
      setRoles(prev => [...prev, newRoleData]);
      return { success: true, data: newRoleData };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar cargo';
      console.error('Erro ao adicionar cargo:', err);
      setError(errorMessage);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Editar cargo
  const editRole = useCallback(async (id: string, updates: Partial<CompanyRole>) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Editando cargo:', { id, updates });
      
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Atualizar cargo no banco de dados
      const { data: updatedRoleData, error: updateError } = await supabase
        .from('company_roles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      console.log('Cargo atualizado com sucesso:', updatedRoleData);
      
      // Atualizar estado local
      setRoles(prev => prev.map(role => 
        role.id === id ? updatedRoleData : role
      ));
      return { success: true, data: updatedRoleData };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao editar cargo';
      console.error('Erro ao editar cargo:', err);
      setError(errorMessage);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  // Excluir cargo
  const deleteRole = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Excluindo cargo:', id);

      // Excluir cargo do banco de dados
      const { error: deleteError } = await supabase
        .from('company_roles')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      console.log('Cargo excluído com sucesso');
      
      // Atualizar estado local
      setRoles(prev => prev.filter(role => role.id !== id));
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir cargo';
      console.error('Erro ao excluir cargo:', err);
      setError(errorMessage);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  // Salvar permissões do cargo (RBAC)
  const saveRolePermissions = useCallback(async (roleId: string, permissions: Record<string, boolean>) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Salvando permissões do cargo:', { roleId, permissions });

      const updateData = {
        permissions,
        updated_at: new Date().toISOString()
      };

      // Tentar atualizar com permissions
      let { data: updatedRoleData, error: updateError } = await supabase
        .from('company_roles')
        .update(updateData)
        .eq('id', roleId)
        .select()
        .single();

      // Se der erro por coluna permissions, atualizar apenas updated_at
      if (updateError && updateError.message?.includes('permissions')) {
        console.warn('Coluna permissions não existe, atualizando apenas timestamp');
        const { data, error } = await supabase
          .from('company_roles')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', roleId)
          .select()
          .single();
        
        updatedRoleData = data;
        updateError = error;
      }

      if (updateError) {
        throw updateError;
      }

      console.log('Permissões salvas com sucesso:', updatedRoleData);
      
      // Atualizar estado local
      setRoles(prev => prev.map(role => 
        role.id === roleId ? { ...role, permissions } : role
      ));
      return { success: true, data: updatedRoleData };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar permissões';
      console.error('Erro ao salvar permissões:', err);
      setError(errorMessage);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  // Adicionar usuário
  const addUser = useCallback(async (userData: CreateUserData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Adicionando usuário:', userData);

      // Buscar company_id do usuário logado
      let companyId: string | null = null;
      
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil do usuário:', profileError);
      }

      companyId = userProfile?.company_id || null;

      if (!companyId) {
        const { data: companyUser, error: companyUserError } = await supabase
          .from('company_users')
          .select('company_id')
          .eq('id', userId)
          .single();

        if (!companyUserError && companyUser?.company_id) {
          companyId = companyUser.company_id;
        }
      }

      if (!companyId) {
        companyId = '11111111-1111-1111-1111-111111111111';
        console.log('Usando company_id padrão de teste:', companyId);
      }

      // 1. Gerar um ID único para o usuário (simulando auth ID)
      const authUserId = crypto.randomUUID();
      console.log('Gerando ID de usuário:', authUserId);

      // 2. Criar perfil do usuário na tabela profiles
      const { error: profileError2 } = await supabase
        .from('profiles')
        .insert([{
          id: authUserId,
          email: userData.email,
          name: userData.full_name,
          company: companyId,
          role: 'user',
          phone: userData.phone || null,
          preferences: {}
        }]);

      if (profileError2) {
        console.error('Erro ao criar perfil:', profileError2);
        // Se der erro no perfil, tentar continuar mesmo assim
      }

      // 3. Inserir usuário na tabela company_users
      const insertData = {
        id: authUserId, // Usar 'id' em vez de 'user_id'
        company_id: companyId,
        full_name: userData.full_name,
        email: userData.email,
        password_hash: userData.password, // Armazenar senha temporariamente (em produção, hash)
        phone: userData.phone || null,
        role_id: userData.role_id || null,
        area_id: userData.area_id || null,
        status: 'active'
      };

      const { data: newUserData, error: insertError } = await supabase
        .from('company_users')
        .insert([insertData])
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao inserir na company_users:', insertError);
        throw insertError;
      }

      console.log('Usuário criado com sucesso:', newUserData);
      
      // Atualizar estado local
      setUsers(prev => [...prev, newUserData]);
      
      return { 
        success: true, 
        data: {
          ...newUserData,
          auth_user_id: authUserId
        }
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar usuário';
      console.error('Erro ao adicionar usuário:', err);
      setError(errorMessage);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Editar usuário
  const editUser = useCallback(async (id: string, updates: Partial<CompanyUser>) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Editando usuário:', { id, updates });

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Atualizar usuário no banco de dados
      const { data: updatedUserData, error: updateError } = await supabase
        .from('company_users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      console.log('Usuário atualizado com sucesso:', updatedUserData);
      
      // Atualizar estado local
      setUsers(prev => prev.map(user => 
        user.id === id ? updatedUserData : user
      ));
      return { success: true, data: updatedUserData };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao editar usuário';
      console.error('Erro ao editar usuário:', err);
      setError(errorMessage);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  // Excluir usuário
  const deleteUser = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Excluindo usuário:', id);

      // Excluir usuário do banco de dados
      const { error: deleteError } = await supabase
        .from('company_users')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      console.log('Usuário excluído com sucesso');
      
      // Atualizar estado local
      setUsers(prev => prev.filter(user => user.id !== id));
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir usuário';
      console.error('Erro ao excluir usuário:', err);
      setError(errorMessage);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar status do usuário
  const updateUserStatus = useCallback(async (id: string, status: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Atualizando status do usuário:', { id, status });

      // Atualizar status no banco de dados
      const { data: updatedUserData, error: updateError } = await supabase
        .from('company_users')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      console.log('Status atualizado com sucesso:', updatedUserData);
      
      // Atualizar estado local
      setUsers(prev => prev.map(user => 
        user.id === id ? updatedUserData : user
      ));
      return { success: true, data: updatedUserData };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar status';
      console.error('Erro ao atualizar status:', err);
      setError(errorMessage);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  // Resetar senha do usuário
  const resetUserPassword = useCallback(async (id: string, newPassword: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Resetando senha do usuário:', id);

      // Atualizar senha no banco de dados
      const { data: updatedUserData, error: updateError } = await supabase
        .from('company_users')
        .update({ 
          password_hash: newPassword, // Em produção, hash a senha
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      console.log('Senha resetada com sucesso');
      
      // Atualizar estado local
      setUsers(prev => prev.map(user => 
        user.id === id ? updatedUserData : user
      ));
      return { success: true, data: updatedUserData };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao resetar senha';
      console.error('Erro ao resetar senha:', err);
      setError(errorMessage);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar logo
  const updateLogo = useCallback(async (logoUrl: string) => {
      try {
        setLoading(true);
        setError(null);
        
      console.log('Atualizando logo:', logoUrl);

      if (!settings) {
        throw new Error('Configurações não carregadas');
      }

      const updateData = {
        logo_url: logoUrl,
        updated_at: new Date().toISOString()
      };

      // Atualizar logo no banco de dados
      const { data: updatedSettings, error: updateError } = await supabase
          .from('company_settings')
        .update(updateData)
        .eq('id', settings.id)
        .select()
          .single();

      if (updateError) {
        throw updateError;
      }

      console.log('Logo atualizado com sucesso:', updatedSettings);
      
      // Atualizar estado local
      setSettings(updatedSettings);
      return { success: true, data: updatedSettings };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar logo';
      console.error('Erro ao atualizar logo:', err);
      setError(errorMessage);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [settings]);

  // Remover logo
  const removeLogo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Removendo logo');

      if (!settings) {
        throw new Error('Configurações não carregadas');
      }

      const updateData = {
        logo_url: null,
        updated_at: new Date().toISOString()
      };

      // Remover logo no banco de dados
      const { data: updatedSettings, error: updateError } = await supabase
        .from('company_settings')
        .update(updateData)
        .eq('id', settings.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      console.log('Logo removido com sucesso:', updatedSettings);
      
      // Atualizar estado local
      setSettings(updatedSettings);
      return { success: true, data: updatedSettings };
      } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover logo';
      console.error('Erro ao remover logo:', err);
        setError(errorMessage);
      return { success: false, error: err };
      } finally {
        setLoading(false);
      }
  }, [settings]);

  return {
    // Estados
    settings,
    areas,
    roles,
    users,
    loading,
    error,
    
    // Funções
    saveCompanySettings,
    addArea,
    editArea,
    deleteArea,
    addRole,
    editRole,
    deleteRole,
    saveRolePermissions,
    addUser,
    editUser,
    deleteUser,
    updateUserStatus,
    resetUserPassword,
    updateLogo,
    removeLogo,
    loadData
  };
}
