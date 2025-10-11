import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WorkGroup {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'archived';
  type: 'project' | 'department' | 'team' | 'committee';
  responsible_id?: string;
  company_id?: string;
  parent_id?: string;
  max_members?: number;
  tags?: string[];
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WorkGroupMember {
  id: string;
  work_group_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joined_at: string;
  permissions?: Record<string, any>;
}

export const useWorkGroups = () => {
  const { user } = useAuth();
  const [workGroups, setWorkGroups] = useState<WorkGroup[]>([]);
  const [members, setMembers] = useState<WorkGroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkGroups = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Buscar grupos onde o usuário é membro
      const { data: memberGroups, error: memberError } = await supabase
        .from('work_group_members')
        .select('work_group_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      const groupIds = memberGroups?.map(m => m.work_group_id) || [];
      
      if (groupIds.length > 0) {
        const { data: groups, error: groupsError } = await supabase
          .from('work_groups')
          .select('*')
          .in('id', groupIds)
          .order('created_at', { ascending: false });

        if (groupsError) throw groupsError;
        setWorkGroups(groups || []);
      } else {
        setWorkGroups([]);
      }

      // Buscar membros de todos os grupos
      if (groupIds.length > 0) {
        const { data: membersData, error: membersError } = await supabase
          .from('work_group_members')
          .select('*')
          .in('work_group_id', groupIds);

        if (membersError) throw membersError;
        setMembers(membersData || []);
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.error('Erro ao buscar grupos de trabalho:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar grupos de trabalho');
      setWorkGroups([]);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const createWorkGroup = async (workGroupData: Omit<WorkGroup, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    try {
      const workGroupWithUser = {
        ...workGroupData,
        responsible_id: user.id
      };

      const { data, error } = await supabase
        .from('work_groups')
        .insert([workGroupWithUser])
        .select()
        .single();

      if (error) throw error;

      // Adicionar usuário como owner do grupo
      await supabase
        .from('work_group_members')
        .insert([{
          work_group_id: data.id,
          user_id: user.id,
          role: 'owner',
          permissions: { all: true }
        }]);

      await fetchWorkGroups(); // Recarregar dados
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar grupo de trabalho');
      throw err;
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
      
      await fetchWorkGroups(); // Recarregar dados
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar grupo de trabalho');
      throw err;
    }
  };

  const deleteWorkGroup = async (id: string) => {
    try {
      // Primeiro deletar todos os membros
      await supabase
        .from('work_group_members')
        .delete()
        .eq('work_group_id', id);

      // Depois deletar o grupo
      const { error } = await supabase
        .from('work_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchWorkGroups(); // Recarregar dados
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir grupo de trabalho');
      throw err;
    }
  };

  const addMember = async (workGroupId: string, userId: string, role: WorkGroupMember['role'] = 'member') => {
    try {
      const { data, error } = await supabase
        .from('work_group_members')
        .insert([{
          work_group_id: workGroupId,
          user_id: userId,
          role,
          permissions: { view: true, edit: role !== 'viewer' }
        }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchWorkGroups(); // Recarregar dados
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar membro');
      throw err;
    }
  };

  const removeMember = async (workGroupId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('work_group_members')
        .delete()
        .eq('work_group_id', workGroupId)
        .eq('user_id', userId);

      if (error) throw error;
      
      await fetchWorkGroups(); // Recarregar dados
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover membro');
      throw err;
    }
  };

  const updateMemberRole = async (workGroupId: string, userId: string, newRole: WorkGroupMember['role']) => {
    try {
      const { data, error } = await supabase
        .from('work_group_members')
        .update({ role: newRole })
        .eq('work_group_id', workGroupId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      
      await fetchWorkGroups(); // Recarregar dados
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar papel do membro');
      throw err;
    }
  };

  const getWorkGroupsByType = (type: WorkGroup['type']) => {
    return workGroups.filter(group => group.type === type);
  };

  const getWorkGroupsByStatus = (status: WorkGroup['status']) => {
    return workGroups.filter(group => group.status === status);
  };

  const getWorkGroupsByCompany = (companyId: string) => {
    return workGroups.filter(group => group.company_id === companyId);
  };

  const getMembersByWorkGroup = (workGroupId: string) => {
    return members.filter(member => member.work_group_id === workGroupId);
  };

  const getUserRoleInWorkGroup = (workGroupId: string) => {
    const member = members.find(m => m.work_group_id === workGroupId && m.user_id === user?.id);
    return member?.role || null;
  };

  const isUserOwner = (workGroupId: string) => {
    return getUserRoleInWorkGroup(workGroupId) === 'owner';
  };

  const isUserAdmin = (workGroupId: string) => {
    const role = getUserRoleInWorkGroup(workGroupId);
    return role === 'owner' || role === 'admin';
  };

  const canUserEdit = (workGroupId: string) => {
    const role = getUserRoleInWorkGroup(workGroupId);
    return role === 'owner' || role === 'admin' || role === 'member';
  };

  useEffect(() => {
    if (user) {
      fetchWorkGroups();
    }
  }, [user]);

  return {
    workGroups,
    members,
    loading,
    error,
    createWorkGroup,
    updateWorkGroup,
    deleteWorkGroup,
    addMember,
    removeMember,
    updateMemberRole,
    getWorkGroupsByType,
    getWorkGroupsByStatus,
    getWorkGroupsByCompany,
    getMembersByWorkGroup,
    getUserRoleInWorkGroup,
    isUserOwner,
    isUserAdmin,
    canUserEdit,
    refetch: fetchWorkGroups
  };
};
