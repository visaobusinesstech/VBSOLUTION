// fix-names-sync.js
// Script para corrigir sincronização de nomes entre contacts e whatsapp_mensagens

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixNamesSync() {
  console.log('🔧 [FIX-NAMES] Corrigindo sincronização de nomes...');
  console.log('');

  try {
    // 1. Corrigir name_wpp para ser igual a whatsapp_name na tabela contacts
    console.log('📝 [FIX-NAMES] Corrigindo name_wpp na tabela contacts...');
    
    const { data: contactsToFix, error: contactsError } = await supabase
      .from('contacts')
      .select('id, name_wpp, whatsapp_name, phone')
      .not('whatsapp_name', 'is', null);
    
    if (contactsError) {
      console.error('❌ [FIX-NAMES] Erro ao buscar contatos:', contactsError);
      return;
    }
    
    console.log(`📊 [FIX-NAMES] Encontrados ${contactsToFix?.length || 0} contatos para verificar`);
    
    let fixedCount = 0;
    for (const contact of contactsToFix || []) {
      if (contact.name_wpp !== contact.whatsapp_name) {
        console.log(`🔄 [FIX-NAMES] Corrigindo contato ${contact.phone}: "${contact.name_wpp}" → "${contact.whatsapp_name}"`);
        
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ name_wpp: contact.whatsapp_name })
          .eq('id', contact.id);
        
        if (updateError) {
          console.error(`❌ [FIX-NAMES] Erro ao atualizar contato ${contact.id}:`, updateError);
        } else {
          fixedCount++;
          console.log(`✅ [FIX-NAMES] Contato ${contact.phone} corrigido`);
        }
      }
    }
    
    console.log(`✅ [FIX-NAMES] ${fixedCount} contatos corrigidos na tabela contacts`);
    
    // 2. Corrigir wpp_name na tabela whatsapp_mensagens baseado nos contatos
    console.log('\n📝 [FIX-NAMES] Corrigindo wpp_name na tabela whatsapp_mensagens...');
    
    const { data: messagesToFix, error: messagesError } = await supabase
      .from('whatsapp_mensagens')
      .select('id, phone, wpp_name, owner_id')
      .not('phone', 'is', null);
    
    if (messagesError) {
      console.error('❌ [FIX-NAMES] Erro ao buscar mensagens:', messagesError);
      return;
    }
    
    console.log(`📊 [FIX-NAMES] Encontradas ${messagesToFix?.length || 0} mensagens para verificar`);
    
    let messagesFixedCount = 0;
    for (const message of messagesToFix || []) {
      // Buscar o contato correspondente
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('name_wpp, whatsapp_name')
        .eq('phone', message.phone)
        .eq('owner_id', message.owner_id)
        .maybeSingle();
      
      if (contactError) {
        console.error(`❌ [FIX-NAMES] Erro ao buscar contato para mensagem ${message.id}:`, contactError);
        continue;
      }
      
      if (contact && contact.name_wpp && contact.name_wpp !== message.wpp_name) {
        console.log(`🔄 [FIX-NAMES] Corrigindo mensagem ${message.id}: "${message.wpp_name}" → "${contact.name_wpp}"`);
        
        const { error: updateError } = await supabase
          .from('whatsapp_mensagens')
          .update({ wpp_name: contact.name_wpp })
          .eq('id', message.id);
        
        if (updateError) {
          console.error(`❌ [FIX-NAMES] Erro ao atualizar mensagem ${message.id}:`, updateError);
        } else {
          messagesFixedCount++;
          console.log(`✅ [FIX-NAMES] Mensagem ${message.id} corrigida`);
        }
      }
    }
    
    console.log(`✅ [FIX-NAMES] ${messagesFixedCount} mensagens corrigidas na tabela whatsapp_mensagens`);
    
    // 3. Verificar se company_id está sendo preenchido corretamente
    console.log('\n📝 [FIX-NAMES] Verificando company_id...');
    
    const { data: contactsWithoutCompany, error: companyError } = await supabase
      .from('contacts')
      .select('id, phone, owner_id, company_id')
      .is('company_id', null)
      .limit(10);
    
    if (companyError) {
      console.error('❌ [FIX-NAMES] Erro ao verificar company_id:', companyError);
    } else {
      console.log(`📊 [FIX-NAMES] ${contactsWithoutCompany?.length || 0} contatos sem company_id`);
      
      if (contactsWithoutCompany && contactsWithoutCompany.length > 0) {
        console.log('🔄 [FIX-NAMES] Corrigindo company_id para contatos...');
        
        for (const contact of contactsWithoutCompany) {
          // Buscar company_id do perfil do usuário
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', contact.owner_id)
            .maybeSingle();
          
          if (profile && profile.company_id) {
            const { error: updateError } = await supabase
              .from('contacts')
              .update({ company_id: profile.company_id })
              .eq('id', contact.id);
            
            if (updateError) {
              console.error(`❌ [FIX-NAMES] Erro ao atualizar company_id para contato ${contact.id}:`, updateError);
            } else {
              console.log(`✅ [FIX-NAMES] Company_id corrigido para contato ${contact.phone}`);
            }
          }
        }
      }
    }
    
    // 4. Verificação final
    console.log('\n🔍 [FIX-NAMES] Verificação final...');
    
    // Verificar contatos
    const { data: finalContacts, error: finalContactsError } = await supabase
      .from('contacts')
      .select('id, name_wpp, whatsapp_name, phone, company_id')
      .limit(5);
    
    if (finalContactsError) {
      console.error('❌ [FIX-NAMES] Erro na verificação final:', finalContactsError);
    } else {
      console.log('📊 [FIX-NAMES] Contatos após correção:');
      finalContacts?.forEach(contact => {
        const isConsistent = contact.name_wpp === contact.whatsapp_name;
        console.log(`   - ${contact.phone}: name_wpp="${contact.name_wpp}", whatsapp_name="${contact.whatsapp_name}" ${isConsistent ? '✅' : '❌'}`);
      });
    }
    
    // Verificar mensagens
    const { data: finalMessages, error: finalMessagesError } = await supabase
      .from('whatsapp_mensagens')
      .select('id, wpp_name, group_contact_name, phone')
      .limit(5);
    
    if (finalMessagesError) {
      console.error('❌ [FIX-NAMES] Erro na verificação final de mensagens:', finalMessagesError);
    } else {
      console.log('\n📊 [FIX-NAMES] Mensagens após correção:');
      finalMessages?.forEach(message => {
        console.log(`   - ${message.phone}: wpp_name="${message.wpp_name}", group_contact_name="${message.group_contact_name}"`);
      });
    }
    
    console.log('\n🎯 [FIX-NAMES] Correções de sincronização concluídas!');
    console.log('📋 [FIX-NAMES] Próximos passos:');
    console.log('   1. Reiniciar o backend WhatsApp');
    console.log('   2. Testar envio/recebimento de mensagens');
    console.log('   3. Verificar se as tabelas voltaram a ser preenchidas');
    console.log('   4. Monitorar logs para confirmar funcionamento');
    
  } catch (error) {
    console.error('❌ [FIX-NAMES] Erro geral:', error);
  }
}

// Executar correções
fixNamesSync();
