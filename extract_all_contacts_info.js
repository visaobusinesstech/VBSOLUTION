#!/usr/bin/env node

/**
 * Script para extrair informações de todos os contatos WhatsApp existentes
 * e verificar se estão sendo salvos corretamente
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 INICIANDO EXTRAÇÃO DE INFORMAÇÕES DE CONTATOS...\n');

async function extractAllContactsInfo() {
  try {
    console.log('📊 ETAPA 1: Verificando estrutura das tabelas...');
    
    // Verificar colunas da tabela whatsapp_atendimentos
    const { data: atendimentosColumns, error: atendimentosError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'whatsapp_atendimentos')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (atendimentosError) {
      console.log('⚠️ Erro ao verificar colunas de whatsapp_atendimentos:', atendimentosError.message);
    } else {
      console.log('✅ Colunas da tabela whatsapp_atendimentos:');
      atendimentosColumns?.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }

    // Verificar colunas da tabela whatsapp_mensagens
    const { data: mensagensColumns, error: mensagensError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'whatsapp_mensagens')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (mensagensError) {
      console.log('⚠️ Erro ao verificar colunas de whatsapp_mensagens:', mensagensError.message);
    } else {
      console.log('✅ Colunas da tabela whatsapp_mensagens:');
      mensagensColumns?.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }

    // Verificar colunas da tabela contacts
    const { data: contactsColumns, error: contactsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'contacts')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (contactsError) {
      console.log('⚠️ Erro ao verificar colunas de contacts:', contactsError.message);
    } else {
      console.log('✅ Colunas da tabela contacts:');
      contactsColumns?.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }

    console.log('\n📊 ETAPA 2: Verificando dados existentes...');

    // Verificar conversas existentes
    const { data: conversas, error: conversasError } = await supabase
      .from('whatsapp_atendimentos')
      .select('*')
      .order('ultima_mensagem_em', { ascending: false })
      .limit(10);

    if (conversasError) {
      console.log('❌ Erro ao buscar conversas:', conversasError.message);
    } else {
      console.log(`✅ Encontradas ${conversas?.length || 0} conversas recentes:`);
      conversas?.forEach((conv, index) => {
        console.log(`   ${index + 1}. ${conv.nome_cliente || conv.numero_cliente} (${conv.chat_id})`);
        console.log(`      - Display Name: ${conv.display_name || 'NÃO DEFINIDO'}`);
        console.log(`      - Is Group: ${conv.is_group || false}`);
        console.log(`      - Contact Info: ${conv.contact_info ? 'PRESENTE' : 'AUSENTE'}`);
      });
    }

    // Verificar mensagens recentes
    const { data: mensagens, error: mensagensError2 } = await supabase
      .from('whatsapp_mensagens')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (mensagensError2) {
      console.log('❌ Erro ao buscar mensagens:', mensagensError2.message);
    } else {
      console.log(`\n✅ Encontradas ${mensagens?.length || 0} mensagens recentes:`);
      mensagens?.forEach((msg, index) => {
        console.log(`   ${index + 1}. ${msg.wpp_name || 'SEM NOME'} (${msg.remetente})`);
        console.log(`      - Conteúdo: ${msg.conteudo?.substring(0, 50)}...`);
        console.log(`      - WPP Name: ${msg.wpp_name || 'NÃO DEFINIDO'}`);
        console.log(`      - Group Contact Name: ${msg.group_contact_name || 'N/A'}`);
        console.log(`      - Raw Data: ${msg.raw ? 'PRESENTE' : 'AUSENTE'}`);
      });
    }

    // Verificar contatos
    const { data: contatos, error: contatosError } = await supabase
      .from('contacts')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(10);

    if (contatosError) {
      console.log('❌ Erro ao buscar contatos:', contatosError.message);
    } else {
      console.log(`\n✅ Encontrados ${contatos?.length || 0} contatos recentes:`);
      contatos?.forEach((contato, index) => {
        console.log(`   ${index + 1}. ${contato.name || 'SEM NOME'} (${contato.phone})`);
        console.log(`      - Name WPP: ${contato.name_wpp || 'NÃO DEFINIDO'}`);
        console.log(`      - WhatsApp Name: ${contato.whatsapp_name || 'NÃO DEFINIDO'}`);
        console.log(`      - Business Name: ${contato.whatsapp_business_name || 'N/A'}`);
        console.log(`      - Business Description: ${contato.whatsapp_business_description || 'N/A'}`);
        console.log(`      - Business Email: ${contato.whatsapp_business_email || 'N/A'}`);
        console.log(`      - Business Website: ${contato.whatsapp_business_website || 'N/A'}`);
        console.log(`      - Is Group: ${contato.whatsapp_is_group || false}`);
        console.log(`      - Is Business: ${contato.is_whatsapp_business || false}`);
      });
    }

    console.log('\n📊 ETAPA 3: Verificando campos vazios...');

    // Contar conversas sem display_name
    const { count: conversasSemDisplayName } = await supabase
      .from('whatsapp_atendimentos')
      .select('*', { count: 'exact', head: true })
      .is('display_name', null);

    console.log(`⚠️ Conversas sem display_name: ${conversasSemDisplayName || 0}`);

    // Contar mensagens sem wpp_name
    const { count: mensagensSemWppName } = await supabase
      .from('whatsapp_mensagens')
      .select('*', { count: 'exact', head: true })
      .is('wpp_name', null);

    console.log(`⚠️ Mensagens sem wpp_name: ${mensagensSemWppName || 0}`);

    // Contar mensagens sem raw
    const { count: mensagensSemRaw } = await supabase
      .from('whatsapp_mensagens')
      .select('*', { count: 'exact', head: true })
      .is('raw', null);

    console.log(`⚠️ Mensagens sem raw: ${mensagensSemRaw || 0}`);

    // Contar contatos sem name_wpp
    const { count: contatosSemNameWpp } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .is('name_wpp', null);

    console.log(`⚠️ Contatos sem name_wpp: ${contatosSemNameWpp || 0}`);

    console.log('\n🎯 RESUMO DA VERIFICAÇÃO:');
    console.log('================================');
    console.log(`✅ Conversas verificadas: ${conversas?.length || 0}`);
    console.log(`✅ Mensagens verificadas: ${mensagens?.length || 0}`);
    console.log(`✅ Contatos verificados: ${contatos?.length || 0}`);
    console.log(`⚠️ Campos vazios encontrados:`);
    console.log(`   - Conversas sem display_name: ${conversasSemDisplayName || 0}`);
    console.log(`   - Mensagens sem wpp_name: ${mensagensSemWppName || 0}`);
    console.log(`   - Mensagens sem raw: ${mensagensSemRaw || 0}`);
    console.log(`   - Contatos sem name_wpp: ${contatosSemNameWpp || 0}`);

    // Salvar relatório
    const report = {
      timestamp: new Date().toISOString(),
      tables_checked: ['whatsapp_atendimentos', 'whatsapp_mensagens', 'contacts'],
      conversations_found: conversas?.length || 0,
      messages_found: mensagens?.length || 0,
      contacts_found: contatos?.length || 0,
      missing_fields: {
        conversations_without_display_name: conversasSemDisplayName || 0,
        messages_without_wpp_name: mensagensSemWppName || 0,
        messages_without_raw: mensagensSemRaw || 0,
        contacts_without_name_wpp: contatosSemNameWpp || 0
      },
      sample_data: {
        conversations: conversas?.slice(0, 5),
        messages: mensagens?.slice(0, 5),
        contacts: contatos?.slice(0, 5)
      }
    };

    fs.writeFileSync('contacts_extraction_report.json', JSON.stringify(report, null, 2));
    console.log('\n💾 Relatório salvo em: contacts_extraction_report.json');

    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('1. Execute o script SQL para adicionar colunas faltantes');
    console.log('2. Reinicie o servidor WhatsApp para aplicar as mudanças');
    console.log('3. Envie uma mensagem de teste para verificar os logs');
    console.log('4. Verifique se as informações estão sendo salvas corretamente');

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

// Executar verificação
extractAllContactsInfo();
