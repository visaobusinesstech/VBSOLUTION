// Script de teste para verificar se o erro do AuthProvider foi corrigido
// Execute este script no console do navegador

console.log('🔧 Testando correção do erro AuthProvider...');

// Função para verificar se os contextos estão funcionando
function testContextProviders() {
  console.log('📊 Verificando contextos:');
  
  try {
    // Verificar se o React está carregado
    if (typeof React !== 'undefined') {
      console.log('✅ React carregado');
    } else {
      console.log('❌ React não encontrado');
    }
    
    // Verificar se há erros no console
    const originalError = console.error;
    const errors = [];
    
    console.error = function(...args) {
      errors.push(args.join(' '));
      originalError.apply(console, args);
    };
    
    // Aguardar um pouco para capturar erros
    setTimeout(() => {
      console.error = originalError;
      
      if (errors.length === 0) {
        console.log('✅ Nenhum erro de contexto detectado');
      } else {
        console.log('❌ Erros detectados:', errors);
      }
    }, 2000);
    
  } catch (error) {
    console.error('❌ Erro ao testar contextos:', error);
  }
}

// Função para verificar se o tema está carregando
function testThemeLoading() {
  console.log('🎨 Testando carregamento do tema...');
  
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  const sidebarColor = computedStyle.getPropertyValue('--sidebar-color');
  const topbarColor = computedStyle.getPropertyValue('--topbar-color');
  const buttonColor = computedStyle.getPropertyValue('--button-color');
  
  console.log('Cores atuais:');
  console.log('- Sidebar:', sidebarColor);
  console.log('- Topbar:', topbarColor);
  console.log('- Button:', buttonColor);
  
  if (sidebarColor && topbarColor && buttonColor) {
    console.log('✅ Variáveis CSS do tema carregadas');
  } else {
    console.log('❌ Variáveis CSS do tema não encontradas');
  }
}

// Função para verificar se os componentes estão renderizando
function testComponentRendering() {
  console.log('🧩 Testando renderização dos componentes...');
  
  const sidebar = document.querySelector('[class*="fixed left-0 top-[46px]"]');
  const topbar = document.querySelector('header[class*="fixed top-0"]');
  const buttons = document.querySelectorAll('button[class*="px-4 py-2"]');
  
  console.log('Componentes encontrados:');
  console.log('- Sidebar:', sidebar ? '✅' : '❌');
  console.log('- Topbar:', topbar ? '✅' : '❌');
  console.log('- Botões:', buttons.length > 0 ? `✅ (${buttons.length})` : '❌');
  
  if (sidebar && topbar && buttons.length > 0) {
    console.log('✅ Todos os componentes principais renderizados');
  } else {
    console.log('❌ Alguns componentes não foram encontrados');
  }
}

// Função principal de teste
function runAuthProviderTests() {
  console.log('🚀 Iniciando testes de correção do AuthProvider...');
  
  // Teste 1: Verificar contextos
  console.log('\n1️⃣ Testando contextos:');
  testContextProviders();
  
  // Teste 2: Verificar carregamento do tema
  console.log('\n2️⃣ Testando carregamento do tema:');
  testThemeLoading();
  
  // Teste 3: Verificar renderização dos componentes
  console.log('\n3️⃣ Testando renderização dos componentes:');
  testComponentRendering();
  
  console.log('\n✅ Testes concluídos!');
  console.log('💡 Se não houver erros de "useAuth must be used within an AuthProvider", a correção funcionou!');
}

// Executar testes
runAuthProviderTests();

// Exportar funções para uso manual
window.testAuthProvider = {
  testContextProviders,
  testThemeLoading,
  testComponentRendering,
  runAuthProviderTests
};

console.log('🔧 Funções de teste disponíveis em window.testAuthProvider');
