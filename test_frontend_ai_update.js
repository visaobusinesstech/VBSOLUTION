#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Usando as mesmas credenciais que o frontend usa
const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const userId = '905b926a-785a-4f6d-9c3a-9455729500b3';
const testPhoneNumber = '554796643900';

async function testFrontendAIUpdate() {
  console.log('🧪 Testando atualização de AI usando chave anônima (como o frontend)...');
  
  try {
    // 1. Buscar o contato atual
    console.log('\n1. Buscando contato atual...');
    const { data: contact, error: fetchError } = await supabase
      .from('contacts')
      .select('*')
      .eq('phone', testPhoneNumber)
      .eq('owner_id', userId)
      .single();

    if (fetchError) {
      console.error('❌ Erro ao buscar contato:', fetchError);
      return;
    }

    console.log('✅ Contato encontrado:', {
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      ai_enabled: contact.ai_enabled
    });

    // 2. Tentar atualizar ai_enabled para true (como o frontend faria)
    console.log('\n2. Tentando atualizar ai_enabled para true (como o frontend)...');
    const { data: updatedContact, error: updateError } = await supabase
      .from('contacts')
      .update({
        ai_enabled: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', contact.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar contato (como o frontend):', updateError);
      console.log('\n🔍 Detalhes do erro:');
      console.log('- Código:', updateError.code);
      console.log('- Mensagem:', updateError.message);
      console.log('- Detalhes:', updateError.details);
      console.log('- Hint:', updateError.hint);
      return;
    }

    console.log('✅ Contato atualizado com sucesso:', {
      id: updatedContact.id,
      name: updatedContact.name,
      phone: updatedContact.phone,
      ai_enabled: updatedContact.ai_enabled
    });

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

testFrontendAIUpdate();

