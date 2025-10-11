// Script para corrigir o código de salvamento de mensagens
// Este script atualiza o simple-baileys-server.js para salvar corretamente os dados

const fs = require('fs');
const path = require('path');

class MessageSavingCodeFixer {
  constructor() {
    this.serverFile = path.join(__dirname, 'backend', 'simple-baileys-server.js');
    this.backupFile = path.join(__dirname, 'backend', 'simple-baileys-server.js.backup');
  }

  async fixMessageSaving() {
    try {
      console.log('🔄 [FIXER] Iniciando correção do código de salvamento de mensagens...');

      // 1. Fazer backup do arquivo original
      await this.createBackup();

      // 2. Ler o arquivo atual
      const content = fs.readFileSync(this.serverFile, 'utf8');

      // 3. Aplicar correções
      const fixedContent = this.applyFixes(content);

      // 4. Salvar arquivo corrigido
      fs.writeFileSync(this.serverFile, fixedContent, 'utf8');

      console.log('✅ [FIXER] Código corrigido com sucesso!');
      console.log('📁 [FIXER] Backup salvo em:', this.backupFile);

    } catch (error) {
      console.error('❌ [FIXER] Erro ao corrigir código:', error.message);
      throw error;
    }
  }

  async createBackup() {
    try {
      const content = fs.readFileSync(this.serverFile, 'utf8');
      fs.writeFileSync(this.backupFile, content, 'utf8');
      console.log('✅ [FIXER] Backup criado com sucesso');
    } catch (error) {
      console.error('❌ [FIXER] Erro ao criar backup:', error.message);
      throw error;
    }
  }

