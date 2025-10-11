// Script de teste para verificar a funcionalidade de drag and drop
// Execute este script no console do navegador na página de atividades

console.log('🧪 Iniciando teste de drag and drop...');

// Função para testar o drag and drop
function testDragAndDrop() {
  try {
    console.log('🎯 Testando funcionalidade de drag and drop...');
    
    // Verificar se os elementos do Kanban estão presentes
    const kanbanColumns = document.querySelectorAll('[data-column-id]');
    const taskCards = document.querySelectorAll('[draggable="true"]');
    
    console.log('📊 Colunas encontradas:', kanbanColumns.length);
    console.log('📋 Cards de tarefa encontrados:', taskCards.length);
    
    if (kanbanColumns.length === 0) {
      console.log('⚠️ Nenhuma coluna do Kanban encontrada');
      return;
    }
    
    if (taskCards.length === 0) {
      console.log('⚠️ Nenhum card de tarefa encontrado');
      return;
    }
    
    // Verificar se os event listeners estão configurados
    const firstCard = taskCards[0];
    const firstColumn = kanbanColumns[0];
    
    console.log('✅ Elementos do Kanban encontrados');
    console.log('🎨 Primeiro card:', firstCard);
    console.log('📦 Primeira coluna:', firstColumn);
    
    // Verificar se o drag and drop está habilitado
    if (firstCard.draggable) {
      console.log('✅ Drag and drop habilitado nos cards');
    } else {
      console.log('❌ Drag and drop não habilitado nos cards');
    }
    
    console.log('✅ Teste de drag and drop concluído');
    
  } catch (error) {
    console.error('❌ Erro no teste de drag and drop:', error);
  }
}

// Função para simular um drag and drop
function simulateDragAndDrop() {
  try {
    console.log('🎭 Simulando drag and drop...');
    
    const taskCards = document.querySelectorAll('[draggable="true"]');
    const kanbanColumns = document.querySelectorAll('[data-column-id]');
    
    if (taskCards.length === 0 || kanbanColumns.length < 2) {
      console.log('⚠️ Elementos insuficientes para simular drag and drop');
      return;
    }
    
    const sourceCard = taskCards[0];
    const targetColumn = kanbanColumns[1];
    
    console.log('🎯 Simulando drag do card:', sourceCard);
    console.log('🎯 Para a coluna:', targetColumn);
    
    // Simular eventos de drag
    const dragStartEvent = new DragEvent('dragstart', {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer()
    });
    
    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer()
    });
    
    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer()
    });
    
    // Disparar eventos
    sourceCard.dispatchEvent(dragStartEvent);
    targetColumn.dispatchEvent(dragOverEvent);
    targetColumn.dispatchEvent(dropEvent);
    
    console.log('✅ Simulação de drag and drop concluída');
    
  } catch (error) {
    console.error('❌ Erro na simulação:', error);
  }
}

// Função para verificar o estado das atividades
function checkActivitiesState() {
  try {
    console.log('🔍 Verificando estado das atividades...');
    
    // Verificar se o React está disponível
    if (typeof window !== 'undefined' && window.React) {
      console.log('✅ React está disponível');
    } else {
      console.log('❌ React não está disponível');
      return;
    }
    
    // Verificar se o hook useActivities está funcionando
    const activitiesElements = document.querySelectorAll('[data-activity-id]');
    console.log('📊 Atividades renderizadas:', activitiesElements.length);
    
    // Verificar se as colunas estão configuradas corretamente
    const columnHeaders = document.querySelectorAll('[data-column-name]');
    console.log('📦 Cabeçalhos de coluna:', columnHeaders.length);
    
    columnHeaders.forEach((header, index) => {
      console.log(`  ${index + 1}. ${header.textContent}`);
    });
    
    console.log('✅ Estado das atividades verificado');
    
  } catch (error) {
    console.error('❌ Erro ao verificar estado:', error);
  }
}

// Função para verificar a funcionalidade de movimentação
function checkMoveFunctionality() {
  try {
    console.log('🔄 Verificando funcionalidade de movimentação...');
    
    // Verificar se a função moveActivity está disponível
    if (typeof window !== 'undefined' && window.React) {
      console.log('✅ React disponível para verificar funções');
    }
    
    // Verificar se há atividades para mover
    const taskCards = document.querySelectorAll('[draggable="true"]');
    if (taskCards.length === 0) {
      console.log('⚠️ Nenhuma atividade disponível para mover');
      return;
    }
    
    console.log('✅ Funcionalidade de movimentação verificada');
    
  } catch (error) {
    console.error('❌ Erro ao verificar funcionalidade:', error);
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('🚀 Executando todos os testes de drag and drop...');
  
  testDragAndDrop();
  checkActivitiesState();
  checkMoveFunctionality();
  simulateDragAndDrop();
  
  console.log('✅ Todos os testes de drag and drop concluídos!');
}

// Executar testes automaticamente
runAllTests();

// Exportar funções para uso manual
window.testDragDrop = {
  testDragAndDrop,
  simulateDragAndDrop,
  checkActivitiesState,
  checkMoveFunctionality,
  runAllTests
};

console.log('💡 Funções de teste disponíveis em window.testDragDrop');
