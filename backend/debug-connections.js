const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.supabase' });

const supabaseUrl = process.env.SUPABASE_URL || 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugConnections() {
  console.log('🔍 Debugando conexões no Supabase...\n');
  
  // Buscar todas as conexões
  const { data: allSessions, error: allError } = await supabase
    .from('whatsapp_sessions')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (allError) {
    console.error('❌ Erro ao buscar todas as sessões:', allError);
    return;
  }
  
  console.log(`📊 Total de sessões no Supabase: ${allSessions?.length || 0}\n`);
  
  if (allSessions && allSessions.length > 0) {
    console.log('📋 Detalhes das sessões:');
    allSessions.forEach((session, index) => {
      console.log(`\n${index + 1}. ID: ${session.id}`);
      console.log(`   Connection ID: ${session.connection_id}`);
      console.log(`   Owner ID: ${session.owner_id}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Session Name: ${session.session_name}`);
      console.log(`   Phone Number: ${session.phone || 'N/A'}`);
      console.log(`   Created: ${session.created_at}`);
      console.log(`   Updated: ${session.updated_at}`);
    });
  }
  
  // Buscar apenas conexões conectadas
  const { data: connectedSessions, error: connectedError } = await supabase
    .from('whatsapp_sessions')
    .select('*')
    .eq('status', 'connected')
    .order('created_at', { ascending: false });
  
  if (connectedError) {
    console.error('❌ Erro ao buscar conexões conectadas:', connectedError);
    return;
  }
  
  console.log(`\n✅ Conexões conectadas: ${connectedSessions?.length || 0}`);
  
  if (connectedSessions && connectedSessions.length > 0) {
    console.log('📋 Conexões conectadas:');
    connectedSessions.forEach((session, index) => {
      console.log(`\n${index + 1}. ${session.session_name} (${session.connection_id})`);
      console.log(`   Owner: ${session.owner_id}`);
      console.log(`   Phone: ${session.phone || 'N/A'}`);
    });
  }
  
  // Verificar duplicatas por owner_id
  const ownerGroups = {};
  allSessions?.forEach(session => {
    const ownerId = session.owner_id;
    if (!ownerGroups[ownerId]) {
      ownerGroups[ownerId] = [];
    }
    ownerGroups[ownerId].push(session);
  });
  
  console.log('\n👥 Conexões por usuário:');
  Object.keys(ownerGroups).forEach(ownerId => {
    const sessions = ownerGroups[ownerId];
    console.log(`\nUsuário ${ownerId}: ${sessions.length} conexões`);
    sessions.forEach(session => {
      console.log(`  - ${session.session_name} (${session.connection_id}) - ${session.status}`);
    });
  });
}

debugConnections().catch(console.error);
