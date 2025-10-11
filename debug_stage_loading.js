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

async function debugStageLoading() {
    try {
        console.log('🔍 Debug Stage Loading - Verificando carregamento de etapas...');
        
        // 1. Verificar se Supabase está respondendo
        console.log('📊 1. Testando conexão com Supabase...');
        const testUrl = `${SUPABASE_URL}/rest/v1/funnel_stages?select=count`;
        const testOptions = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        };
        
        const testResult = await makeRequest(testUrl, testOptions);
        console.log('📊 Status da conexão:', testResult.status);
        
        if (testResult.status !== 200) {
            console.log('❌ Supabase não está respondendo corretamente');
            return;
        }

        // 2. Verificar etapas disponíveis
        console.log('📊 2. Verificando etapas disponíveis...');
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
            console.log('❌ Nenhuma etapa encontrada no banco de dados');
            console.log('🔍 Isso significa que o frontend deve usar dados mock');
            return;
        }

        console.log('✅ Etapas encontradas no banco:');
        stagesResult.data.forEach((stage, index) => {
            console.log(`   ${index + 1}. ${stage.name} (ID: ${stage.id})`);
        });

        // 3. Verificar se há etapas com ID "1"
        console.log('📊 3. Verificando se há etapas com ID "1"...');
        const stageWithId1 = stagesResult.data.find(stage => stage.id === '1');
        if (stageWithId1) {
            console.log('❌ ENCONTRADO! Há uma etapa com ID "1":', stageWithId1);
            console.log('🔍 Esta é a causa do problema!');
        } else {
            console.log('✅ Nenhuma etapa com ID "1" encontrada');
        }

        // 4. Verificar se há etapas com IDs não-UUID
        console.log('📊 4. Verificando se há etapas com IDs não-UUID...');
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const nonUuidStages = stagesResult.data.filter(stage => !uuidRegex.test(stage.id));
        
        if (nonUuidStages.length > 0) {
            console.log('❌ ENCONTRADO! Etapas com IDs não-UUID:');
            nonUuidStages.forEach(stage => {
                console.log(`   - ${stage.name} (ID: ${stage.id})`);
            });
            console.log('🔍 Estas são a causa do problema!');
        } else {
            console.log('✅ Todas as etapas têm IDs UUID válidos');
        }

        // 5. Verificar se há etapas com order_index = 1
        console.log('📊 5. Verificando se há etapas com order_index = 1...');
        const stageWithOrder1 = stagesResult.data.find(stage => stage.order_index === 1);
        if (stageWithOrder1) {
            console.log('✅ Etapa com order_index = 1:', stageWithOrder1);
            console.log('🔍 Esta deve ser a primeira etapa carregada');
        }

        console.log('🎉 Debug Stage Loading concluído!');
        console.log('📋 Resumo:');
        console.log('   - Supabase está respondendo');
        console.log('   - Etapas encontradas:', stagesResult.data.length);
        console.log('   - Etapas com ID "1":', stageWithId1 ? 'SIM (PROBLEMA!)' : 'NÃO');
        console.log('   - Etapas com IDs não-UUID:', nonUuidStages.length);
        console.log('   - Primeira etapa (order_index=1):', stageWithOrder1?.name || 'N/A');

    } catch (error) {
        console.error('❌ Erro no debug stage loading:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    debugStageLoading();
}

module.exports = { debugStageLoading };

