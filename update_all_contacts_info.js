#!/usr/bin/env node

/**
 * Script para atualizar todas as informações dos contatos existentes
 * com os dados extraídos do WhatsApp
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAllContactsInfo() {
  console.log('🚀 ATUALIZANDO INFORMAÇÕES DE TODOS OS CONTATOS...\n');

  try {
    // 1. Buscar todas as conversas
    console.log('📊 ETAPA 1: Buscando todas as conversas...');
    
    const response = await fetch('http://localhost:3000/api/baileys-simple/test-conversations?ownerId=905b926a-785a-4f6d-9c3a-9455729500b3');
    const data = await response.json();
    
    if (!data.success) {
      console.log('❌ Erro ao buscar conversas:', data);
      return;
    }

    const conversations = data.conversations;
    console.log(`✅ Encontradas ${conversations.length} conversas`);

    // 2. Atualizar informações dos contatos
    console.log('\n📊 ETAPA 2: Atualizando informações dos contatos...');
    
    let updatedContacts = 0;
    let createdContacts = 0;
    
    for (let i = 0; i < conversations.length; i++) {
      const conv = conversations[i];
      console.log(`\n🔄 Processando ${i + 1}/${conversations.length}: ${conv.nome_cliente || conv.numero_cliente}`);
      
      try {
        // Verificar se o contato já existe
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('*')
          .eq('phone', conv.numero_cliente)
          .eq('owner_id', '905b926a-785a-4f6d-9c3a-9455729500b3')
          .single();

        const contactData = {
          owner_id: '905b926a-785a-4f6d-9c3a-9455729500b3',
          phone: conv.numero_cliente,
          name: conv.nome_cliente || conv.whatsapp_name || `Contato ${conv.numero_cliente}`,
          name_wpp: conv.whatsapp_name,
          whatsapp_name: conv.whatsapp_name,
          whatsapp_business_name: conv.whatsapp_business_name,
          whatsapp_business_description: conv.whatsapp_business_description,
          whatsapp_business_email: conv.whatsapp_business_email,
          whatsapp_business_website: conv.whatsapp_business_website,
          whatsapp_business_category: conv.whatsapp_business_category,
          whatsapp_verified: conv.whatsapp_verified,
          whatsapp_is_group: conv.chat_id?.includes('@g.us'),
          whatsapp_group_subject: conv.whatsapp_group_subject,
          whatsapp_group_description: conv.whatsapp_group_description,
          whatsapp_group_participants: conv.whatsapp_group_participants,
          whatsapp_status: conv.whatsapp_status,
          updated_at: new Date().toISOString()
        };

        if (existingContact) {
          // Atualizar contato existente
          const { error: updateError } = await supabase
            .from('contacts')
            .update(contactData)
            .eq('id', existingContact.id);

          if (updateError) {
            console.log(`⚠️ Erro ao atualizar contato:`, updateError.message);
          } else {
            console.log(`✅ Contato atualizado: ${contactData.name}`);
            updatedContacts++;
          }
        } else {
          // Criar novo contato
          contactData.created_at = new Date().toISOString();
          
          const { error: createError } = await supabase
            .from('contacts')
            .insert([contactData]);

          if (createError) {
            console.log(`⚠️ Erro ao criar contato:`, createError.message);
          } else {
            console.log(`✅ Novo contato criado: ${contactData.name}`);
            createdContacts++;
          }
        }

      } catch (error) {
        console.log(`❌ Erro ao processar contato ${conv.numero_cliente}:`, error.message);
      }
    }

    // 3. Verificar resultados
    console.log('\n📊 ETAPA 3: Verificando resultados...');
    
    const { count: totalContacts } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', '905b926a-785a-4f6d-9c3a-9455729500b3');

    const { count: contactsWithWhatsappName } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', '905b926a-785a-4f6d-9c3a-9455729500b3')
      .not('whatsapp_name', 'is', null);

    const { count: contactsWithBusinessInfo } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', '905b926a-785a-4f6d-9c3a-9455729500b3')
      .not('whatsapp_business_name', 'is', null);

    const { count: groupContacts } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', '905b926a-785a-4f6d-9c3a-9455729500b3')
      .eq('whatsapp_is_group', true);

    console.log('🎯 RESULTADOS DA ATUALIZAÇÃO:');
    console.log('============================');
    console.log(`✅ Conversas processadas: ${conversations.length}`);
    console.log(`✅ Contatos atualizados: ${updatedContacts}`);
    console.log(`✅ Novos contatos criados: ${createdContacts}`);
    console.log(`📊 Total de contatos: ${totalContacts || 0}`);
    console.log(`📊 Contatos com nome WhatsApp: ${contactsWithWhatsappName || 0}`);
    console.log(`📊 Contatos com info de negócio: ${contactsWithBusinessInfo || 0}`);
    console.log(`📊 Contatos de grupos: ${groupContacts || 0}`);

    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('1. Reinicie o frontend para ver as mudanças');
    console.log('2. Verifique a página de Contatos');
    console.log('3. Verifique as conversas WhatsApp');
    console.log('4. As informações agora devem aparecer na interface!');

  } catch (error) {
    console.error('❌ Erro durante a atualização:', error);
  }
}

// Executar atualização
updateAllContactsInfo();
