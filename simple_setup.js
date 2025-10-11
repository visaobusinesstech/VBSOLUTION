// Script simples para configurar dados de exemplo
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupData() {
  try {
    console.log('🔧 Configurando dados de exemplo...');

    // 1. Verificar se as tabelas existem
    console.log('📋 Verificando tabelas...');
    
    const { data: stages, error: stagesError } = await supabase
      .from('funnel_stages')
      .select('*')
      .limit(1);

    if (stagesError) {
      console.log('❌ Tabela funnel_stages não existe. Execute o SQL no Supabase primeiro.');
      console.log('📝 SQL necessário:');
      console.log(`
CREATE TABLE IF NOT EXISTS public.funnel_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  order_position INTEGER NOT NULL,
  color TEXT NOT NULL,
  probability INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  value DECIMAL(10,2) DEFAULT 0,
  stage_id UUID REFERENCES public.funnel_stages(id),
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
      `);
      return;
    }

    console.log('✅ Tabelas encontradas!');

    // 2. Inserir stages se não existirem
    const { data: existingStages } = await supabase
      .from('funnel_stages')
      .select('*');

    if (!existingStages || existingStages.length === 0) {
      console.log('📊 Inserindo stages...');
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
    } else {
      console.log('✅ Stages já existem!');
    }

    // 3. Buscar stages para usar nos leads
    const { data: stagesData } = await supabase
      .from('funnel_stages')
      .select('id, name')
      .order('order_position');

    if (stagesData && stagesData.length > 0) {
      // 4. Inserir leads de exemplo
      const { data: existingLeads } = await supabase
        .from('leads')
        .select('*')
        .limit(1);

      if (!existingLeads || existingLeads.length === 0) {
        console.log('📊 Inserindo leads...');
        const { error: insertLeadsError } = await supabase
          .from('leads')
          .insert([
            {
              name: 'João Silva',
              email: 'joao@empresa.com',
              phone: '(11) 99999-0001',
              company: 'Empresa A',
              value: 15000,
              stage_id: stagesData[0].id,
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
              stage_id: stagesData[1].id,
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
              stage_id: stagesData[2].id,
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
              stage_id: stagesData[3].id,
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
              stage_id: stagesData[4].id,
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
      } else {
        console.log('✅ Leads já existem!');
      }

      // 5. Inserir templates
      const { data: existingTemplates } = await supabase
        .from('templates')
        .select('*')
        .limit(1);

      if (!existingTemplates || existingTemplates.length === 0) {
        console.log('📊 Inserindo templates...');
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
      } else {
        console.log('✅ Templates já existem!');
      }
    }

    console.log('🎉 Configuração concluída!');
    console.log('📱 Agora você pode testar a aplicação em http://localhost:5174/leads-sales');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar configuração
setupData();
