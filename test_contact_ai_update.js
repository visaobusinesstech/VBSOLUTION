#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.supabase' });

const supabaseUrl = process.env.SUPABASE_URL || 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';
const userId = '905b926a-785a-4f6d-9c3a-9455729500b3'; // ID do usuário de teste
const testPhoneNumber = '554796643900'; // Número de telefone de teste

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testContactAIUpdate() {
  console.log('🧪 Testando atualização de AI para contato...');
  
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

    // 2. Atualizar ai_enabled para true
    console.log('\n2. Atualizando ai_enabled para true...');
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
      console.error('❌ Erro ao atualizar contato:', updateError);
      return;
    }

    console.log('✅ Contato atualizado:', {
      id: updatedContact.id,
      name: updatedContact.name,
      phone: updatedContact.phone,
      ai_enabled: updatedContact.ai_enabled
    });

    // 3. Verificar se a atualização foi salva
    console.log('\n3. Verificando se a atualização foi salva...');
    const { data: verifyContact, error: verifyError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contact.id)
      .single();

    if (verifyError) {
      console.error('❌ Erro ao verificar contato:', verifyError);
      return;
    }

    console.log('✅ Verificação final:', {
      id: verifyContact.id,
      name: verifyContact.name,
      phone: verifyContact.phone,
      ai_enabled: verifyContact.ai_enabled
    });

    if (verifyContact.ai_enabled === true) {
      console.log('\n🎉 SUCESSO! O contato foi atualizado corretamente com ai_enabled = true');
    } else {
      console.log('\n❌ FALHA! O contato não foi atualizado corretamente');
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

testContactAIUpdate();
