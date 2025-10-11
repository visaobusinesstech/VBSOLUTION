const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.supabase' });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupConnections() {
  try {
    console.log('🧹 Iniciando limpeza das conexões duplicadas...');
    
    // Buscar todas as conexões
    const { data: sessions, error: fetchError } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Erro ao buscar sessões:', fetchError);
      return;
    }
    
    console.log(`📊 Encontradas ${sessions.length} sessões no total`);
    
    // Agrupar por connection_id
    const connectionGroups = {};
    sessions.forEach(session => {
      if (!connectionGroups[session.connection_id]) {
        connectionGroups[session.connection_id] = [];
      }
      connectionGroups[session.connection_id].push(session);
    });
    
    console.log(`🔍 Encontrados ${Object.keys(connectionGroups).length} connection_ids únicos`);
    
    // Para cada connection_id, manter apenas a mais recente
    let deletedCount = 0;
    for (const [connectionId, groupSessions] of Object.entries(connectionGroups)) {
      if (groupSessions.length > 1) {
        console.log(`🔄 Processando connection_id: ${connectionId} (${groupSessions.length} sessões)`);
        
        // Ordenar por created_at (mais recente primeiro)
        groupSessions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Manter apenas a primeira (mais recente) e deletar as outras
        const toKeep = groupSessions[0];
        const toDelete = groupSessions.slice(1);
        
        console.log(`  ✅ Mantendo: ${toKeep.id} (criada em ${toKeep.created_at})`);
        
        for (const session of toDelete) {
          console.log(`  🗑️ Deletando: ${session.id} (criada em ${session.created_at})`);
          
          const { error: deleteError } = await supabase
            .from('whatsapp_sessions')
            .delete()
            .eq('id', session.id);
          
          if (deleteError) {
            console.error(`    ❌ Erro ao deletar ${session.id}:`, deleteError);
          } else {
            deletedCount++;
          }
        }
      }
    }
    
    console.log(`✅ Limpeza concluída! ${deletedCount} sessões duplicadas foram removidas.`);
    
    // Verificar resultado final
    const { data: finalSessions, error: finalError } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!finalError) {
      console.log(`📊 Resultado final: ${finalSessions.length} sessões restantes`);
      finalSessions.forEach(session => {
        console.log(`  - ${session.connection_id}: ${session.status} (${session.created_at})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

// Executar limpeza
cleanupConnections();
