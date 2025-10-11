// Script de teste para o sistema de identidade visual por empresa
// Execute este script no console do navegador para testar

console.log('🎨 Testando Sistema de Identidade Visual por Empresa');

// Função para testar se as variáveis CSS estão sendo aplicadas
function testCSSVariables() {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  console.log('📊 Variáveis CSS atuais:');
  console.log('--sidebar-color:', computedStyle.getPropertyValue('--sidebar-color'));
  console.log('--topbar-color:', computedStyle.getPropertyValue('--topbar-color'));
  console.log('--button-color:', computedStyle.getPropertyValue('--button-color'));
  
  return {
    sidebar: computedStyle.getPropertyValue('--sidebar-color'),
    topbar: computedStyle.getPropertyValue('--topbar-color'),
    button: computedStyle.getPropertyValue('--button-color')
  };
}

// Função para testar se os componentes estão usando as variáveis CSS
function testComponentStyles() {
  console.log('🔍 Testando estilos dos componentes:');
  
  // Testar sidebar
  const sidebar = document.querySelector('[class*="fixed left-0 top-[46px]"]');
  if (sidebar) {
    const sidebarStyle = getComputedStyle(sidebar);
    console.log('Sidebar background:', sidebarStyle.backgroundColor);
  }
  
  // Testar topbar
  const topbar = document.querySelector('header[class*="fixed top-0"]');
  if (topbar) {
    const topbarStyle = getComputedStyle(topbar);
    console.log('Topbar background:', topbarStyle.backgroundColor);
  }
  
  // Testar botões
  const buttons = document.querySelectorAll('button[class*="px-4 py-2"]');
  if (buttons.length > 0) {
    const buttonStyle = getComputedStyle(buttons[0]);
    console.log('Botão background:', buttonStyle.backgroundColor);
    console.log('Botão border:', buttonStyle.borderColor);
  }
}

// Função para simular mudança de cores
function simulateColorChange() {
  console.log('🎨 Simulando mudança de cores...');
  
  const root = document.documentElement;
  
  // Cores de teste
  const testColors = {
    sidebar: '#ff6b6b',
    topbar: '#4ecdc4',
    button: '#45b7d1'
  };
  
  // Aplicar cores de teste
  root.style.setProperty('--sidebar-color', testColors.sidebar);
  root.style.setProperty('--topbar-color', testColors.topbar);
  root.style.setProperty('--button-color', testColors.button);
  
  console.log('✅ Cores de teste aplicadas:', testColors);
  
  // Aguardar um pouco e restaurar cores padrão
  setTimeout(() => {
    root.style.setProperty('--sidebar-color', '#dee2e3');
    root.style.setProperty('--topbar-color', '#3F30F1');
    root.style.setProperty('--button-color', '#4A5477');
    console.log('🔄 Cores restauradas para padrão');
  }, 3000);
}

// Função principal de teste
function runTests() {
  console.log('🚀 Iniciando testes do sistema de identidade visual...');
  
  // Teste 1: Verificar variáveis CSS
  console.log('\n1️⃣ Testando variáveis CSS:');
  testCSSVariables();
  
  // Teste 2: Verificar estilos dos componentes
  console.log('\n2️⃣ Testando estilos dos componentes:');
  testComponentStyles();
  
  // Teste 3: Simular mudança de cores
  console.log('\n3️⃣ Testando mudança de cores:');
  simulateColorChange();
  
  console.log('\n✅ Testes concluídos!');
  console.log('💡 Para testar completamente, vá para Configurações > Empresa > Identidade Visual');
}

// Executar testes
runTests();

// Exportar funções para uso manual
window.testCompanyTheme = {
  testCSSVariables,
  testComponentStyles,
  simulateColorChange,
  runTests
};

console.log('🔧 Funções de teste disponíveis em window.testCompanyTheme');
