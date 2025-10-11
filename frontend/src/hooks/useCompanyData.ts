import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  cep?: string;
  logo_url?: string;
  settings: any;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: any;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  created_at: string;
}

export interface CompanyUser {
  id: string;
  company_id: string;
  user_id: string;
  is_owner: boolean;
  joined_at: string;
}

export interface WorkGroup {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  color: string;
  photo_url?: string;
  sector?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkGroupMember {
  id: string;
  work_group_id: string;
  user_id: string;
  position?: string;
  joined_at: string;
}

export function useCompanyData() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [workGroups, setWorkGroups] = useState<WorkGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCompanyData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchCompanyData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch company data
      const { data: companyData, error: companyError } = await supabase
        .from('company_users')
        .select(`
          *,
          companies (*)
        `)
        .eq('user_id', user.id)
        .single();

      if (companyError) throw companyError;

      if (companyData?.companies) {
        setCompany(companyData.companies);
        
        // Fetch roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('roles')
          .select('*')
          .order('name');

        if (rolesError) throw rolesError;
        setRoles(rolesData || []);

        // Fetch user roles for the company
        const { data: userRolesData, error: userRolesError } = await supabase
          .from('user_roles')
          .select(`
            *,
            roles (*)
          `)
          .in('user_id', 
            (await supabase
              .from('company_users')
              .select('user_id')
              .eq('company_id', companyData.companies.id)
            ).data?.map(u => u.user_id) || []
          );

        if (userRolesError) throw userRolesError;
        setUserRoles(userRolesData || []);

        // Fetch company users
        const { data: companyUsersData, error: companyUsersError } = await supabase
          .from('company_users')
          .select(`
            *,
            profiles (*)
          `)
          .eq('company_id', companyData.companies.id);

        if (companyUsersError) throw companyUsersError;
        setCompanyUsers(companyUsersData || []);

        // Fetch work groups
        const { data: workGroupsData, error: workGroupsError } = await supabase
          .from('work_groups')
          .select(`
            *,
            work_group_members (
              *,
              profiles (*)
            )
          `)
          .eq('company_id', companyData.companies.id);

        if (workGroupsError) throw workGroupsError;
        setWorkGroups(workGroupsData || []);
      }
    } catch (err) {
      console.error('Erro ao buscar dados da empresa:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const addUserToCompany = async (email: string, roleId: string) => {
    if (!company || !user) return { error: 'Dados insuficientes' };

    try {
      // Use a different approach - search by email in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email)
        .single();
      
      if (userError || !userData) {
        return { error: 'Usuário não encontrado' };
      }

      // Add user to company
      const { error: companyUserError } = await supabase
        .from('company_users')
        .insert({
          company_id: company.id,
          user_id: userData.id,
          is_owner: false
        });

      if (companyUserError) throw companyUserError;

      // Assign role to user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: targetUser.id,
          role_id: roleId
        });

      if (roleError) throw roleError;

      // Refresh data
      await fetchCompanyData();
      return { success: true };
    } catch (err) {
      console.error('Erro ao adicionar usuário:', err);
      return { error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  };

  const removeUserFromCompany = async (userId: string) => {
    if (!company) return { error: 'Empresa não encontrada' };

    try {
      // Remove user roles
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (rolesError) throw rolesError;

      // Remove from company
      const { error: companyError } = await supabase
        .from('company_users')
        .delete()
        .eq('company_id', company.id)
        .eq('user_id', userId);

      if (companyError) throw companyError;

      // Refresh data
      await fetchCompanyData();
      return { success: true };
    } catch (err) {
      console.error('Erro ao remover usuário:', err);
      return { error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  };

  const updateUserRole = async (userId: string, roleId: string) => {
    try {
      // Remove existing roles
      const { error: removeError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (removeError) throw removeError;

      // Add new role
      const { error: addError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleId
        });

      if (addError) throw addError;

      // Refresh data
      await fetchCompanyData();
      return { success: true };
    } catch (err) {
      console.error('Erro ao atualizar perfil do usuário:', err);
      return { error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  };

  const createWorkGroup = async (workGroupData: Omit<WorkGroup, 'id' | 'company_id' | 'created_at' | 'updated_at'>) => {
    if (!company) return { error: 'Empresa não encontrada' };

    try {
      const { data, error } = await supabase
        .from('work_groups')
        .insert([{
          ...workGroupData,
          company_id: company.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Refresh data
      await fetchCompanyData();
      return { data };
    } catch (err) {
      console.error('Erro ao criar grupo de trabalho:', err);
      return { error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  };

  const updateWorkGroup = async (id: string, updates: Partial<WorkGroup>) => {
    try {
      const { data, error } = await supabase
        .from('work_groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Refresh data
      await fetchCompanyData();
      return { data };
    } catch (err) {
      console.error('Erro ao atualizar grupo de trabalho:', err);
      return { error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  };

  const deleteWorkGroup = async (id: string) => {
    try {
      const { error } = await supabase
        .from('work_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh data
      await fetchCompanyData();
      return { success: true };
    } catch (err) {
      console.error('Erro ao deletar grupo de trabalho:', err);
      return { error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  };

  const isAdmin = () => {
    if (!user || !userRoles.length) return false;
    return userRoles.some(ur => ur.roles?.is_admin);
  };

  const isOwner = () => {
    if (!companyUsers.length) return false;
    return companyUsers.some(cu => cu.user_id === user?.id && cu.is_owner);
  };

  return {
    company,
    roles,
    userRoles,
    companyUsers,
    workGroups,
    loading,
    error,
    addUserToCompany,
    removeUserFromCompany,
    updateUserRole,
    createWorkGroup,
    updateWorkGroup,
    deleteWorkGroup,
    isAdmin,
    isOwner,
    refreshData: fetchCompanyData,
  };
}
