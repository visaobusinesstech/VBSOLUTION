// Script para executar SQL no Supabase - Tentativa 3
const https = require('https');

console.log('🎯 Executando SQL no Supabase - Tentativa 3...');

const SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

async function makeRequest(url, options) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ data: jsonData, error: null, status: res.statusCode });
                } catch (e) {
                    resolve({ data: data, error: null, status: res.statusCode });
                }
            });
        });
        
        req.on('error', (err) => reject(err));
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

async function executeSQLSupabase3() {
    try {
        console.log('📡 Conectando ao Supabase...');
        
        // 1. Tentar usar a função de schema
        console.log('📝 1. Tentando usar função de schema...');
        const schemaUrl = `${SUPABASE_URL}/rest/v1/rpc/schema`;
        const schemaOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': SUPABASE_SERVICE_ROLE_KEY
            },
            body: JSON.stringify({
                operation: 'create_table',
                table: 'pipelines',
                definition: `
                    CREATE TABLE IF NOT EXISTS public.pipelines (
                        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
                        name TEXT NOT NULL,
                        description TEXT,
                        is_default BOOLEAN DEFAULT false,
                        is_active BOOLEAN DEFAULT true,
                        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
                    );
                `
            })
        };
        
        const schemaResult = await makeRequest(schemaUrl, schemaOptions);
        
        if (schemaResult.status === 200) {
            console.log('✅ Tabela pipelines criada via schema');
            
            // 2. Inserir pipeline padrão
            console.log('📝 2. Inserindo pipeline padrão...');
            const insertUrl = `${SUPABASE_URL}/rest/v1/pipelines`;
            const insertOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    name: 'Pipeline Padrão',
                    description: 'Pipeline padrão do sistema',
                    is_default: true,
                    is_active: true
                })
            };
            
            const insertResult = await makeRequest(insertUrl, insertOptions);
            
            if (insertResult.status === 201) {
                console.log('✅ Pipeline padrão inserida:', insertResult.data[0].name);
                
                // 3. Verificar dados
                console.log('🔍 3. Verificando dados...');
                const checkUrl = `${SUPABASE_URL}/rest/v1/pipelines?select=*`;
                const checkOptions = {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                        'apikey': SUPABASE_SERVICE_ROLE_KEY
                    }
                };
                
                const checkResult = await makeRequest(checkUrl, checkOptions);
                
                if (checkResult.status === 200) {
                    console.log(`✅ ${checkResult.data.length} pipelines encontradas:`);
                    checkResult.data.forEach(pipeline => {
                        console.log(`   - ${pipeline.name} (${pipeline.is_default ? 'Padrão' : 'Customizada'}) - ID: ${pipeline.id}`);
                    });
                }
                
                console.log('\n🎉 Configuração de pipelines concluída!');
                console.log('✅ Sistema pronto para gerenciar pipelines e etapas');
                
                return true;
                
            } else {
                console.log('❌ Erro ao inserir pipeline:', insertResult.data);
                return false;
            }
            
        } else {
            console.log('❌ Erro ao executar schema:', schemaResult.data);
            return false;
        }
        
    } catch (err) {
        console.error('❌ Erro geral:', err.message);
        return false;
    }
}

// Executar configuração
executeSQLSupabase3().then(success => {
    if (success) {
        console.log('\n✅ Configuração concluída com sucesso!');
        console.log('🚀 Agora você pode testar o gerenciamento de pipelines');
    } else {
        console.log('\n❌ Tentativa 3 falhou, tentando método alternativo...');
    }
});
