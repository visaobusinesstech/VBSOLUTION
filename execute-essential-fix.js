// Script para executar comandos essenciais via API do Supabase
const { createClient } = require('@supabase/supabase-js');

console.log('🚀 Executando correções essenciais via API do Supabase...');

const SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function executeEssentialFix() {
    try {
        console.log('📡 Conectando ao Supabase...');
        
        // 1. Limpar dados existentes
        console.log('🧹 Limpando dados existentes...');
        await supabase.from('tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('atendimentos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // 2. Inserir leads de teste
        console.log('📝 Inserindo leads de teste...');
        const { data: leadsData, error: leadsError } = await supabase
            .from('leads')
            .insert([
                {
                    name: 'João Silva',
                    email: 'joao@email.com',
                    phone: '(11) 99999-9999',
                    company: 'Empresa ABC',
                    source: 'website',
                    status: 'new',
                    priority: 'high',
                    value: 5000.00,
                    currency: 'BRL',
                    notes: 'Lead de teste'
                },
                {
                    name: 'Maria Santos',
                    email: 'maria@email.com',
                    phone: '(11) 88888-8888',
                    company: 'Empresa XYZ',
                    source: 'referral',
                    status: 'contacted',
                    priority: 'medium',
                    value: 3000.00,
                    currency: 'BRL',
                    notes: 'Lead em contato inicial'
                },
                {
                    name: 'Pedro Costa',
                    email: 'pedro@email.com',
                    phone: '(11) 77777-7777',
                    company: 'Empresa DEF',
                    source: 'social_media',
                    status: 'qualified',
                    priority: 'high',
                    value: 7500.00,
                    currency: 'BRL',
                    notes: 'Lead qualificado'
                },
                {
                    name: 'Ana Oliveira',
                    email: 'ana@email.com',
                    phone: '(11) 66666-6666',
                    company: 'Empresa GHI',
                    source: 'website',
                    status: 'new',
                    priority: 'low',
                    value: 2000.00,
                    currency: 'BRL',
                    notes: 'Lead de baixa prioridade'
                },
                {
                    name: 'Carlos Pereira',
                    email: 'carlos@email.com',
                    phone: '(11) 55555-5555',
                    company: 'Empresa JKL',
                    source: 'referral',
                    status: 'won',
                    priority: 'high',
                    value: 10000.00,
                    currency: 'BRL',
                    notes: 'Lead convertido'
                }
            ])
            .select();
        
        if (leadsError) {
            console.error('❌ Erro ao inserir leads:', leadsError.message);
            return false;
        }
        
        console.log(`✅ ${leadsData.length} leads inseridos com sucesso!`);
        
        // 3. Verificar leads inseridos
        console.log('🔍 Verificando leads inseridos...');
        const { data: allLeads, error: fetchError } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (fetchError) {
            console.error('❌ Erro ao buscar leads:', fetchError.message);
            return false;
        }
        
        console.log(`✅ Total de leads encontrados: ${allLeads.length}`);
        console.log('📋 Leads inseridos:');
        allLeads.forEach(lead => {
            console.log(`  - ${lead.name} (${lead.email}) - ${lead.status} - R$ ${lead.value}`);
        });
        
        // 4. Testar inserção de novo lead
        console.log('🧪 Testando inserção de novo lead...');
        const { data: testLead, error: testError } = await supabase
            .from('leads')
            .insert([{
                name: 'Teste Final',
                email: 'teste@final.com',
                phone: '(11) 99999-9999',
                company: 'Empresa Teste Final',
                source: 'test',
                status: 'new',
                priority: 'medium',
                value: 1000,
                currency: 'BRL',
                notes: 'Lead de teste final'
            }])
            .select();
        
        if (testError) {
            console.error('❌ Erro ao inserir lead de teste:', testError.message);
            return false;
        }
        
        console.log('✅ Lead de teste inserido com sucesso! ID:', testLead[0].id);
        
        console.log('\n🎉 Correções essenciais executadas com sucesso!');
        console.log('✅ O banco de dados está funcionando perfeitamente');
        console.log('✅ Leads inseridos e testados');
        console.log('🚀 Agora você pode testar o frontend!');
        
        return true;
        
    } catch (err) {
        console.error('❌ Erro geral:', err.message);
        return false;
    }
}

// Executar o script
executeEssentialFix().then(success => {
    if (success) {
        console.log('\n✅ Execução concluída com sucesso!');
        console.log('🎯 Próximo passo: Teste o frontend em http://localhost:5174/leads-sales');
    } else {
        console.log('\n❌ Execução falhou');
    }
});
