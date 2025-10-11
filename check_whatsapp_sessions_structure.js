const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkWhatsAppSessionsStructure() {
  console.log('🔍 Verificando estrutura da tabela whatsapp_sessions...');
  
  try {
    // Tentar buscar uma sessão existente para ver a estrutura
    const { data: sessions, error } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao acessar whatsapp_sessions:', error.message);
      return;
    }
    
    if (sessions && sessions.length > 0) {
      console.log('✅ Estrutura da tabela whatsapp_sessions:');
      console.log('Colunas encontradas:', Object.keys(sessions[0]));
      
      const session = sessions[0];
      console.log('\n📋 Exemplo de dados:');
      console.log('- connection_id:', session.connection_id);
      console.log('- owner_id:', session.owner_id);
      console.log('- phone:', session.phone);
      console.log('- phone_number:', session.phone_number);
      console.log('- status:', session.status);
      console.log('- attendance_type:', session.attendance_type);
      
      // Verificar qual coluna tem dados
      if (session.phone && !session.phone_number) {
        console.log('\n✅ Usar coluna: phone');
      } else if (session.phone_number && !session.phone) {
        console.log('\n✅ Usar coluna: phone_number');
      } else if (session.phone && session.phone_number) {
        console.log('\n⚠️ Ambas colunas existem: phone e phone_number');
        console.log('Valores:', { phone: session.phone, phone_number: session.phone_number });
      } else {
        console.log('\n❌ Nenhuma das colunas phone/phone_number tem dados');
      }
    } else {
      console.log('⚠️ Nenhuma sessão encontrada na tabela');
      
      // Tentar inserir uma sessão de teste para ver qual coluna usar
      console.log('\n🧪 Tentando inserir sessão de teste...');
      
      const testSession = {
        connection_id: 'test_connection_' + Date.now(),
        owner_id: '905b926a-785a-4f6d-9c3a-9455729500b3',
        status: 'disconnected',
        phone: '559999999999',
        attendance_type: 'human'
      };
      
      const { data: inserted, error: insertError } = await supabase
        .from('whatsapp_sessions')
        .insert([testSession])
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Erro ao inserir sessão de teste:', insertError.message);
        
        // Tentar com phone_number
        const testSession2 = {
          connection_id: 'test_connection2_' + Date.now(),
          owner_id: '905b926a-785a-4f6d-9c3a-9455729500b3',
          status: 'disconnected',
          phone_number: '559999999999',
          attendance_type: 'human'
        };
        
        const { data: inserted2, error: insertError2 } = await supabase
          .from('whatsapp_sessions')
          .insert([testSession2])
          .select()
          .single();
        
        if (insertError2) {
          console.error('❌ Erro ao inserir com phone_number:', insertError2.message);
        } else {
          console.log('✅ Sucesso com phone_number:', inserted2);
          
          // Limpar dados de teste
          await supabase
            .from('whatsapp_sessions')
            .delete()
            .eq('connection_id', testSession2.connection_id);
        }
      } else {
        console.log('✅ Sucesso com phone:', inserted);
        
        // Limpar dados de teste
        await supabase
          .from('whatsapp_sessions')
          .delete()
          .eq('connection_id', testSession.connection_id);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkWhatsAppSessionsStructure();
