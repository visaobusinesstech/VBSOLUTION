// Script para testar a exibição de atividades no Kanban
// Execute este script no console do navegador na página de atividades

console.log('🎯 Testando exibição de atividades no Kanban...');

// Função para verificar se as atividades estão sendo carregadas
async function checkActivitiesLoading() {
  try {
    console.log('🔍 Verificando carregamento de atividades...');
    
    // Verificar se há atividades no estado do React
    const reactRoot = document.querySelector('#root');
    if (!reactRoot) {
      console.log('❌ Root do React não encontrado');
      return false;
    }
    
    // Verificar se há elementos de atividade no DOM
    const activityElements = document.querySelectorAll('[draggable="true"]');
    console.log('📋 Elementos de atividade no DOM:', activityElements.length);
    
    if (activityElements.length > 0) {
      console.log('✅ Atividades encontradas no DOM');
      activityElements.forEach((element, index) => {
        const title = element.querySelector('h4, .title, [data-title]')?.textContent || 'Sem título';
        const status = element.getAttribute('data-status') || 'unknown';
        console.log(`  ${index + 1}. ${title} (${status})`);
      });
      return true;
    } else {
      console.log('⚠️ Nenhuma atividade encontrada no DOM');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar atividades:', error);
    return false;
  }
}

// Função para verificar as colunas do Kanban
function checkKanbanColumns() {
  try {
    console.log('📦 Verificando colunas do Kanban...');
    
    const columnElements = document.querySelectorAll('[data-column-id], .kanban-column');
    console.log('📊 Colunas encontradas no DOM:', columnElements.length);
    
    if (columnElements.length > 0) {
      columnElements.forEach((column, index) => {
        const name = column.querySelector('h3, .column-title')?.textContent || 'Sem nome';
        const taskCount = column.querySelectorAll('[draggable="true"]').length;
        console.log(`  ${index + 1}. ${name} (${taskCount} tarefas)`);
      });
      return true;
    } else {
      console.log('⚠️ Nenhuma coluna encontrada no DOM');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar colunas:', error);
    return false;
  }
}

// Função para verificar o mapeamento entre atividades e colunas
function checkActivityColumnMapping() {
  try {
    console.log('🗺️ Verificando mapeamento atividades-colunas...');
    
    const columns = document.querySelectorAll('[data-column-id], .kanban-column');
    let totalMappedActivities = 0;
    
    columns.forEach((column, index) => {
      const columnName = column.querySelector('h3, .column-title')?.textContent || `Coluna ${index + 1}`;
      const activities = column.querySelectorAll('[draggable="true"]');
      
      console.log(`📋 ${columnName}: ${activities.length} atividades`);
      
      activities.forEach((activity, actIndex) => {
        const title = activity.querySelector('h4, .title, [data-title]')?.textContent || 'Sem título';
        const status = activity.getAttribute('data-status') || 'unknown';
        console.log(`  ${actIndex + 1}. ${title} (${status})`);
        totalMappedActivities++;
      });
    });
    
    console.log(`📊 Total de atividades mapeadas: ${totalMappedActivities}`);
    return totalMappedActivities > 0;
  } catch (error) {
    console.error('❌ Erro ao verificar mapeamento:', error);
    return false;
  }
}

// Função para verificar se há atividades no Supabase
async function checkSupabaseActivities() {
  try {
    console.log('🔌 Verificando atividades no Supabase...');
    
    if (typeof window !== 'undefined' && window.supabase) {
      const { data, error } = await window.supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar atividades do Supabase:', error);
        return false;
      }
      
      console.log('✅ Atividades encontradas no Supabase:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('📋 Detalhes das atividades:');
        data.forEach((activity, index) => {
          console.log(`  ${index + 1}. ${activity.title} (${activity.status})`);
        });
        
        // Verificar se há atividades com status 'todo'
        const todoActivities = data.filter(activity => activity.status === 'todo');
        console.log(`📝 Atividades com status "todo": ${todoActivities.length}`);
        
        return true;
      } else {
        console.log('⚠️ Nenhuma atividade encontrada no Supabase');
        return false;
      }
    } else {
      console.error('❌ Supabase não está disponível');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar Supabase:', error);
    return false;
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
        title: `Teste Kanban - ${new Date().toLocaleString()}`,
        description: 'Atividade de teste para verificar exibição no Kanban',
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
        checkActivitiesLoading();
      }, 3000);
      
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

// Função para forçar recarregamento da página
function forceReload() {
  console.log('🔄 Forçando recarregamento da página...');
  window.location.reload();
}

// Função para verificar logs do console
function checkConsoleLogs() {
  console.log('📋 Verificando logs do console...');
  
  // Verificar se há logs de debug do Kanban
  const hasKanbanLogs = console.log.toString().includes('KANBAN') || 
                       console.log.toString().includes('kanban');
  
  if (hasKanbanLogs) {
    console.log('✅ Logs de debug do Kanban encontrados');
  } else {
    console.log('⚠️ Nenhum log de debug do Kanban encontrado');
  }
  
  return hasKanbanLogs;
}

// Função principal para executar todos os testes
async function runKanbanTests() {
  console.log('🚀 Iniciando testes de exibição do Kanban...');
  
  const results = {
    supabase: await checkSupabaseActivities(),
    activities: checkActivitiesLoading(),
    columns: checkKanbanColumns(),
    mapping: checkActivityColumnMapping(),
    logs: checkConsoleLogs()
  };
  
  console.log('📊 Resultados dos testes:', results);
  
  // Análise dos resultados
  if (!results.supabase) {
    console.log('💡 Problema: Nenhuma atividade no Supabase');
    console.log('🔧 Solução: Execute createTestActivity() para criar uma atividade de teste');
  }
  
  if (!results.activities) {
    console.log('💡 Problema: Atividades não estão sendo carregadas no frontend');
    console.log('🔧 Solução: Verifique se o hook useActivities está funcionando');
  }
  
  if (!results.columns) {
    console.log('💡 Problema: Colunas do Kanban não estão sendo renderizadas');
    console.log('🔧 Solução: Verifique se o componente ClickUpKanban está sendo renderizado');
  }
  
  if (!results.mapping) {
    console.log('💡 Problema: Atividades não estão sendo mapeadas para as colunas');
    console.log('🔧 Solução: Verifique se os status das atividades correspondem aos das colunas');
  }
  
  if (!results.logs) {
    console.log('💡 Problema: Logs de debug não estão sendo exibidos');
    console.log('🔧 Solução: Verifique se os logs de debug estão habilitados');
  }
  
  // Sugestões baseadas nos resultados
  if (results.supabase && !results.activities) {
    console.log('🔧 Ação sugerida: As atividades estão no Supabase mas não no frontend');
    console.log('   - Verifique se o hook useActivities está sendo chamado');
    console.log('   - Verifique se há erros de autenticação');
    console.log('   - Execute forceReload() para recarregar a página');
  }
  
  if (results.activities && !results.mapping) {
    console.log('🔧 Ação sugerida: As atividades estão carregadas mas não mapeadas');
    console.log('   - Verifique se os status das atividades correspondem aos das colunas');
    console.log('   - Verifique se o componente ClickUpKanban está funcionando');
  }
  
  return results;
}

// Executar testes automaticamente
runKanbanTests();

// Exportar funções para uso manual
window.testKanban = {
  checkActivitiesLoading,
  checkKanbanColumns,
  checkActivityColumnMapping,
  checkSupabaseActivities,
  createTestActivity,
  forceReload,
  checkConsoleLogs,
  runKanbanTests
};

console.log('💡 Funções de teste disponíveis em window.testKanban');
