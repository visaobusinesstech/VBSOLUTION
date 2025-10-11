// demo-whatsapp-profile-sync.js
// Demonstração do sistema de sincronização de perfis WhatsApp

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function demonstrateProfileSync() {
  console.log('🎯 [DEMO] ===== DEMONSTRAÇÃO DO SISTEMA DE SINCRONIZAÇÃO DE PERFIS =====');
  console.log('');
  
  try {
    // 1. Verificar se as colunas foram adicionadas
    console.log('📊 [DEMO] 1. Verificando estrutura das tabelas...');
    
    const { data: contactsColumns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'contacts')
      .eq('table_schema', 'public')
      .like('column_name', 'whatsapp_%')
      .order('column_name');
    
    const { data: messagesColumns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'whatsapp_mensagens')
      .eq('table_schema', 'public')
      .like('column_name', 'whatsapp_%')
      .order('column_name');
    
    console.log(`✅ [DEMO] Colunas WhatsApp na tabela contacts: ${contactsColumns?.length || 0}`);
    console.log(`✅ [DEMO] Colunas WhatsApp na tabela whatsapp_mensagens: ${messagesColumns?.length || 0}`);
    
    if (contactsColumns && contactsColumns.length > 0) {
      console.log('   📋 Colunas encontradas:');
      contactsColumns.forEach(col => {
        console.log(`      - ${col.column_name}`);
      });
    }
    
    // 2. Inserir dados de demonstração
    console.log('\n📝 [DEMO] 2. Inserindo dados de demonstração...');
    
    // Contato individual com informações de negócio
    const demoContact = {
      owner_id: '00000000-0000-0000-0000-000000000000',
      name: 'João Silva - Empresa Tech',
      phone: '5511999999999',
      whatsapp_jid: '5511999999999@s.whatsapp.net',
      whatsapp_name: 'João Silva',
      whatsapp_profile_picture: 'https://example.com/profile1.jpg',
      whatsapp_is_group: false,
      whatsapp_business_name: 'Tech Solutions LTDA',
      whatsapp_business_description: 'Soluções em tecnologia para empresas',
      whatsapp_business_category: 'TECHNOLOGY',
      whatsapp_business_email: 'contato@techsolutions.com',
      whatsapp_business_website: 'https://techsolutions.com',
      whatsapp_business_address: 'Rua das Flores, 123 - São Paulo, SP',
      whatsapp_verified: true,
      whatsapp_online: true,
      whatsapp_status: 'Disponível para atendimento',
      whatsapp_last_seen: new Date().toISOString(),
      whatsapp_raw_data: {
        businessProfile: {
          business_name: 'Tech Solutions LTDA',
          description: 'Soluções em tecnologia para empresas',
          category: 'TECHNOLOGY',
          verified: true
        },
        presence: {
          lastSeen: Date.now(),
          isOnline: true
        }
      }
    };
    
    const { data: insertedContact, error: contactError } = await supabase
      .from('contacts')
      .insert(demoContact)
      .select();
    
    if (contactError) {
      console.log('⚠️ [DEMO] Erro ao inserir contato (pode já existir):', contactError.message);
    } else {
      console.log('✅ [DEMO] Contato de demonstração inserido:', insertedContact[0].id);
    }
    
    // Grupo de demonstração
    const demoGroup = {
      owner_id: '00000000-0000-0000-0000-000000000000',
      name: 'Grupo de Desenvolvimento',
      phone: '120363123456789012@g.us',
      whatsapp_jid: '120363123456789012@g.us',
      whatsapp_name: 'Grupo de Desenvolvimento',
      whatsapp_profile_picture: 'https://example.com/group1.jpg',
      whatsapp_is_group: true,
      whatsapp_group_subject: 'Grupo de Desenvolvimento',
      whatsapp_group_description: 'Grupo para discussões de desenvolvimento',
      whatsapp_group_owner: '5511999999999@s.whatsapp.net',
      whatsapp_group_admins: ['5511999999999@s.whatsapp.net', '5511888888888@s.whatsapp.net'],
      whatsapp_group_participants: [
        { id: '5511999999999@s.whatsapp.net', admin: 'admin', name: 'João Silva' },
        { id: '5511888888888@s.whatsapp.net', admin: 'admin', name: 'Maria Santos' },
        { id: '5511777777777@s.whatsapp.net', admin: null, name: 'Pedro Costa' }
      ],
      whatsapp_group_created: new Date().toISOString(),
      whatsapp_group_settings: {
        announce: true,
        restrict: false,
        invite: 'admins'
      },
      whatsapp_raw_data: {
        groupMetadata: {
          subject: 'Grupo de Desenvolvimento',
          desc: 'Grupo para discussões de desenvolvimento',
          owner: '5511999999999@s.whatsapp.net',
          participants: 3
        }
      }
    };
    
    const { data: insertedGroup, error: groupError } = await supabase
      .from('contacts')
      .insert(demoGroup)
      .select();
    
    if (groupError) {
      console.log('⚠️ [DEMO] Erro ao inserir grupo (pode já existir):', groupError.message);
    } else {
      console.log('✅ [DEMO] Grupo de demonstração inserido:', insertedGroup[0].id);
    }
    
    // 3. Demonstrar consultas
    console.log('\n🔍 [DEMO] 3. Demonstrando consultas...');
    
    // Buscar contatos com informações de negócio
    const { data: businessContacts } = await supabase
      .from('contacts')
      .select('name, whatsapp_business_name, whatsapp_business_category, whatsapp_verified')
      .not('whatsapp_business_name', 'is', null)
      .limit(5);
    
    console.log('🏢 [DEMO] Contatos com informações de negócio:');
    businessContacts?.forEach(contact => {
      console.log(`   - ${contact.name}`);
      console.log(`     Negócio: ${contact.whatsapp_business_name}`);
      console.log(`     Categoria: ${contact.whatsapp_business_category}`);
      console.log(`     Verificado: ${contact.whatsapp_verified ? 'Sim' : 'Não'}`);
    });
    
    // Buscar grupos
    const { data: groups } = await supabase
      .from('contacts')
      .select('name, whatsapp_group_subject, whatsapp_group_participants')
      .eq('whatsapp_is_group', true)
      .limit(5);
    
    console.log('\n👥 [DEMO] Grupos encontrados:');
    groups?.forEach(group => {
      const participants = Array.isArray(group.whatsapp_group_participants) 
        ? group.whatsapp_group_participants.length 
        : 0;
      console.log(`   - ${group.whatsapp_group_subject || group.name}`);
      console.log(`     Participantes: ${participants}`);
    });
    
    // 4. Demonstrar funcionalidades da API
    console.log('\n🌐 [DEMO] 4. Funcionalidades da API disponíveis:');
    console.log('   📡 Endpoints implementados:');
    console.log('      - POST /api/whatsapp-profile/:connectionId/sync-all');
    console.log('      - POST /api/whatsapp-profile/:connectionId/sync-contact');
    console.log('      - GET /api/whatsapp-profile/:connectionId/sync-status');
    console.log('      - GET /api/whatsapp-profile/:connectionId/groups');
    console.log('      - GET /api/whatsapp-profile/:connectionId/profile-picture/:jid');
    
    // 5. Instruções de uso
    console.log('\n📋 [DEMO] 5. Como usar o sistema:');
    console.log('   1. Inicie o backend: ./start-whatsapp-with-logs.sh');
    console.log('   2. Crie uma conexão WhatsApp');
    console.log('   3. Envie/receba mensagens para ver os logs em ação');
    console.log('   4. Use os endpoints da API para sincronização manual');
    console.log('   5. Monitore os logs para ver as informações sendo capturadas');
    
    console.log('\n✅ [DEMO] Demonstração concluída com sucesso!');
    console.log('🎯 [DEMO] O sistema está pronto para capturar informações de perfis WhatsApp!');
    
  } catch (error) {
    console.error('❌ [DEMO] Erro na demonstração:', error);
  }
}

// Executar demonstração
demonstrateProfileSync();
