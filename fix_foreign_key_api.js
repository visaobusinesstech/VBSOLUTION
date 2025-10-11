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

async function fixForeignKey() {
    try {
        console.log('🔧 Iniciando correção da foreign key...');
        
        // 1. Verificar leads existentes
        console.log('📊 1. Verificando leads existentes...');
        const leadsUrl = `${SUPABASE_URL}/rest/v1/leads?select=id,stage_id&limit=10`;
        const leadsOptions = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        };
        
        const leadsResult = await makeRequest(leadsUrl, leadsOptions);
        console.log('📊 Leads encontrados:', leadsResult.data?.length || 0);

        // 2. Verificar funnel_stages existentes
        console.log('📊 2. Verificando etapas do funil...');
        const stagesUrl = `${SUPABASE_URL}/rest/v1/funnel_stages?select=id,name&order=order_index.asc`;
        const stagesResult = await makeRequest(stagesUrl, leadsOptions);
        console.log('📊 Etapas encontradas:', stagesResult.data?.length || 0);

        if (stagesResult.data && stagesResult.data.length > 0) {
            const firstStage = stagesResult.data[0];
            console.log('✅ Primeira etapa disponível:', firstStage.name, '(ID:', firstStage.id, ')');

            // 3. Atualizar leads sem stage_id ou com stage_id inválido
            console.log('🔄 3. Atualizando leads com stage_id inválido...');
            
            // Primeiro, atualizar leads com stage_id inválido para NULL
            const updateInvalidUrl = `${SUPABASE_URL}/rest/v1/leads?stage_id=not.in.(${stagesResult.data.map(s => s.id).join(',')})`;
            const updateInvalidOptions = {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY
                },
                body: JSON.stringify({ stage_id: null })
            };

            const updateInvalidResult = await makeRequest(updateInvalidUrl, updateInvalidOptions);
            console.log('🔄 Leads com stage_id inválido atualizados:', updateInvalidResult.status);

            // Depois, atualizar leads sem stage_id para a primeira etapa
            const updateNullUrl = `${SUPABASE_URL}/rest/v1/leads?stage_id=is.null`;
            const updateNullOptions = {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY
                },
                body: JSON.stringify({ stage_id: firstStage.id })
            };

            const updateNullResult = await makeRequest(updateNullUrl, updateNullOptions);
            console.log('🔄 Leads sem stage_id atualizados:', updateNullResult.status);

            // 4. Testar criação de lead
            console.log('🧪 4. Testando criação de lead...');
            const testLead = {
                name: 'Lead de Teste - ' + new Date().toISOString(),
                email: 'teste@exemplo.com',
                phone: '11999999999',
                stage_id: firstStage.id,
                status: 'cold',
                priority: 'medium'
            };

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
                console.log('✅ Lead de teste criado com sucesso!');
                console.log('📋 Dados do lead:', createResult.data);

                // 5. Deletar o lead de teste
                console.log('🗑️ 5. Removendo lead de teste...');
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

                console.log('🎉 Correção da foreign key concluída com sucesso!');
                console.log('📋 Próximos passos:');
                console.log('   1. Teste a criação de leads no frontend');
                console.log('   2. Verifique se a etapa é selecionada corretamente');
                console.log('   3. Os erros de foreign key devem estar resolvidos');

            } else {
                console.log('❌ Erro ao criar lead de teste:', createResult);
                console.log('💡 Execute o script SQL manualmente no Supabase Dashboard');
            }
        } else {
            console.log('❌ Nenhuma etapa do funil encontrada');
            console.log('💡 Execute primeiro o script de configuração das etapas');
        }

    } catch (error) {
        console.error('❌ Erro ao corrigir foreign key:', error);
        console.log('💡 Soluções alternativas:');
        console.log('   1. Execute o script SQL manualmente no Supabase Dashboard');
        console.log('   2. Verifique as credenciais do Supabase');
        console.log('   3. Confirme se o banco está acessível');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    fixForeignKey();
}

module.exports = { fixForeignKey };

