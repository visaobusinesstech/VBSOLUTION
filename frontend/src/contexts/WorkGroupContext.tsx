import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WorkGroupMember {
  id: string;
  name: string;
  initials: string;
  email: string;
  position: string;
  avatar?: string;
}

export interface WorkGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  photo?: string;
  sector: string;
  members: WorkGroupMember[];
  tasksCount: number;
  completedTasks: number;
  activeProjects: number;
  settings?: { checklist?: Array<{ type: 'project' | 'task'; id: string; title: string; completed: boolean }> };
  createdAt: Date;
  updatedAt: Date;
}

interface WorkGroupContextType {
  workGroups: WorkGroup[];
  addWorkGroup: (workGroup: Omit<WorkGroup, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateWorkGroup: (id: string, updates: Partial<WorkGroup>) => Promise<void>;
  deleteWorkGroup: (id: string) => Promise<void>;
  getWorkGroupById: (id: string) => WorkGroup | undefined;
  loading: boolean;
}

const WorkGroupContext = createContext<WorkGroupContextType | undefined>(undefined);

export const useWorkGroup = () => {
  const context = useContext(WorkGroupContext);
  if (context === undefined) {
    throw new Error('useWorkGroup must be used within a WorkGroupProvider');
  }
  return context;
};

interface WorkGroupProviderProps {
  children: ReactNode;
}

// Dados iniciais vazios - serão carregados do Supabase
const initialWorkGroups: WorkGroup[] = [];

export const WorkGroupProvider: React.FC<WorkGroupProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [workGroups, setWorkGroups] = useState<WorkGroup[]>(initialWorkGroups);
  const [loading, setLoading] = useState(true);

