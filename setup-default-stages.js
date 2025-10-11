// Script para configurar etapas padrão do sistema
const { createClient } = require('@supabase/supabase-js');

console.log('🎯 Configurando etapas padrão do sistema...');

const SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function setupDefaultStages() {
    try {
        console.log('📡 Conectando ao Supabase...');
        
        // 1. Limpar etapas existentes
        console.log('🧹 1. Limpando etapas existentes...');
        const { error: deleteError } = await supabase
            .from('funnel_stages')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar todas
        
        if (deleteError) {
            console.log('⚠️ Aviso ao limpar etapas:', deleteError.message);
        } else {
            console.log('✅ Etapas existentes removidas');
        }
        
        // 2. Inserir etapas padrão
        console.log('📝 2. Inserindo etapas padrão...');
        const defaultStages = [
            { name: 'Novo Lead', position: 1, color: '#EF4444' },
            { name: 'Contato Inicial', position: 2, color: '#F59E0B' },
            { name: 'Proposta', position: 3, color: '#3B82F6' },
            { name: 'Fechamento', position: 4, color: '#10B981' },
            { name: 'Boas Vindas', position: 5, color: '#8B5CF6' },
            { name: 'Não Concluído', position: 6, color: '#6B7280' }
        ];
        
        const { data: stagesData, error: insertError } = await supabase
            .from('funnel_stages')
            .insert(defaultStages)
            .select();
            
        if (insertError) {
            console.error('❌ Erro ao inserir etapas:', insertError.message);
            return false;
        }
        
        console.log('✅ Etapas padrão inseridas:');
        stagesData.forEach(stage => {
            console.log(`   ${stage.position}. ${stage.name} (${stage.color})`);
        });
        
        // 3. Verificar se foram inseridas corretamente
        console.log('\n🔍 3. Verificando etapas inseridas...');
        const { data: allStages, error: fetchError } = await supabase
            .from('funnel_stages')
            .select('*')
            .order('position', { ascending: true });
            
        if (fetchError) {
            console.error('❌ Erro ao verificar etapas:', fetchError.message);
            return false;
        }
        
        console.log(`✅ Total de etapas: ${allStages.length}`);
        allStages.forEach(stage => {
            console.log(`   ${stage.position}. ${stage.name} - ${stage.color}`);
        });
        
        console.log('\n🎉 Configuração das etapas padrão concluída!');
        console.log('✅ Sistema pronto com as etapas:');
        console.log('   1. Novo Lead');
        console.log('   2. Contato Inicial');
        console.log('   3. Proposta');
        console.log('   4. Fechamento');
        console.log('   5. Boas Vindas');
        console.log('   6. Não Concluído');
        
        return true;
        
    } catch (err) {
        console.error('❌ Erro geral:', err.message);
        return false;
    }
}

// Executar configuração
setupDefaultStages().then(success => {
    if (success) {
        console.log('\n✅ Configuração concluída com sucesso!');
        console.log('🚀 Agora você pode testar o frontend com as novas etapas');
    } else {
        console.log('\n❌ Configuração falhou');
    }
});
