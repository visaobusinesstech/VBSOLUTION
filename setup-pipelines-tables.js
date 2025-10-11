// Script para criar tabelas de pipelines no Supabase
const { createClient } = require('@supabase/supabase-js');

console.log('🎯 Configurando tabelas de pipelines no Supabase...');

const SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function setupPipelinesTables() {
    try {
        console.log('📡 Conectando ao Supabase...');
        
        // 1. Criar tabela de pipelines
        console.log('📝 1. Criando tabela de pipelines...');
        const { error: pipelinesError } = await supabase.rpc('exec_sql', {
            sql: `
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
        });
        
        if (pipelinesError) {
            console.log('⚠️ Aviso ao criar tabela pipelines:', pipelinesError.message);
        } else {
            console.log('✅ Tabela pipelines criada');
        }
        
        // 2. Atualizar tabela funnel_stages para incluir pipeline_id
        console.log('📝 2. Atualizando tabela funnel_stages...');
        const { error: stagesError } = await supabase.rpc('exec_sql', {
            sql: `
                ALTER TABLE public.funnel_stages 
                ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES public.pipelines(id);
            `
        });
        
        if (stagesError) {
            console.log('⚠️ Aviso ao atualizar funnel_stages:', stagesError.message);
        } else {
            console.log('✅ Coluna pipeline_id adicionada a funnel_stages');
        }
        
        // 3. Inserir pipeline padrão
        console.log('📝 3. Inserindo pipeline padrão...');
        const { data: pipelineData, error: insertPipelineError } = await supabase
            .from('pipelines')
            .insert([{
                name: 'Pipeline Padrão',
                description: 'Pipeline padrão do sistema',
                is_default: true,
                is_active: true
            }])
            .select();
            
        if (insertPipelineError) {
            console.log('⚠️ Aviso ao inserir pipeline padrão:', insertPipelineError.message);
        } else {
            console.log('✅ Pipeline padrão inserida:', pipelineData[0].name);
        }
        
        // 4. Atualizar etapas existentes com pipeline_id
        console.log('📝 4. Atualizando etapas existentes...');
        const { data: defaultPipeline } = await supabase
            .from('pipelines')
            .select('id')
            .eq('is_default', true)
            .single();
            
        if (defaultPipeline) {
            const { error: updateStagesError } = await supabase
                .from('funnel_stages')
                .update({ pipeline_id: defaultPipeline.id })
                .is('pipeline_id', null);
                
            if (updateStagesError) {
                console.log('⚠️ Aviso ao atualizar etapas:', updateStagesError.message);
            } else {
                console.log('✅ Etapas atualizadas com pipeline_id');
            }
        }
        
        // 5. Habilitar RLS
        console.log('📝 5. Configurando RLS...');
        const { error: rlsError } = await supabase.rpc('exec_sql', {
            sql: `
                ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
                
                CREATE POLICY IF NOT EXISTS "Enable all operations for all users" ON public.pipelines 
                FOR ALL USING (true);
            `
        });
        
        if (rlsError) {
            console.log('⚠️ Aviso ao configurar RLS:', rlsError.message);
        } else {
            console.log('✅ RLS configurado para pipelines');
        }
        
        // 6. Verificar dados
        console.log('🔍 6. Verificando dados...');
        const { data: pipelines, error: fetchPipelinesError } = await supabase
            .from('pipelines')
            .select('*');
            
        if (fetchPipelinesError) {
            console.error('❌ Erro ao buscar pipelines:', fetchPipelinesError.message);
        } else {
            console.log(`✅ ${pipelines.length} pipelines encontradas:`);
            pipelines.forEach(pipeline => {
                console.log(`   - ${pipeline.name} (${pipeline.is_default ? 'Padrão' : 'Customizada'})`);
            });
        }
        
        const { data: stages, error: fetchStagesError } = await supabase
            .from('funnel_stages')
            .select('*')
            .order('position', { ascending: true });
            
        if (fetchStagesError) {
            console.error('❌ Erro ao buscar etapas:', fetchStagesError.message);
        } else {
            console.log(`✅ ${stages.length} etapas encontradas:`);
            stages.forEach(stage => {
                console.log(`   - ${stage.name} (Pipeline: ${stage.pipeline_id ? 'Sim' : 'Não'})`);
            });
        }
        
        console.log('\n🎉 Configuração das tabelas de pipelines concluída!');
        console.log('✅ Sistema pronto para gerenciar pipelines e etapas');
        
        return true;
        
    } catch (err) {
        console.error('❌ Erro geral:', err.message);
        return false;
    }
}

// Executar configuração
setupPipelinesTables().then(success => {
    if (success) {
        console.log('\n✅ Configuração concluída com sucesso!');
        console.log('🚀 Agora você pode testar o gerenciamento de pipelines');
    } else {
        console.log('\n❌ Configuração falhou');
    }
});
