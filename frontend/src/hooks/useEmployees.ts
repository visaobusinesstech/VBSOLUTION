import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  hire_date?: string;
  salary?: number;
  currency?: string;
  status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  manager_id?: string;
  company_id?: string;
  work_group_id?: string;
  avatar_url?: string;
  skills?: string[];
  notes?: string;
  responsible_id?: string;
  created_at: string;
  updated_at: string;
}

export interface OrgNode {
  id: string;
  name: string;
  type: 'sector' | 'position' | 'person';
  parent_id?: string;
  responsible_id?: string;
  description?: string;
  position_x: number;
  position_y: number;
  data?: Employee;
  children?: OrgNode[];
}

export const useEmployees = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [orgStructure, setOrgStructure] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Buscar company_id do perfil do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        throw new Error('Usuário não possui empresa associada');
      }

      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setEmployees(data || []);
    } catch (err) {
      console.error('Erro ao buscar funcionários:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar funcionários');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgStructure = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('organizational_structure')
        .select('*')
        .eq('responsible_id', user.id)
        .order('position_x', { ascending: true });

      if (error) throw error;
      
      // Construir estrutura hierárquica
      const buildTree = (nodes: any[], parentId?: string): OrgNode[] => {
        return nodes
          .filter(node => node.parent_id === parentId)
          .map(node => ({
            ...node,
            children: buildTree(nodes, node.id)
          }));
      };

      const tree = buildTree(data || []);
      setOrgStructure(tree);
    } catch (err) {
      console.error('Erro ao buscar estrutura organizacional:', err);
    }
  };

  const createEmployee = async (employeeData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    try {
      const employeeWithUser = {
        ...employeeData,
        responsible_id: user.id,
        currency: employeeData.currency || 'BRL',
        status: employeeData.status || 'active'
      };

      const { data, error } = await supabase
        .from('employees')
        .insert([employeeWithUser])
        .select()
        .single();

      if (error) throw error;
      
      await fetchEmployees(); // Recarregar dados
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar funcionário');
      throw err;
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchEmployees(); // Recarregar dados
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar funcionário');
      throw err;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchEmployees(); // Recarregar dados
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir funcionário');
      throw err;
    }
  };

  const createOrgNode = async (nodeData: Omit<OrgNode, 'id' | 'children'>) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    try {
      const nodeWithUser = {
        ...nodeData,
        responsible_id: user.id
      };

      const { data, error } = await supabase
        .from('organizational_structure')
        .insert([nodeWithUser])
        .select()
        .single();

      if (error) throw error;
      
      await fetchOrgStructure(); // Recarregar dados
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar nó organizacional');
      throw err;
    }
  };

  const updateOrgNode = async (id: string, updates: Partial<OrgNode>) => {
    try {
      const { data, error } = await supabase
        .from('organizational_structure')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchOrgStructure(); // Recarregar dados
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar nó organizacional');
      throw err;
    }
  };

  const deleteOrgNode = async (id: string) => {
    try {
      const { error } = await supabase
        .from('organizational_structure')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchOrgStructure(); // Recarregar dados
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir nó organizacional');
      throw err;
    }
  };

  const getEmployeesByDepartment = (department: string) => {
    return employees.filter(employee => employee.department === department);
  };

  const getEmployeesByStatus = (status: Employee['status']) => {
    return employees.filter(employee => employee.status === status);
  };

  const getEmployeesByPosition = (position: string) => {
    return employees.filter(employee => employee.position === position);
  };

  const getEmployeesByWorkGroup = (workGroupId: string) => {
    return employees.filter(employee => employee.work_group_id === workGroupId);
  };

  const searchEmployees = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return employees.filter(employee => 
      employee.name.toLowerCase().includes(lowerQuery) ||
      employee.email.toLowerCase().includes(lowerQuery) ||
      (employee.position && employee.position.toLowerCase().includes(lowerQuery)) ||
      (employee.department && employee.department.toLowerCase().includes(lowerQuery))
    );
  };

  const getActiveEmployees = () => {
    return employees.filter(employee => employee.status === 'active');
  };

  const getEmployeesByManager = (managerId: string) => {
    return employees.filter(employee => employee.manager_id === managerId);
  };

  const getOrgNodeById = (id: string): OrgNode | undefined => {
    const findNode = (nodes: OrgNode[]): OrgNode | undefined => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findNode(orgStructure);
  };

  const getOrgNodeChildren = (parentId: string): OrgNode[] => {
    const parent = getOrgNodeById(parentId);
    return parent?.children || [];
  };

  const moveOrgNode = async (nodeId: string, newParentId: string | null, newPosition: { x: number, y: number }) => {
    try {
      const updates = {
        parent_id: newParentId,
        position_x: newPosition.x,
        position_y: newPosition.y
      };

      await updateOrgNode(nodeId, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao mover nó organizacional');
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchEmployees();
      fetchOrgStructure();
    }
  }, [user]);

  return {
    employees,
    orgStructure,
    loading,
    error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    createOrgNode,
    updateOrgNode,
    deleteOrgNode,
    getEmployeesByDepartment,
    getEmployeesByStatus,
    getEmployeesByPosition,
    getEmployeesByWorkGroup,
    searchEmployees,
    getActiveEmployees,
    getEmployeesByManager,
    getOrgNodeById,
    getOrgNodeChildren,
    moveOrgNode,
    refetchEmployees: fetchEmployees,
    refetchOrgStructure: fetchOrgStructure
  };
};
