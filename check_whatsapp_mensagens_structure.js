const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkWhatsAppMensagensStructure() {
  console.log('🔍 Verificando estrutura da tabela whatsapp_mensagens...');
  
  try {
    // Tentar buscar uma mensagem existente para ver a estrutura
    const { data: messages, error } = await supabase
      .from('whatsapp_mensagens')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao acessar whatsapp_mensagens:', error.message);
      return;
    }
    
    if (messages && messages.length > 0) {
      console.log('✅ Estrutura da tabela whatsapp_mensagens:');
      console.log('Colunas encontradas:', Object.keys(messages[0]));
      
      const message = messages[0];
      console.log('\n📋 Exemplo de dados:');
      console.log('- id:', message.id);
      console.log('- chat_id:', message.chat_id);
      console.log('- phone:', message.phone);
      console.log('- phone_number:', message.phone_number);
      console.log('- conteudo:', message.conteudo);
      console.log('- remetente:', message.remetente);
      
      // Verificar qual coluna tem dados
      if (message.phone && !message.phone_number) {
        console.log('\n✅ Usar coluna: phone');
      } else if (message.phone_number && !message.phone) {
        console.log('\n✅ Usar coluna: phone_number');
      } else if (message.phone && message.phone_number) {
        console.log('\n⚠️ Ambas colunas existem: phone e phone_number');
        console.log('Valores:', { phone: message.phone, phone_number: message.phone_number });
      } else {
        console.log('\n❌ Nenhuma das colunas phone/phone_number tem dados');
      }
    } else {
      console.log('⚠️ Nenhuma mensagem encontrada na tabela');
      
      // Tentar inserir uma mensagem de teste para ver qual coluna usar
      console.log('\n🧪 Tentando inserir mensagem de teste...');
      
      const testMessage = {
        chat_id: '559999999999@s.whatsapp.net',
        conteudo: 'Mensagem de teste',
        remetente: 'CLIENTE',
        message_type: 'TEXTO',
        phone: '559999999999',
        owner_id: '905b926a-785a-4f6d-9c3a-9455729500b3'
      };
      
      const { data: inserted, error: insertError } = await supabase
        .from('whatsapp_mensagens')
        .insert([testMessage])
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Erro ao inserir mensagem de teste:', insertError.message);
        
        // Tentar com phone_number
        const testMessage2 = {
          chat_id: '559999999999@s.whatsapp.net',
          conteudo: 'Mensagem de teste 2',
          remetente: 'CLIENTE',
          message_type: 'TEXTO',
          phone_number: '559999999999',
          owner_id: '905b926a-785a-4f6d-9c3a-9455729500b3'
        };
        
        const { data: inserted2, error: insertError2 } = await supabase
          .from('whatsapp_mensagens')
          .insert([testMessage2])
          .select()
          .single();
        
        if (insertError2) {
          console.error('❌ Erro ao inserir com phone_number:', insertError2.message);
        } else {
          console.log('✅ Sucesso com phone_number:', inserted2);
          
          // Limpar dados de teste
          await supabase
            .from('whatsapp_mensagens')
            .delete()
            .eq('id', inserted2.id);
        }
      } else {
        console.log('✅ Sucesso com phone:', inserted);
        
        // Limpar dados de teste
        await supabase
          .from('whatsapp_mensagens')
          .delete()
          .eq('id', inserted.id);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkWhatsAppMensagensStructure();
