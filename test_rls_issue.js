const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testRLSIssue() {
  try {
    console.log('🔍 Testando problema de RLS...');

    // Testar com chave anônima (como o frontend)
    console.log('\n1. Testando com chave anônima (frontend):');
    const { data: anonStages, error: anonError } = await supabaseAnon
      .from('funnel_stages')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (anonError) {
      console.error('❌ Erro com chave anônima:', anonError);
    } else {
      console.log(`✅ Etapas encontradas com chave anônima: ${anonStages?.length || 0}`);
    }

    // Testar com chave de serviço
    console.log('\n2. Testando com chave de serviço:');
    const { data: serviceStages, error: serviceError } = await supabaseService
      .from('funnel_stages')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (serviceError) {
      console.error('❌ Erro com chave de serviço:', serviceError);
    } else {
      console.log(`✅ Etapas encontradas com chave de serviço: ${serviceStages?.length || 0}`);
    }

    // Verificar políticas RLS
    console.log('\n3. Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabaseService
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'funnel_stages');

    if (policiesError) {
      console.error('❌ Erro ao buscar políticas:', policiesError);
    } else {
      console.log(`✅ Políticas encontradas: ${policies?.length || 0}`);
      if (policies && policies.length > 0) {
        policies.forEach(policy => {
          console.log(`   - ${policy.policyname}: ${policy.cmd}`);
        });
      }
    }

    // Testar sem filtro de is_active
    console.log('\n4. Testando sem filtro is_active:');
    const { data: allStages, error: allError } = await supabaseAnon
      .from('funnel_stages')
      .select('*')
      .order('position', { ascending: true });

    if (allError) {
      console.error('❌ Erro ao buscar todas as etapas:', allError);
    } else {
      console.log(`✅ Todas as etapas encontradas: ${allStages?.length || 0}`);
      if (allStages && allStages.length > 0) {
        allStages.forEach(stage => {
          console.log(`   - ${stage.name} (ativa: ${stage.is_active})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testRLSIssue();
}

module.exports = { testRLSIssue };
