const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxGamuLjvZm0_OU0';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

async function testStagesAccess() {
  console.log('🔍 Testando acesso às etapas do pipeline...\n');

  // Teste com chave anônima
  console.log('1. Testando com chave anônima:');
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('funnel_stages')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (anonError) {
      console.log('❌ Erro com chave anônima:', anonError.message);
    } else {
      console.log('✅ Sucesso com chave anônima:', anonData?.length || 0, 'etapas encontradas');
      if (anonData && anonData.length > 0) {
        anonData.forEach(stage => {
          console.log(`   - ${stage.name} (posição: ${stage.position}, cor: ${stage.color})`);
        });
      }
    }
  } catch (err) {
    console.log('❌ Erro de conexão com chave anônima:', err.message);
  }

  console.log('\n2. Testando com chave de serviço:');
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data: serviceData, error: serviceError } = await supabaseService
      .from('funnel_stages')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (serviceError) {
      console.log('❌ Erro com chave de serviço:', serviceError.message);
    } else {
      console.log('✅ Sucesso com chave de serviço:', serviceData?.length || 0, 'etapas encontradas');
      if (serviceData && serviceData.length > 0) {
        serviceData.forEach(stage => {
          console.log(`   - ${stage.name} (posição: ${stage.position}, cor: ${stage.color})`);
        });
      }
    }
  } catch (err) {
    console.log('❌ Erro de conexão com chave de serviço:', err.message);
  }

  console.log('\n3. Testando políticas RLS:');
  try {
    const { data: rlsData, error: rlsError } = await supabaseService
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'funnel_stages');

    if (rlsError) {
      console.log('❌ Erro ao verificar políticas RLS:', rlsError.message);
    } else {
      console.log('✅ Políticas RLS encontradas:', rlsData?.length || 0);
      if (rlsData && rlsData.length > 0) {
        rlsData.forEach(policy => {
          console.log(`   - ${policy.policyname}: ${policy.cmd} (${policy.permissive ? 'permissive' : 'restrictive'})`);
        });
      }
    }
  } catch (err) {
    console.log('❌ Erro ao verificar RLS:', err.message);
  }
}

testStagesAccess().catch(console.error);
