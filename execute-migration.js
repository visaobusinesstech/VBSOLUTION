// Script para executar migração via API do Supabase
const https = require('https');

console.log('🎯 Executando migração via API do Supabase...');

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

async function executeMigration() {
    try {
        console.log('📡 Conectando ao Supabase...');
        
        // 1. Tentar executar migração via API
        console.log('📝 1. Executando migração via API...');
        const migrationUrl = `${SUPABASE_URL}/rest/v1/rpc/migrate`;
        const migrationOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': SUPABASE_SERVICE_ROLE_KEY
            },
            body: JSON.stringify({
                sql: `
                    -- Criar tabela de pipelines
                    CREATE TABLE IF NOT EXISTS public.pipelines (
                        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
                        name TEXT NOT NULL,
                        description TEXT,
                        is_default BOOLEAN DEFAULT false,
                        is_active BOOLEAN DEFAULT true,
                        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
                    );
                    
                    -- Adicionar coluna pipeline_id na tabela funnel_stages
                    ALTER TABLE public.funnel_stages 
                    ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES public.pipelines(id);
                    
                    -- Inserir pipeline padrão
                    INSERT INTO public.pipelines (name, description, is_default, is_active) 
                    VALUES ('Pipeline Padrão', 'Pipeline padrão do sistema', true, true)
                    ON CONFLICT (name) DO NOTHING;
                    
                    -- Atualizar etapas existentes com pipeline_id da pipeline padrão
                    UPDATE public.funnel_stages 
                    SET pipeline_id = (
                        SELECT id FROM public.pipelines WHERE is_default = true LIMIT 1
                    )
                    WHERE pipeline_id IS NULL;
                    
                    -- Habilitar RLS
                    ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
                    
                    -- Criar políticas RLS
                    CREATE POLICY IF NOT EXISTS "Enable all operations for all users" ON public.pipelines 
                    FOR ALL USING (true);
                `
            })
        };
        
        const migrationResult = await makeRequest(migrationUrl, migrationOptions);
        
        if (migrationResult.status === 200) {
            console.log('✅ Migração executada com sucesso via API');
            
            // 2. Verificar se as tabelas foram criadas
            console.log('🔍 2. Verificando tabelas criadas...');
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
                
                // 3. Verificar etapas atualizadas
                console.log('🔍 3. Verificando etapas atualizadas...');
                const stagesUrl = `${SUPABASE_URL}/rest/v1/funnel_stages?select=*&order=position.asc`;
                const stagesOptions = {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                        'apikey': SUPABASE_SERVICE_ROLE_KEY
                    }
                };
                
                const stagesResult = await makeRequest(stagesUrl, stagesOptions);
                
                if (stagesResult.status === 200) {
                    console.log(`✅ ${stagesResult.data.length} etapas encontradas:`);
                    stagesResult.data.forEach(stage => {
                        console.log(`   ${stage.position}. ${stage.name} (Pipeline: ${stage.pipeline_id ? 'Sim' : 'Não'})`);
                    });
                }
                
                console.log('\n🎉 Configuração de pipelines concluída!');
                console.log('✅ Sistema pronto para gerenciar pipelines e etapas');
                
                return true;
                
            } else {
                console.log('⚠️ Erro ao verificar pipelines:', checkResult.data);
                return false;
            }
            
        } else {
            console.log('❌ Erro ao executar migração:', migrationResult.data);
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

// Executar migração
executeMigration().then(success => {
    if (success) {
        console.log('\n✅ Migração concluída com sucesso!');
        console.log('🚀 Agora você pode testar o gerenciamento de pipelines');
    } else {
        console.log('\n❌ Execute o SQL manualmente no Supabase Dashboard');
    }
});
