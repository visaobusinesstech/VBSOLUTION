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
                    resolve(result);
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
        
        // 1. Executar migração para corrigir foreign key
        console.log('📝 1. Executando migração para corrigir foreign key...');
        const migrationUrl = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
        const migrationOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                sql: `
                    -- Verificar se a coluna stage_id existe na tabela leads
                    DO $$ 
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name = 'leads' 
                            AND column_name = 'stage_id'
                            AND table_schema = 'public'
                        ) THEN
                            ALTER TABLE public.leads ADD COLUMN stage_id UUID;
                        END IF;
                    END $$;

                    -- Adicionar foreign key constraint se não existir
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.table_constraints 
                            WHERE constraint_name = 'leads_stage_id_fkey'
                            AND table_name = 'leads'
                            AND table_schema = 'public'
                        ) THEN
                            ALTER TABLE public.leads 
                            ADD CONSTRAINT leads_stage_id_fkey 
                            FOREIGN KEY (stage_id) REFERENCES public.funnel_stages(id) ON DELETE SET NULL;
                        END IF;
                    END $$;

                    -- Inserir etapas padrão se não existirem
                    INSERT INTO public.funnel_stages (id, name, order_position, color, probability, is_default) VALUES
                    ('11111111-1111-1111-1111-111111111111', 'Novo Lead', 1, '#3b82f6', 10, true),
                    ('22222222-2222-2222-2222-222222222222', 'Contato Inicial', 2, '#8b5cf6', 25, true),
                    ('33333333-3333-3333-3333-333333333333', 'Proposta', 3, '#f59e0b', 50, true),
                    ('44444444-4444-4444-4444-444444444444', 'Reunião', 4, '#ef4444', 75, true),
                    ('55555555-5555-5555-5555-555555555555', 'Fechamento', 5, '#10b981', 100, true)
                    ON CONFLICT (id) DO NOTHING;

                    -- Atualizar leads que não têm stage_id para o primeiro estágio padrão
                    UPDATE public.leads 
                    SET stage_id = '11111111-1111-1111-1111-111111111111'
                    WHERE stage_id IS NULL;

                    -- Criar índices para performance
                    CREATE INDEX IF NOT EXISTS idx_leads_stage_id ON public.leads(stage_id);
                    CREATE INDEX IF NOT EXISTS idx_funnel_stages_order ON public.funnel_stages(order_position);
                `
            })
        };
        
        const migrationResult = await makeRequest(migrationUrl, migrationOptions);
        console.log('✅ Migração executada:', migrationResult);

        // 2. Verificar se as tabelas foram criadas corretamente
        console.log('🔍 2. Verificando estrutura das tabelas...');
        const checkUrl = `${SUPABASE_URL}/rest/v1/leads?select=*&limit=1`;
        const checkOptions = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        };
        
        const checkResult = await makeRequest(checkUrl, checkOptions);
        console.log('✅ Verificação da tabela leads:', checkResult);

        // 3. Verificar funnel_stages
        console.log('🔍 3. Verificando tabela funnel_stages...');
        const stagesUrl = `${SUPABASE_URL}/rest/v1/funnel_stages?select=*`;
        const stagesResult = await makeRequest(stagesUrl, checkOptions);
        console.log('✅ Etapas do funil encontradas:', stagesResult);

        console.log('🎉 Correção do banco de dados concluída com sucesso!');
        console.log('📋 Próximos passos:');
        console.log('   1. Reinicie o servidor de desenvolvimento');
        console.log('   2. Teste a criação de leads');
        console.log('   3. Verifique se os erros foram resolvidos');

    } catch (error) {
        console.error('❌ Erro ao corrigir banco de dados:', error);
        console.log('💡 Soluções alternativas:');
        console.log('   1. Execute a migração manualmente no Supabase SQL Editor');
        console.log('   2. Verifique as credenciais do Supabase');
        console.log('   3. Confirme se o banco está acessível');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    fixLeadsDatabase();
}

module.exports = { fixLeadsDatabase };
