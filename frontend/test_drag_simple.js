// Teste simples de drag and drop
// Execute no console do navegador na página de atividades

console.log('🧪 Testando drag and drop...');

// Verificar se há elementos do Kanban
const kanbanContainer = document.querySelector('.flex.gap-6');
if (!kanbanContainer) {
  console.error('❌ Container do Kanban não encontrado');
} else {
  console.log('✅ Container do Kanban encontrado');
  
  const columns = kanbanContainer.querySelectorAll('[style*="width: 280px"]');
  console.log(`📋 Colunas encontradas: ${columns.length}`);
  
  const taskCards = kanbanContainer.querySelectorAll('[draggable="true"]');
  console.log(`🎯 Cards de tarefas: ${taskCards.length}`);
  
  if (taskCards.length > 0) {
    console.log('✅ Cards encontrados - drag and drop deve funcionar');
    console.log('🎮 Tente arrastar um card de uma coluna para outra');
  } else {
    console.warn('⚠️ Nenhum card encontrado para testar');
  }
}
