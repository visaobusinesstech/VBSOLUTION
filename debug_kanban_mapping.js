// Script para debugar o mapeamento entre atividades e colunas do Kanban
// Execute este script no console do navegador na página de atividades

console.log('🔍 Debugando mapeamento do Kanban...');

// Função para verificar as atividades carregadas
function checkActivitiesData() {
  try {
    console.log('📊 Verificando dados das atividades...');
    
    // Verificar se o React está disponível
    if (typeof window !== 'undefined' && window.React) {
      console.log('✅ React está disponível');
    } else {
      console.log('❌ React não está disponível');
      return false;
    }
    
    // Verificar elementos do DOM para atividades
    const activityElements = document.querySelectorAll('[data-activity-id], [draggable="true"]');
    console.log('📋 Elementos de atividade encontrados:', activityElements.length);
    
    // Verificar se há atividades no localStorage ou estado
    const savedActivities = localStorage.getItem('activities');
    if (savedActivities) {
      console.log('💾 Atividades salvas no localStorage:', JSON.parse(savedActivities));
    } else {
      console.log('⚠️ Nenhuma atividade salva no localStorage');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar atividades:', error);
    return false;
  }
}

// Função para verificar as colunas do Kanban
function checkKanbanColumns() {
  try {
    console.log('📦 Verificando colunas do Kanban...');
    
    const savedColumns = localStorage.getItem('kanbanColumns');
    if (savedColumns) {
      const columns = JSON.parse(savedColumns);
      console.log('📊 Colunas do Kanban:', columns);
      
      // Verificar se as colunas têm os status corretos
      const statuses = columns.map(col => col.status);
      console.log('📋 Status das colunas:', statuses);
      
      return columns;
    } else {
      console.log('⚠️ Nenhuma configuração de colunas salva');
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar colunas:', error);
    return null;
  }
}

// Função para verificar o mapeamento entre atividades e colunas
function checkMapping() {
  try {
    console.log('🗺️ Verificando mapeamento...');
    
    const columns = checkKanbanColumns();
    if (!columns) {
      console.log('⚠️ Não é possível verificar mapeamento sem colunas');
      return false;
    }
    
    // Verificar se há atividades no DOM
    const activityElements = document.querySelectorAll('[draggable="true"]');
    console.log('📋 Atividades no DOM:', activityElements.length);
    
    // Verificar status das atividades
    activityElements.forEach((element, index) => {
      const status = element.getAttribute('data-status') || 'unknown';
      const title = element.querySelector('h4, .title, [data-title]')?.textContent || 'Sem título';
      
      console.log(`Atividade ${index + 1}:`, {
        title: title,
        status: status,
        element: element
      });
    });
    
    // Verificar se há atividades órfãs (sem coluna correspondente)
    const activityStatuses = Array.from(activityElements).map(el => 
      el.getAttribute('data-status') || 'unknown'
    );
    
    const columnStatuses = columns.map(col => col.status);
    const orphanStatuses = activityStatuses.filter(status => 
      !columnStatuses.includes(status) && status !== 'unknown'
    );
    
    if (orphanStatuses.length > 0) {
      console.log('⚠️ Status órfãos encontrados:', [...new Set(orphanStatuses)]);
      console.log('💡 Dica: Verifique se as colunas correspondem aos status das atividades');
    } else {
      console.log('✅ Todas as atividades têm colunas correspondentes');
    }
    
    return orphanStatuses.length === 0;
  } catch (error) {
    console.error('❌ Erro ao verificar mapeamento:', error);
    return false;
  }
}

// Função para verificar se as atividades estão sendo carregadas do Supabase
async function checkSupabaseData() {
  try {
    console.log('🔌 Verificando dados do Supabase...');
    
    if (typeof window !== 'undefined' && window.supabase) {
      const { data, error } = await window.supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('❌ Erro ao buscar atividades do Supabase:', error);
        return false;
      }
      
      console.log('✅ Atividades encontradas no Supabase:', data?.length || 0);
      console.log('📋 Dados das atividades:', data);
      
      if (data && data.length > 0) {
        // Verificar status das atividades
        const statuses = data.map(activity => activity.status);
        console.log('📊 Status das atividades no Supabase:', [...new Set(statuses)]);
        
        // Verificar se há atividades com status 'todo'
        const todoActivities = data.filter(activity => activity.status === 'todo');
        console.log('📝 Atividades com status "todo":', todoActivities.length);
        
        if (todoActivities.length > 0) {
          console.log('✅ Atividades com status "todo" encontradas');
        } else {
          console.log('⚠️ Nenhuma atividade com status "todo" encontrada');
        }
      }
      
      return true;
    } else {
      console.error('❌ Supabase não está disponível');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar Supabase:', error);
    return false;
  }
}

// Função para forçar recarregamento das atividades
async function forceReloadActivities() {
  try {
    console.log('🔄 Forçando recarregamento das atividades...');
    
    // Limpar localStorage
    localStorage.removeItem('kanbanColumns');
    console.log('🗑️ Configurações do Kanban limpas');
    
    // Recarregar página
    console.log('🔄 Recarregando página...');
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Erro ao forçar recarregamento:', error);
  }
}

// Função para criar uma atividade de teste
async function createTestActivity() {
  try {
    console.log('➕ Criando atividade de teste...');
    
    if (typeof window !== 'undefined' && window.supabase) {
      const { data: { user } } = await window.supabase.auth.getUser();
      
      if (!user) {
        console.log('⚠️ Usuário não autenticado');
        return false;
      }
      
      const testActivity = {
        title: `Teste de Mapeamento - ${new Date().toLocaleString()}`,
        description: 'Esta é uma atividade de teste para verificar o mapeamento',
        type: 'task',
        priority: 'medium',
        status: 'todo',
        owner_id: user.id
      };
      
      console.log('📝 Criando atividade:', testActivity);
      
      const { data, error } = await window.supabase
        .from('activities')
        .insert([testActivity])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Erro ao criar atividade de teste:', error);
        return false;
      }
      
      console.log('✅ Atividade de teste criada:', data);
      
      // Aguardar um pouco e verificar se aparece no Kanban
      setTimeout(() => {
        console.log('🔍 Verificando se a atividade aparece no Kanban...');
        const activityElements = document.querySelectorAll('[draggable="true"]');
        console.log('📋 Atividades no DOM após criação:', activityElements.length);
      }, 2000);
      
      return true;
    } else {
      console.error('❌ Supabase não está disponível');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao criar atividade de teste:', error);
    return false;
  }
}

// Função principal para executar todos os checks
async function runDebugChecks() {
  console.log('🚀 Iniciando debug do mapeamento do Kanban...');
  
  const results = {
    activities: checkActivitiesData(),
    columns: checkKanbanColumns(),
    mapping: checkMapping(),
    supabase: await checkSupabaseData(),
    testActivity: await createTestActivity()
  };
  
  console.log('📊 Resultados do debug:', results);
  
  // Sugestões baseadas nos resultados
  if (!results.activities) {
    console.log('💡 Problema: Atividades não estão sendo carregadas no frontend');
  }
  
  if (!results.columns) {
    console.log('💡 Problema: Colunas do Kanban não estão configuradas');
  }
  
  if (!results.mapping) {
    console.log('💡 Problema: Mapeamento entre atividades e colunas está incorreto');
  }
  
  if (!results.supabase) {
    console.log('💡 Problema: Dados não estão sendo carregados do Supabase');
  }
  
  return results;
}

// Executar debug automaticamente
runDebugChecks();

// Exportar funções para uso manual
window.debugKanban = {
  checkActivitiesData,
  checkKanbanColumns,
  checkMapping,
  checkSupabaseData,
  forceReloadActivities,
  createTestActivity,
  runDebugChecks
};

console.log('💡 Funções de debug disponíveis em window.debugKanban');
