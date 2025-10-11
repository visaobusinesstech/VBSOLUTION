// Script para executar o diagnóstico automaticamente
// Execute este script no console do navegador

console.log('🚀 EXECUTANDO DIAGNÓSTICO AUTOMATIZADO...');

// Função para executar o diagnóstico e capturar resultados
async function executeDiagnosis() {
  try {
    // Executar o script de diagnóstico
    const diagnosisScript = await fetch('/auto_diagnose_theme_issue.js');
    const diagnosisCode = await diagnosisScript.text();
    
    // Executar o código
    eval(diagnosisCode);
    
    // Aguardar um pouco para os testes terminarem
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Capturar resultados
    const results = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    console.log('\n📊 RESULTADOS CAPTURADOS:');
    console.log(JSON.stringify(results, null, 2));
    
    return results;
  } catch (error) {
    console.error('❌ Erro ao executar diagnóstico:', error);
    return { error: error.message };
  }
}

// Executar diagnóstico
executeDiagnosis();
