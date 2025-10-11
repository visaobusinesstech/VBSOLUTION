// Script para testar a inicialização automática do WhatsApp
// Execute: node test_whatsapp_auto_init.js

const fetch = require('node-fetch');

class WhatsAppAutoInitTester {
  constructor() {
    this.baseUrl = 'http://localhost:3002/api/baileys-simple';
  }

  async testAutoInitialization() {
    console.log('🧪 [TESTER] Testando inicialização automática do WhatsApp...');
    
    try {
      // 1. Testar rota de auto-connect
      console.log('🔄 [TESTER] Testando rota /auto-connect...');
      const autoConnectResponse = await fetch(`${this.baseUrl}/auto-connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      const autoConnectData = await autoConnectResponse.json();
      console.log('✅ [TESTER] Resposta auto-connect:', autoConnectData);
      
      if (autoConnectData.success) {
        console.log('✅ [TESTER] WhatsApp inicializado automaticamente!');
        console.log(`📱 [TESTER] Connection ID: ${autoConnectData.data.connectionId}`);
        console.log(`📱 [TESTER] Status: ${autoConnectData.data.status}`);
        console.log(`📱 [TESTER] Auto-inicializado: ${autoConnectData.data.autoInitialized}`);
      } else {
        console.log('❌ [TESTER] Falha na inicialização automática:', autoConnectData.error);
      }
      
      // 2. Testar listagem de conexões
      console.log('\n🔄 [TESTER] Testando listagem de conexões...');
      const connectionsResponse = await fetch(`${this.baseUrl}/connections`);
      const connectionsData = await connectionsResponse.json();
      
      if (connectionsData.success) {
        console.log('✅ [TESTER] Conexões encontradas:', connectionsData.data.length);
        connectionsData.data.forEach((conn, index) => {
          console.log(`   ${index + 1}. ${conn.name} - ${conn.connectionState} - ${conn.phoneNumber || 'N/A'}`);
        });
      } else {
        console.log('❌ [TESTER] Erro ao listar conexões:', connectionsData.error);
      }
      
      // 3. Testar criação de conexão com autoInit
      console.log('\n🔄 [TESTER] Testando criação de conexão com autoInit...');
      const createResponse = await fetch(`${this.baseUrl}/connections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Teste Auto Init',
          type: 'whatsapp_baileys',
          autoInit: true
        })
      });
      
      const createData = await createResponse.json();
      console.log('✅ [TESTER] Resposta criação com autoInit:', createData);
      
      if (createData.success) {
        console.log('✅ [TESTER] Conexão criada com autoInit!');
        console.log(`📱 [TESTER] Connection ID: ${createData.data.connectionId}`);
        console.log(`📱 [TESTER] Auto-inicializado: ${createData.data.autoInitialized}`);
      } else {
        console.log('❌ [TESTER] Falha na criação com autoInit:', createData.error);
      }
      
      console.log('\n🎉 [TESTER] Teste de inicialização automática concluído!');
      
    } catch (error) {
      console.error('❌ [TESTER] Erro no teste:', error.message);
    }
  }
}

// Executar teste
async function main() {
  try {
    const tester = new WhatsAppAutoInitTester();
    await tester.testAutoInitialization();
  } catch (error) {
    console.error('💥 [MAIN] Erro fatal:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = WhatsAppAutoInitTester;
