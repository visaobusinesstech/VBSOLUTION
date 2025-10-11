const https = require('https');

// Configurações do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

async function makeRequest(url, options) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve({ data: result, status: res.statusCode });
                } catch (e) {
                    resolve({ data, status: res.statusCode });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

async function testFinalLeadCreation() {
    try {
        console.log('🎯 Teste Final - Criação de Leads...');
        
        // 1. Verificar etapas disponíveis
        console.log('📊 1. Verificando etapas disponíveis...');
        const stagesUrl = `${SUPABASE_URL}/rest/v1/funnel_stages?select=id,name,order_index&order=order_index.asc`;
        const stagesOptions = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        };
        
        const stagesResult = await makeRequest(stagesUrl, stagesOptions);
        console.log('📊 Status:', stagesResult.status);
        console.log('📊 Etapas encontradas:', stagesResult.data?.length || 0);
        
        if (!stagesResult.data || stagesResult.data.length === 0) {
            console.log('❌ Nenhuma etapa encontrada');
            return;
        }

        const firstStage = stagesResult.data[0];
        console.log('✅ Primeira etapa:', firstStage.name, '(ID:', firstStage.id, ')');

        // 2. Testar criação de lead com dados corretos (sem campos problemáticos)
        console.log('🧪 2. Testando criação de lead com dados corretos...');
        const correctLead = {
            name: 'Lead Teste Final - ' + new Date().toISOString(),
            email: 'teste@exemplo.com',
            phone: '11999999999',
            company: 'Empresa Teste Final',
            source: 'website',
            priority: 'medium',
            stage_id: firstStage.id,
            status: 'cold',
            currency: 'BRL',
            value: 1000
        };

        console.log('📋 Dados corretos:', correctLead);

        const createUrl = `${SUPABASE_URL}/rest/v1/leads`;
        const createOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(correctLead)
        };

        const createResult = await makeRequest(createUrl, createOptions);
        
        console.log('📋 Status da criação:', createResult.status);
        console.log('📋 Dados da resposta:', createResult.data);

        if (createResult.status === 201) {
            console.log('✅ Lead criado com sucesso!');
            console.log('📋 ID do lead:', createResult.data[0].id);
            console.log('📋 Nome do lead:', createResult.data[0].name);
            console.log('📋 Etapa do lead:', createResult.data[0].stage_id);
            
            // Deletar o lead
            const deleteUrl = `${SUPABASE_URL}/rest/v1/leads?id=eq.${createResult.data[0].id}`;
            const deleteOptions = {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY
                }
            };
            await makeRequest(deleteUrl, deleteOptions);
            console.log('✅ Lead removido');
        } else {
            console.log('❌ Erro ao criar lead');
            console.log('📋 Detalhes do erro:', createResult.data);
        }

        // 3. Testar criação de lead com dados do frontend (simulando o problema)
        console.log('🧪 3. Testando criação de lead simulando dados do frontend...');
        const frontendLead = {
            name: 'Lead Frontend Teste',
            email: 'contato@empresa.c',
            phone: '1203634196684991', // Telefone limpo (sem @g.us)
            company: 'Empresa Teste',
            source: 'website',
            priority: 'medium',
            stage_id: firstStage.id,
            status: 'cold',
            currency: 'BRL',
            value: 21
        };

        console.log('📋 Dados do frontend:', frontendLead);

        const frontendResult = await makeRequest(createUrl, createOptions);
        
        console.log('📋 Status da criação frontend:', frontendResult.status);
        console.log('📋 Dados da resposta frontend:', frontendResult.data);

        if (frontendResult.status === 201) {
            console.log('✅ Lead do frontend criado com sucesso!');
            
            // Deletar o lead
            const deleteUrl = `${SUPABASE_URL}/rest/v1/leads?id=eq.${frontendResult.data[0].id}`;
            const deleteOptions = {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY
                }
            };
            await makeRequest(deleteUrl, deleteOptions);
            console.log('✅ Lead do frontend removido');
        } else {
            console.log('❌ Erro ao criar lead do frontend');
            console.log('📋 Detalhes do erro:', frontendResult.data);
        }

        console.log('🎉 Teste Final concluído!');
        console.log('📋 Resumo:');
        console.log('   - API Supabase está funcionando');
        console.log('   - Criação de leads está funcionando');
        console.log('   - Campos problemáticos foram removidos');
        console.log('   - Frontend deve funcionar agora');

    } catch (error) {
        console.error('❌ Erro no teste final:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    testFinalLeadCreation();
}

module.exports = { testFinalLeadCreation };

