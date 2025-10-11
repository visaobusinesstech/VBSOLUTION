// Script para verificar se as atividades estão sendo salvas com o status correto
// Execute este script no console do navegador na página de atividades

console.log('🔍 Verificando status das atividades...');

// Função para verificar atividades no Supabase
async function checkActivityStatus() {
  try {
    console.log('🔌 Verificando atividades no Supabase...');
    
    if (typeof window !== 'undefined' && window.supabase) {
      const { data, error } = await window.supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar atividades:', error);
        return false;
      }
      
      console.log('✅ Atividades encontradas:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('📋 Detalhes das atividades:');
        data.forEach((activity, index) => {
          console.log(`  ${index + 1}. ${activity.title}`);
          console.log(`     Status: ${activity.status}`);
          console.log(`     Owner ID: ${activity.owner_id}`);
          console.log(`     Criado em: ${activity.created_at}`);
          console.log('     ---');
        });
        
        // Verificar status únicos
        const uniqueStatuses = [...new Set(data.map(activity => activity.status))];
        console.log('📊 Status únicos encontrados:', uniqueStatuses);
        
        // Verificar se há atividades com status 'todo'
        const todoActivities = data.filter(activity => activity.status === 'todo');
        console.log(`📝 Atividades com status "todo": ${todoActivities.length}`);
        
        if (todoActivities.length > 0) {
          console.log('✅ Atividades com status "todo" encontradas');
          return true;
        } else {
          console.log('⚠️ Nenhuma atividade com status "todo" encontrada');
          return false;
        }
      } else {
        console.log('⚠️ Nenhuma atividade encontrada');
        return false;
      }
    } else {
      console.error('❌ Supabase não está disponível');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar atividades:', error);
    return false;
  }
}

// Função para verificar configuração das colunas do Kanban
function checkKanbanColumnConfig() {
  try {
    console.log('📦 Verificando configuração das colunas do Kanban...');
    
    const savedColumns = localStorage.getItem('kanbanColumns');
    if (savedColumns) {
      const columns = JSON.parse(savedColumns);
      console.log('📊 Colunas do Kanban:', columns);
      
      const statuses = columns.map(col => col.status);
      console.log('📋 Status das colunas:', statuses);
      
      // Verificar se há coluna para status 'todo'
      const hasTodoColumn = statuses.includes('todo');
      console.log(`✅ Coluna para status "todo": ${hasTodoColumn ? 'Sim' : 'Não'}`);
      
      return hasTodoColumn;
    } else {
      console.log('⚠️ Nenhuma configuração de colunas salva');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar colunas:', error);
    return false;
  }
}

// Função para verificar se as atividades estão sendo exibidas no Kanban
function checkKanbanDisplay() {
  try {
    console.log('🎯 Verificando exibição no Kanban...');
    
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
    console.error('❌ Erro ao verificar exibição:', error);
    return false;
  }
}

// Função para criar uma atividade de teste com status 'todo'
async function createTodoTestActivity() {
  try {
    console.log('➕ Criando atividade de teste com status "todo"...');
    
    if (typeof window !== 'undefined' && window.supabase) {
      const { data: { user } } = await window.supabase.auth.getUser();
      
      if (!user) {
        console.log('⚠️ Usuário não autenticado');
        return false;
      }
      
      const testActivity = {
        title: `Teste Todo - ${new Date().toLocaleString()}`,
        description: 'Atividade de teste com status todo',
        type: 'task',
        priority: 'medium',
        status: 'todo', // Status específico para teste
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
        checkKanbanDisplay();
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

// Função para verificar se há problemas de mapeamento
function checkMappingIssues() {
  try {
    console.log('🗺️ Verificando problemas de mapeamento...');
    
    const savedColumns = localStorage.getItem('kanbanColumns');
    if (!savedColumns) {
      console.log('⚠️ Nenhuma configuração de colunas encontrada');
      return false;
    }
    
    const columns = JSON.parse(savedColumns);
    const columnStatuses = columns.map(col => col.status);
    
    // Verificar se há atividades no Supabase
    if (typeof window !== 'undefined' && window.supabase) {
      window.supabase
        .from('activities')
        .select('status')
        .then(({ data, error }) => {
          if (error) {
            console.error('❌ Erro ao verificar atividades:', error);
            return;
          }
          
          if (data && data.length > 0) {
            const activityStatuses = [...new Set(data.map(activity => activity.status))];
            console.log('📊 Status das atividades:', activityStatuses);
            console.log('📊 Status das colunas:', columnStatuses);
            
            // Verificar status órfãos
            const orphanStatuses = activityStatuses.filter(status => 
              !columnStatuses.includes(status)
            );
            
            if (orphanStatuses.length > 0) {
              console.log('⚠️ Status órfãos encontrados:', orphanStatuses);
              console.log('💡 Dica: Adicione colunas para estes status ou mude o status das atividades');
            } else {
              console.log('✅ Todos os status das atividades têm colunas correspondentes');
            }
            
            // Verificar colunas vazias
            const emptyColumns = columnStatuses.filter(status => 
              !activityStatuses.includes(status)
            );
            
            if (emptyColumns.length > 0) {
              console.log('📋 Colunas vazias:', emptyColumns);
            }
          }
        });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar mapeamento:', error);
    return false;
  }
}

// Função principal para executar todos os testes
async function runStatusVerification() {
  console.log('🚀 Iniciando verificação de status das atividades...');
  
  const results = {
    supabase: await checkActivityStatus(),
    columns: checkKanbanColumnConfig(),
    display: checkKanbanDisplay(),
    mapping: checkMappingIssues()
  };
  
  console.log('📊 Resultados da verificação:', results);
  
  // Análise dos resultados
  if (!results.supabase) {
    console.log('💡 Problema: Nenhuma atividade no Supabase');
    console.log('🔧 Solução: Execute createTodoTestActivity() para criar uma atividade de teste');
  }
  
  if (!results.columns) {
    console.log('💡 Problema: Colunas do Kanban não configuradas');
    console.log('🔧 Solução: Verifique se as colunas estão sendo salvas no localStorage');
  }
  
  if (!results.display) {
    console.log('💡 Problema: Atividades não estão sendo exibidas no Kanban');
    console.log('🔧 Solução: Verifique se o componente ClickUpKanban está funcionando');
  }
  
  if (!results.mapping) {
    console.log('💡 Problema: Problemas de mapeamento entre atividades e colunas');
    console.log('🔧 Solução: Verifique se os status correspondem');
  }
  
  return results;
}

// Executar verificação automaticamente
runStatusVerification();

// Exportar funções para uso manual
window.verifyStatus = {
  checkActivityStatus,
  checkKanbanColumnConfig,
  checkKanbanDisplay,
  createTodoTestActivity,
  checkMappingIssues,
  runStatusVerification
};

console.log('💡 Funções de verificação disponíveis em window.verifyStatus');
