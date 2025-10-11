// Script para testar a página de email
console.log('📧 Testando página de email...');

// Verificar se a página está acessível
fetch('/email')
  .then(response => {
    if (response.ok) {
      console.log('✅ Página /email está acessível');
    } else {
      console.log('❌ Erro ao acessar página /email:', response.status);
    }
  })
  .catch(error => {
    console.log('❌ Erro de rede:', error);
  });

// Verificar se as tabelas existem no Supabase
const checkTables = async () => {
  try {
    const response = await fetch('/api/email/settings');
    if (response.ok) {
      console.log('✅ API de configurações de email está funcionando');
    } else {
      console.log('❌ Erro na API de configurações:', response.status);
    }
  } catch (error) {
    console.log('❌ Erro ao verificar API:', error);
  }
};

checkTables();

console.log('📧 Teste concluído!');
