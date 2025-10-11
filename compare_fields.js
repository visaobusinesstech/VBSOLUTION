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

async function compareFields() {
    try {
        console.log('🔍 Comparando campos do modal com a tabela leads...');
        
        // 1. Verificar campos da tabela leads
        console.log('📊 1. Verificando campos da tabela leads...');
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
        
        let tableFields = [];
        if (schemaResult.status === 200 && schemaResult.data && schemaResult.data.length > 0) {
            tableFields = Object.keys(schemaResult.data[0]);
            console.log('📊 Campos da tabela leads:');
            tableFields.forEach(field => {
                console.log(`   - ${field}`);
            });
        }

        // 2. Campos que estão sendo enviados no modal
        const modalFields = [
            'name',
            'email', 
            'phone',
            'company',
            'position',
            'source',
            'priority',
            'stage_id',
            'responsible_id',
            'contact_id',
            'product_id',
            'value',
            'currency',
            'expected_close_date',
            'notes',
            'status'
        ];

        console.log('\n📋 Campos sendo enviados no modal:');
        modalFields.forEach(field => {
            console.log(`   - ${field}`);
        });

        // 3. Comparar campos
        console.log('\n🔍 Comparação:');
        const missingInTable = modalFields.filter(field => !tableFields.includes(field));
        const missingInModal = tableFields.filter(field => !modalFields.includes(field));

        if (missingInTable.length > 0) {
            console.log('❌ Campos do modal que NÃO existem na tabela:');
            missingInTable.forEach(field => {
                console.log(`   - ${field}`);
            });
        } else {
            console.log('✅ Todos os campos do modal existem na tabela');
        }

        if (missingInModal.length > 0) {
            console.log('ℹ️ Campos da tabela que NÃO estão sendo enviados no modal:');
            missingInModal.forEach(field => {
                console.log(`   - ${field}`);
            });
        }

        // 4. Gerar query para adicionar campos faltantes
        if (missingInTable.length > 0) {
            console.log('\n📝 Query para adicionar campos faltantes:');
            console.log('-- Adicionar campos faltantes na tabela leads');
            console.log('ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS position TEXT;');
            console.log('ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL;');
            console.log('ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;');
            console.log('ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS responsible_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;');
            console.log('ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS expected_close_date DATE;');
            console.log('ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notes TEXT;');
            console.log('ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'cold\';');
        }

        console.log('\n🎉 Comparação concluída!');

    } catch (error) {
        console.error('❌ Erro na comparação:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    compareFields();
}

module.exports = { compareFields };

