// Teste simples do Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  console.log('🔍 Testando conexão com Supabase...');
  
  try {
    // Teste 1: Verificar se funnel_stages existe
    console.log('📋 Testando tabela funnel_stages...');
    const { data: stages, error: stagesError } = await supabase
      .from('funnel_stages')
      .select('*')
      .limit(5);

    if (stagesError) {
      console.error('❌ Erro na tabela funnel_stages:', stagesError.message);
    } else {
      console.log('✅ funnel_stages OK:', stages?.length || 0, 'registros');
    }

    // Teste 2: Verificar se leads existe
    console.log('📋 Testando tabela leads...');
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .limit(5);

    if (leadsError) {
      console.error('❌ Erro na tabela leads:', leadsError.message);
    } else {
      console.log('✅ leads OK:', leads?.length || 0, 'registros');
    }

    // Teste 3: Verificar se templates existe
    console.log('📋 Testando tabela templates...');
    const { data: templates, error: templatesError } = await supabase
      .from('templates')
      .select('*')
      .limit(5);

    if (templatesError) {
      console.error('❌ Erro na tabela templates:', templatesError.message);
    } else {
      console.log('✅ templates OK:', templates?.length || 0, 'registros');
    }

    // Teste 4: Verificar se products existe
    console.log('📋 Testando tabela products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);

    if (productsError) {
      console.error('❌ Erro na tabela products:', productsError.message);
    } else {
      console.log('✅ products OK:', products?.length || 0, 'registros');
    }

    console.log('🎉 Teste concluído!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testSupabase();
