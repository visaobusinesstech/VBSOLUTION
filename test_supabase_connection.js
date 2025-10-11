#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🧪 Testando conexão com Supabase...\n');

  try {
    // Testar conexão básica
    console.log('1. Testando conexão básica...');
    const { data, error } = await supabase
      .from('whatsapp_mensagens')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Erro na conexão:', error.message);
      return;
    }
    console.log('✅ Conexão com Supabase funcionando!');

    // Verificar mensagens recentes
    console.log('\n2. Verificando mensagens recentes...');
    const { data: messages, error: messagesError } = await supabase
      .from('whatsapp_mensagens')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (messagesError) {
      console.log('❌ Erro ao buscar mensagens:', messagesError.message);
    } else {
      console.log(`✅ Encontradas ${messages.length} mensagens recentes:`);
      messages.forEach((msg, index) => {
        console.log(`   ${index + 1}. ${msg.wpp_name || 'Sem nome'} - ${msg.conteudo?.substring(0, 30)}...`);
        console.log(`      WPP Name: ${msg.wpp_name || 'NÃO DEFINIDO'}`);
        console.log(`      Raw: ${msg.raw ? 'PRESENTE' : 'AUSENTE'}`);
      });
    }

    // Verificar conversas
    console.log('\n3. Verificando conversas...');
    const { data: conversations, error: convError } = await supabase
      .from('whatsapp_atendimentos')
      .select('*')
      .order('ultima_mensagem_em', { ascending: false })
      .limit(5);

    if (convError) {
      console.log('❌ Erro ao buscar conversas:', convError.message);
    } else {
      console.log(`✅ Encontradas ${conversations.length} conversas:`);
      conversations.forEach((conv, index) => {
        console.log(`   ${index + 1}. ${conv.nome_cliente || conv.numero_cliente} (${conv.chat_id})`);
        console.log(`      Display Name: ${conv.display_name || 'NÃO DEFINIDO'}`);
        console.log(`      Is Group: ${conv.is_group || false}`);
      });
    }

    // Verificar contatos
    console.log('\n4. Verificando contatos...');
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5);

    if (contactsError) {
      console.log('❌ Erro ao buscar contatos:', contactsError.message);
    } else {
      console.log(`✅ Encontrados ${contacts.length} contatos:`);
      contacts.forEach((contact, index) => {
        console.log(`   ${index + 1}. ${contact.name} (${contact.phone})`);
        console.log(`      Name WPP: ${contact.name_wpp || 'NÃO DEFINIDO'}`);
        console.log(`      WhatsApp Name: ${contact.whatsapp_name || 'NÃO DEFINIDO'}`);
      });
    }

    console.log('\n🎯 RESUMO:');
    console.log('✅ Conexão com Supabase: OK');
    console.log(`✅ Mensagens verificadas: ${messages?.length || 0}`);
    console.log(`✅ Conversas verificadas: ${conversations?.length || 0}`);
    console.log(`✅ Contatos verificados: ${contacts?.length || 0}`);

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testConnection();