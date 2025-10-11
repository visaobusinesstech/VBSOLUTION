import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Activity {
  id: string;
  owner_id: string; // Campo atual na tabela activities (será migrado para created_by)
  title: string;
  description: string | null;
  type: string;
  priority: string;
  status: string;
  due_date: string | null;
  start_date: string | null;
  end_date: string | null;
  responsible_id: string | null;
  company_id: string | null;
  project_id: string | null;
  work_group: string | null;
  department: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  tags: string[];
  attachments: any | null;
  comments: any | null;
  progress: number;
  is_urgent: boolean;
  is_public: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateActivityData {
  title: string;
  description?: string;
  type?: string;
  priority?: string;
  status?: string;
  due_date?: string;
  start_date?: string;
  end_date?: string;
  responsible_id?: string;
  company_id?: string;
  project_id?: string;
  work_group?: string;
  department?: string;
  estimated_hours?: number;
  actual_hours?: number;
  tags?: string[];
  attachments?: any;
  comments?: any;
  progress?: number;
  is_urgent?: boolean;
  is_public?: boolean;
  notes?: string;
}

export interface UpdateActivityData extends Partial<CreateActivityData> {}

export interface ActivityFilters {
  status?: string;
  priority?: string;
  type?: string;
  responsible_id?: string;
  company_id?: string;
  project_id?: string;
  work_group?: string;
  department?: string;
  is_urgent?: boolean;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getProfile } = useAuth();
  
  // Verificar se getProfile está disponível
  if (!getProfile) {
    console.error('❌ [ACTIVITIES] getProfile não está disponível no contexto de autenticação');
  }

  // Função para obter o company_id do usuário logado
  const getCompanyId = useCallback(async () => {
    try {
      
      if (!getProfile) {
        console.error('❌ [ACTIVITIES] getProfile não está disponível');
        return null;
      }
      
      const result = await getProfile();
      const { profile, error: profileError } = result || {};
      
      if (profileError) {
        console.warn('⚠️ [ACTIVITIES] Erro ao obter perfil:', profileError);
        return null;
      }
      
      if (!profile) {
        console.warn('⚠️ [ACTIVITIES] Usuário não autenticado, usando null para company_id');
        return null;
      }
      
      
      // Se não tiver company_id, tentar buscar na tabela user_profiles
      if (!profile.company_id) {
        try {
          const { data: userProfile, error: userProfileError } = await supabase
            .from('user_profiles')
            .select('company_id')
            .eq('id', profile.id)
            .single();
          
          if (!userProfileError && userProfile?.company_id) {
            return userProfile.company_id;
          }
        } catch (userProfileErr) {
          console.warn('⚠️ [ACTIVITIES] Erro ao buscar user_profiles:', userProfileErr);
        }
        
        // Se ainda não tiver, usar null (permitir criação sem empresa)
        console.log('ℹ️ [ACTIVITIES] Nenhum company_id encontrado, usando null');
        return null;
      }
      
      return profile.company_id;
    } catch (error) {
      console.error('❌ [ACTIVITIES] Erro ao obter company_id:', error);
      // Em caso de erro, permitir criação sem empresa
      return null;
    }
  }, [getProfile]);

  // Função para obter o ID do usuário logado
  const getOwnerId = useCallback(async () => {
    try {
      
      if (!getProfile) {
        console.error('❌ [ACTIVITIES] getProfile não está disponível');
        throw new Error('getProfile não está disponível');
      }
      
      const result = await getProfile();
      const { profile, error: profileError } = result || {};
      
      if (profileError) {
        console.error('❌ [ACTIVITIES] Erro ao obter perfil:', profileError);
        throw new Error(profileError);
      }
      
      if (!profile) {
        console.error('❌ [ACTIVITIES] Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }
      
      return profile.id;
    } catch (error) {
        console.error('❌ [ACTIVITIES] Erro ao obter owner_id:', error);
      throw error;
    }
  }, [getProfile]);

  // Buscar todas as atividades do usuário - versão otimizada
  const fetchActivities = useCallback(async (filters?: ActivityFilters) => {
    try {
      // Evitar carregamentos múltiplos
      if (loading) {
        console.log('⚠️ [ACTIVITIES] Já está carregando, ignorando chamada duplicada');
        return { data: activities, error: null };
      }
      
      setLoading(true);
      setError(null);

      // Verificar autenticação diretamente
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Buscar perfil diretamente
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, company_id')
        .eq('id', user.id)
        .single();
      
      let companyId = profile?.company_id;
      if (!companyId) {
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();
        companyId = userProfile?.company_id || null;
      }

      let query = supabase
        .from('activities')
        .select('*');
      
      console.log('🔍 [FETCH] Usuário:', user.id, 'Company ID:', companyId);
      
      // Filtrar por empresa se disponível, senão filtrar por usuário
      if (companyId) {
        // Se tem empresa, filtrar por empresa OU owner_id (para pegar atividades importadas)
        query = query.or(`company_id.eq.${companyId},owner_id.eq.${user.id}`);
        console.log('🔍 [FETCH] Filtrando por company_id OU owner_id:', companyId, user.id);
      } else {
        // Se não tem empresa, filtrar apenas por owner_id
        query = query.eq('owner_id', user.id);
        console.log('🔍 [FETCH] Filtrando por owner_id:', user.id);
      }

      // Aplicar filtros
      if (filters) {
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.priority) {
          query = query.eq('priority', filters.priority);
        }
        if (filters.type) {
          query = query.eq('type', filters.type);
        }
        if (filters.responsible_id) {
          query = query.eq('responsible_id', filters.responsible_id);
        }
        if (filters.company_id) {
          query = query.eq('company_id', filters.company_id);
        }
        if (filters.project_id) {
          query = query.eq('project_id', filters.project_id);
        }
        if (filters.work_group) {
          query = query.eq('work_group', filters.work_group);
        }
        if (filters.department) {
          query = query.eq('department', filters.department);
        }
        if (filters.is_urgent !== undefined) {
          query = query.eq('is_urgent', filters.is_urgent);
        }
        if (filters.search && filters.search.trim()) {
          const searchTerm = filters.search.trim();
          query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }
        if (filters.start_date) {
          query = query.gte('due_date', filters.start_date);
        }
        if (filters.end_date) {
          query = query.lte('due_date', filters.end_date);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [FETCH] Erro ao buscar atividades:', error);
        throw error;
      }

      console.log('🔍 [FETCH] Atividades retornadas:', data?.length || 0, 'atividades');
      console.log('🔍 [FETCH] Atividades:', data?.map(a => ({ title: a.title, status: a.status, owner_id: a.owner_id, created_by: a.created_by })));

      setActivities(data || []);
      
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar atividades';
      setError(errorMessage);
      console.error('Erro ao buscar atividades:', err);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [loading, activities]);

  // Criar nova atividade - versão otimizada
  const createActivity = useCallback(async (activityData: CreateActivityData) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Verificar autenticação
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user || !user.id) {
        console.error('❌ [CREATE] Erro de autenticação:', { userError, user, hasUserId: !!user?.id });
        throw new Error('Usuário não autenticado ou ID inválido');
      }

      console.log('✅ [CREATE] Usuário autenticado:', { userId: user.id, email: user.email });

      // Verificação adicional do created_by
      if (!user.id) {
        console.error('❌ [CREATE] user.id é null ou undefined');
        throw new Error('ID do usuário não disponível');
      }

      // 2. Buscar company_id de forma simples
      let companyId = null;
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (!profileError && profileData?.company_id) {
          companyId = profileData.company_id;
        } else {
          // Tentar user_profiles como fallback
          const { data: userProfileData, error: userProfileError } = await supabase
            .from('user_profiles')
            .select('company_id')
            .eq('id', user.id)
            .single();

          if (!userProfileError && userProfileData?.company_id) {
            companyId = userProfileData.company_id;
          }
        }
      } catch (profileErr) {
        // Ignorar erro e continuar
      }

      // 3. Preparar dados mínimos necessários
      const insertData = {
        title: activityData.title || 'Atividade sem título',
        description: activityData.description || null,
        type: activityData.type || 'task',
        priority: activityData.priority || 'medium',
        status: activityData.status || 'pending', // Usar status padrão do Supabase
        owner_id: user.id,
        company_id: companyId || activityData.company_id || null,
        due_date: activityData.due_date || null,
        responsible_id: activityData.responsible_id || null,
        project_id: activityData.project_id || null,
        work_group: activityData.work_group || null,
        department: activityData.department || null,
        progress: 0,
        is_urgent: false,
        is_public: false,
      };

      console.log('🔍 [CREATE] Dados para inserção:', {
        ...insertData,
        created_by: insertData.created_by,
        hasUserId: !!user.id,
        userId: user.id
      });

      // 4. Inserir diretamente no Supabase
      console.log('🔍 [CREATE] Dados para inserir:', insertData);
      
      const { data, error } = await supabase
        .from('activities')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('❌ [CREATE] Erro do Supabase:', error);
        // Tratar erros específicos
        if (error.code === '42501') {
          throw new Error('Permissão negada: Verifique as políticas RLS da tabela activities');
        } else if (error.code === 'PGRST116') {
          throw new Error('Tabela activities não encontrada: Verifique se a tabela existe no Supabase');
        } else if (error.code === '23505') {
          throw new Error('Atividade duplicada: Já existe uma atividade com estes dados');
        } else {
          throw new Error(`Erro ao criar atividade: ${error.message}`);
        }
      }
      
      console.log('✅ [CREATE] Atividade criada com sucesso:', data);
      
      // 5. Atualizar estado local
      setActivities(prev => [data, ...prev]);
      
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro inesperado ao criar atividade';
      setError(errorMessage);
      console.error('Erro ao criar atividade:', err);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar atividade existente - versão otimizada
  const updateActivity = useCallback(async (id: string, updates: UpdateActivityData) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [UPDATE] Iniciando atualização da atividade:', { id, updates });

      // Verificar autenticação diretamente
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ [UPDATE] Erro de autenticação:', userError);
        throw new Error('Usuário não autenticado');
      }

      console.log('✅ [UPDATE] Usuário autenticado:', user.id);

      // Limpar campos vazios para evitar erro 400
      const cleanUpdates = { ...updates };
      if (cleanUpdates.responsible_id === '' || cleanUpdates.responsible_id === undefined) {
        cleanUpdates.responsible_id = null;
      }
      if (cleanUpdates.company_id === '' || cleanUpdates.company_id === undefined) {
        cleanUpdates.company_id = null;
      }
      if (cleanUpdates.project_id === '' || cleanUpdates.project_id === undefined) {
        cleanUpdates.project_id = null;
      }
      if (cleanUpdates.work_group === '' || cleanUpdates.work_group === undefined) {
        cleanUpdates.work_group = null;
      }
      if (cleanUpdates.department === '' || cleanUpdates.department === undefined) {
        cleanUpdates.department = null;
      }

      console.log('🔍 [UPDATE] Dados limpos que serão enviados:', JSON.stringify(cleanUpdates, null, 2));

      const { data, error } = await supabase
        .from('activities')
        .update({
          ...cleanUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('owner_id', user.id) // Garantir que só atualiza atividades próprias
        .select()
        .single();

      if (error) {
        console.error('❌ [UPDATE] Erro do Supabase:', error);
        throw error;
      }

      console.log('✅ [UPDATE] Atividade atualizada no banco:', data);

      // Atualizar estado local
      setActivities(prev => {
        const updatedActivities = prev.map(activity => 
          activity.id === id ? data : activity
        );
        console.log('✅ [UPDATE] Estado local atualizado:', updatedActivities.find(a => a.id === id));
        return updatedActivities;
      });

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar atividade';
      setError(errorMessage);
      console.error('❌ [UPDATE] Erro ao atualizar atividade:', err);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Excluir atividade - versão otimizada
  const deleteActivity = useCallback(async (id: string) => {
    try {
      setError(null);

      // Verificar autenticação diretamente
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id); // Garantir que só exclui atividades próprias

      if (error) {
        throw error;
      }

      // Atualizar estado local imediatamente - sem loading
      setActivities(prev => prev.filter(activity => activity.id !== id));
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir atividade';
      setError(errorMessage);
      console.error('Erro ao excluir atividade:', err);
      return { error: errorMessage };
    }
  }, []);

  // Buscar atividade por ID
  const getActivityById = useCallback(async (id: string) => {
    try {
      setError(null);

      const ownerId = await getOwnerId();

      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('id', id)
        .eq('owner_id', ownerId) // Garantir que só busca atividades próprias
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar atividade';
      setError(errorMessage);
      console.error('Erro ao buscar atividade:', err);
      return { data: null, error: errorMessage };
    }
  }, [getOwnerId]);

  // Atualizar progresso de uma atividade
  const updateActivityProgress = useCallback(async (id: string, progress: number) => {
    try {
      setError(null);

      const ownerId = await getOwnerId();

      const { data, error } = await supabase
        .from('activities')
        .update({
          progress,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('owner_id', ownerId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setActivities(prev => prev.map(activity => 
        activity.id === id ? data : activity
      ));

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar progresso';
      setError(errorMessage);
      console.error('Erro ao atualizar progresso:', err);
      return { data: null, error: errorMessage };
    }
  }, [getOwnerId]);

  // Marcar atividade como urgente/não urgente
  const toggleUrgent = useCallback(async (id: string, isUrgent: boolean) => {
    try {
      setError(null);

      const ownerId = await getOwnerId();

      const { data, error } = await supabase
        .from('activities')
        .update({
          is_urgent: isUrgent,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('owner_id', ownerId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setActivities(prev => prev.map(activity => 
        activity.id === id ? data : activity
      ));

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao alterar urgência';
      setError(errorMessage);
      console.error('Erro ao alterar urgência:', err);
      return { data: null, error: errorMessage };
    }
  }, [getOwnerId]);

  // Carregar atividades ao inicializar - versão otimizada sem loop
  useEffect(() => {
    let isMounted = true;
    
    const loadActivities = async () => {
      // Evitar carregamentos múltiplos
      if (loading) return;
      
      try {
        setLoading(true);
        setError(null);

        // Verificar autenticação diretamente
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('Usuário não autenticado');
        }
        
        // Buscar perfil diretamente
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, company_id')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.warn('Perfil não encontrado, usando dados do usuário');
        }
        
        // Buscar company_id
        let companyId = profile?.company_id;
        if (!companyId) {
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('company_id')
            .eq('id', user.id)
            .single();
          companyId = userProfile?.company_id || null;
        }

        let query = supabase
          .from('activities')
          .select('*');
        
        // Filtrar por empresa se disponível, senão filtrar por usuário
        if (companyId) {
          // Se tem empresa, filtrar por empresa OU owner_id (para pegar atividades importadas)
          query = query.or(`company_id.eq.${companyId},owner_id.eq.${user.id}`);
        } else {
          // Se não tem empresa, filtrar apenas por owner_id
          query = query.eq('owner_id', user.id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (isMounted) {
          setActivities(data || []);
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar atividades';
          setError(errorMessage);
          console.error('Erro ao buscar atividades:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Carregar apenas uma vez quando o hook é montado
    loadActivities();
    
    return () => {
      isMounted = false;
    };
  }, []); // Dependências vazias - carrega apenas uma vez


  // Função para mover atividade entre status (drag and drop) - COM OPTIMISTIC UI
  const moveActivity = useCallback(async (activityId: string, newStatus: string) => {
    try {
      setError(null);

      // 1. OPTIMISTIC UI: Atualizar estado local imediatamente
      const originalActivity = activities.find(a => a.id === activityId);
      if (!originalActivity) {
        throw new Error('Atividade não encontrada');
      }

      const optimisticUpdate = { ...originalActivity, status: newStatus };
      
      setActivities(prev => 
        prev.map(activity => 
          activity.id === activityId ? optimisticUpdate : activity
        )
      );

      console.log('🔄 [MOVE] Atualização otimista aplicada:', { activityId, newStatus });

      // 2. Atualizar no Supabase
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('activities')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', activityId)
        .eq('owner_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ [MOVE] Erro do Supabase:', error);
        
        // 3. REVERTER: Se falhou, reverter o estado local
        setActivities(prev => 
          prev.map(activity => 
            activity.id === activityId ? originalActivity : activity
          )
        );
        
        throw error;
      }

      console.log('✅ [MOVE] Atividade movida com sucesso no Supabase:', data);
      
      // 4. Atualizar estado local com dados reais do Supabase
      setActivities(prev => 
        prev.map(activity => 
          activity.id === activityId ? data : activity
        )
      );

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao mover atividade';
      setError(errorMessage);
      console.error('❌ [MOVE] Erro ao mover atividade:', err);
      return { data: null, error: errorMessage };
    }
  }, [activities, supabase]);



  // Função para recarregar atividades (alias para fetchActivities)
  const refetch = useCallback(() => {
    return fetchActivities();
  }, [fetchActivities]);

  // Debug simplificado apenas quando necessário - removido para evitar re-renders
  // if (process.env.NODE_ENV === 'development' && activities.length > 0) {
  //   console.log('📊 Atividades carregadas:', activities.length);
  // }

  return {
    activities,
    loading,
    error,
    fetchActivities,
    refetch,
    createActivity,
    updateActivity,
    deleteActivity,
    moveActivity,
    getActivityById,
    updateActivityProgress,
    toggleUrgent,
  };
}
