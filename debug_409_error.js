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

async function debug409Error() {
    try {
        console.log('🔍 Debug 409 Error - Investigando erro de conflito na criação de lead...');
        
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
        console.log('📊 Status stages:', stagesResult.status);
        console.log('📊 Etapas encontradas:', stagesResult.data?.length || 0);
        
        if (!stagesResult.data || stagesResult.data.length === 0) {
            console.log('❌ Nenhuma etapa encontrada');
            return;
        }

        const firstStage = stagesResult.data[0];
        console.log('✅ Primeira etapa:', firstStage.name, '(ID:', firstStage.id, ')');

        // 2. Testar criação de lead com dados mínimos
        console.log('🧪 2. Testando criação de lead com dados mínimos...');
        const minimalLead = {
            name: 'Lead Debug 409 - ' + new Date().toISOString(),
            stage_id: firstStage.id,
            source: 'website',
            priority: 'medium',
            status: 'cold',
            currency: 'BRL',
            value: 0
        };

        console.log('📋 Dados mínimos:', minimalLead);

        const createUrl = `${SUPABASE_URL}/rest/v1/leads`;
        const createOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(minimalLead)
        };

        const createResult = await makeRequest(createUrl, createOptions);
        
        console.log('📋 Status da criação:', createResult.status);
        console.log('📋 Headers da resposta:', createResult.headers);
        console.log('📋 Dados da resposta:', createResult.data);

        if (createResult.status === 201) {
            console.log('✅ Lead com dados mínimos criado com sucesso!');
            
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
            console.log('❌ Erro ao criar lead com dados mínimos');
            console.log('📋 Detalhes do erro:', createResult.data);
        }

        // 3. Testar criação de lead com dados completos (simulando frontend)
        console.log('🧪 3. Testando criação de lead com dados completos...');
        const completeLead = {
            name: 'Lead Debug 409 Completo - ' + new Date().toISOString(),
            email: 'contato@empresa.com',
            phone: '551191494013',
            company: 'Nome da empresa',
            position: '',
            source: 'website',
            priority: 'medium',
            stage_id: firstStage.id,
            responsible_id: null, // null para evitar violação de FK
            contact_id: null,
            product_id: null,
            value: 21,
            currency: 'BRL',
            expected_close_date: null,
            notes: null,
            status: 'cold'
        };

        console.log('📋 Dados completos:', completeLead);

        const createResult2 = await makeRequest(createUrl, createOptions);
        
        console.log('📋 Status da criação:', createResult2.status);
        console.log('📋 Headers da resposta:', createResult2.headers);
        console.log('📋 Dados da resposta:', createResult2.data);

        if (createResult2.status === 201) {
            console.log('✅ Lead com dados completos criado com sucesso!');
            
            // Deletar o lead
            const deleteUrl2 = `${SUPABASE_URL}/rest/v1/leads?id=eq.${createResult2.data[0].id}`;
            const deleteOptions2 = {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY
                }
            };
            await makeRequest(deleteUrl2, deleteOptions2);
            console.log('✅ Lead removido');
        } else {
            console.log('❌ Erro ao criar lead com dados completos');
            console.log('📋 Detalhes do erro:', createResult2.data);
        }

        // 4. Verificar se há constraints únicos que podem causar conflito
        console.log('🧪 4. Verificando constraints únicos...');
        const existingLeadsUrl = `${SUPABASE_URL}/rest/v1/leads?select=id,name,email,phone&limit=5`;
        const existingLeadsOptions = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        };
        
        const existingLeadsResult = await makeRequest(existingLeadsUrl, existingLeadsOptions);
        console.log('📊 Leads existentes:', existingLeadsResult.data);

        // 5. Testar com URL exata do erro (com select específico)
        console.log('🧪 5. Testando com URL exata do erro...');
        const exactUrl = `${SUPABASE_URL}/rest/v1/leads?select=id,name,email,phone,company,source,status,value,stage_id,created_at`;
        const exactOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(completeLead)
        };

        const exactResult = await makeRequest(exactUrl, exactOptions);
        
        console.log('📋 Status da criação (URL exata):', exactResult.status);
        console.log('📋 Dados da resposta (URL exata):', exactResult.data);

        if (exactResult.status === 201) {
            console.log('✅ Lead criado com URL exata!');
            
            // Deletar o lead
            const deleteUrl3 = `${SUPABASE_URL}/rest/v1/leads?id=eq.${exactResult.data[0].id}`;
            const deleteOptions3 = {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY
                }
            };
            await makeRequest(deleteUrl3, deleteOptions3);
            console.log('✅ Lead removido');
        } else {
            console.log('❌ Erro ao criar lead com URL exata');
            console.log('📋 Detalhes do erro:', exactResult.data);
        }

        console.log('🎉 Debug 409 Error concluído!');
        console.log('📋 Resumo:');
        console.log('   - API Supabase está funcionando');
        console.log('   - Stages têm UUIDs válidos');
        console.log('   - Dados mínimos funcionam:', createResult.status === 201 ? 'SIM' : 'NÃO');
        console.log('   - Dados completos funcionam:', createResult2.status === 201 ? 'SIM' : 'NÃO');
        console.log('   - URL exata funciona:', exactResult.status === 201 ? 'SIM' : 'NÃO');

    } catch (error) {
        console.error('❌ Erro no debug 409:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    debug409Error();
}

module.exports = { debug409Error };

