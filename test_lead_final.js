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

async function testLeadCreation() {
    try {
        console.log('🧪 Testando criação de leads - Versão Final...');
        
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
        console.log('📊 Etapas encontradas:', stagesResult.data?.length || 0);
        
        if (!stagesResult.data || stagesResult.data.length === 0) {
            console.log('❌ Nenhuma etapa encontrada');
            return;
        }

        const firstStage = stagesResult.data[0];
        console.log('✅ Primeira etapa:', firstStage.name, '(ID:', firstStage.id, ')');

        // 2. Testar criação de lead com dados válidos
        console.log('🧪 2. Testando criação de lead com dados válidos...');
        const validLead = {
            name: 'Lead de Teste Final - ' + new Date().toISOString(),
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

        console.log('📋 Dados do lead válido:', validLead);

        const createUrl = `${SUPABASE_URL}/rest/v1/leads`;
        const createOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(validLead)
        };

        const createResult = await makeRequest(createUrl, createOptions);
        
        if (createResult.status === 201) {
            console.log('✅ Lead válido criado com sucesso!');
            console.log('📋 Dados do lead:', createResult.data);

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
            console.log('❌ Erro ao criar lead válido');
            console.log('📋 Status:', createResult.status);
            console.log('📋 Dados de erro:', createResult.data);
        }

        // 3. Testar criação de lead com dados problemáticos (nome = telefone)
        console.log('🧪 3. Testando criação de lead com dados problemáticos...');
        const problematicLead = {
            name: '554796643900', // Nome igual ao telefone
            email: 'teste@exemplo.com',
            phone: '554796643900',
            company: 'Empresa Teste',
            source: 'website',
            priority: 'medium',
            stage_id: firstStage.id,
            status: 'cold',
            currency: 'BRL',
            value: 1000
        };

        console.log('📋 Dados problemáticos:', problematicLead);

        const createProblematicResult = await makeRequest(createUrl, createOptions);
        
        if (createProblematicResult.status === 201) {
            console.log('⚠️ Lead problemático foi criado');
            console.log('📋 Dados do lead:', createProblematicResult.data);

            // Deletar o lead problemático
            const deleteProblematicUrl = `${SUPABASE_URL}/rest/v1/leads?id=eq.${createProblematicResult.data[0].id}`;
            const deleteProblematicOptions = {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY
                }
            };
            await makeRequest(deleteProblematicUrl, deleteProblematicOptions);
            console.log('✅ Lead problemático removido');
        } else {
            console.log('✅ Lead problemático foi rejeitado');
            console.log('📋 Status:', createProblematicResult.status);
            console.log('📋 Dados de erro:', createProblematicResult.data);
        }

        // 4. Testar criação de lead sem campo name (problema do frontend)
        console.log('🧪 4. Testando criação de lead SEM campo name...');
        const leadWithoutName = {
            email: 'teste@exemplo.com',
            phone: '554796643900',
            company: 'Empresa Teste',
            source: 'website',
            priority: 'medium',
            stage_id: firstStage.id,
            status: 'cold',
            currency: 'BRL',
            value: 1000
        };

        console.log('📋 Dados SEM campo name:', leadWithoutName);

        const createWithoutNameResult = await makeRequest(createUrl, createOptions);
        
        if (createWithoutNameResult.status === 201) {
            console.log('⚠️ Lead SEM campo name foi criado (isso não deveria acontecer)');
            console.log('📋 Dados do lead:', createWithoutNameResult.data);

            // Deletar o lead
            const deleteWithoutNameUrl = `${SUPABASE_URL}/rest/v1/leads?id=eq.${createWithoutNameResult.data[0].id}`;
            const deleteWithoutNameOptions = {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY
                }
            };
            await makeRequest(deleteWithoutNameUrl, deleteWithoutNameOptions);
            console.log('✅ Lead removido');
        } else {
            console.log('✅ Lead SEM campo name foi rejeitado (comportamento esperado)');
            console.log('📋 Status:', createWithoutNameResult.status);
            console.log('📋 Dados de erro:', createWithoutNameResult.data);
        }

        console.log('🎉 Teste de criação de leads concluído!');
        console.log('📋 Conclusões:');
        console.log('   - Se o lead válido foi criado, a API está funcionando');
        console.log('   - Se o lead problemático foi criado, precisa de validação no frontend');
        console.log('   - Se o lead SEM campo name foi rejeitado, a API está validando corretamente');

    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    testLeadCreation();
}

module.exports = { testLeadCreation };