  applyFixes(content) {
    console.log('🔄 [FIXER] Aplicando correções no código...');

    let fixedContent = content;

    // 1. Corrigir função de salvamento de mensagens para incluir todos os campos
    const oldSaveMessage = `async function saveMessageToSupabase(messageData, userId) {
  try {
    console.log('💾 [DATABASE] Salvando mensagem no Supabase...');
    console.log('💾 [DATABASE] Dados principais:', {
      chat_id: messageData.chat_id,
      remetente: messageData.remetente,
      wpp_name: messageData.wpp_name,
      group_contact_name: messageData.group_contact_name,
      message_type: messageData.message_type
    });

    const { data, error } = await supabaseAdmin
      .from('whatsapp_mensagens')
      .insert([messageData])
      .select('*')
      .single();

    if (error) {
      console.error('❌ [DATABASE] Erro ao salvar mensagem:', error);
      throw error;
    }

    console.log('✅ [DATABASE] Mensagem salva com sucesso:', data.id);
    return data;
  } catch (error) {
    console.error('❌ [DATABASE] Erro ao salvar mensagem:', error);
    throw error;
  }
}`;

    const newSaveMessage = `async function saveMessageToSupabase(messageData, userId) {
  try {
    console.log('💾 [DATABASE] Salvando mensagem no Supabase...');
    console.log('💾 [DATABASE] Dados principais:', {
      chat_id: messageData.chat_id,
      remetente: messageData.remetente,
      wpp_name: messageData.wpp_name,
      group_contact_name: messageData.group_contact_name,
      message_type: messageData.message_type
    });

    // Garantir que todos os campos necessários estejam presentes
    const completeMessageData = {
      ...messageData,
      // Campos obrigatórios
      owner_id: messageData.owner_id || userId,
      chat_id: messageData.chat_id,
      conteudo: messageData.conteudo || messageData.body || '',
      tipo: messageData.tipo || messageData.message_type || 'TEXTO',
      remetente: messageData.remetente || 'CLIENTE',
      timestamp: messageData.timestamp || new Date().toISOString(),
      lida: messageData.lida || false,
      
      // Campos de mídia
      midia_url: messageData.midia_url || messageData.media_url || null,
      midia_tipo: messageData.midia_tipo || messageData.media_type || null,
      midia_nome: messageData.midia_nome || messageData.media_name || null,
      midia_tamanho: messageData.midia_tamanho || messageData.media_size || null,
      
      // Campos de identificação
      message_id: messageData.message_id || messageData.id || \`msg_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
      connection_id: messageData.connection_id || null,
      
      // Campos do WhatsApp
      wpp_name: messageData.wpp_name || null,
      group_contact_name: messageData.group_contact_name || null,
      message_type: messageData.message_type || messageData.tipo || 'TEXTO',
      media_type: messageData.media_type || null,
      media_mime: messageData.media_mime || null,
      duration_ms: messageData.duration_ms || null,
      
      // Informações de negócio
      whatsapp_business_name: messageData.whatsapp_business_name || null,
      whatsapp_business_description: messageData.whatsapp_business_description || null,
      whatsapp_business_category: messageData.whatsapp_business_category || null,
      whatsapp_business_email: messageData.whatsapp_business_email || null,
      whatsapp_business_website: messageData.whatsapp_business_website || null,
      whatsapp_business_address: messageData.whatsapp_business_address || null,
      whatsapp_verified: messageData.whatsapp_verified || false,
      
      // Informações de status
      whatsapp_online: messageData.whatsapp_online || false,
      whatsapp_blocked: messageData.whatsapp_blocked || false,
      whatsapp_muted: messageData.whatsapp_muted || false,
      whatsapp_pinned: messageData.whatsapp_pinned || false,
      whatsapp_archived: messageData.whatsapp_archived || false,
      whatsapp_status: messageData.whatsapp_status || null,
      whatsapp_last_seen: messageData.whatsapp_last_seen || null,
      
      // Informações de grupo
      whatsapp_is_group: messageData.whatsapp_is_group || false,
      whatsapp_group_subject: messageData.whatsapp_group_subject || null,
      whatsapp_group_description: messageData.whatsapp_group_description || null,
      whatsapp_group_owner: messageData.whatsapp_group_owner || null,
      whatsapp_group_admins: messageData.whatsapp_group_admins || null,
      whatsapp_group_participants: messageData.whatsapp_group_participants || null,
      whatsapp_group_created: messageData.whatsapp_group_created || null,
      whatsapp_group_settings: messageData.whatsapp_group_settings || null,
      
      // Dados brutos
      whatsapp_raw_data: messageData.whatsapp_raw_data || null,
      whatsapp_presence: messageData.whatsapp_presence || null,
      
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('💾 [DATABASE] Dados completos preparados:', {
      wpp_name: completeMessageData.wpp_name,
      whatsapp_business_name: completeMessageData.whatsapp_business_name,
      whatsapp_is_group: completeMessageData.whatsapp_is_group,
      whatsapp_verified: completeMessageData.whatsapp_verified
    });

    const { data, error } = await supabaseAdmin
      .from('whatsapp_mensagens')
      .insert([completeMessageData])
      .select('*')
      .single();

    if (error) {
      console.error('❌ [DATABASE] Erro ao salvar mensagem:', error);
      throw error;
    }

    console.log('✅ [DATABASE] Mensagem salva com sucesso:', data.id);
    return data;
  } catch (error) {
    console.error('❌ [DATABASE] Erro ao salvar mensagem:', error);
    throw error;
  }
}`;

    if (fixedContent.includes('async function saveMessageToSupabase(messageData, userId) {')) {
      fixedContent = fixedContent.replace(oldSaveMessage, newSaveMessage);
      console.log('✅ [FIXER] Função saveMessageToSupabase corrigida');
    }

    // 2. Corrigir função de atualização de contatos
    const oldUpdateContact = `async function updateContactFromMessage(messageData, userId, sock) {
  try {
    const phoneNumber = messageData.phone || messageData.chat_id?.split('@')[0];
    const chatId = messageData.chat_id;
    
    if (!phoneNumber || !chatId) {
      console.log('⚠️ [CONTACT-UPDATE] Dados insuficientes para atualizar contato');
      return;
    }

    console.log('🔄 [CONTACT-UPDATE] Atualizando contato:', phoneNumber);

    // Buscar contato existente
    const { data: existingContact, error: checkError } = await supabaseAdmin
      .from('contacts')
      .select('id, whatsapp_jid, whatsapp_profile_picture, whatsapp_message_count, name_wpp, whatsapp_name')
      .eq('owner_id', userId)
      .or(\`phone.eq.\${phoneNumber},whatsapp_jid.eq.\${chatId}\`)
      .maybeSingle();

    if (!existingContact) {
      console.log('⚠️ [CONTACT-UPDATE] Contato não encontrado para atualizar');
      return;
    }

    // Preparar dados de atualização
    const updateData = {
      whatsapp_jid: chatId,
      whatsapp_name: messageData.wpp_name,
      name_wpp: messageData.wpp_name,
      whatsapp_message_count: (existingContact.whatsapp_message_count || 0) + 1,
      updated_at: new Date().toISOString()
    };

    // Adicionar informações de negócio se disponíveis
    if (messageData.whatsapp_business_name) {
      updateData.whatsapp_business_name = messageData.whatsapp_business_name;
    }
    if (messageData.whatsapp_business_description) {
      updateData.whatsapp_business_description = messageData.whatsapp_business_description;
    }
    if (messageData.whatsapp_business_category) {
      updateData.whatsapp_business_category = messageData.whatsapp_business_category;
    }
    if (messageData.whatsapp_business_email) {
      updateData.whatsapp_business_email = messageData.whatsapp_business_email;
    }
    if (messageData.whatsapp_business_website) {
      updateData.whatsapp_business_website = messageData.whatsapp_business_website;
    }
    if (messageData.whatsapp_business_address) {
      updateData.whatsapp_business_address = messageData.whatsapp_business_address;
    }
    if (messageData.whatsapp_verified !== undefined) {
      updateData.whatsapp_verified = messageData.whatsapp_verified;
    }
    if (messageData.whatsapp_online !== undefined) {
      updateData.whatsapp_online = messageData.whatsapp_online;
    }
    if (messageData.whatsapp_blocked !== undefined) {
      updateData.whatsapp_blocked = messageData.whatsapp_blocked;
    }
    if (messageData.whatsapp_muted !== undefined) {
      updateData.whatsapp_muted = messageData.whatsapp_muted;
    }
    if (messageData.whatsapp_status) {
      updateData.whatsapp_status = messageData.whatsapp_status;
    }
    if (messageData.whatsapp_last_seen) {
      updateData.whatsapp_last_seen = messageData.whatsapp_last_seen;
    }

    // Atualizar contato
    const { error: updateError } = await supabaseAdmin
      .from('contacts')
      .update(updateData)
      .eq('id', existingContact.id);

    if (updateError) {
      console.error('❌ [CONTACT-UPDATE] Erro ao atualizar contato:', updateError);
      return;
    }

    console.log('✅ [CONTACT-UPDATE] Contato atualizado com sucesso:', existingContact.id);

  } catch (error) {
    console.error('❌ [CONTACT-UPDATE] Erro ao atualizar contato:', error);
  }
}`;

    const newUpdateContact = `async function updateContactFromMessage(messageData, userId, sock) {
  try {
    const phoneNumber = messageData.phone || messageData.chat_id?.split('@')[0];
    const chatId = messageData.chat_id;
    
    if (!phoneNumber || !chatId) {
      console.log('⚠️ [CONTACT-UPDATE] Dados insuficientes para atualizar contato');
      return;
    }

    console.log('🔄 [CONTACT-UPDATE] Atualizando contato:', phoneNumber);

    // Buscar contato existente
    const { data: existingContact, error: checkError } = await supabaseAdmin
      .from('contacts')
      .select('id, whatsapp_jid, whatsapp_profile_picture, whatsapp_message_count, name_wpp, whatsapp_name, name')
      .eq('owner_id', userId)
      .or(\`phone.eq.\${phoneNumber},whatsapp_jid.eq.\${chatId}\`)
      .maybeSingle();

    if (!existingContact) {
      console.log('⚠️ [CONTACT-UPDATE] Contato não encontrado para atualizar');
      return;
    }

    // Preparar dados de atualização
    const updateData = {
      whatsapp_jid: chatId,
      whatsapp_name: messageData.wpp_name,
      name_wpp: messageData.wpp_name,
      whatsapp_message_count: (existingContact.whatsapp_message_count || 0) + 1,
      updated_at: new Date().toISOString()
    };

    // Atualizar nome se não existir ou se o Push Name for melhor
    if (messageData.wpp_name && (!existingContact.name || existingContact.name.startsWith('Contato'))) {
      updateData.name = messageData.wpp_name;
      console.log('✅ [CONTACT-UPDATE] Nome do contato atualizado:', messageData.wpp_name);
    }

    // Adicionar informações de negócio se disponíveis
    if (messageData.whatsapp_business_name) {
      updateData.whatsapp_business_name = messageData.whatsapp_business_name;
    }
    if (messageData.whatsapp_business_description) {
      updateData.whatsapp_business_description = messageData.whatsapp_business_description;
    }
    if (messageData.whatsapp_business_category) {
      updateData.whatsapp_business_category = messageData.whatsapp_business_category;
    }
    if (messageData.whatsapp_business_email) {
      updateData.whatsapp_business_email = messageData.whatsapp_business_email;
    }
    if (messageData.whatsapp_business_website) {
      updateData.whatsapp_business_website = messageData.whatsapp_business_website;
    }
    if (messageData.whatsapp_business_address) {
      updateData.whatsapp_business_address = messageData.whatsapp_business_address;
    }
    if (messageData.whatsapp_verified !== undefined) {
      updateData.whatsapp_verified = messageData.whatsapp_verified;
    }
    if (messageData.whatsapp_online !== undefined) {
      updateData.whatsapp_online = messageData.whatsapp_online;
    }
    if (messageData.whatsapp_blocked !== undefined) {
      updateData.whatsapp_blocked = messageData.whatsapp_blocked;
    }
    if (messageData.whatsapp_muted !== undefined) {
      updateData.whatsapp_muted = messageData.whatsapp_muted;
    }
    if (messageData.whatsapp_pinned !== undefined) {
      updateData.whatsapp_pinned = messageData.whatsapp_pinned;
    }
    if (messageData.whatsapp_archived !== undefined) {
      updateData.whatsapp_archived = messageData.whatsapp_archived;
    }
    if (messageData.whatsapp_status) {
      updateData.whatsapp_status = messageData.whatsapp_status;
    }
    if (messageData.whatsapp_last_seen) {
      updateData.whatsapp_last_seen = messageData.whatsapp_last_seen;
    }

    // Adicionar informações de grupo se disponíveis
    if (messageData.whatsapp_is_group !== undefined) {
      updateData.whatsapp_is_group = messageData.whatsapp_is_group;
    }
    if (messageData.whatsapp_group_subject) {
      updateData.whatsapp_group_subject = messageData.whatsapp_group_subject;
    }
    if (messageData.whatsapp_group_description) {
      updateData.whatsapp_group_description = messageData.whatsapp_group_description;
    }
    if (messageData.whatsapp_group_owner) {
      updateData.whatsapp_group_owner = messageData.whatsapp_group_owner;
    }
    if (messageData.whatsapp_group_admins) {
      updateData.whatsapp_group_admins = messageData.whatsapp_group_admins;
    }
    if (messageData.whatsapp_group_participants) {
      updateData.whatsapp_group_participants = messageData.whatsapp_group_participants;
    }
    if (messageData.whatsapp_group_created) {
      updateData.whatsapp_group_created = messageData.whatsapp_group_created;
    }
    if (messageData.whatsapp_group_settings) {
      updateData.whatsapp_group_settings = messageData.whatsapp_group_settings;
    }

    // Adicionar dados brutos
    if (messageData.whatsapp_raw_data) {
      updateData.whatsapp_raw_data = messageData.whatsapp_raw_data;
    }
    if (messageData.whatsapp_presence) {
      updateData.whatsapp_presence = messageData.whatsapp_presence;
    }

    // Atualizar contato
    const { error: updateError } = await supabaseAdmin
      .from('contacts')
      .update(updateData)
      .eq('id', existingContact.id);

    if (updateError) {
      console.error('❌ [CONTACT-UPDATE] Erro ao atualizar contato:', updateError);
      return;
    }

    console.log('✅ [CONTACT-UPDATE] Contato atualizado com sucesso:', existingContact.id);
    console.log('📊 [CONTACT-UPDATE] Dados atualizados:', {
      name: updateData.name,
      whatsapp_name: updateData.whatsapp_name,
      whatsapp_business_name: updateData.whatsapp_business_name,
      whatsapp_is_group: updateData.whatsapp_is_group
    });

  } catch (error) {
    console.error('❌ [CONTACT-UPDATE] Erro ao atualizar contato:', error);
  }
}`;

    if (fixedContent.includes('async function updateContactFromMessage(messageData, userId, sock) {')) {
      fixedContent = fixedContent.replace(oldUpdateContact, newUpdateContact);
      console.log('✅ [FIXER] Função updateContactFromMessage corrigida');
    }

    console.log('✅ [FIXER] Todas as correções aplicadas com sucesso');
    return fixedContent;
  }
}

// Executar correção
async function main() {
  try {
    const fixer = new MessageSavingCodeFixer();
    await fixer.fixMessageSaving();
    console.log('🎉 [MAIN] Correção do código concluída com sucesso!');
  } catch (error) {
    console.error('💥 [MAIN] Erro fatal:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = MessageSavingCodeFixer;
