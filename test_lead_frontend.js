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
        console.log('🧪 Testando criação de lead com dados exatos do frontend...');
        
        // 1. Verificar etapas disponíveis
        console.log('📊 1. Verificando etapas disponíveis...');
        const stagesUrl = `${SUPABASE_URL}/rest/v1/funnel_stages?select=id,name,order_position&order=order_position.asc`;
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

        // 2. Testar criação de lead com dados exatos do console (sem campo name)
        console.log('🧪 2. Testando criação de lead SEM campo name...');
        const leadWithoutName = {
            notes: null,
            phone: "554796643900",
            position: null,
            priority: "medium",
            product_id: "d5831df4-fe65-4c43-8e48-d311ff6c1592",
            product_price: 21,
            product_quantity: 1,
            responsible_id: null,
            source: "website",
            stage_id: firstStage.id, // Usar ID real da etapa
            status: "cold",
            value: 21,
            currency: "BRL",
            email: "contato@empresa.c"
        };

        console.log('📋 Dados SEM campo name:', leadWithoutName);

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
        
        if (createResult1.status === 201) {
            console.log('⚠️ Lead SEM campo name foi criado (isso não deveria acontecer)');
            console.log('📋 Dados do lead:', createResult1.data);

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
            console.log('📋 Status:', createResult1.status);
            console.log('📋 Dados de erro:', createResult1.data);
        }

        // 3. Testar criação de lead COM campo name
        console.log('🧪 3. Testando criação de lead COM campo name...');
        const leadWithName = {
            name: "Lead de Teste Frontend",
            notes: null,
            phone: "554796643900",
            position: null,
            priority: "medium",
            product_id: "d5831df4-fe65-4c43-8e48-d311ff6c1592",
            product_price: 21,
            product_quantity: 1,
            responsible_id: null,
            source: "website",
            stage_id: firstStage.id,
            status: "cold",
            value: 21,
            currency: "BRL",
            email: "contato@empresa.c"
        };

        console.log('📋 Dados COM campo name:', leadWithName);

        const createResult2 = await makeRequest(createUrl, createOptions);
        
        if (createResult2.status === 201) {
            console.log('✅ Lead COM campo name foi criado com sucesso!');
            console.log('📋 Dados do lead:', createResult2.data);

            // Deletar o lead
            await makeRequest(deleteUrl, deleteOptions);
            console.log('✅ Lead removido');
        } else {
            console.log('❌ Erro ao criar lead COM campo name');
            console.log('📋 Status:', createResult2.status);
            console.log('📋 Dados de erro:', createResult2.data);
        }

        // 4. Testar criação de lead com nome igual ao telefone (problema identificado)
        console.log('🧪 4. Testando criação de lead com nome igual ao telefone...');
        const leadWithPhoneAsName = {
            name: "554796643900", // Nome igual ao telefone
            notes: null,
            phone: "554796643900",
            position: null,
            priority: "medium",
            product_id: "d5831df4-fe65-4c43-8e48-d311ff6c1592",
            product_price: 21,
            product_quantity: 1,
            responsible_id: null,
            source: "website",
            stage_id: firstStage.id,
            status: "cold",
            value: 21,
            currency: "BRL",
            email: "contato@empresa.c"
        };

        console.log('📋 Dados com nome igual ao telefone:', leadWithPhoneAsName);

        const createResult3 = await makeRequest(createUrl, createOptions);
        
        if (createResult3.status === 201) {
            console.log('⚠️ Lead com nome igual ao telefone foi criado');
            console.log('📋 Dados do lead:', createResult3.data);

            // Deletar o lead
            await makeRequest(deleteUrl, deleteOptions);
            console.log('✅ Lead removido');
        } else {
            console.log('✅ Lead com nome igual ao telefone foi rejeitado');
            console.log('📋 Status:', createResult3.status);
            console.log('📋 Dados de erro:', createResult3.data);
        }

        console.log('🎉 Teste de criação de leads concluído!');
        console.log('📋 Conclusões:');
        console.log('   - Se o lead SEM campo name foi criado, o problema está no frontend');
        console.log('   - Se o lead COM campo name foi criado, a API está funcionando');
        console.log('   - Se o lead com nome igual ao telefone foi criado, precisa de validação');

    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    testLeadCreation();
}

module.exports = { testLeadCreation };

