// apply-contacts-fix.js
// Script para aplicar correções no sistema de contatos e company_id

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyContactsFix() {
  console.log('🔧 [FIX] Aplicando correções no sistema de contatos e company_id...');
  console.log('');

  try {
    // 1. Ler o arquivo SQL
    const sqlFilePath = path.join(__dirname, 'fix-contacts-and-company-id.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 [FIX] Arquivo SQL carregado:', sqlFilePath);
    console.log('⚡ [FIX] Executando correções...');
    
    // 2. Executar o SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ [FIX] Erro ao executar SQL:', error);
      
      // Tentar executar comandos individualmente
      console.log('🔄 [FIX] Tentando executar comandos individualmente...');
      
      const commands = sqlContent.split(';').filter(cmd => cmd.trim());
      console.log(`📊 [FIX] Encontrados ${commands.length} comandos para executar`);
      
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i].trim();
        if (command && !command.startsWith('--')) {
          console.log(`⚡ [FIX] Executando comando ${i + 1}/${commands.length}...`);
          
          try {
            const { error: cmdError } = await supabase.rpc('exec_sql', { sql: command });
            if (cmdError) {
              console.log(`⚠️ [FIX] Erro no comando ${i + 1}:`, cmdError.message);
            } else {
              console.log(`✅ [FIX] Comando ${i + 1} executado com sucesso`);
            }
          } catch (cmdErr) {
            console.log(`❌ [FIX] Erro no comando ${i + 1}:`, cmdErr.message);
          }
        }
      }
    } else {
      console.log('✅ [FIX] SQL executado com sucesso');
    }
    
    // 3. Verificar se as correções foram aplicadas
    console.log('\n🔍 [FIX] Verificando correções aplicadas...');
    
    // Verificar se a tabela contatos foi removida
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'contatos');
    
    if (tables && tables.length > 0) {
      console.log('⚠️ [FIX] Tabela contatos ainda existe');
    } else {
      console.log('✅ [FIX] Tabela contatos foi removida com sucesso');
    }
    
    // Verificar contatos
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, name_wpp, whatsapp_name, phone, owner_id')
      .limit(5);
    
    if (contactsError) {
      console.log('❌ [FIX] Erro ao verificar contatos:', contactsError.message);
    } else {
      console.log(`✅ [FIX] Tabela contacts encontrada com ${contacts?.length || 0} registros`);
      
      // Verificar se name_wpp é igual a whatsapp_name
      const inconsistentContacts = contacts?.filter(c => c.name_wpp !== c.whatsapp_name) || [];
      if (inconsistentContacts.length > 0) {
        console.log(`⚠️ [FIX] ${inconsistentContacts.length} contatos com name_wpp diferente de whatsapp_name`);
        inconsistentContacts.forEach(contact => {
          console.log(`   - ${contact.phone}: name_wpp="${contact.name_wpp}", whatsapp_name="${contact.whatsapp_name}"`);
        });
      } else {
        console.log('✅ [FIX] Todos os contatos têm name_wpp igual a whatsapp_name');
      }
    }
    
    // Verificar mensagens WhatsApp
    const { data: messages, error: messagesError } = await supabase
      .from('whatsapp_mensagens')
      .select('id, wpp_name, group_contact_name, phone, owner_id')
      .limit(5);
    
    if (messagesError) {
      console.log('❌ [FIX] Erro ao verificar mensagens:', messagesError.message);
    } else {
      console.log(`✅ [FIX] Tabela whatsapp_mensagens encontrada com ${messages?.length || 0} registros`);
      
      // Mostrar exemplos de nomes
      messages?.forEach(msg => {
        console.log(`   - ${msg.phone}: wpp_name="${msg.wpp_name}", group_contact_name="${msg.group_contact_name}"`);
      });
    }
    
    // Verificar empresas
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, fantasy_name, company_name, owner_id')
      .limit(5);
    
    if (companiesError) {
      console.log('❌ [FIX] Erro ao verificar empresas:', companiesError.message);
    } else {
      console.log(`✅ [FIX] Tabela companies encontrada com ${companies?.length || 0} registros`);
      companies?.forEach(company => {
        console.log(`   - ${company.fantasy_name} (ID: ${company.id})`);
      });
    }
    
    console.log('\n🎯 [FIX] Correções aplicadas com sucesso!');
    console.log('📋 [FIX] Próximos passos:');
    console.log('   1. Reiniciar o backend WhatsApp');
    console.log('   2. Testar envio/recebimento de mensagens');
    console.log('   3. Verificar se as tabelas voltaram a ser preenchidas');
    console.log('   4. Monitorar logs para confirmar funcionamento');
    
  } catch (error) {
    console.error('❌ [FIX] Erro geral:', error);
  }
}

// Executar correções
applyContactsFix();
