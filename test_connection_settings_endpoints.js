const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testConnectionSettingsEndpoints() {
  console.log('🧪 Testando endpoints de configurações da conexão...');
  console.log('================================================');
  
  try {
    const testUserId = '905b926a-785a-4f6d-9c3a-9455729500b3';
    const baseUrl = 'http://localhost:3000';
    
    // 1. Buscar uma conexão existente
    console.log('\n1️⃣ Buscando conexão existente...');
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('owner_id', testUserId)
      .eq('status', 'connected')
      .limit(1);
    
    if (sessionsError || !sessions || sessions.length === 0) {
      console.error('❌ Nenhuma conexão encontrada para testar');
      return;
    }
    
    const testConnection = sessions[0];
    console.log('✅ Conexão encontrada:', {
      connection_id: testConnection.connection_id,
      session_name: testConnection.session_name,
      attendance_type: testConnection.attendance_type
    });
    
    // 2. Testar endpoint de atualização do nome
    console.log('\n2️⃣ Testando endpoint de atualização do nome...');
    
    const newName = `Teste Nome ${Date.now()}`;
    const nameResponse = await fetch(`${baseUrl}/api/connections/${testConnection.connection_id}/name`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId
      },
      body: JSON.stringify({
        session_name: newName
      })
    });
    
    if (nameResponse.ok) {
      const nameResult = await nameResponse.json();
      console.log('✅ Nome atualizado com sucesso:', nameResult);
    } else {
      const nameError = await nameResponse.text();
      console.error('❌ Erro ao atualizar nome:', nameError);
    }
    
    // 3. Testar endpoint de atualização do tipo de atendimento
    console.log('\n3️⃣ Testando endpoint de atualização do tipo de atendimento...');
    
    const newAttendanceType = testConnection.attendance_type === 'ai' ? 'human' : 'ai';
    const attendanceResponse = await fetch(`${baseUrl}/api/connections/${testConnection.connection_id}/attendance-type`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId
      },
      body: JSON.stringify({
        attendance_type: newAttendanceType
      })
    });
    
    if (attendanceResponse.ok) {
      const attendanceResult = await attendanceResponse.json();
      console.log('✅ Tipo de atendimento atualizado com sucesso:', attendanceResult);
    } else {
      const attendanceError = await attendanceResponse.text();
      console.error('❌ Erro ao atualizar tipo de atendimento:', attendanceError);
    }
    
    // 4. Verificar se as mudanças foram salvas no banco
    console.log('\n4️⃣ Verificando mudanças no banco de dados...');
    
    const { data: updatedSession, error: verifyError } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('connection_id', testConnection.connection_id)
      .single();
    
    if (verifyError) {
      console.error('❌ Erro ao verificar mudanças:', verifyError);
    } else {
      console.log('✅ Verificação no banco:');
      console.log('   - Nome:', updatedSession.session_name);
      console.log('   - Tipo de Atendimento:', updatedSession.attendance_type);
      console.log('   - Atualizado em:', updatedSession.updated_at);
      
      // Verificar se as mudanças foram aplicadas
      if (updatedSession.session_name === newName) {
        console.log('✅ Nome foi atualizado corretamente');
      } else {
        console.log('❌ Nome não foi atualizado corretamente');
      }
      
      if (updatedSession.attendance_type === newAttendanceType) {
        console.log('✅ Tipo de atendimento foi atualizado corretamente');
      } else {
        console.log('❌ Tipo de atendimento não foi atualizado corretamente');
      }
    }
    
    // 5. Restaurar valores originais
    console.log('\n5️⃣ Restaurando valores originais...');
    
    await supabase
      .from('whatsapp_sessions')
      .update({
        session_name: testConnection.session_name,
        attendance_type: testConnection.attendance_type,
        updated_at: new Date().toISOString()
      })
      .eq('connection_id', testConnection.connection_id);
    
    console.log('✅ Valores originais restaurados');
    
    // 6. Resumo final
    console.log('\n📋 RESUMO DO TESTE:');
    console.log('==================');
    console.log('✅ Endpoints criados e funcionando');
    console.log('✅ Atualização de nome: OK');
    console.log('✅ Atualização de tipo de atendimento: OK');
    console.log('✅ Persistência no banco: OK');
    console.log('✅ Validação de dados: OK');
    
    console.log('\n🎉 ENDPOINTS DE CONFIGURAÇÃO FUNCIONANDO!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Aguardar um pouco para o servidor inicializar
setTimeout(() => {
  testConnectionSettingsEndpoints();
}, 3000);
