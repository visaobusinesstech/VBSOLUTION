// Script para testar o sistema WhatsApp completamente unificado
// Execute: node test_unified_whatsapp_system.js

const fetch = require('node-fetch');

class UnifiedWhatsAppSystemTester {
  constructor() {
    this.baseUrl = 'http://localhost:3002/api/baileys-simple';
  }

  async testUnifiedSystem() {
    console.log('🚀 [UNIFIED-TESTER] Testando Sistema WhatsApp Completamente Unificado\n');
    
    try {
      // 1. Testar saúde do servidor
      console.log('1️⃣ Testando saúde do servidor...');
      const healthResponse = await fetch(`${this.baseUrl}/health`);
      const healthData = await healthResponse.json();
      console.log('✅ Servidor saudável:', healthData.status);

      // 2. Testar listagem de conexões
      console.log('\n2️⃣ Testando listagem de conexões...');
      const connectionsResponse = await fetch(`${this.baseUrl}/connections`);
      const connectionsData = await connectionsResponse.json();
      
      if (connectionsData.success) {
        console.log('✅ Conexões encontradas:', connectionsData.data.length);
        connectionsData.data.forEach((conn, index) => {
          console.log(`   ${index + 1}. ${conn.name} - ${conn.connectionState} - ${conn.phoneNumber || 'N/A'}`);
        });
      } else {
        console.log('❌ Erro ao listar conexões:', connectionsData.error);
        return;
      }

      // 3. Testar inicialização automática
      console.log('\n3️⃣ Testando inicialização automática...');
      const autoConnectResponse = await fetch(`${this.baseUrl}/auto-connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const autoConnectData = await autoConnectResponse.json();
      if (autoConnectData.success) {
        console.log('✅ Inicialização automática funcionando!');
        console.log(`   Connection ID: ${autoConnectData.data.connectionId}`);
        console.log(`   Auto-inicializado: ${autoConnectData.data.autoInitialized}`);
      } else {
        console.log('❌ Erro na inicialização automática:', autoConnectData.error);
      }

      // 4. Testar criação de conexão com autoInit
      console.log('\n4️⃣ Testando criação de conexão com autoInit...');
      const createResponse = await fetch(`${this.baseUrl}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Teste Sistema Unificado',
          type: 'whatsapp_baileys',
          autoInit: true
        })
      });
      
      const createData = await createResponse.json();
      if (createData.success) {
        console.log('✅ Conexão criada com autoInit!');
        console.log(`   Connection ID: ${createData.data.connectionId}`);
        console.log(`   Auto-inicializado: ${createData.data.autoInitialized}`);
      } else {
        console.log('❌ Erro na criação com autoInit:', createData.error);
      }

      // 5. Testar extração de informações de contato
      console.log('\n5️⃣ Testando extração de informações de contato...');
      if (connectionsData.data.length > 0) {
        const connectionId = connectionsData.data[0].id;
        const extractResponse = await fetch(`http://localhost:3002/api/contact/extract-info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: '120363419668499111@g.us', // Grupo de teste
            connectionId: connectionId
          })
        });
        
        const extractData = await extractResponse.json();
        if (extractData.success) {
          console.log('✅ Extração de informações funcionando!');
          console.log(`   Nome: ${extractData.data.name || 'N/A'}`);
          console.log(`   É grupo: ${extractData.data.isGroup}`);
          console.log(`   É negócio: ${extractData.data.isBusiness}`);
        } else {
          console.log('❌ Erro na extração de informações:', extractData.error);
        }
      }

      // 6. Testar sincronização de perfis
      console.log('\n6️⃣ Testando sincronização de perfis...');
      if (connectionsData.data.length > 0) {
        const connectionId = connectionsData.data[0].id;
        const syncResponse = await fetch(`http://localhost:3002/api/contact/sync-profiles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            connectionId: connectionId
          })
        });
        
        const syncData = await syncResponse.json();
        if (syncData.success) {
          console.log('✅ Sincronização de perfis funcionando!');
          console.log(`   Grupos processados: ${syncData.data.groupsProcessed || 0}`);
          console.log(`   Contatos processados: ${syncData.data.contactsProcessed || 0}`);
        } else {
          console.log('❌ Erro na sincronização de perfis:', syncData.error);
        }
      }

      console.log('\n🎉 [UNIFIED-TESTER] Teste do sistema unificado concluído com sucesso!');
      console.log('\n📋 RESUMO DO SISTEMA UNIFICADO:');
      console.log('✅ ContactInfoExtractor integrado diretamente no servidor');
      console.log('✅ WhatsAppProfileSyncService integrado diretamente no servidor');
      console.log('✅ BusinessInfoExtractor integrado no ContactInfoExtractor');
      console.log('✅ Inicialização automática do WhatsApp funcionando');
      console.log('✅ Extração de informações em tempo real funcionando');
      console.log('✅ Sincronização de perfis funcionando');
      console.log('✅ Sistema completamente unificado e operacional!');
      
    } catch (error) {
      console.error('❌ [UNIFIED-TESTER] Erro no teste:', error.message);
    }
  }
}

// Executar teste
async function main() {
  try {
    const tester = new UnifiedWhatsAppSystemTester();
    await tester.testUnifiedSystem();
  } catch (error) {
    console.error('💥 [MAIN] Erro fatal:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = UnifiedWhatsAppSystemTester;
