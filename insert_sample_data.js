// Script para inserir dados de exemplo no Supabase
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://nrbsocawokmihvxfcpso.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function insertSampleData() {
  console.log('📝 Inserindo dados de exemplo...');
  
  try {
    // 1. Inserir empresas de exemplo
    console.log('\n1. Inserindo empresas...');
    const companies = [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        fantasy_name: 'Tech Solutions',
        email: 'contato@techsolutions.com',
        phone: '(11) 3456-7890',
        status: 'active'
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        fantasy_name: 'Marketing Pro',
        email: 'vendas@marketingpro.com',
        phone: '(21) 2345-6789',
        status: 'active'
      }
    ];
    
    const { data: insertedCompanies, error: companiesError } = await supabase
      .from('companies')
      .upsert(companies, { onConflict: 'id' })
      .select();
    
    if (companiesError) {
      console.error('❌ Erro ao inserir empresas:', companiesError.message);
      return;
    }
    
    console.log('✅ Empresas inseridas:', insertedCompanies.length);
    
    // 2. Inserir usuário de exemplo
    console.log('\n2. Inserindo usuário...');
    const user = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Usuário Teste',
      email: 'teste@exemplo.com',
      role: 'admin'
    };
    
    const { data: insertedUser, error: userError } = await supabase
      .from('user_profiles')
      .upsert(user, { onConflict: 'id' })
      .select();
    
    if (userError) {
      console.error('❌ Erro ao inserir usuário:', userError.message);
      return;
    }
    
    console.log('✅ Usuário inserido');
    
    // 3. Inserir etapas do funil
    console.log('\n3. Inserindo etapas do funil...');
    const stages = [
      {
        id: 'stage-001-0000-0000-0000-000000000001',
        name: 'Contato Inicial',
        order_index: 1,
        color: '#3b82f6',
        company_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        created_by: '00000000-0000-0000-0000-000000000001'
      },
      {
        id: 'stage-002-0000-0000-0000-000000000002',
        name: 'Proposta',
        order_index: 2,
        color: '#8b5cf6',
        company_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        created_by: '00000000-0000-0000-0000-000000000001'
      },
      {
        id: 'stage-003-0000-0000-0000-000000000003',
        name: 'Reunião Meet',
        order_index: 3,
        color: '#f59e0b',
        company_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        created_by: '00000000-0000-0000-0000-000000000001'
      },
      {
        id: 'stage-004-0000-0000-0000-000000000004',
        name: 'Fechamento',
        order_index: 4,
        color: '#ef4444',
        company_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        created_by: '00000000-0000-0000-0000-000000000001'
      },
      {
        id: 'stage-005-0000-0000-0000-000000000005',
        name: 'Boas Vindas',
        order_index: 5,
        color: '#10b981',
        company_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        created_by: '00000000-0000-0000-0000-000000000001'
      }
    ];
    
    const { data: insertedStages, error: stagesError } = await supabase
      .from('funnel_stages')
      .upsert(stages, { onConflict: 'id' })
      .select();
    
    if (stagesError) {
      console.error('❌ Erro ao inserir etapas:', stagesError.message);
      return;
    }
    
    console.log('✅ Etapas inseridas:', insertedStages.length);
    
    console.log('\n🎉 Dados de exemplo inseridos com sucesso!');
    console.log('Agora você pode executar o teste de criação de leads.');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

// Executar inserção
insertSampleData();