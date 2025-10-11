const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkContactsStructure() {
  console.log('🔍 Verificando estrutura da tabela contacts...');
  
  try {
    // Tentar buscar um contato existente para ver a estrutura
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao acessar contacts:', error.message);
      return;
    }
    
    if (contacts && contacts.length > 0) {
      console.log('✅ Estrutura da tabela contacts:');
      console.log('Colunas encontradas:', Object.keys(contacts[0]));
      
      const contact = contacts[0];
      console.log('\n📋 Exemplo de dados:');
      console.log('- id:', contact.id);
      console.log('- name:', contact.name);
      console.log('- phone:', contact.phone);
      console.log('- phone_number:', contact.phone_number);
      console.log('- owner_id:', contact.owner_id);
      console.log('- ai_enabled:', contact.ai_enabled);
      
      // Verificar qual coluna tem dados
      if (contact.phone && !contact.phone_number) {
        console.log('\n✅ Usar coluna: phone');
      } else if (contact.phone_number && !contact.phone) {
        console.log('\n✅ Usar coluna: phone_number');
      } else if (contact.phone && contact.phone_number) {
        console.log('\n⚠️ Ambas colunas existem: phone e phone_number');
        console.log('Valores:', { phone: contact.phone, phone_number: contact.phone_number });
      } else {
        console.log('\n❌ Nenhuma das colunas phone/phone_number tem dados');
      }
    } else {
      console.log('⚠️ Nenhum contato encontrado na tabela');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkContactsStructure();
