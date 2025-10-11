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

async function checkLeadsSchema() {
    try {
        console.log('🔍 Verificando schema da tabela leads...');
        
        // 1. Verificar colunas da tabela leads
        console.log('📊 1. Verificando colunas da tabela leads...');
        const schemaUrl = `${SUPABASE_URL}/rest/v1/leads?select=*&limit=1`;
        const schemaOptions = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        };
        
        const schemaResult = await makeRequest(schemaUrl, schemaOptions);
        console.log('📊 Status:', schemaResult.status);
        
        if (schemaResult.status === 200 && schemaResult.data && schemaResult.data.length > 0) {
            const lead = schemaResult.data[0];
            console.log('📊 Colunas da tabela leads:');
            Object.keys(lead).forEach(key => {
                console.log(`   - ${key}: ${typeof lead[key]} (${lead[key]})`);
            });
        } else {
            console.log('📊 Nenhum lead encontrado para verificar schema');
        }

        // 2. Tentar criar lead com campos mínimos
        console.log('🧪 2. Testando criação de lead com campos mínimos...');
        const minimalLead = {
            name: 'Lead Teste Schema',
            email: 'teste@exemplo.com',
            phone: '11999999999',
            source: 'website',
            priority: 'medium',
            stage_id: '550e8400-e29b-41d4-a716-446655440001',
            status: 'cold',
            currency: 'BRL',
            value: 1000
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
        console.log('📋 Dados da resposta:', createResult.data);

        if (createResult.status === 201) {
            console.log('✅ Lead criado com sucesso!');
            
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
        }

        // 3. Tentar criar lead com campos problemáticos
        console.log('🧪 3. Testando criação de lead com campos problemáticos...');
        const problematicLead = {
            name: 'Lead Teste Problemático',
            email: 'teste@exemplo.com',
            phone: '11999999999',
            source: 'website',
            priority: 'medium',
            stage_id: '550e8400-e29b-41d4-a716-446655440001',
            status: 'cold',
            currency: 'BRL',
            value: 1000,
            product_price: 100, // Campo que não existe
            product_quantity: 1, // Campo que não existe
            product_id: 'd5831df4-fe65-4c43-8e48-d311ff6c1592' // Campo que não existe
        };

        console.log('📋 Dados problemáticos:', problematicLead);

        const createProblematicResult = await makeRequest(createUrl, createOptions);
        
        console.log('📋 Status da criação problemática:', createProblematicResult.status);
        console.log('📋 Dados da resposta:', createProblematicResult.data);

        if (createProblematicResult.status === 201) {
            console.log('⚠️ Lead problemático foi criado');
            
            // Deletar o lead
            const deleteUrl = `${SUPABASE_URL}/rest/v1/leads?id=eq.${createProblematicResult.data[0].id}`;
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
            console.log('✅ Lead problemático foi rejeitado (comportamento esperado)');
        }

        console.log('🎉 Verificação do schema concluída!');

    } catch (error) {
        console.error('❌ Erro na verificação:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    checkLeadsSchema();
}

module.exports = { checkLeadsSchema };

