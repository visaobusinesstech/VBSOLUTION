#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.supabase' });

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAIAfterPhoneFix() {
  console.log('🧪 Testando AI após correção da coluna phone...');
  
  try {
    // 1. Pular verificação de estrutura (RPC não disponível)
    console.log('\n1. Verificação de estrutura pulada (RPC não disponível)');
    
    // 2. Verificar se há contatos na tabela
    console.log('\n2. Verificando contatos existentes...');
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, phone, owner_id, ai_enabled, name')
      .limit(5);
    
    if (contactsError) {
      console.error('❌ Erro ao buscar contatos:', contactsError);
      return;
    }
    
    console.log(`📊 Total de contatos encontrados: ${contacts?.length || 0}`);
    if (contacts && contacts.length > 0) {
      console.log('📋 Primeiros contatos:');
      console.table(contacts);
    }
    
    // 3. Testar criação de contato de teste
    console.log('\n3. Testando criação de contato de teste...');
    const testPhone = '554796643900';
    const testUserId = '905b926a-785a-4f6d-9c3a-9455729500b3';
    
    // Primeiro, remover contato de teste se existir
    await supabase
      .from('contacts')
      .delete()
      .eq('phone', testPhone)
      .eq('owner_id', testUserId);
    
    // Criar contato de teste
    const { data: newContact, error: createError } = await supabase
      .from('contacts')
      .insert({
        phone: testPhone,
        name: 'Contato Teste AI',
        owner_id: testUserId,
        ai_enabled: true,
        status: 'active'
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Erro ao criar contato de teste:', createError);
      return;
    }
    
    console.log('✅ Contato de teste criado:', newContact);
    
    // 4. Testar busca de contato (simulando a verificação do AI)
    console.log('\n4. Testando busca de contato para verificação do AI...');
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('ai_enabled, phone, name')
      .eq('phone', testPhone)
      .eq('owner_id', testUserId)
      .single();
    
    if (contactError) {
      console.error('❌ Erro ao buscar contato:', contactError);
      return;
    }
    
    console.log('✅ Contato encontrado para verificação do AI:', contactData);
    console.log(`🤖 AI habilitado: ${contactData.ai_enabled ? 'SIM' : 'NÃO'}`);
    
    // 5. Limpar contato de teste
    console.log('\n5. Limpando contato de teste...');
    await supabase
      .from('contacts')
      .delete()
      .eq('id', newContact.id);
    
    console.log('✅ Contato de teste removido');
    
    console.log('\n🎉 Teste concluído com sucesso!');
    console.log('✅ A tabela contacts está funcionando corretamente com a coluna phone');
    console.log('✅ O AI poderá fazer verificações sem erro de phone_number');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar teste
testAIAfterPhoneFix();
