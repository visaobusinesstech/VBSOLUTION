#!/usr/bin/env node

/**
 * Script de Limpeza de Portas - VBSolution CRM
 * Remove processos conflitantes das portas do sistema
 */

const PortFinder = require('./port-finder');

async function cleanupPorts() {
  console.log('🧹 Iniciando limpeza de portas do VBSolution CRM...\n');
  
  const finder = new PortFinder();
  
  try {
    // Limpeza agressiva de todas as portas conflitantes
    const cleanedPorts = await finder.cleanupAllConflicts();
    
    if (cleanedPorts.length === 0) {
      console.log('✅ Nenhum conflito de porta encontrado!');
    } else {
      console.log(`✅ Limpeza concluída! ${cleanedPorts.length} portas liberadas.`);
    }
    
    // Verificar portas disponíveis
    console.log('\n🔍 Verificando portas disponíveis...');
    const ports = await finder.findPorts();
    
    console.log('\n📊 Status das portas:');
    console.log(`🌐 Frontend: ${ports.frontend} (disponível)`);
    console.log(`🔧 Backend: ${ports.backend} (disponível)`);
    
    console.log('\n✅ Sistema pronto para inicialização!');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  cleanupPorts().catch(console.error);
}

module.exports = cleanupPorts;
