// Script para testar as correções do WhatsApp
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testWhatsAppFixes() {
  console.log('🧪 Testando correções do WhatsApp...\n');

  try {
    // 1. Verificar estrutura da tabela contacts
    console.log('1. Verificando estrutura da tabela contacts...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'contacts')
      .eq('table_schema', 'public')
      .like('column_name', '%whatsapp%')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError);
    } else {
      console.log('✅ Colunas WhatsApp encontradas:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }

    // 2. Verificar se name_wpp existe
    console.log('\n2. Verificando campo name_wpp...');
    const { data: nameWppExists } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'contacts')
      .eq('table_schema', 'public')
      .eq('column_name', 'name_wpp')
      .single();

    if (nameWppExists) {
      console.log('✅ Campo name_wpp existe');
    } else {
      console.log('❌ Campo name_wpp não existe - precisa ser criado');
    }

    // 3. Verificar contatos existentes
    console.log('\n3. Verificando contatos existentes...');
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, name, name_wpp, whatsapp_name, phone, whatsapp_jid, whatsapp_profile_picture, whatsapp_message_count, whatsapp_last_message_at, whatsapp_last_message_content')
      .not('phone', 'is', null)
      .limit(5);

    if (contactsError) {
      console.error('❌ Erro ao buscar contatos:', contactsError);
    } else {
      console.log(`✅ Encontrados ${contacts.length} contatos:`);
      contacts.forEach((contact, index) => {
        console.log(`   ${index + 1}. ${contact.name || 'Sem nome'} (${contact.phone})`);
        console.log(`      - name_wpp: ${contact.name_wpp || 'NULL'}`);
        console.log(`      - whatsapp_name: ${contact.whatsapp_name || 'NULL'}`);
        console.log(`      - whatsapp_profile_picture: ${contact.whatsapp_profile_picture ? 'Existe' : 'NULL'}`);
        console.log(`      - whatsapp_message_count: ${contact.whatsapp_message_count || 0}`);
        console.log(`      - whatsapp_last_message_at: ${contact.whatsapp_last_message_at || 'NULL'}`);
        console.log(`      - whatsapp_last_message_content: ${contact.whatsapp_last_message_content || 'NULL'}`);
      });
    }

    // 4. Verificar funções criadas
    console.log('\n4. Verificando funções criadas...');
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .eq('routine_schema', 'public')
      .like('routine_name', '%whatsapp%');

    if (functionsError) {
      console.error('❌ Erro ao verificar funções:', functionsError);
    } else {
      console.log('✅ Funções encontradas:');
      functions.forEach(func => {
        console.log(`   - ${func.routine_name} (${func.routine_type})`);
      });
    }

    // 5. Testar função de incrementar contador
    if (contacts && contacts.length > 0) {
      console.log('\n5. Testando função increment_whatsapp_message_count...');
      const testContact = contacts[0];
      
      try {
        const { data: result, error: incrementError } = await supabase
          .rpc('increment_whatsapp_message_count', { contact_id: testContact.id });

        if (incrementError) {
          console.error('❌ Erro ao testar função:', incrementError);
        } else {
          console.log(`✅ Função testada com sucesso. Novo contador: ${result}`);
        }
      } catch (err) {
        console.error('❌ Erro ao executar função:', err.message);
      }
    }

    // 6. Verificar índices
    console.log('\n6. Verificando índices...');
    const { data: indexes, error: indexesError } = await supabase
      .from('pg_indexes')
      .select('indexname, tablename, indexdef')
      .eq('tablename', 'contacts')
      .eq('schemaname', 'public')
      .like('indexname', '%whatsapp%');

    if (indexesError) {
      console.error('❌ Erro ao verificar índices:', indexesError);
    } else {
      console.log('✅ Índices WhatsApp encontrados:');
      indexes.forEach(idx => {
        console.log(`   - ${idx.indexname}`);
      });
    }

    console.log('\n🎉 Teste concluído!');
    console.log('\n📋 Resumo das correções:');
    console.log('   ✅ Estrutura da tabela verificada');
    console.log('   ✅ Campos WhatsApp verificados');
    console.log('   ✅ Contatos existentes verificados');
    console.log('   ✅ Funções verificadas');
    console.log('   ✅ Índices verificados');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testWhatsAppFixes();
}

module.exports = { testWhatsAppFixes };
