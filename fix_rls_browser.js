// Script para corrigir RLS do WhatsApp via navegador
// Execute este script no console do navegador na página do Supabase

const SUPABASE_URL = "https://nrbsocawokmihvxfcpso.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0";

async function fixWhatsAppRLS() {
    console.log("🚀 Iniciando correção do RLS do WhatsApp...");
    
    const headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    };
    
    const queries = [
        // Enable RLS
        "ALTER TABLE public.whatsapp_atendimentos ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE public.whatsapp_mensagens ENABLE ROW LEVEL SECURITY;",
        
        // Drop existing policies
        "DROP POLICY IF EXISTS \"Usuários podem ver e editar atendimentos de suas empresas\" ON public.whatsapp_atendimentos;",
        "DROP POLICY IF EXISTS \"Usuários podem ver e editar mensagens de suas empresas\" ON public.whatsapp_mensagens;",
        
        // Create new policies
        "CREATE POLICY \"whatsapp_atendimentos_policy\" ON public.whatsapp_atendimentos FOR ALL USING (auth.uid() = owner_id);",
        "CREATE POLICY \"whatsapp_mensagens_policy\" ON public.whatsapp_mensagens FOR ALL USING (auth.uid() = owner_id);",
        
        // Grant permissions
        "GRANT ALL ON public.whatsapp_atendimentos TO authenticated;",
        "GRANT ALL ON public.whatsapp_mensagens TO authenticated;"
    ];
    
    let successCount = 0;
    
    for (let i = 0; i < queries.length; i++) {
        const query = queries[i];
        console.log(`Executando query ${i + 1}/${queries.length}: ${query.substring(0, 50)}...`);
        
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ query: query })
            });
            
            if (response.ok) {
                console.log(`✅ Query ${i + 1} executada com sucesso`);
                successCount++;
            } else {
                console.error(`❌ Erro na query ${i + 1}: ${response.status} - ${await response.text()}`);
            }
        } catch (error) {
            console.error(`❌ Erro na query ${i + 1}:`, error);
        }
    }
    
    if (successCount === queries.length) {
        console.log("✅ Todas as correções do RLS foram aplicadas com sucesso!");
        console.log("🔄 Recarregue a página para ver as conversas aparecerem.");
    } else {
        console.log(`⚠️ ${successCount}/${queries.length} correções foram aplicadas`);
    }
}

// Executar a função
fixWhatsAppRLS();
