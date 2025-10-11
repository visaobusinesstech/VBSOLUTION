// Script para executar via API de administração do Supabase
const https = require('https');

console.log('🎯 Executando via API de administração do Supabase...');

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

async function executeAdmin() {
    try {
        console.log('📡 Conectando ao Supabase...');
        
        // 1. Tentar executar via API de administração
        console.log('📝 1. Executando via API de administração...');
        const adminUrl = `${SUPABASE_URL}/rest/v1/rpc/admin`;
        const adminOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': SUPABASE_SERVICE_ROLE_KEY
            },
            body: JSON.stringify({
                action: 'create_table',
                table_name: 'pipelines',
                columns: {
                    id: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
                    name: 'TEXT NOT NULL',
                    description: 'TEXT',
                    is_default: 'BOOLEAN DEFAULT false',
                    is_active: 'BOOLEAN DEFAULT true',
                    created_at: 'TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()',
                    updated_at: 'TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()'
                }
            })
        };
        
        const adminResult = await makeRequest(adminUrl, adminOptions);
        
        if (adminResult.status === 200) {
            console.log('✅ Tabela pipelines criada via API de administração');
            
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
                
                // 3. Atualizar etapas existentes
                console.log('📝 3. Atualizando etapas existentes...');
                const updateUrl = `${SUPABASE_URL}/rest/v1/funnel_stages`;
                const updateOptions = {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        pipeline_id: insertResult.data[0].id
                    })
                };
                
                const updateResult = await makeRequest(updateUrl, updateOptions);
                
                if (updateResult.status === 200 || updateResult.status === 204) {
                    console.log('✅ Etapas atualizadas com pipeline_id');
                } else {
                    console.log('⚠️ Aviso ao atualizar etapas:', updateResult.data);
                }
                
                // 4. Verificar dados finais
                console.log('🔍 4. Verificando dados finais...');
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
                        console.log(`   - ${pipeline.name} (${pipeline.is_default ? 'Padrão' : 'Customizada'})`);
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
            console.log('❌ Erro ao executar via API de administração:', adminResult.data);
            console.log('\n📋 Execute este SQL no Supabase Dashboard:');
            console.log('=====================================');
            console.log(`
-- 1. Criar tabela de pipelines
CREATE TABLE IF NOT EXISTS public.pipelines (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Adicionar coluna pipeline_id na tabela funnel_stages
ALTER TABLE public.funnel_stages 
ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES public.pipelines(id);

-- 3. Inserir pipeline padrão
INSERT INTO public.pipelines (name, description, is_default, is_active) 
VALUES ('Pipeline Padrão', 'Pipeline padrão do sistema', true, true);

-- 4. Atualizar etapas existentes com pipeline_id da pipeline padrão
UPDATE public.funnel_stages 
SET pipeline_id = (
    SELECT id FROM public.pipelines WHERE is_default = true LIMIT 1
)
WHERE pipeline_id IS NULL;

-- 5. Habilitar RLS
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS
CREATE POLICY IF NOT EXISTS "Enable all operations for all users" ON public.pipelines 
FOR ALL USING (true);
            `);
            console.log('=====================================');
            return false;
        }
        
    } catch (err) {
        console.error('❌ Erro geral:', err.message);
        return false;
    }
}

// Executar administração
executeAdmin().then(success => {
    if (success) {
        console.log('\n✅ Administração concluída com sucesso!');
        console.log('🚀 Agora você pode testar o gerenciamento de pipelines');
    } else {
        console.log('\n❌ Execute o SQL manualmente no Supabase Dashboard');
    }
});