  const fetchWorkGroups = async () => {
    if (!user) {
      // Silent: Usuário não autenticado, não buscando grupos
      return;
    }

    // Fetching work groups for user

    try {
      setLoading(true);
      
      // Buscar grupos de trabalho criados pelo usuário atual
      const { data: workGroupsData, error: workGroupsError } = await supabase
        .from('work_groups')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (workGroupsError) {
        console.error('Erro ao buscar grupos de trabalho:', workGroupsError);
        throw workGroupsError;
      }

      // Logs removed for performance

      // Converter dados do Supabase para o formato esperado
      const formattedWorkGroups = (workGroupsData || []).map(wg => {
        // Extrair dados do settings JSON se existir
        const settings = wg.settings || {};
        const checklist = settings.checklist || [];
        
        // Calcular progresso baseado na checklist hierárquica se existir
        const allTasks = checklist.flatMap((project: any) => project.tasks || []);
        const allProjects = checklist.filter((i: any) => i.type === 'project');
        const tasksCount = allTasks.length;
        const completedTasks = allTasks.filter((t: any) => t.completed).length;
        const activeProjects = allProjects.filter((p: any) => !p.completed).length;
        
        // Se não há checklist, usar os valores salvos nas colunas separadas
        const finalTasksCount = tasksCount > 0 ? tasksCount : (wg.tasks_count || 0);
        const finalCompletedTasks = completedTasks > 0 ? completedTasks : (wg.completed_tasks || 0);
        const finalActiveProjects = activeProjects > 0 ? activeProjects : (wg.active_projects || 0);
        
        return {
          id: wg.id,
          name: wg.name,
          description: wg.description || '',
          color: wg.color || '#3B82F6',
          photo: wg.photo || '',
          sector: wg.sector || 'Não definido',
          members: [], // Simplificado - sem membros por enquanto
          tasksCount: finalTasksCount,
          completedTasks: finalCompletedTasks,
          activeProjects: finalActiveProjects,
          settings: wg.settings, // Incluir settings completo
          status: wg.status || 'active',
          createdAt: new Date(wg.created_at),
          updatedAt: new Date(wg.updated_at)
        };
      });

      setWorkGroups(formattedWorkGroups);
    } catch (err) {
      console.error('Erro ao buscar grupos de trabalho:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados do Supabase
  useEffect(() => {
    if (user) {
      fetchWorkGroups();
    } else {
      setLoading(false);
    }
  }, [user]);

  const addWorkGroup = async (workGroupData: Omit<WorkGroup, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      // Silent: Usuário não autenticado
      throw new Error('Usuário não autenticado');
    }

    // Silent: Iniciando criação de grupo de trabalho
    // Silent: Usuário ID

    try {
      // Criar grupo de trabalho no Supabase (incluindo settings com checklist)
      const insertData: any = {
        name: workGroupData.name,
        owner_id: user.id,
        description: workGroupData.description || '',
        status: 'active',
        color: workGroupData.color || '#3B82F6',
        photo: workGroupData.photo || null,
        sector: workGroupData.sector || null,
        tasks_count: workGroupData.tasksCount || 0,
        completed_tasks: workGroupData.completedTasks || 0,
        active_projects: workGroupData.activeProjects || 0
      };

      // Tentar adicionar settings se existir
      if (workGroupData.settings) {
        insertData.settings = workGroupData.settings;
        console.log('📋 [CONTEXT] Incluindo settings na inserção:', insertData.settings);
      } else {
        console.log('⚠️ [CONTEXT] Nenhum settings fornecido para inserção');
      }

      console.log('📋 [CONTEXT] Dados para inserção (completo):', insertData);
      console.log('📋 [CONTEXT] Settings sendo enviados:', JSON.stringify(insertData.settings, null, 2));

      const { data: newWorkGroup, error: createError } = await supabase
        .from('work_groups')
        .insert([insertData])
        .select()
        .single();

      if (createError) {
        console.error('❌ [CONTEXT] Erro ao criar grupo no Supabase:', createError);
        console.error('❌ [CONTEXT] Detalhes do erro:', createError.message);
        throw createError;
      }

      console.log('✅ [CONTEXT] Grupo criado com sucesso no Supabase:', newWorkGroup);
      console.log('✅ [CONTEXT] Settings salvos no Supabase:', newWorkGroup.settings);

      // Atualizar estado local imediatamente
      const newFormattedGroup = {
        id: newWorkGroup.id,
        name: newWorkGroup.name,
        description: newWorkGroup.description || '',
        color: workGroupData.color || '#3B82F6',
        photo: workGroupData.photo || '',
        sector: workGroupData.sector || 'Não definido',
        members: [],
        tasksCount: workGroupData.tasksCount || 0,
        completedTasks: workGroupData.completedTasks || 0,
        activeProjects: workGroupData.activeProjects || 0,
        settings: workGroupData.settings,
        status: newWorkGroup.status || 'active',
        createdAt: new Date(newWorkGroup.created_at),
        updatedAt: new Date(newWorkGroup.updated_at)
      };

      console.log('🔄 [CONTEXT] Adicionando grupo ao estado local:', newFormattedGroup);
      console.log('📊 [CONTEXT] activeProjects do grupo:', newFormattedGroup.activeProjects);
      console.log('📊 [CONTEXT] settings do grupo:', newFormattedGroup.settings);
      
      setWorkGroups(prev => {
        const newState = [newFormattedGroup, ...prev];
        console.log('📊 [CONTEXT] Novo estado:', newState.length, 'grupos');
        console.log('📊 [CONTEXT] Primeiro grupo activeProjects:', newState[0]?.activeProjects);
        return newState;
      });
      console.log('✅ [CONTEXT] Grupo adicionado ao estado local');

      // Recarregar dados do Supabase em background para sincronizar (com delay)
      setTimeout(() => {
        console.log('🔄 [CONTEXT] Recarregando dados do Supabase em background...');
        fetchWorkGroups();
      }, 2000);

    } catch (err) {
      console.error('❌ [CONTEXT] Erro ao criar grupo de trabalho:', err);
      throw err; // Re-throw para que o erro seja capturado na página
    }
  };

  const updateWorkGroup = async (id: string, updates: Partial<WorkGroup>) => {
    try {
      console.log('🔄 [CONTEXT] Iniciando atualização do grupo:', id);
      console.log('📝 [CONTEXT] Dados de atualização:', updates);

      // Preparar dados para atualização (usando todas as colunas disponíveis)
      const updateData: any = {
        name: updates.name,
        description: updates.description,
        status: updates.status,
        color: updates.color,
        photo: updates.photo,
        sector: updates.sector,
        tasks_count: updates.tasksCount,
        completed_tasks: updates.completedTasks,
        active_projects: updates.activeProjects,
        settings: updates.settings
      };

      // Remover campos undefined/null
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === null) {
          delete updateData[key];
        }
      });

      console.log('📋 [CONTEXT] Dados limpos para Supabase:', updateData);
      console.log('📋 [CONTEXT] Settings sendo enviados:', JSON.stringify(updateData.settings, null, 2));

      const { error } = await supabase
        .from('work_groups')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('❌ [CONTEXT] Erro ao atualizar no Supabase:', error);
        throw error;
      }

      console.log('✅ [CONTEXT] Dados salvos no Supabase com sucesso');

      // Atualizar estado local imediatamente
      setWorkGroups(prev => prev.map(wg => 
        wg.id === id ? { ...wg, ...updates } : wg
      ));

      console.log('🔄 [CONTEXT] Estado local atualizado');

      // Recarregar dados do Supabase em background para sincronizar
      fetchWorkGroups();
    } catch (err) {
      console.error('❌ [CONTEXT] Erro ao atualizar grupo de trabalho:', err);
      throw err; // Re-throw para que o erro seja capturado na página
    }
  };

  const deleteWorkGroup = async (id: string) => {
    try {
      const { error } = await supabase
        .from('work_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Recarregar dados
      await fetchWorkGroups();
    } catch (err) {
      console.error('Erro ao deletar grupo de trabalho:', err);
    }
  };

  const getWorkGroupById = (id: string) => {
    return workGroups.find(group => group.id === id);
  };

  const value: WorkGroupContextType = {
    workGroups,
    addWorkGroup,
    updateWorkGroup,
    deleteWorkGroup,
    getWorkGroupById,
    loading,
  };

  return (
    <WorkGroupContext.Provider value={value}>
      {children}
    </WorkGroupContext.Provider>
  );
};
