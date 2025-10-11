const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.supabase' });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDatabase() {
  try {
    console.log('🔧 Corrigindo estrutura do banco de dados via API...');
    
    // 1. Verificar se a tabela whatsapp_atendimentos existe e deletar
    console.log('1. Verificando tabela whatsapp_atendimentos...');
    const { data: atendimentos, error: atendimentosError } = await supabase
      .from('whatsapp_atendimentos')
      .select('*')
      .limit(1);
    
    if (atendimentosError) {
      console.log('✅ Tabela whatsapp_atendimentos não existe ou já foi deletada');
    } else {
      console.log('⚠️ Tabela whatsapp_atendimentos ainda existe, mas não podemos deletar via API');
      console.log('   Execute manualmente no Supabase SQL Editor: DROP TABLE whatsapp_atendimentos;');
    }
    
    // 2. Verificar estrutura atual da tabela whatsapp_mensagens
    console.log('2. Verificando estrutura atual da tabela whatsapp_mensagens...');
    const { data: messages, error: messagesError } = await supabase
      .from('whatsapp_mensagens')
      .select('*')
      .limit(1);
    
    if (messagesError) {
      console.log('❌ Erro ao acessar tabela whatsapp_mensagens:', messagesError.message);
      return;
    }
    
    console.log('✅ Tabela whatsapp_mensagens acessível');
    
    // 3. Verificar se as colunas existem
    if (messages.length > 0) {
      const sampleMessage = messages[0];
      console.log('📋 Colunas atuais na tabela whatsapp_mensagens:');
      Object.keys(sampleMessage).forEach(key => {
        console.log(`  - ${key}: ${typeof sampleMessage[key]}`);
      });
      
      // Verificar se precisa renomear 'tipo' para 'message_type'
      if ('tipo' in sampleMessage && !('message_type' in sampleMessage)) {
        console.log('⚠️ Coluna "tipo" encontrada, precisa ser renomeada para "message_type"');
        console.log('   Execute no Supabase SQL Editor: ALTER TABLE whatsapp_mensagens RENAME COLUMN tipo TO message_type;');
      }
      
      // Verificar se precisa adicionar 'media_type'
      if (!('media_type' in sampleMessage)) {
        console.log('⚠️ Coluna "media_type" não encontrada, precisa ser adicionada');
        console.log('   Execute no Supabase SQL Editor: ALTER TABLE whatsapp_mensagens ADD COLUMN media_type VARCHAR(50);');
      }
    }
    
    // 4. Testar inserção de mensagem com nova estrutura
    console.log('3. Testando inserção de mensagem com nova estrutura...');
    const testMessage = {
      owner_id: '00000000-0000-0000-0000-000000000000',
      atendimento_id: null, // Agora pode ser null
      chat_id: 'test@c.us',
      conteudo: 'Teste de mensagem',
      message_type: 'TEXTO', // Nova coluna
      media_type: null, // Nova coluna
      remetente: 'CLIENTE',
      timestamp: new Date().toISOString(),
      lida: false,
      message_id: 'test_' + Date.now(),
      media_url: null,
      media_mime: null,
      duration_ms: null,
      status: 'AGUARDANDO',
      raw: { test: true }
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('whatsapp_mensagens')
      .insert([testMessage])
      .select();
    
    if (insertError) {
      console.log('❌ Erro ao inserir mensagem de teste:', insertError.message);
      console.log('   Detalhes:', insertError.details);
      console.log('   Hint:', insertError.hint);
    } else {
      console.log('✅ Mensagem de teste inserida com sucesso!');
      
      // Deletar mensagem de teste
      await supabase
        .from('whatsapp_mensagens')
        .delete()
        .eq('message_id', testMessage.message_id);
      console.log('🧹 Mensagem de teste removida');
    }
    
    console.log('\n📝 RESUMO DAS AÇÕES NECESSÁRIAS:');
    console.log('1. Execute no Supabase SQL Editor:');
    console.log('   DROP TABLE IF EXISTS whatsapp_atendimentos;');
    console.log('   ALTER TABLE whatsapp_mensagens DROP CONSTRAINT IF EXISTS whatsapp_mensagens_atendimento_id_fkey;');
    console.log('   ALTER TABLE whatsapp_mensagens RENAME COLUMN tipo TO message_type;');
    console.log('   ALTER TABLE whatsapp_mensagens ADD COLUMN media_type VARCHAR(50);');
    console.log('   ALTER TABLE whatsapp_mensagens ALTER COLUMN atendimento_id DROP NOT NULL;');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixDatabase();
