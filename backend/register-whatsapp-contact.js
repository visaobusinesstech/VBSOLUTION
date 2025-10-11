const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.supabase' });

const supabaseUrl = process.env.SUPABASE_URL || 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Registra ou atualiza um contato WhatsApp na tabela contacts
 * @param {Object} contactData - Dados do contato
 * @param {string} contactData.phone - Número do telefone
 * @param {string} contactData.name - Nome do contato (opcional)
 * @param {string} contactData.owner_id - ID do proprietário
 * @returns {Promise<Object>} - Resultado da operação
 */
async function registerWhatsAppContact(contactData) {
  try {
    const { phone, name, owner_id } = contactData;
    
    if (!phone || !owner_id) {
      throw new Error('Phone e owner_id são obrigatórios');
    }

    console.log('📱 Registrando contato WhatsApp:', { phone, name, owner_id });

    // Verificar se o contato já existe
    const { data: existingContact, error: searchError } = await supabase
      .from('contacts')
      .select('*')
      .eq('phone', phone)
      .eq('owner_id', owner_id)
      .single();

    if (searchError && searchError.code !== 'PGRST116') {
      throw searchError;
    }

    if (existingContact) {
      // Atualizar contato existente
      console.log('🔄 Atualizando contato existente:', existingContact.id);
      
      const { data: updatedContact, error: updateError } = await supabase
        .from('contacts')
        .update({
          name: name || existingContact.name,
          last_contact_at: new Date().toISOString(),
          whatsapp_opted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingContact.id)
        .select()
        .single();

      if (updateError) throw updateError;

      console.log('✅ Contato atualizado:', updatedContact.id);
      return { success: true, contact: updatedContact, action: 'updated' };
    } else {
      // Criar novo contato
      console.log('➕ Criando novo contato');
      
      const { data: newContact, error: insertError } = await supabase
        .from('contacts')
        .insert({
          phone: phone,
          name: name || phone, // Usar telefone como nome se não fornecido
          owner_id: owner_id,
          status: 'active',
          whatsapp_opted: true,
          last_contact_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      console.log('✅ Novo contato criado:', newContact.id);
      return { success: true, contact: newContact, action: 'created' };
    }
  } catch (error) {
    console.error('❌ Erro ao registrar contato WhatsApp:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { registerWhatsAppContact };
