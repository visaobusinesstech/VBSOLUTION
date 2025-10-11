#!/usr/bin/env node

const WebSocket = require('ws');

console.log('🧪 TESTE DE NOMES DE CONTATOS - INICIANDO...');
console.log('==============================================');
console.log('');

// Conectar ao WebSocket do backend
const ws = new WebSocket('ws://localhost:3000');

ws.on('open', function open() {
  console.log('✅ Conectado ao WebSocket do backend');
  console.log('📡 Aguardando mensagens para testar nomes...');
  console.log('');
});

ws.on('message', function message(data) {
  try {
    const parsed = JSON.parse(data);
    
    // Monitorar eventos de conversa
    if (parsed.type === 'conversation:updated') {
      console.log('📡 [CONVERSATION-UPDATE] Recebido:');
      console.log('   - Conversation ID:', parsed.conversationId);
      console.log('   - Nome Cliente:', parsed.nome_cliente);
      console.log('   - WPP Name:', parsed.last_message?.wpp_name);
      console.log('   - Group Contact Name:', parsed.last_message?.group_contact_name);
      console.log('   - From:', parsed.from);
      console.log('   - Preview:', parsed.preview);
      console.log('');
    }
    
    // Monitorar mensagens individuais
    if (parsed.type === 'newMessage') {
      console.log('💬 [NEW-MESSAGE] Recebida:');
      console.log('   - Chat ID:', parsed.chat_id);
      console.log('   - WPP Name:', parsed.wpp_name);
      console.log('   - Group Contact Name:', parsed.group_contact_name);
      console.log('   - Remetente:', parsed.remetente);
      console.log('   - Conteúdo:', parsed.conteudo);
      console.log('');
    }
    
  } catch (error) {
    // Ignorar erros de parsing
  }
});

ws.on('error', function error(err) {
  console.error('❌ Erro no WebSocket:', err.message);
});

ws.on('close', function close() {
  console.log('🔌 Conexão WebSocket fechada');
});

// Manter o script rodando
process.on('SIGINT', () => {
  console.log('\n🛑 Parando teste...');
  ws.close();
  process.exit(0);
});

console.log('💡 Envie uma mensagem no WhatsApp para testar!');
console.log('   Pressione Ctrl+C para parar o teste');
console.log('');
