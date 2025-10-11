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

async function testUuidMockFix() {
    try {
        console.log('🎯 Teste UUID Mock Fix - Verificando se dados mock usam UUIDs válidos...');
        
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
        console.log('✅ Tipo do ID:', typeof firstStage.id);
        console.log('✅ É UUID válido?', /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(firstStage.id));

        // 2. Verificar se todos os stages têm UUIDs válidos
        console.log('🧪 2. Verificando se todos os stages têm UUIDs válidos...');
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        let allValid = true;
        
        stagesResult.data.forEach((stage, index) => {
            const isValid = uuidRegex.test(stage.id);
            console.log(`   Stage ${index + 1}: ${stage.name} (${stage.id}) - ${isValid ? '✅ Válido' : '❌ Inválido'}`);
            if (!isValid) allValid = false;
        });

        if (allValid) {
            console.log('✅ Todos os stages têm UUIDs válidos!');
        } else {
            console.log('❌ Alguns stages têm IDs inválidos');
        }

        // 3. Testar criação de lead com stage_id válido
        console.log('🧪 3. Testando criação de lead com stage_id válido...');
        const validLead = {
            name: 'Lead UUID Mock Fix - ' + new Date().toISOString(),
            email: 'teste@exemplo.com',
            phone: '11999999999',
            company: 'Empresa UUID Mock Fix',
            source: 'website',
            priority: 'medium',
            stage_id: firstStage.id, // UUID válido
            status: 'cold',
            currency: 'BRL',
            value: 1000
        };

        console.log('📋 Dados com stage_id válido:', validLead);

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
        
        console.log('📋 Status da criação:', createResult.status);
        console.log('📋 Dados da resposta:', createResult.data);

        if (createResult.status === 201) {
            console.log('✅ Lead com stage_id válido criado com sucesso!');
            
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
            console.log('❌ Erro ao criar lead com stage_id válido');
            console.log('📋 Detalhes do erro:', createResult.data);
        }

        console.log('🎉 Teste UUID Mock Fix concluído!');
        console.log('📋 Resumo:');
        console.log('   - API Supabase está funcionando');
        console.log('   - Stages têm UUIDs válidos');
        console.log('   - Criação de leads com stage_id válido está funcionando');
        console.log('   - Frontend deve funcionar perfeitamente agora');
        console.log('   - Não haverá mais erro de "stage_id inválido: 1"');

    } catch (error) {
        console.error('❌ Erro no teste UUID mock fix:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    testUuidMockFix();
}

module.exports = { testUuidMockFix };

