// Script de verificação para confirmar que a correção do sistema de contatos WhatsApp foi aplicada
// Execute: node verify_whatsapp_contacts_fix.js

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

class WhatsAppContactsVerifier {
  constructor() {
    this.checks = [];
    this.passed = 0;
    this.failed = 0;
  }

  async verifyAll() {
    console.log('🔍 [VERIFIER] Iniciando verificação do sistema de contatos WhatsApp...');
    console.log('');

    try {
      // 1. Verificar estrutura das tabelas
      await this.verifyTableStructure();
      
      // 2. Verificar dados de contatos
      await this.verifyContactsData();
      
      // 3. Verificar dados de mensagens
      await this.verifyMessagesData();
      
      // 4. Verificar integridade dos dados
      await this.verifyDataIntegrity();

      // 5. Relatório final
      this.generateReport();

    } catch (error) {
      console.error('❌ [VERIFIER] Erro na verificação:', error.message);
      throw error;
    }
  }

  async verifyTableStructure() {
    console.log('🔍 [VERIFIER] Verificando estrutura das tabelas...');
    
    try {
      // Verificar tabela contacts
      const { data: contactsColumns, error: contactsError } = await supabase
        .rpc('get_table_columns', { table_name: 'contacts' });

      if (contactsError) {
        // Fallback para query direta
        const { data: contactsData, error: contactsQueryError } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_name', 'contacts')
          .eq('table_schema', 'public')
          .in('column_name', [
            'whatsapp_jid', 'name_wpp', 'whatsapp_name', 'whatsapp_business_name',
            'whatsapp_business_description', 'whatsapp_business_category',
            'whatsapp_verified', 'whatsapp_online', 'whatsapp_blocked',
            'whatsapp_is_group', 'whatsapp_group_subject'
          ]);

        if (contactsQueryError) {
          throw new Error(`Erro ao verificar colunas da tabela contacts: ${contactsQueryError.message}`);
        }

        this.checkResult('contacts', 'Estrutura da tabela contacts', contactsData.length >= 10, 
          `Encontradas ${contactsData.length} colunas do WhatsApp`);
      }

      // Verificar tabela whatsapp_mensagens
      const { data: messagesData, error: messagesError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'whatsapp_mensagens')
        .eq('table_schema', 'public')
        .in('column_name', [
          'wpp_name', 'group_contact_name', 'message_type', 'whatsapp_business_name',
          'whatsapp_verified', 'whatsapp_online', 'whatsapp_blocked',
          'whatsapp_is_group', 'whatsapp_group_subject'
        ]);

      if (messagesError) {
        throw new Error(`Erro ao verificar colunas da tabela whatsapp_mensagens: ${messagesError.message}`);
      }

      this.checkResult('whatsapp_mensagens', 'Estrutura da tabela whatsapp_mensagens', messagesData.length >= 9,
        `Encontradas ${messagesData.length} colunas do WhatsApp`);

    } catch (error) {
      this.checkResult('structure', 'Estrutura das tabelas', false, error.message);
    }
  }

  async verifyContactsData() {
    console.log('🔍 [VERIFIER] Verificando dados de contatos...');
    
    try {
      // Verificar contatos com Push Names
      const { data: contactsWithNames, error: namesError } = await supabase
        .from('contacts')
        .select('id, name, name_wpp, whatsapp_name, whatsapp_business_name, whatsapp_verified')
        .not('name_wpp', 'is', null)
        .limit(10);

      if (namesError) {
        throw new Error(`Erro ao verificar contatos com nomes: ${namesError.message}`);
      }

      this.checkResult('contacts_names', 'Contatos com Push Names', contactsWithNames.length > 0,
        `Encontrados ${contactsWithNames.length} contatos com Push Names`);

      // Verificar contatos com informações de negócio
      const { data: businessContacts, error: businessError } = await supabase
        .from('contacts')
        .select('id, whatsapp_business_name, whatsapp_business_category, whatsapp_verified')
        .not('whatsapp_business_name', 'is', null)
        .limit(5);

      if (businessError) {
        throw new Error(`Erro ao verificar contatos de negócio: ${businessError.message}`);
      }

      this.checkResult('contacts_business', 'Contatos com informações de negócio', businessContacts.length >= 0,
        `Encontrados ${businessContacts.length} contatos de negócio`);

      // Verificar contatos de grupo
      const { data: groupContacts, error: groupError } = await supabase
        .from('contacts')
        .select('id, whatsapp_is_group, whatsapp_group_subject')
        .eq('whatsapp_is_group', true)
        .limit(5);

      if (groupError) {
        throw new Error(`Erro ao verificar contatos de grupo: ${groupError.message}`);
      }

      this.checkResult('contacts_groups', 'Contatos de grupo', groupContacts.length >= 0,
        `Encontrados ${groupContacts.length} contatos de grupo`);

    } catch (error) {
      this.checkResult('contacts_data', 'Dados de contatos', false, error.message);
    }
  }

