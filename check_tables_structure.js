// Script para verificar estrutura das tabelas
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTablesStructure() {
  console.log('🔍 Verificando estrutura das tabelas...');

  try {
    // Verificar tabela leads
    console.log('📋 Verificando tabela leads...');
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .limit(1);

    if (leadsError) {
      console.error('❌ Erro na tabela leads:', leadsError.message);
    } else {
      console.log('✅ Tabela leads existe');
      if (leads && leads.length > 0) {
        console.log('📊 Colunas da tabela leads:', Object.keys(leads[0]));
      }
    }

    // Verificar tabela funnel_stages
    console.log('📋 Verificando tabela funnel_stages...');
    const { data: stages, error: stagesError } = await supabase
      .from('funnel_stages')
      .select('*')
      .limit(1);

    if (stagesError) {
      console.error('❌ Erro na tabela funnel_stages:', stagesError.message);
    } else {
      console.log('✅ Tabela funnel_stages existe');
      if (stages && stages.length > 0) {
        console.log('📊 Colunas da tabela funnel_stages:', Object.keys(stages[0]));
      }
    }

    // Verificar tabela user_profiles
    console.log('📋 Verificando tabela user_profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.error('❌ Erro na tabela user_profiles:', profilesError.message);
    } else {
      console.log('✅ Tabela user_profiles existe');
      if (profiles && profiles.length > 0) {
        console.log('📊 Colunas da tabela user_profiles:', Object.keys(profiles[0]));
      }
    }

    // Verificar tabela companies
    console.log('📋 Verificando tabela companies...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);

    if (companiesError) {
      console.error('❌ Erro na tabela companies:', companiesError.message);
    } else {
      console.log('✅ Tabela companies existe');
      if (companies && companies.length > 0) {
        console.log('📊 Colunas da tabela companies:', Object.keys(companies[0]));
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkTablesStructure();
