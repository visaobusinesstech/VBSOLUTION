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
        console.log('🧪 Testando criação de lead...');
        
        // 1. Verificar etapas disponíveis
        console.log('📊 1. Verificando etapas disponíveis...');
        const stagesUrl = `${SUPABASE_URL}/rest/v1/funnel_stages?select=id,name&order=order_index.asc`;
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
        const testLead = {
            name: 'Lead de Teste - ' + new Date().toISOString(),
            email: 'teste@exemplo.com',
            phone: '11999999999',
            company: 'Empresa Teste',
            source: 'website',
            priority: 'medium',
            stage_id: firstStage.id,
            status: 'cold',
            currency: 'BRL',
            value: 1000
        };

        console.log('📋 Dados do lead de teste:', testLead);

        const createUrl = `${SUPABASE_URL}/rest/v1/leads`;
        const createOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(testLead)
        };

        const createResult = await makeRequest(createUrl, createOptions);
        
        if (createResult.status === 201) {
            console.log('✅ Lead criado com sucesso!');
            console.log('📋 Dados do lead criado:', createResult.data);

            // 3. Deletar o lead de teste
            console.log('🗑️ 3. Removendo lead de teste...');
            const deleteUrl = `${SUPABASE_URL}/rest/v1/leads?id=eq.${createResult.data[0].id}`;
            const deleteOptions = {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY
                }
            };

            await makeRequest(deleteUrl, deleteOptions);
            console.log('✅ Lead de teste removido');

            console.log('🎉 Teste de criação de lead concluído com sucesso!');
            console.log('📋 O problema pode estar no frontend, não na API do Supabase');

        } else {
            console.log('❌ Erro ao criar lead de teste:', createResult);
            console.log('📋 Status:', createResult.status);
            console.log('📋 Dados de erro:', createResult.data);
        }

        // 4. Testar criação de lead com dados problemáticos (nome = telefone)
        console.log('🧪 4. Testando criação de lead com dados problemáticos...');
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
            console.log('⚠️ Lead problemático foi criado (isso não deveria acontecer)');
            console.log('📋 Dados do lead problemático:', createProblematicResult.data);

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
            console.log('✅ Lead problemático foi rejeitado (comportamento esperado)');
            console.log('📋 Status:', createProblematicResult.status);
            console.log('📋 Dados de erro:', createProblematicResult.data);
        }

    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    testLeadCreation();
}

module.exports = { testLeadCreation };
