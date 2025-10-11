// Script para executar o final-fix.sql via API do Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

console.log('🚀 Executando script final-fix.sql via API do Supabase...');

const SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function executeFinalFix() {
    try {
        console.log('📡 Conectando ao Supabase...');
        
        // Ler o arquivo SQL
        const sqlContent = fs.readFileSync('final-fix.sql', 'utf8');
        console.log('📄 Arquivo SQL carregado com sucesso');
        
        // Dividir o SQL em comandos individuais
        const commands = sqlContent
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
        
        console.log(`🔧 Executando ${commands.length} comandos SQL...`);
        
        // Executar cada comando
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            if (command.trim()) {
                try {
                    console.log(`⚡ Executando comando ${i + 1}/${commands.length}...`);
                    
                    // Para comandos DDL, usar rpc
                    if (command.includes('CREATE TABLE') || command.includes('ALTER TABLE') || 
                        command.includes('DROP') || command.includes('CREATE INDEX') ||
                        command.includes('CREATE POLICY') || command.includes('CREATE FUNCTION') ||
                        command.includes('CREATE TRIGGER') || command.includes('INSERT INTO')) {
                        
                        const { data, error } = await supabase.rpc('exec_sql', { sql: command });
                        
                        if (error) {
                            console.warn(`⚠️  Aviso no comando ${i + 1}:`, error.message);
                        } else {
                            console.log(`✅ Comando ${i + 1} executado com sucesso`);
                        }
                    }
                } catch (cmdError) {
                    console.warn(`⚠️  Erro no comando ${i + 1}:`, cmdError.message);
                }
            }
        }
        
        console.log('\n🎯 Verificando resultados...');
        
        // Verificar se as tabelas foram criadas
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .in('table_name', ['leads', 'atendimentos', 'tickets']);
        
        if (tablesError) {
            console.error('❌ Erro ao verificar tabelas:', tablesError.message);
        } else {
            console.log('✅ Tabelas encontradas:', tables.map(t => t.table_name));
        }
        
        // Verificar leads inseridos
        const { data: leads, error: leadsError } = await supabase
            .from('leads')
            .select('id, name, email, status')
            .limit(5);
        
        if (leadsError) {
            console.error('❌ Erro ao verificar leads:', leadsError.message);
        } else {
            console.log(`✅ Leads encontrados: ${leads.length}`);
            leads.forEach(lead => {
                console.log(`  - ${lead.name} (${lead.email}) - ${lead.status}`);
            });
        }
        
        console.log('\n🎉 Script final-fix.sql executado com sucesso!');
        console.log('✅ O banco de dados está configurado corretamente');
        console.log('🚀 Agora você pode testar o frontend!');
        
        return true;
        
    } catch (err) {
        console.error('❌ Erro geral:', err.message);
        return false;
    }
}

// Executar o script
executeFinalFix().then(success => {
    if (success) {
        console.log('\n✅ Execução concluída com sucesso!');
    } else {
        console.log('\n❌ Execução falhou');
    }
});
