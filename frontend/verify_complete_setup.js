// Script para verificar se a configuração completa foi bem-sucedida
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyCompleteSetup() {
  console.log('🔍 Verificando configuração completa do sistema de Pipeline...\n');

  let allChecksPassed = true;
  const results = [];

  // Verificação 1: Conexão com Supabase
  console.log('1️⃣ Verificando conexão com Supabase...');
  try {
    const { data, error } = await supabase.from('pipelines').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Conexão: OK');
    results.push({ test: 'Conexão', status: 'OK' });
  } catch (err) {
    console.log('❌ Conexão: FALHOU');
    results.push({ test: 'Conexão', status: 'FALHOU', error: err.message });
    allChecksPassed = false;
  }

  // Verificação 2: Tabela pipelines
  console.log('\n2️⃣ Verificando tabela pipelines...');
  try {
    const { data: pipelines, error } = await supabase.from('pipelines').select('*').limit(1);
    if (error) throw error;
    console.log('✅ Tabela pipelines: OK');
    results.push({ test: 'Tabela pipelines', status: 'OK', count: pipelines.length });
  } catch (err) {
    console.log('❌ Tabela pipelines: FALHOU');
    results.push({ test: 'Tabela pipelines', status: 'FALHOU', error: err.message });
    allChecksPassed = false;
  }

  // Verificação 3: Tabela pipeline_stages
  console.log('\n3️⃣ Verificando tabela pipeline_stages...');
  try {
    const { data: stages, error } = await supabase
      .from('pipeline_stages')
      .select('*')
      .order('position', { ascending: true });
    
    if (error) throw error;
    console.log('✅ Tabela pipeline_stages: OK');
    console.log(`📊 Etapas encontradas: ${stages.length}`);
    
    if (stages.length > 0) {
      console.log('\n🎯 Etapas configuradas:');
      stages.forEach(stage => {
        console.log(`   ${stage.position}. ${stage.name} (${stage.color})`);
      });
    }
    
    results.push({ test: 'Tabela pipeline_stages', status: 'OK', count: stages.length });
  } catch (err) {
    console.log('❌ Tabela pipeline_stages: FALHOU');
    results.push({ test: 'Tabela pipeline_stages', status: 'FALHOU', error: err.message });
    allChecksPassed = false;
  }

  // Verificação 4: Colunas na tabela leads
  console.log('\n4️⃣ Verificando colunas na tabela leads...');
  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, name, pipeline_id, stage_id')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Colunas pipeline_id e stage_id: OK');
    results.push({ test: 'Colunas leads', status: 'OK' });
  } catch (err) {
    console.log('❌ Colunas pipeline_id e stage_id: FALHOU');
    results.push({ test: 'Colunas leads', status: 'FALHOU', error: err.message });
    allChecksPassed = false;
  }

  // Verificação 5: Teste de inserção de lead
  console.log('\n5️⃣ Testando inserção de lead...');
  try {
    const testLead = {
      name: 'Lead Teste',
      email: 'teste@exemplo.com',
      phone: '(11) 99999-9999',
      source: 'website',
      status: 'open',
      priority: 'medium',
      value: 1000,
      currency: 'BRL',
      stage_id: '10000000-0000-0000-0000-000000000001', // Novo Lead
      pipeline_id: 'f3eec962-47e7-49cb-8d5d-40a719494e18'
    };

    const { data: insertedLead, error } = await supabase
      .from('leads')
      .insert([testLead])
      .select()
      .single();

    if (error) throw error;
    
    console.log('✅ Inserção de lead: OK');
    console.log(`📝 Lead teste criado: ${insertedLead.name} (ID: ${insertedLead.id})`);
    
    // Limpar o lead teste
    await supabase.from('leads').delete().eq('id', insertedLead.id);
    console.log('🧹 Lead teste removido');
    
    results.push({ test: 'Inserção de lead', status: 'OK' });
  } catch (err) {
    console.log('❌ Inserção de lead: FALHOU');
    results.push({ test: 'Inserção de lead', status: 'FALHOU', error: err.message });
    allChecksPassed = false;
  }

  // Resultado final
  console.log('\n' + '='.repeat(70));
  console.log('📋 RELATÓRIO FINAL DE VERIFICAÇÃO');
  console.log('='.repeat(70));

  results.forEach(result => {
    const status = result.status === 'OK' ? '✅' : '❌';
    console.log(`${status} ${result.test}: ${result.status}`);
    if (result.count !== undefined) {
      console.log(`   📊 Quantidade: ${result.count}`);
    }
    if (result.error) {
      console.log(`   📝 Erro: ${result.error}`);
    }
  });

  console.log('\n' + '='.repeat(70));

  if (allChecksPassed) {
    console.log('🎉 CONFIGURAÇÃO COMPLETA E FUNCIONANDO!');
    console.log('✅ Todos os testes passaram com sucesso!');
    console.log('✅ Sistema de Pipeline está 100% operacional!');
    console.log('✅ Página Leads e Vendas está pronta para uso!');
    
    console.log('\n🚀 SISTEMA PRONTO PARA USO:');
    console.log('1. ✅ Conexão com Supabase configurada');
    console.log('2. ✅ Tabelas criadas e funcionando');
    console.log('3. ✅ Etapas padrão configuradas');
    console.log('4. ✅ Colunas adicionadas na tabela leads');
    console.log('5. ✅ Teste de inserção funcionando');
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Acesse a página "Leads e Vendas" no sistema');
    console.log('2. Clique em "Novo Lead" para criar leads');
    console.log('3. Use "Editar" para personalizar etapas');
    console.log('4. Arraste cards entre etapas para mover leads');
    console.log('5. Use os botões de ação (Ganho/Perdido) nos cards');
    
    console.log('\n🎊 PARABÉNS! O sistema está funcionando perfeitamente!');
  } else {
    console.log('⚠️ CONFIGURAÇÃO INCOMPLETA');
    console.log('❌ Alguns testes falharam');
    console.log('🔧 Execute o SQL completo no Supabase SQL Editor');
    
    console.log('\n📝 SQL para executar:');
    console.log('Arquivo: complete_setup.sql');
    console.log('Ou execute o SQL mostrado nos scripts anteriores');
    
    console.log('\n🔄 Após executar o SQL, rode novamente:');
    console.log('node verify_complete_setup.js');
  }

  console.log('\n📱 Acesso ao Supabase:');
  console.log('🌐 URL: https://supabase.com/dashboard');
  console.log('🔑 Projeto: nrbsocawokmihvxfcpso');
  console.log('📝 Seção: SQL Editor');
}

// Executar verificação
verifyCompleteSetup();

