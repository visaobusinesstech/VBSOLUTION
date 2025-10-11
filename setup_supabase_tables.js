// Script para configurar tabelas e políticas do Supabase
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTables() {
  try {
    console.log('🔧 Configurando tabelas do Supabase...');

    // 1. Criar tabela funnel_stages
    console.log('📋 Criando tabela funnel_stages...');
    const { error: createStagesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.funnel_stages (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          owner_id UUID NOT NULL REFERENCES auth.users(id),
          name TEXT NOT NULL,
          order_position INTEGER NOT NULL,
          color TEXT NOT NULL,
          probability INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
      `
    });

    if (createStagesError) {
      console.error('❌ Erro ao criar tabela funnel_stages:', createStagesError);
    } else {
      console.log('✅ Tabela funnel_stages criada!');
    }

    // 2. Criar tabela leads
    console.log('📋 Criando tabela leads...');
    const { error: createLeadsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.leads (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          owner_id UUID NOT NULL REFERENCES auth.users(id),
          company_id UUID REFERENCES public.companies(id),
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          company TEXT,
          value DECIMAL(10,2) DEFAULT 0,
          stage_id UUID REFERENCES public.funnel_stages(id),
          priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
          status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
          source TEXT DEFAULT 'manual',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
      `
    });

    if (createLeadsError) {
      console.error('❌ Erro ao criar tabela leads:', createLeadsError);
    } else {
      console.log('✅ Tabela leads criada!');
    }

    // 3. Criar tabela templates
    console.log('📋 Criando tabela templates...');
    const { error: createTemplatesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.templates (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          owner_id UUID NOT NULL REFERENCES auth.users(id),
          company_id UUID REFERENCES public.companies(id),
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp', 'proposal', 'contract', 'presentation')),
          subject TEXT,
          content TEXT NOT NULL,
          variables JSONB DEFAULT '{}',
          is_active BOOLEAN DEFAULT true,
          is_public BOOLEAN DEFAULT false,
          tags TEXT[] DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
      `
    });

    if (createTemplatesError) {
      console.error('❌ Erro ao criar tabela templates:', createTemplatesError);
    } else {
      console.log('✅ Tabela templates criada!');
    }

    // 4. Criar tabela lead_events
    console.log('📋 Criando tabela lead_events...');
    const { error: createEventsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.lead_events (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          owner_id UUID NOT NULL REFERENCES auth.users(id),
          company_id UUID REFERENCES public.companies(id),
          lead_id UUID REFERENCES public.leads(id),
          deal_id UUID,
          title TEXT NOT NULL,
          description TEXT,
          start_date TIMESTAMP WITH TIME ZONE NOT NULL,
          end_date TIMESTAMP WITH TIME ZONE,
          event_type TEXT DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'call', 'email', 'task', 'deadline')),
          is_all_day BOOLEAN DEFAULT false,
          location TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
      `
    });

    if (createEventsError) {
      console.error('❌ Erro ao criar tabela lead_events:', createEventsError);
    } else {
      console.log('✅ Tabela lead_events criada!');
    }

    // 5. Desabilitar RLS temporariamente para inserir dados
    console.log('🔓 Desabilitando RLS temporariamente...');
    const { error: disableRLSError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.funnel_stages DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.templates DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.lead_events DISABLE ROW LEVEL SECURITY;
      `
    });

    if (disableRLSError) {
      console.error('❌ Erro ao desabilitar RLS:', disableRLSError);
    } else {
      console.log('✅ RLS desabilitado temporariamente!');
    }

    // 6. Inserir dados padrão
    console.log('📊 Inserindo dados padrão...');
    
    // Inserir stages
    const { error: insertStagesError } = await supabase
      .from('funnel_stages')
      .insert([
        { name: 'Qualified', order_position: 1, color: '#10b981', probability: 10 },
        { name: 'Contact Made', order_position: 2, color: '#3b82f6', probability: 25 },
        { name: 'Demo Scheduled', order_position: 3, color: '#8b5cf6', probability: 50 },
        { name: 'Proposal Made', order_position: 4, color: '#f59e0b', probability: 75 },
        { name: 'Negotiations Started', order_position: 5, color: '#ef4444', probability: 90 }
      ]);

    if (insertStagesError) {
      console.error('❌ Erro ao inserir stages:', insertStagesError);
    } else {
      console.log('✅ Stages inseridos!');
    }

    // Buscar stages inseridos para usar nos leads
    const { data: stages } = await supabase
      .from('funnel_stages')
      .select('id, name')
      .order('order_position');

    if (stages && stages.length > 0) {
      // Inserir leads de exemplo
      const { error: insertLeadsError } = await supabase
        .from('leads')
        .insert([
          {
            name: 'João Silva',
            email: 'joao@empresa.com',
            phone: '(11) 99999-0001',
            company: 'Empresa A',
            value: 15000,
            stage_id: stages[0].id,
            priority: 'high',
            status: 'open',
            source: 'website'
          },
          {
            name: 'Maria Santos',
            email: 'maria@empresa.com',
            phone: '(11) 99999-0002',
            company: 'Empresa B',
            value: 25000,
            stage_id: stages[1].id,
            priority: 'medium',
            status: 'open',
            source: 'referral'
          },
          {
            name: 'Pedro Costa',
            email: 'pedro@empresa.com',
            phone: '(11) 99999-0003',
            company: 'Empresa C',
            value: 18000,
            stage_id: stages[2].id,
            priority: 'high',
            status: 'open',
            source: 'linkedin'
          },
          {
            name: 'Ana Lima',
            email: 'ana@empresa.com',
            phone: '(11) 99999-0004',
            company: 'Empresa D',
            value: 12000,
            stage_id: stages[3].id,
            priority: 'low',
            status: 'open',
            source: 'email'
          },
          {
            name: 'Carlos Oliveira',
            email: 'carlos@empresa.com',
            phone: '(11) 99999-0005',
            company: 'Empresa E',
            value: 30000,
            stage_id: stages[4].id,
            priority: 'urgent',
            status: 'won',
            source: 'website'
          }
        ]);

      if (insertLeadsError) {
        console.error('❌ Erro ao inserir leads:', insertLeadsError);
      } else {
        console.log('✅ Leads inseridos!');
      }
    }

    // Inserir templates
    const { error: insertTemplatesError } = await supabase
      .from('templates')
      .insert([
        {
          name: 'Proposta Comercial Padrão',
          type: 'proposal',
          subject: 'Proposta Comercial - {{company_name}}',
          content: 'Prezado(a) {{contact_name}},\n\nSegue nossa proposta comercial para {{company_name}}.\n\nValor: {{deal_value}}\nPrazo: {{delivery_time}}\n\nAtenciosamente,\nEquipe Comercial',
          variables: {
            company_name: 'Nome da empresa',
            contact_name: 'Nome do contato',
            deal_value: 'Valor do negócio',
            delivery_time: 'Prazo de entrega'
          }
        },
        {
          name: 'Follow-up WhatsApp',
          type: 'whatsapp',
          content: 'Olá {{contact_name}}! Como está o andamento da nossa proposta para {{company_name}}? Temos algumas novidades que podem interessar! 😊',
          variables: {
            contact_name: 'Nome do contato',
            company_name: 'Nome da empresa'
          }
        }
      ]);

    if (insertTemplatesError) {
      console.error('❌ Erro ao inserir templates:', insertTemplatesError);
    } else {
      console.log('✅ Templates inseridos!');
    }

    // 7. Reabilitar RLS
    console.log('🔒 Reabilitando RLS...');
    const { error: enableRLSError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.funnel_stages ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;
      `
    });

    if (enableRLSError) {
      console.error('❌ Erro ao reabilitar RLS:', enableRLSError);
    } else {
      console.log('✅ RLS reabilitado!');
    }

    console.log('🎉 Configuração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar configuração
setupTables();
