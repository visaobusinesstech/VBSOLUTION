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

async function fixLeadsDatabase() {
    try {
        console.log('🔧 Iniciando correção do banco de dados...');
        
        // 1. Verificar se a tabela leads tem a coluna stage_id
        console.log('🔍 1. Verificando estrutura da tabela leads...');
        const leadsUrl = `${SUPABASE_URL}/rest/v1/leads?select=*&limit=1`;
        const leadsOptions = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        };
        
        const leadsResult = await makeRequest(leadsUrl, leadsOptions);
        console.log('📊 Estrutura da tabela leads:', leadsResult);

        // 2. Verificar funnel_stages
        console.log('🔍 2. Verificando tabela funnel_stages...');
        const stagesUrl = `${SUPABASE_URL}/rest/v1/funnel_stages?select=*&order=order_index.asc`;
        const stagesResult = await makeRequest(stagesUrl, leadsOptions);
        console.log('📊 Etapas do funil encontradas:', stagesResult.data?.length || 0);

        if (stagesResult.data && stagesResult.data.length > 0) {
            const firstStage = stagesResult.data[0];
            console.log('✅ Primeira etapa encontrada:', firstStage.name, '(ID:', firstStage.id, ')');

            // 3. Tentar criar um lead de teste para verificar se a foreign key funciona
            console.log('🧪 3. Testando criação de lead...');
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

                // 4. Deletar o lead de teste
                console.log('🗑️ 4. Removendo lead de teste...');
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

                console.log('🎉 Banco de dados está funcionando corretamente!');
                console.log('📋 Próximos passos:');
                console.log('   1. Reinicie o servidor de desenvolvimento');
                console.log('   2. Teste a criação de leads no frontend');
                console.log('   3. Verifique se os erros foram resolvidos');

            } else {
                console.log('❌ Erro ao criar lead de teste:', createResult);
                console.log('💡 Possíveis soluções:');
                console.log('   1. Verifique se a foreign key está configurada corretamente');
                console.log('   2. Execute a migração manualmente no Supabase SQL Editor');
                console.log('   3. Verifique as permissões RLS da tabela leads');
            }
        } else {
            console.log('❌ Nenhuma etapa do funil encontrada');
            console.log('💡 Execute primeiro o script de configuração das etapas');
        }

    } catch (error) {
        console.error('❌ Erro ao corrigir banco de dados:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    fixLeadsDatabase();
}

module.exports = { fixLeadsDatabase };

