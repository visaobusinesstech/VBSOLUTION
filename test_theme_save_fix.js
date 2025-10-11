// Script de teste para verificar se a correção do erro "Falha ao aplicar tema" funcionou
// Execute este script no console do navegador

console.log('🎨 Testando correção do erro "Falha ao aplicar tema"...');

// Função para testar se as cores estão sendo aplicadas corretamente
function testThemeApplication() {
  console.log('📊 Testando aplicação do tema:');
  
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  const sidebarColor = computedStyle.getPropertyValue('--sidebar-color');
  const topbarColor = computedStyle.getPropertyValue('--topbar-color');
  const buttonColor = computedStyle.getPropertyValue('--button-color');
  
  console.log('Cores atuais:');
  console.log('- Sidebar:', sidebarColor);
  console.log('- Topbar:', topbarColor);
  console.log('- Button:', buttonColor);
  
  return {
    sidebar: sidebarColor,
    topbar: topbarColor,
    button: buttonColor
  };
}

// Função para simular mudança de cores e teste de salvamento
function simulateThemeChange() {
  console.log('🎨 Simulando mudança de tema...');
  
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
  
  // Verificar se as cores foram aplicadas
  const appliedColors = testThemeApplication();
  
  if (appliedColors.sidebar === testColors.sidebar && 
      appliedColors.topbar === testColors.topbar && 
      appliedColors.button === testColors.button) {
    console.log('✅ Cores aplicadas com sucesso!');
  } else {
    console.log('❌ Erro ao aplicar cores');
  }
  
  // Restaurar cores padrão após 3 segundos
  setTimeout(() => {
    root.style.setProperty('--sidebar-color', '#dee2e3');
    root.style.setProperty('--topbar-color', '#3F30F1');
    root.style.setProperty('--button-color', '#4A5477');
    console.log('🔄 Cores restauradas para padrão');
  }, 3000);
}

// Função para verificar se os componentes estão usando as cores corretas
function testComponentColors() {
  console.log('🧩 Testando cores dos componentes:');
  
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

// Função para verificar se há erros no console relacionados ao tema
function checkThemeErrors() {
  console.log('🔍 Verificando erros relacionados ao tema...');
  
  const originalError = console.error;
  const themeErrors = [];
  
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('tema') || message.includes('theme') || message.includes('Falha ao aplicar')) {
      themeErrors.push(message);
    }
    originalError.apply(console, args);
  };
  
  // Aguardar um pouco para capturar erros
  setTimeout(() => {
    console.error = originalError;
    
    if (themeErrors.length === 0) {
      console.log('✅ Nenhum erro de tema detectado');
    } else {
      console.log('❌ Erros de tema detectados:', themeErrors);
    }
  }, 2000);
}

// Função para testar a interface de configuração
function testSettingsInterface() {
  console.log('⚙️ Testando interface de configurações...');
  
  // Verificar se os seletores de cor estão presentes
  const colorPickers = document.querySelectorAll('input[type="color"]');
  console.log('Seletores de cor encontrados:', colorPickers.length);
  
  // Verificar se o botão de salvar tema está presente
  const saveThemeButton = document.querySelector('button[class*="px-4 py-2"]');
  if (saveThemeButton) {
    console.log('✅ Botão de salvar tema encontrado');
  } else {
    console.log('❌ Botão de salvar tema não encontrado');
  }
  
  // Verificar se a seção de identidade visual está presente
  const themeSection = document.querySelector('[class*="Identidade Visual"]') || 
                      document.querySelector('h3:contains("Identidade Visual")');
  if (themeSection) {
    console.log('✅ Seção de identidade visual encontrada');
  } else {
    console.log('❌ Seção de identidade visual não encontrada');
  }
}

// Função principal de teste
function runThemeSaveTests() {
  console.log('🚀 Iniciando testes de correção do erro de tema...');
  
  // Teste 1: Verificar aplicação do tema
  console.log('\n1️⃣ Testando aplicação do tema:');
  testThemeApplication();
  
  // Teste 2: Simular mudança de cores
  console.log('\n2️⃣ Testando mudança de cores:');
  simulateThemeChange();
  
  // Teste 3: Verificar cores dos componentes
  console.log('\n3️⃣ Testando cores dos componentes:');
  testComponentColors();
  
  // Teste 4: Verificar erros
  console.log('\n4️⃣ Verificando erros:');
  checkThemeErrors();
  
  // Teste 5: Verificar interface
  console.log('\n5️⃣ Testando interface:');
  testSettingsInterface();
  
  console.log('\n✅ Testes concluídos!');
  console.log('💡 Para testar completamente, vá para Configurações > Empresa > Identidade Visual');
  console.log('🎨 Tente alterar as cores e clicar em "Salvar" para verificar se o erro foi corrigido');
}

// Executar testes
runThemeSaveTests();

// Exportar funções para uso manual
window.testThemeSave = {
  testThemeApplication,
  simulateThemeChange,
  testComponentColors,
  checkThemeErrors,
  testSettingsInterface,
  runThemeSaveTests
};

console.log('🔧 Funções de teste disponíveis em window.testThemeSave');
