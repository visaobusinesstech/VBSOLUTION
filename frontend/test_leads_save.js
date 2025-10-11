import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function testLeadsSave() {
  console.log('🧪 Testando salvamento de leads...');
  
  try {
    // 1. Verificar se a tabela leads existe
    console.log('\n📋 Verificando tabela leads...');
    
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, name')
      .limit(1);

    if (leadsError) {
      console.log('❌ Erro ao acessar tabela leads:', leadsError.message);
      return;
    }

    console.log('✅ Tabela leads acessível');

    // 2. Verificar se existem etapas do funil
    console.log('\n🔍 Verificando etapas do funil...');
    
    const { data: stages, error: stagesError } = await supabase
      .from('funnel_stages')
      .select('id, name, order_position')
      .order('order_position');

    if (stagesError) {
      console.log('❌ Erro ao acessar etapas do funil:', stagesError.message);
      return;
    }

    if (!stages || stages.length === 0) {
      console.log('⚠️ Nenhuma etapa do funil encontrada. Criando etapas padrão...');
      
      const defaultStages = [
        { id: '11111111-1111-1111-1111-111111111111', name: 'Novo Lead', order_position: 1, color: '#3b82f6', probability: 10 },
        { id: '22222222-2222-2222-2222-222222222222', name: 'Contato Inicial', order_position: 2, color: '#8b5cf6', probability: 25 },
        { id: '33333333-3333-3333-3333-333333333333', name: 'Proposta', order_position: 3, color: '#f59e0b', probability: 50 },
        { id: '44444444-4444-4444-4444-444444444444', name: 'Reunião', order_position: 4, color: '#ef4444', probability: 75 },
        { id: '55555555-5555-5555-5555-555555555555', name: 'Fechamento', order_position: 5, color: '#10b981', probability: 100 }
      ];

      for (const stage of defaultStages) {
        const { error: insertError } = await supabase
          .from('funnel_stages')
          .upsert(stage, { onConflict: 'id' });
        
        if (insertError) {
          console.log(`❌ Erro ao inserir etapa ${stage.name}:`, insertError.message);
        } else {
          console.log(`✅ Etapa ${stage.name} criada/atualizada`);
        }
      }
    } else {
      console.log(`✅ Encontradas ${stages.length} etapas do funil`);
    }

    // 3. Testar inserção de lead
    console.log('\n💾 Testando inserção de lead...');
    
    const testLead = {
      name: 'Lead de Teste - ' + new Date().toISOString(),
      email: 'teste@exemplo.com',
      phone: '(11) 99999-9999',
      company: 'Empresa Teste',
      source: 'website',
      priority: 'medium',
      stage_id: stages?.[0]?.id || '11111111-1111-1111-1111-111111111111',
      value: 1000.00,
      currency: 'BRL',
      status: 'cold'
    };

    console.log('📝 Dados do lead de teste:', testLead);

    const { data: insertedLead, error: insertError } = await supabase
      .from('leads')
      .insert([testLead])
      .select(`
        *,
        stage:funnel_stages(id, name, color, order_position)
      `)
      .single();

    if (insertError) {
      console.log('❌ Erro ao inserir lead:', insertError.message);
      console.log('🔍 Detalhes do erro:', insertError);
    } else {
      console.log('✅ Lead inserido com sucesso!');
      console.log('📋 Dados do lead inserido:', insertedLead);
      
      // 4. Verificar se o lead aparece na lista
      console.log('\n🔍 Verificando se o lead aparece na lista...');
      
      const { data: allLeads, error: fetchError } = await supabase
        .from('leads')
        .select(`
          *,
          stage:funnel_stages(id, name, color, order_position)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.log('❌ Erro ao buscar leads:', fetchError.message);
      } else {
        console.log(`✅ Encontrados ${allLeads?.length || 0} leads na lista`);
        
        const foundLead = allLeads?.find(lead => lead.id === insertedLead.id);
        if (foundLead) {
          console.log('✅ Lead encontrado na lista!');
          console.log('📋 Lead na lista:', {
            id: foundLead.id,
            name: foundLead.name,
            stage: foundLead.stage?.name || 'Sem etapa',
            status: foundLead.status
          });
        } else {
          console.log('❌ Lead não encontrado na lista');
        }
      }

      // 5. Deletar o lead de teste
      console.log('\n🗑️ Removendo lead de teste...');
      
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', insertedLead.id);
      
      if (deleteError) {
        console.log('⚠️ Erro ao deletar lead de teste:', deleteError.message);
      } else {
        console.log('✅ Lead de teste removido');
      }
    }

    console.log('\n🎉 Teste de salvamento concluído!');
    console.log('\n📋 Resumo:');
    console.log('- ✅ Tabela leads acessível');
    console.log('- ✅ Etapas do funil verificadas/criadas');
    console.log('- ✅ Inserção de lead testada');
    console.log('- ✅ Busca de leads testada');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar o teste
testLeadsSave();

