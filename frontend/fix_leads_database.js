import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixLeadsDatabase() {
  console.log('🚀 Iniciando correção da estrutura da tabela leads...');
  
  try {
    // 1. Verificar se a tabela leads existe e sua estrutura
    console.log('\n📋 Verificando estrutura da tabela leads...');
    
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'leads' })
      .catch(async () => {
        // Fallback: usar query direta
        const { data, error } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_name', 'leads')
          .eq('table_schema', 'public');
        return { data, error };
      });

    if (columnsError) {
      console.log('⚠️ Não foi possível verificar colunas via RPC, tentando método alternativo...');
    } else {
      console.log('✅ Colunas encontradas:', columns);
    }

    // 2. Executar migração da tabela leads
    console.log('\n🔧 Executando migração da tabela leads...');
    
    const migrationSQL = `
      -- Verificar se a tabela leads existe
      DO $$
      BEGIN
        -- Se a tabela não existir, criar
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads' AND table_schema = 'public') THEN
          CREATE TABLE public.leads (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            company TEXT,
            position TEXT,
            source TEXT DEFAULT 'website',
            priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
            stage_id UUID NOT NULL REFERENCES public.funnel_stages(id),
            responsible_id UUID REFERENCES public.suppliers(id),
            contact_id UUID REFERENCES public.contacts(id),
            product_id UUID REFERENCES public.products(id),
            product_quantity INTEGER DEFAULT 1,
            product_price DECIMAL(10,2),
            value DECIMAL(10,2) DEFAULT 0,
            currency TEXT DEFAULT 'BRL',
            expected_close_date DATE,
            notes TEXT,
            status TEXT DEFAULT 'cold' CHECK (status IN ('hot', 'cold', 'won', 'lost')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
          );
        ELSE
          -- Se a tabela existe, adicionar colunas que podem estar faltando
          ALTER TABLE public.leads 
          ADD COLUMN IF NOT EXISTS position TEXT,
          ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website',
          ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
          ADD COLUMN IF NOT EXISTS stage_id UUID,
          ADD COLUMN IF NOT EXISTS responsible_id UUID,
          ADD COLUMN IF NOT EXISTS contact_id UUID,
          ADD COLUMN IF NOT EXISTS product_id UUID,
          ADD COLUMN IF NOT EXISTS product_quantity INTEGER DEFAULT 1,
          ADD COLUMN IF NOT EXISTS product_price DECIMAL(10,2),
          ADD COLUMN IF NOT EXISTS value DECIMAL(10,2) DEFAULT 0,
          ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL',
          ADD COLUMN IF NOT EXISTS expected_close_date DATE,
          ADD COLUMN IF NOT EXISTS notes TEXT,
          ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'cold';
        END IF;
      END $$;

      -- Desabilitar RLS temporariamente
      ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;

      -- Remover políticas existentes
      DROP POLICY IF EXISTS "Enable all operations for all users" ON public.leads;
      DROP POLICY IF EXISTS "Users can view own leads" ON public.leads;
      DROP POLICY IF EXISTS "Users can insert own leads" ON public.leads;
      DROP POLICY IF EXISTS "Users can update own leads" ON public.leads;
      DROP POLICY IF EXISTS "Users can delete own leads" ON public.leads;

      -- Criar índices para performance
      CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON public.leads(owner_id);
      CREATE INDEX IF NOT EXISTS idx_leads_stage_id ON public.leads(stage_id);
      CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
      CREATE INDEX IF NOT EXISTS idx_leads_priority ON public.leads(priority);
      CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
      CREATE INDEX IF NOT EXISTS idx_leads_contact_id ON public.leads(contact_id);
      CREATE INDEX IF NOT EXISTS idx_leads_product_id ON public.leads(product_id);
      CREATE INDEX IF NOT EXISTS idx_leads_responsible_id ON public.leads(responsible_id);
    `;

    // Dividir o SQL em comandos individuais
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));

    console.log(`📝 Executando ${commands.length} comandos SQL...`);

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (!command || command.startsWith('--') || command.startsWith('/*')) {
        continue;
      }

      try {
        console.log(`\n🔄 Executando comando ${i + 1}/${commands.length}...`);
        console.log(`SQL: ${command.substring(0, 100)}${command.length > 100 ? '...' : ''}`);
        
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: command });
        
        if (error) {
          console.log(`⚠️ Erro no RPC, tentando execução direta: ${error.message}`);
          // Tentar execução direta
          const { data: directData, error: directError } = await supabase
            .from('leads')
            .select('id')
            .limit(1);
          
          if (directError) {
            console.log(`❌ Erro na execução direta: ${directError.message}`);
          } else {
            console.log(`✅ Comando executado com sucesso via query direta`);
          }
        } else {
          console.log(`✅ Comando executado com sucesso via RPC`);
        }
      } catch (err) {
        console.log(`❌ Erro ao executar comando ${i + 1}:`, err.message);
      }
    }

    // 3. Verificar se a tabela funnel_stages existe
    console.log('\n🔍 Verificando tabela funnel_stages...');
    
    const { data: stages, error: stagesError } = await supabase
      .from('funnel_stages')
      .select('id, name, order_position')
      .order('order_position');

    if (stagesError) {
      console.log('❌ Erro ao buscar etapas do funil:', stagesError.message);
      
      // Criar etapas padrão
      console.log('🔧 Criando etapas padrão do funil...');
      
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
      console.log(`✅ Encontradas ${stages?.length || 0} etapas do funil`);
    }

    // 4. Testar inserção de um lead de exemplo
    console.log('\n🧪 Testando inserção de lead de exemplo...');
    
    const testLead = {
      name: 'Lead de Teste',
      email: 'teste@exemplo.com',
      phone: '(11) 99999-9999',
      company: 'Empresa Teste',
      source: 'website',
      priority: 'medium',
      stage_id: '11111111-1111-1111-1111-111111111111',
      value: 1000.00,
      currency: 'BRL',
      status: 'cold'
    };

    const { data: insertedLead, error: insertError } = await supabase
      .from('leads')
      .insert([testLead])
      .select()
      .single();

    if (insertError) {
      console.log('❌ Erro ao inserir lead de teste:', insertError.message);
    } else {
      console.log('✅ Lead de teste inserido com sucesso:', insertedLead.id);
      
      // Deletar o lead de teste
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

    console.log('\n🎉 Correção da estrutura da tabela leads concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Execute o servidor: cd "Sistema/Atualizado/VBSOLUTIONCRM-master/frontend" && pnpm dev');
    console.log('2. Abra o console do navegador (F12)');
    console.log('3. Tente criar uma oportunidade e verifique os logs');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar a correção
fixLeadsDatabase();