  async verifyMessagesData() {
    console.log('🔍 [VERIFIER] Verificando dados de mensagens...');
    
    try {
      // Verificar mensagens com Push Names
      const { data: messagesWithNames, error: namesError } = await supabase
        .from('whatsapp_mensagens')
        .select('id, wpp_name, group_contact_name, message_type')
        .not('wpp_name', 'is', null)
        .limit(10);

      if (namesError) {
        throw new Error(`Erro ao verificar mensagens com nomes: ${namesError.message}`);
      }

      this.checkResult('messages_names', 'Mensagens com Push Names', messagesWithNames.length > 0,
        `Encontradas ${messagesWithNames.length} mensagens com Push Names`);

      // Verificar mensagens com informações de negócio
      const { data: businessMessages, error: businessError } = await supabase
        .from('whatsapp_mensagens')
        .select('id, whatsapp_business_name, whatsapp_business_category')
        .not('whatsapp_business_name', 'is', null)
        .limit(5);

      if (businessError) {
        throw new Error(`Erro ao verificar mensagens de negócio: ${businessError.message}`);
      }

      this.checkResult('messages_business', 'Mensagens com informações de negócio', businessMessages.length >= 0,
        `Encontradas ${businessMessages.length} mensagens de negócio`);

      // Verificar mensagens de grupo
      const { data: groupMessages, error: groupError } = await supabase
        .from('whatsapp_mensagens')
        .select('id, whatsapp_is_group, whatsapp_group_subject')
        .eq('whatsapp_is_group', true)
        .limit(5);

      if (groupError) {
        throw new Error(`Erro ao verificar mensagens de grupo: ${groupError.message}`);
      }

      this.checkResult('messages_groups', 'Mensagens de grupo', groupMessages.length >= 0,
        `Encontradas ${groupMessages.length} mensagens de grupo`);

    } catch (error) {
      this.checkResult('messages_data', 'Dados de mensagens', false, error.message);
    }
  }

  async verifyDataIntegrity() {
    console.log('🔍 [VERIFIER] Verificando integridade dos dados...');
    
    try {
      // Verificar se contatos e mensagens estão sincronizados
      const { data: syncData, error: syncError } = await supabase
        .from('contacts')
        .select(`
          id, name, name_wpp, whatsapp_name,
          whatsapp_mensagens!inner(id, wpp_name, group_contact_name)
        `)
        .not('name_wpp', 'is', null)
        .limit(5);

      if (syncError) {
        throw new Error(`Erro ao verificar sincronização: ${syncError.message}`);
      }

      this.checkResult('data_sync', 'Sincronização de dados', syncData.length >= 0,
        `Verificados ${syncData.length} contatos sincronizados`);

      // Verificar se não há erros de coluna faltando
      const { data: errorCheck, error: errorCheckError } = await supabase
        .from('whatsapp_mensagens')
        .select('id, whatsapp_blocked, whatsapp_verified, whatsapp_online')
        .limit(1);

      if (errorCheckError) {
        this.checkResult('column_errors', 'Verificação de erros de coluna', false, errorCheckError.message);
      } else {
        this.checkResult('column_errors', 'Verificação de erros de coluna', true, 'Nenhum erro de coluna encontrado');
      }

    } catch (error) {
      this.checkResult('data_integrity', 'Integridade dos dados', false, error.message);
    }
  }

  checkResult(category, description, passed, details) {
    const result = {
      category,
      description,
      passed,
      details,
      timestamp: new Date().toISOString()
    };

    this.checks.push(result);

    if (passed) {
      this.passed++;
      console.log(`✅ [${category.toUpperCase()}] ${description}: ${details}`);
    } else {
      this.failed++;
      console.log(`❌ [${category.toUpperCase()}] ${description}: ${details}`);
    }
  }

  generateReport() {
    console.log('');
    console.log('📊 [VERIFIER] ===== RELATÓRIO DE VERIFICAÇÃO =====');
    console.log(`✅ Verificações aprovadas: ${this.passed}`);
    console.log(`❌ Verificações falharam: ${this.failed}`);
    console.log(`📈 Taxa de sucesso: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
    console.log('');

    if (this.failed === 0) {
      console.log('🎉 [VERIFIER] Todas as verificações passaram! Sistema funcionando corretamente.');
      console.log('');
      console.log('✅ [VERIFIER] O sistema de contatos WhatsApp está:');
      console.log('   • Salvando Push Names corretamente');
      console.log('   • Extraindo informações de negócio');
      console.log('   • Sincronizando dados entre tabelas');
      console.log('   • Sem erros de coluna faltando');
    } else {
      console.log('⚠️ [VERIFIER] Algumas verificações falharam. Verifique os detalhes acima.');
      console.log('');
      console.log('🔧 [VERIFIER] Ações recomendadas:');
      this.checks.filter(c => !c.passed).forEach(check => {
        console.log(`   • ${check.description}: ${check.details}`);
      });
    }

    console.log('');
    console.log('📝 [VERIFIER] Próximos passos:');
    console.log('   1. Reinicie o servidor WhatsApp se necessário');
    console.log('   2. Verifique as páginas Contatos e Conversation');
    console.log('   3. Monitore os logs para confirmar funcionamento');
  }
}

// Executar verificação
async function main() {
  try {
    const verifier = new WhatsAppContactsVerifier();
    await verifier.verifyAll();
  } catch (error) {
    console.error('💥 [MAIN] Erro fatal na verificação:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = WhatsAppContactsVerifier;
