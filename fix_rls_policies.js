const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixRLSPolicies() {
  try {
    console.log('🔧 Corrigindo políticas RLS...');

    // Habilitar RLS nas tabelas
    console.log('1. Habilitando RLS...');
    const tables = ['funnel_stages', 'pipelines', 'leads'];
    
    for (const table of tables) {
      const { error: rlsError } = await supabase.rpc('exec', {
        sql: `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`
      });
      
      if (rlsError) {
        console.error(`❌ Erro ao habilitar RLS em ${table}:`, rlsError);
      } else {
        console.log(`✅ RLS habilitado em ${table}`);
      }
    }

    // Criar políticas permissivas para funnel_stages
    console.log('\n2. Criando políticas para funnel_stages...');
    const funnelStagesPolicies = [
      {
        name: 'funnel_stages_select_policy',
        sql: 'CREATE POLICY "funnel_stages_select_policy" ON public.funnel_stages FOR SELECT USING (true);'
      },
      {
        name: 'funnel_stages_insert_policy',
        sql: 'CREATE POLICY "funnel_stages_insert_policy" ON public.funnel_stages FOR INSERT WITH CHECK (true);'
      },
      {
        name: 'funnel_stages_update_policy',
        sql: 'CREATE POLICY "funnel_stages_update_policy" ON public.funnel_stages FOR UPDATE USING (true);'
      },
      {
        name: 'funnel_stages_delete_policy',
        sql: 'CREATE POLICY "funnel_stages_delete_policy" ON public.funnel_stages FOR DELETE USING (true);'
      }
    ];

    for (const policy of funnelStagesPolicies) {
      // Primeiro, tentar dropar a política se existir
      await supabase.rpc('exec', {
        sql: `DROP POLICY IF EXISTS "${policy.name}" ON public.funnel_stages;`
      });

      // Criar a política
      const { error: policyError } = await supabase.rpc('exec', {
        sql: policy.sql
      });

      if (policyError) {
        console.error(`❌ Erro ao criar política ${policy.name}:`, policyError);
      } else {
        console.log(`✅ Política ${policy.name} criada`);
      }
    }

    // Criar políticas permissivas para pipelines
    console.log('\n3. Criando políticas para pipelines...');
    const pipelinesPolicies = [
      {
        name: 'pipelines_select_policy',
        sql: 'CREATE POLICY "pipelines_select_policy" ON public.pipelines FOR SELECT USING (true);'
      },
      {
        name: 'pipelines_insert_policy',
        sql: 'CREATE POLICY "pipelines_insert_policy" ON public.pipelines FOR INSERT WITH CHECK (true);'
      },
      {
        name: 'pipelines_update_policy',
        sql: 'CREATE POLICY "pipelines_update_policy" ON public.pipelines FOR UPDATE USING (true);'
      },
      {
        name: 'pipelines_delete_policy',
        sql: 'CREATE POLICY "pipelines_delete_policy" ON public.pipelines FOR DELETE USING (true);'
      }
    ];

    for (const policy of pipelinesPolicies) {
      // Primeiro, tentar dropar a política se existir
      await supabase.rpc('exec', {
        sql: `DROP POLICY IF EXISTS "${policy.name}" ON public.pipelines;`
      });

      // Criar a política
      const { error: policyError } = await supabase.rpc('exec', {
        sql: policy.sql
      });

      if (policyError) {
        console.error(`❌ Erro ao criar política ${policy.name}:`, policyError);
      } else {
        console.log(`✅ Política ${policy.name} criada`);
      }
    }

    // Criar políticas permissivas para leads
    console.log('\n4. Criando políticas para leads...');
    const leadsPolicies = [
      {
        name: 'leads_select_policy',
        sql: 'CREATE POLICY "leads_select_policy" ON public.leads FOR SELECT USING (true);'
      },
      {
        name: 'leads_insert_policy',
        sql: 'CREATE POLICY "leads_insert_policy" ON public.leads FOR INSERT WITH CHECK (true);'
      },
      {
        name: 'leads_update_policy',
        sql: 'CREATE POLICY "leads_update_policy" ON public.leads FOR UPDATE USING (true);'
      },
      {
        name: 'leads_delete_policy',
        sql: 'CREATE POLICY "leads_delete_policy" ON public.leads FOR DELETE USING (true);'
      }
    ];

    for (const policy of leadsPolicies) {
      // Primeiro, tentar dropar a política se existir
      await supabase.rpc('exec', {
        sql: `DROP POLICY IF EXISTS "${policy.name}" ON public.leads;`
      });

      // Criar a política
      const { error: policyError } = await supabase.rpc('exec', {
        sql: policy.sql
      });

      if (policyError) {
        console.error(`❌ Erro ao criar política ${policy.name}:`, policyError);
      } else {
        console.log(`✅ Política ${policy.name} criada`);
      }
    }

    // Testar se as políticas funcionam
    console.log('\n5. Testando políticas...');
    const { createClient: createAnonClient } = require('@supabase/supabase-js');
    const supabaseAnon = createAnonClient(SUPABASE_URL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0');

    const { data: testStages, error: testError } = await supabaseAnon
      .from('funnel_stages')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (testError) {
      console.error('❌ Erro no teste das políticas:', testError);
    } else {
      console.log(`✅ Teste bem-sucedido! Etapas encontradas: ${testStages?.length || 0}`);
      if (testStages && testStages.length > 0) {
        testStages.forEach(stage => {
          console.log(`   - ${stage.name} (posição: ${stage.position})`);
        });
      }
    }

    console.log('\n🎉 Políticas RLS corrigidas com sucesso!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixRLSPolicies();
}

module.exports = { fixRLSPolicies };
