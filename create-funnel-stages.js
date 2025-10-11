// Script para criar tabela funnel_stages e inserir dados
const { createClient } = require('@supabase/supabase-js');

console.log('🔧 Criando tabela funnel_stages...');

const SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createFunnelStages() {
    try {
        console.log('📡 Conectando ao Supabase...');
        
        // 1. Verificar se a tabela funnel_stages existe
        console.log('🔍 Verificando se tabela funnel_stages existe...');
        const { data: existingStages, error: checkError } = await supabase
            .from('funnel_stages')
            .select('*')
            .limit(1);
        
        if (checkError && checkError.code === 'PGRST116') {
            console.log('❌ Tabela funnel_stages não existe, criando...');
            
            // Como não podemos criar tabelas via API, vamos inserir dados diretamente
            // Primeiro, vamos tentar inserir os dados
            console.log('📝 Inserindo etapas do funil...');
        } else if (checkError) {
            console.error('❌ Erro ao verificar tabela:', checkError.message);
            return false;
        } else {
            console.log('✅ Tabela funnel_stages já existe');
            console.log(`📊 Etapas encontradas: ${existingStages.length}`);
        }
        
        // 2. Inserir etapas do funil (sem especificar ID para gerar UUIDs automáticos)
        console.log('📝 Inserindo etapas do funil...');
        const { data: stagesData, error: stagesError } = await supabase
            .from('funnel_stages')
            .upsert([
                {
                    name: 'Novo Lead',
                    position: 1,
                    color: '#EF4444',
                    is_active: true
                },
                {
                    name: 'Contato Inicial',
                    position: 2,
                    color: '#F59E0B',
                    is_active: true
                },
                {
                    name: 'Qualificação',
                    position: 3,
                    color: '#3B82F6',
                    is_active: true
                },
                {
                    name: 'Proposta',
                    position: 4,
                    color: '#8B5CF6',
                    is_active: true
                },
                {
                    name: 'Negociação',
                    position: 5,
                    color: '#EC4899',
                    is_active: true
                },
                {
                    name: 'Fechamento',
                    position: 6,
                    color: '#10B981',
                    is_active: true
                }
            ])
            .select();
        
        if (stagesError) {
            console.error('❌ Erro ao inserir etapas:', stagesError.message);
            return false;
        }
        
        console.log(`✅ ${stagesData.length} etapas do funil inseridas/atualizadas!`);
        
        // 3. Verificar etapas inseridas
        console.log('🔍 Verificando etapas inseridas...');
        const { data: allStages, error: fetchError } = await supabase
            .from('funnel_stages')
            .select('*')
            .order('position', { ascending: true });
        
        if (fetchError) {
            console.error('❌ Erro ao buscar etapas:', fetchError.message);
            return false;
        }
        
        console.log('📋 Etapas do funil:');
        allStages.forEach(stage => {
            console.log(`   ${stage.position}. ${stage.name} (${stage.color}) - ID: ${stage.id}`);
        });
        
        console.log('\n🎉 Tabela funnel_stages configurada com sucesso!');
        console.log('✅ Agora o sistema pode mapear corretamente os stage_id');
        
        return true;
        
    } catch (err) {
        console.error('❌ Erro geral:', err.message);
        return false;
    }
}

// Executar
createFunnelStages().then(success => {
    if (success) {
        console.log('\n✅ Configuração concluída!');
        console.log('🚀 Agora teste criar um lead novamente');
    } else {
        console.log('\n❌ Configuração falhou');
    }
});
