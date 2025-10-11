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

async function checkUserExists() {
    try {
        console.log('🔍 Verificando se o usuário responsible_id existe...');
        
        const responsibleId = 'f3460df1-72fd-47bc-a681-17c7be50bae2';
        console.log('🔍 responsible_id:', responsibleId);
        
        // 1. Verificar se existe na tabela users
        console.log('📊 1. Verificando na tabela users...');
        const usersUrl = `${SUPABASE_URL}/rest/v1/users?id=eq.${responsibleId}&select=id,name,email`;
        const usersOptions = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        };
        
        const usersResult = await makeRequest(usersUrl, usersOptions);
        console.log('📊 Status users:', usersResult.status);
        console.log('📊 Dados users:', usersResult.data);
        
        if (usersResult.data && usersResult.data.length > 0) {
            console.log('✅ Usuário encontrado na tabela users:', usersResult.data[0]);
        } else {
            console.log('❌ Usuário NÃO encontrado na tabela users');
        }
        
        // 2. Verificar se existe na tabela suppliers
        console.log('📊 2. Verificando na tabela suppliers...');
        const suppliersUrl = `${SUPABASE_URL}/rest/v1/suppliers?id=eq.${responsibleId}&select=id,name,email`;
        const suppliersOptions = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        };
        
        const suppliersResult = await makeRequest(suppliersUrl, suppliersOptions);
        console.log('📊 Status suppliers:', suppliersResult.status);
        console.log('📊 Dados suppliers:', suppliersResult.data);
        
        if (suppliersResult.data && suppliersResult.data.length > 0) {
            console.log('✅ Usuário encontrado na tabela suppliers:', suppliersResult.data[0]);
        } else {
            console.log('❌ Usuário NÃO encontrado na tabela suppliers');
        }
        
        // 3. Verificar todas as tabelas que podem ter esse ID
        console.log('📊 3. Verificando em outras tabelas...');
        
        const tables = ['contacts', 'companies', 'products'];
        for (const table of tables) {
            try {
                const tableUrl = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${responsibleId}&select=id,name`;
                const tableOptions = {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'apikey': SUPABASE_ANON_KEY
                    }
                };
                
                const tableResult = await makeRequest(tableUrl, tableOptions);
                if (tableResult.data && tableResult.data.length > 0) {
                    console.log(`✅ Encontrado na tabela ${table}:`, tableResult.data[0]);
                } else {
                    console.log(`❌ NÃO encontrado na tabela ${table}`);
                }
            } catch (err) {
                console.log(`⚠️ Erro ao verificar tabela ${table}:`, err.message);
            }
        }
        
        // 4. Verificar estrutura da tabela leads
        console.log('📊 4. Verificando estrutura da tabela leads...');
        const leadsUrl = `${SUPABASE_URL}/rest/v1/leads?select=*&limit=1`;
        const leadsOptions = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        };
        
        const leadsResult = await makeRequest(leadsUrl, leadsOptions);
        console.log('📊 Status leads:', leadsResult.status);
        if (leadsResult.data && leadsResult.data.length > 0) {
            console.log('📊 Estrutura da tabela leads:', Object.keys(leadsResult.data[0]));
        }
        
        console.log('🎉 Verificação concluída!');
        console.log('📋 Resumo:');
        console.log('   - responsible_id:', responsibleId);
        console.log('   - Existe na tabela users?', usersResult.data && usersResult.data.length > 0 ? 'SIM' : 'NÃO');
        console.log('   - Existe na tabela suppliers?', suppliersResult.data && suppliersResult.data.length > 0 ? 'SIM' : 'NÃO');
        
        if (!usersResult.data || usersResult.data.length === 0) {
            console.log('🔧 SOLUÇÃO: O responsible_id deve ser NULL ou um ID válido da tabela users');
        }

    } catch (error) {
        console.error('❌ Erro na verificação:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    checkUserExists();
}

module.exports = { checkUserExists };

