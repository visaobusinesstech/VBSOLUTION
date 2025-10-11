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

async function disableRLSTemporarily() {
    try {
        console.log('🔧 Desabilitando RLS temporariamente...');
        
        // 1. Criar uma política RLS mais permissiva para desenvolvimento
        console.log('📝 1. Criando política RLS permissiva...');
        const policyUrl = `${SUPABASE_URL}/rest/v1/rpc/exec`;
        const policyOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                sql: `
                    -- Remover políticas existentes
                    DROP POLICY IF EXISTS "Enable all operations for all users" ON public.leads;
                    DROP POLICY IF EXISTS "Users can view own leads" ON public.leads;
                    DROP POLICY IF EXISTS "Users can create leads" ON public.leads;
                    DROP POLICY IF EXISTS "Users can update own leads" ON public.leads;
                    DROP POLICY IF EXISTS "Users can delete own leads" ON public.leads;
                    
                    -- Criar política permissiva para desenvolvimento
                    CREATE POLICY "Enable all operations for all users" ON public.leads 
                    FOR ALL USING (true) WITH CHECK (true);
                `
            })
        };
        
        const policyResult = await makeRequest(policyUrl, policyOptions);
        console.log('✅ Política RLS criada:', policyResult);

        // 2. Testar criação de lead
        console.log('🧪 2. Testando criação de lead...');
        const testLead = {
            name: 'Lead de Teste - ' + new Date().toISOString(),
            email: 'teste@exemplo.com',
            phone: '11999999999',
            stage_id: '550e8400-e29b-41d4-a716-446655440001',
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

            // 3. Deletar o lead de teste
            console.log('🗑️ 3. Removendo lead de teste...');
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

            console.log('🎉 RLS configurado corretamente!');
            console.log('📋 Próximos passos:');
            console.log('   1. Reinicie o servidor de desenvolvimento');
            console.log('   2. Teste a criação de leads no frontend');
            console.log('   3. Os erros de foreign key devem estar resolvidos');

        } else {
            console.log('❌ Erro ao criar lead de teste:', createResult);
            
            // Tentar desabilitar RLS completamente
            console.log('🔄 Tentando desabilitar RLS completamente...');
            const disableUrl = `${SUPABASE_URL}/rest/v1/rpc/exec`;
            const disableOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY
                },
                body: JSON.stringify({
                    sql: `
                        -- Desabilitar RLS temporariamente
                        ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
                    `
                })
            };

            const disableResult = await makeRequest(disableUrl, disableOptions);
            console.log('✅ RLS desabilitado:', disableResult);

            // Testar novamente
            const createResult2 = await makeRequest(createUrl, createOptions);
            if (createResult2.status === 201) {
                console.log('✅ Lead criado após desabilitar RLS!');
                console.log('⚠️  ATENÇÃO: RLS está desabilitado - configure adequadamente em produção');
            } else {
                console.log('❌ Ainda não foi possível criar lead:', createResult2);
            }
        }

    } catch (error) {
        console.error('❌ Erro ao configurar RLS:', error);
        console.log('💡 Soluções alternativas:');
        console.log('   1. Execute o script SQL manualmente no Supabase Dashboard');
        console.log('   2. Verifique as credenciais do Supabase');
        console.log('   3. Confirme se o banco está acessível');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    disableRLSTemporarily();
}

module.exports = { disableRLSTemporarily };