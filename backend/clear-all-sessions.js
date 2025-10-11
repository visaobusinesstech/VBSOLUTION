const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAllSessions() {
  try {
    console.log('🧹 Limpando todas as sessões do Supabase...');
    
    // Deletar todas as sessões
    const { error } = await supabase
      .from('whatsapp_sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar todas exceto uma dummy
    
    if (error) {
      console.error('❌ Erro ao limpar sessões:', error);
      return;
    }
    
    console.log('✅ Todas as sessões foram removidas do Supabase');
    
    // Verificar se ficou vazio
    const { data: remainingSessions, error: checkError } = await supabase
      .from('whatsapp_sessions')
      .select('*');
    
    if (checkError) {
      console.error('❌ Erro ao verificar sessões restantes:', checkError);
      return;
    }
    
    console.log(`📊 Sessões restantes: ${remainingSessions.length}`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

clearAllSessions();
