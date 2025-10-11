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
                    resolve({ data: result, status: res.statusCode, headers: res.headers });
                } catch (e) {
                    resolve({ data, status: res.statusCode, headers: res.headers });
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

async function debugLeadCreation() {
    try {
        console.log('🔍 Debugando criação de leads...');
        
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

        // 2. Testar criação de lead com dados exatos do console (sem campo name)
        console.log('🧪 2. Testando criação de lead SEM campo name (como no console)...');
        const leadWithoutName = {
            notes: null,
            phone: "120363419668499111@g.us", // Formato exato do console
            position: null,
            priority: "medium",
            product_id: "d5831df4-fe65-4c43-8e48-d311ff6c1592",
            product_price: 21,
            product_quantity: 1,
            responsible_id: null,
            source: "website",
            stage_id: "1", // ID como string, como no console
            status: "cold",
            value: 21,
            currency: "BRL",
            email: "contato@empresa.c"
        };

        console.log('📋 Dados SEM campo name (exatos do console):', leadWithoutName);

        const createUrl = `${SUPABASE_URL}/rest/v1/leads`;
        const createOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(leadWithoutName)
        };

        const createResult1 = await makeRequest(createUrl, createOptions);
        
        console.log('📋 Status da criação SEM campo name:', createResult1.status);
        console.log('📋 Headers da resposta:', createResult1.headers);
        console.log('📋 Dados da resposta:', createResult1.data);

        if (createResult1.status === 201) {
            console.log('⚠️ Lead SEM campo name foi criado (isso não deveria acontecer)');
            
            // Deletar o lead
            const deleteUrl = `${SUPABASE_URL}/rest/v1/leads?id=eq.${createResult1.data[0].id}`;
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
            console.log('✅ Lead SEM campo name foi rejeitado (comportamento esperado)');
        }

        // 3. Testar criação de lead com stage_id correto
        console.log('🧪 3. Testando criação de lead com stage_id correto...');
        const leadWithCorrectStage = {
            name: 'Lead de Teste Debug',
            notes: null,
            phone: "11999999999", // Telefone limpo
            position: null,
            priority: "medium",
            product_id: "d5831df4-fe65-4c43-8e48-d311ff6c1592",
            product_price: 21,
            product_quantity: 1,
            responsible_id: null,
            source: "website",
            stage_id: firstStage.id, // ID correto da etapa
            status: "cold",
            value: 21,
            currency: "BRL",
            email: "contato@empresa.c"
        };

        console.log('📋 Dados com stage_id correto:', leadWithCorrectStage);

        const createResult2 = await makeRequest(createUrl, createOptions);
        
        console.log('📋 Status da criação com stage_id correto:', createResult2.status);
        console.log('📋 Dados da resposta:', createResult2.data);

        if (createResult2.status === 201) {
            console.log('✅ Lead com stage_id correto foi criado com sucesso!');
            
            // Deletar o lead
            const deleteUrl = `${SUPABASE_URL}/rest/v1/leads?id=eq.${createResult2.data[0].id}`;
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
            console.log('❌ Erro ao criar lead com stage_id correto');
        }

        // 4. Testar criação de lead com stage_id como string "1"
        console.log('🧪 4. Testando criação de lead com stage_id como string "1"...');
        const leadWithStringStage = {
            name: 'Lead de Teste String Stage',
            notes: null,
            phone: "11999999999",
            position: null,
            priority: "medium",
            product_id: "d5831df4-fe65-4c43-8e48-d311ff6c1592",
            product_price: 21,
            product_quantity: 1,
            responsible_id: null,
            source: "website",
            stage_id: "1", // String "1" como no console
            status: "cold",
            value: 21,
            currency: "BRL",
            email: "contato@empresa.c"
        };

        console.log('📋 Dados com stage_id string "1":', leadWithStringStage);

        const createResult3 = await makeRequest(createUrl, createOptions);
        
        console.log('📋 Status da criação com stage_id string "1":', createResult3.status);
        console.log('📋 Dados da resposta:', createResult3.data);

        if (createResult3.status === 201) {
            console.log('✅ Lead com stage_id string "1" foi criado com sucesso!');
            
            // Deletar o lead
            const deleteUrl = `${SUPABASE_URL}/rest/v1/leads?id=eq.${createResult3.data[0].id}`;
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
            console.log('❌ Erro ao criar lead com stage_id string "1"');
        }

        console.log('🎉 Debug de criação de leads concluído!');
        console.log('📋 Conclusões:');
        console.log('   - Se o lead SEM campo name foi rejeitado, a API está validando');
        console.log('   - Se o lead com stage_id correto foi criado, a API está funcionando');
        console.log('   - Se o lead com stage_id string "1" foi criado, o problema está no frontend');

    } catch (error) {
        console.error('❌ Erro no debug:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    debugLeadCreation();
}

module.exports = { debugLeadCreation };

