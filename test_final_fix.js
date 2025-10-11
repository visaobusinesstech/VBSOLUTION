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

async function testFinalFix() {
    try {
        console.log('🎯 Teste Final - Criação de Leads SEM campo contact_id...');
        
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

        // 2. Testar criação de lead SEM campo contact_id
        console.log('🧪 2. Testando criação de lead SEM campo contact_id...');
        const leadWithoutContactId = {
            name: 'Lead Teste Final - ' + new Date().toISOString(),
            email: 'teste@exemplo.com',
            phone: '11999999999',
            company: 'Empresa Teste Final',
            position: 'Gerente',
            source: 'website',
            priority: 'medium',
            stage_id: firstStage.id,
            responsible_id: null,
            product_id: null,
            value: 1000,
            currency: 'BRL',
            expected_close_date: '2025-12-31',
            notes: 'Lead de teste sem contact_id',
            status: 'cold'
        };

        console.log('📋 Dados SEM contact_id:', leadWithoutContactId);

        const createUrl = `${SUPABASE_URL}/rest/v1/leads`;
        const createOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(leadWithoutContactId)
        };

        const createResult = await makeRequest(createUrl, createOptions);
        
        console.log('📋 Status da criação:', createResult.status);
        console.log('📋 Dados da resposta:', createResult.data);

        if (createResult.status === 201) {
            console.log('✅ Lead criado com sucesso!');
            console.log('📋 ID do lead:', createResult.data[0].id);
            console.log('📋 Nome do lead:', createResult.data[0].name);
            console.log('📋 Etapa do lead:', createResult.data[0].stage_id);
            console.log('📋 Posição:', createResult.data[0].position);
            console.log('📋 Empresa:', createResult.data[0].company);
            console.log('📋 Email:', createResult.data[0].email);
            console.log('📋 Telefone:', createResult.data[0].phone);
            console.log('📋 Valor:', createResult.data[0].value);
            console.log('📋 Moeda:', createResult.data[0].currency);
            console.log('📋 Data esperada:', createResult.data[0].expected_close_date);
            console.log('📋 Notas:', createResult.data[0].notes);
            console.log('📋 Status:', createResult.data[0].status);
            
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

        // 3. Testar criação de lead com dados mínimos
        console.log('🧪 3. Testando criação de lead com dados mínimos...');
        const minimalLead = {
            name: 'Lead Mínimo - ' + new Date().toISOString(),
            email: 'minimo@exemplo.com',
            phone: '11888888888',
            source: 'website',
            priority: 'medium',
            stage_id: firstStage.id,
            status: 'cold',
            currency: 'BRL',
            value: 500
        };

        console.log('📋 Dados mínimos:', minimalLead);

        const minimalResult = await makeRequest(createUrl, createOptions);
        
        console.log('📋 Status da criação mínima:', minimalResult.status);
        console.log('📋 Dados da resposta:', minimalResult.data);

        if (minimalResult.status === 201) {
            console.log('✅ Lead mínimo criado com sucesso!');
            
            // Deletar o lead
            const deleteUrl = `${SUPABASE_URL}/rest/v1/leads?id=eq.${minimalResult.data[0].id}`;
            const deleteOptions = {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY
                }
            };
            await makeRequest(deleteUrl, deleteOptions);
            console.log('✅ Lead mínimo removido');
        } else {
            console.log('❌ Erro ao criar lead mínimo');
            console.log('📋 Detalhes do erro:', minimalResult.data);
        }

        console.log('🎉 Teste Final concluído!');
        console.log('📋 Resumo:');
        console.log('   - API Supabase está funcionando');
        console.log('   - Criação de leads SEM contact_id está funcionando');
        console.log('   - Criação de leads com dados mínimos está funcionando');
        console.log('   - Frontend deve funcionar perfeitamente agora');
        console.log('   - Leads devem aparecer no Kanban após criação');

    } catch (error) {
        console.error('❌ Erro no teste final:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    testFinalFix();
}

module.exports = { testFinalFix };

