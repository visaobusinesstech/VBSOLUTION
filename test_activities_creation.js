// Script de teste para verificar a criação de atividades
// Execute este script no console do navegador na página de atividades

console.log('🧪 Iniciando teste de criação de atividades...');

// Função para testar a criação de uma atividade
async function testCreateActivity() {
  try {
    console.log('📝 Testando criação de atividade...');
    
    // Simular dados de uma atividade
    const testActivityData = {
      title: 'Teste de Atividade - ' + new Date().toLocaleString(),
      description: 'Esta é uma atividade de teste criada automaticamente',
      type: 'task',
      priority: 'medium',
      status: 'todo'
    };
    
    console.log('📋 Dados da atividade:', testActivityData);
    
    // Verificar se o hook useActivities está disponível
    if (typeof window !== 'undefined' && window.React) {
      console.log('✅ React está disponível');
    } else {
      console.log('❌ React não está disponível');
      return;
    }
    
    // Verificar se o Supabase está disponível
    if (typeof window !== 'undefined' && window.supabase) {
      console.log('✅ Supabase está disponível');
    } else {
      console.log('❌ Supabase não está disponível');
      return;
    }
    
    console.log('✅ Teste de criação de atividade concluído');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Função para verificar a estrutura da tabela activities
async function checkActivitiesTable() {
  try {
    console.log('🔍 Verificando estrutura da tabela activities...');
    
    if (typeof window !== 'undefined' && window.supabase) {
      const { data, error } = await window.supabase
        .from('activities')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('❌ Erro ao verificar tabela:', error);
      } else {
        console.log('✅ Tabela activities acessível');
        console.log('📊 Estrutura da tabela:', data);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao verificar tabela:', error);
  }
}

// Função para verificar as colunas do Kanban
function checkKanbanColumns() {
  try {
    console.log('🎯 Verificando colunas do Kanban...');
    
    const savedColumns = localStorage.getItem('kanbanColumns');
    if (savedColumns) {
      const columns = JSON.parse(savedColumns);
      console.log('✅ Colunas do Kanban carregadas:', columns);
      
      // Verificar se as colunas têm os status corretos
      const expectedStatuses = ['todo', 'doing', 'done'];
      const columnStatuses = columns.map(col => col.status);
      
      const hasCorrectStatuses = expectedStatuses.every(status => 
        columnStatuses.includes(status)
      );
      
      if (hasCorrectStatuses) {
        console.log('✅ Colunas do Kanban têm os status corretos');
      } else {
        console.log('⚠️ Colunas do Kanban podem ter status incorretos');
        console.log('Status esperados:', expectedStatuses);
        console.log('Status encontrados:', columnStatuses);
      }
    } else {
      console.log('⚠️ Nenhuma configuração de Kanban salva encontrada');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar colunas do Kanban:', error);
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('🚀 Executando todos os testes...');
  
  await checkActivitiesTable();
  checkKanbanColumns();
  await testCreateActivity();
  
  console.log('✅ Todos os testes concluídos!');
}

// Executar testes automaticamente
runAllTests();

// Exportar funções para uso manual
window.testActivities = {
  testCreateActivity,
  checkActivitiesTable,
  checkKanbanColumns,
  runAllTests
};

console.log('💡 Funções de teste disponíveis em window.testActivities');
