// Script para atualizar contatos existentes com dados do WhatsApp
// Execute este script após aplicar a migração SQL

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

class WhatsAppContactsUpdater {
  constructor() {
    this.updatedContacts = 0;
    this.updatedMessages = 0;
    this.errors = [];
  }

  async updateAllContacts() {
    console.log('🔄 [UPDATER] Iniciando atualização de contatos com dados do WhatsApp...');
    
    try {
      // 1. Buscar todos os contatos que têm dados do WhatsApp
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .not('phone', 'is', null);

      if (contactsError) {
        throw new Error(`Erro ao buscar contatos: ${contactsError.message}`);
      }

      console.log(`📊 [UPDATER] Encontrados ${contacts.length} contatos para atualizar`);

      // 2. Buscar todas as mensagens do WhatsApp
      const { data: messages, error: messagesError } = await supabase
        .from('whatsapp_mensagens')
        .select('*')
        .not('chat_id', 'is', null);

      if (messagesError) {
        throw new Error(`Erro ao buscar mensagens: ${messagesError.message}`);
      }

      console.log(`📊 [UPDATER] Encontradas ${messages.length} mensagens do WhatsApp`);

      // 3. Criar mapa de dados do WhatsApp por telefone
      const whatsappDataMap = this.createWhatsAppDataMap(messages);

      // 4. Atualizar contatos
      await this.updateContactsWithWhatsAppData(contacts, whatsappDataMap);

      // 5. Atualizar mensagens com Push Names
      await this.updateMessagesWithPushNames(messages);

      console.log('✅ [UPDATER] Atualização concluída!');
      console.log(`📈 [UPDATER] Contatos atualizados: ${this.updatedContacts}`);
      console.log(`📈 [UPDATER] Mensagens atualizadas: ${this.updatedMessages}`);
      console.log(`❌ [UPDATER] Erros: ${this.errors.length}`);

      if (this.errors.length > 0) {
        console.log('🔍 [UPDATER] Erros encontrados:');
        this.errors.forEach((error, index) => {
          console.log(`${index + 1}. ${error}`);
        });
      }

    } catch (error) {
      console.error('❌ [UPDATER] Erro geral:', error.message);
      throw error;
    }
  }

  createWhatsAppDataMap(messages) {
    console.log('🔄 [UPDATER] Criando mapa de dados do WhatsApp...');
    
    const dataMap = new Map();

    messages.forEach(message => {
      const phone = this.extractPhoneFromChatId(message.chat_id);
      if (!phone) return;

      if (!dataMap.has(phone)) {
        dataMap.set(phone, {
          wpp_name: message.wpp_name,
          group_contact_name: message.group_contact_name,
          whatsapp_business_name: message.whatsapp_business_name,
          whatsapp_business_description: message.whatsapp_business_description,
          whatsapp_business_category: message.whatsapp_business_category,
          whatsapp_business_email: message.whatsapp_business_email,
          whatsapp_business_website: message.whatsapp_business_website,
          whatsapp_business_address: message.whatsapp_business_address,
          whatsapp_verified: message.whatsapp_verified,
          whatsapp_online: message.whatsapp_online,
          whatsapp_blocked: message.whatsapp_blocked,
          whatsapp_muted: message.whatsapp_muted,
          whatsapp_status: message.whatsapp_status,
          whatsapp_last_seen: message.whatsapp_last_seen,
          whatsapp_is_group: message.whatsapp_is_group,
          whatsapp_group_subject: message.whatsapp_group_subject,
          whatsapp_group_description: message.whatsapp_group_description,
          whatsapp_group_owner: message.whatsapp_group_owner,
          whatsapp_group_admins: message.whatsapp_group_admins,
          whatsapp_group_participants: message.whatsapp_group_participants,
          whatsapp_group_created: message.whatsapp_group_created,
          whatsapp_group_settings: message.whatsapp_group_settings,
          whatsapp_raw_data: message.whatsapp_raw_data,
          whatsapp_presence: message.whatsapp_presence,
          whatsapp_jid: message.chat_id
        });
      } else {
        // Atualizar com dados mais recentes ou mais completos
        const existing = dataMap.get(phone);
        if (message.wpp_name && !existing.wpp_name) {
          existing.wpp_name = message.wpp_name;
        }
        if (message.whatsapp_business_name && !existing.whatsapp_business_name) {
          existing.whatsapp_business_name = message.whatsapp_business_name;
        }
        if (message.whatsapp_business_description && !existing.whatsapp_business_description) {
          existing.whatsapp_business_description = message.whatsapp_business_description;
        }
        if (message.whatsapp_business_category && !existing.whatsapp_business_category) {
          existing.whatsapp_business_category = message.whatsapp_business_category;
        }
        if (message.whatsapp_business_email && !existing.whatsapp_business_email) {
          existing.whatsapp_business_email = message.whatsapp_business_email;
        }
        if (message.whatsapp_business_website && !existing.whatsapp_business_website) {
          existing.whatsapp_business_website = message.whatsapp_business_website;
        }
        if (message.whatsapp_business_address && !existing.whatsapp_business_address) {
          existing.whatsapp_business_address = message.whatsapp_business_address;
        }
        if (message.whatsapp_verified !== null && existing.whatsapp_verified === null) {
          existing.whatsapp_verified = message.whatsapp_verified;
        }
        if (message.whatsapp_online !== null && existing.whatsapp_online === null) {
          existing.whatsapp_online = message.whatsapp_online;
        }
        if (message.whatsapp_blocked !== null && existing.whatsapp_blocked === null) {
          existing.whatsapp_blocked = message.whatsapp_blocked;
        }
        if (message.whatsapp_muted !== null && existing.whatsapp_muted === null) {
          existing.whatsapp_muted = message.whatsapp_muted;
        }
        if (message.whatsapp_status && !existing.whatsapp_status) {
          existing.whatsapp_status = message.whatsapp_status;
        }
        if (message.whatsapp_last_seen && !existing.whatsapp_last_seen) {
          existing.whatsapp_last_seen = message.whatsapp_last_seen;
        }
        if (message.whatsapp_is_group !== null && existing.whatsapp_is_group === null) {
          existing.whatsapp_is_group = message.whatsapp_is_group;
        }
        if (message.whatsapp_group_subject && !existing.whatsapp_group_subject) {
          existing.whatsapp_group_subject = message.whatsapp_group_subject;
        }
        if (message.whatsapp_group_description && !existing.whatsapp_group_description) {
          existing.whatsapp_group_description = message.whatsapp_group_description;
        }
        if (message.whatsapp_group_owner && !existing.whatsapp_group_owner) {
          existing.whatsapp_group_owner = message.whatsapp_group_owner;
        }
        if (message.whatsapp_group_admins && !existing.whatsapp_group_admins) {
          existing.whatsapp_group_admins = message.whatsapp_group_admins;
        }
        if (message.whatsapp_group_participants && !existing.whatsapp_group_participants) {
          existing.whatsapp_group_participants = message.whatsapp_group_participants;
        }
        if (message.whatsapp_group_created && !existing.whatsapp_group_created) {
          existing.whatsapp_group_created = message.whatsapp_group_created;
        }
        if (message.whatsapp_group_settings && !existing.whatsapp_group_settings) {
          existing.whatsapp_group_settings = message.whatsapp_group_settings;
        }
        if (message.whatsapp_raw_data && !existing.whatsapp_raw_data) {
          existing.whatsapp_raw_data = message.whatsapp_raw_data;
        }
        if (message.whatsapp_presence && !existing.whatsapp_presence) {
          existing.whatsapp_presence = message.whatsapp_presence;
        }
        if (message.chat_id && !existing.whatsapp_jid) {
          existing.whatsapp_jid = message.chat_id;
        }
      }
    });

    console.log(`✅ [UPDATER] Mapa criado com ${dataMap.size} contatos únicos`);
    return dataMap;
  }

  async updateContactsWithWhatsAppData(contacts, whatsappDataMap) {
    console.log('🔄 [UPDATER] Atualizando contatos com dados do WhatsApp...');

    for (const contact of contacts) {
      try {
        const phone = contact.phone;
        const whatsappData = whatsappDataMap.get(phone);

        if (!whatsappData) {
          console.log(`ℹ️ [UPDATER] Nenhum dado do WhatsApp encontrado para ${phone}`);
          continue;
        }

        // Preparar dados para atualização
        const updateData = {
          whatsapp_jid: whatsappData.whatsapp_jid,
          name_wpp: whatsappData.wpp_name,
          whatsapp_name: whatsappData.wpp_name,
          whatsapp_business_name: whatsappData.whatsapp_business_name,
          whatsapp_business_description: whatsappData.whatsapp_business_description,
          whatsapp_business_category: whatsappData.whatsapp_business_category,
          whatsapp_business_email: whatsappData.whatsapp_business_email,
          whatsapp_business_website: whatsappData.whatsapp_business_website,
          whatsapp_business_address: whatsappData.whatsapp_business_address,
          whatsapp_verified: whatsappData.whatsapp_verified,
          whatsapp_online: whatsappData.whatsapp_online,
          whatsapp_blocked: whatsappData.whatsapp_blocked,
          whatsapp_muted: whatsappData.whatsapp_muted,
          whatsapp_status: whatsappData.whatsapp_status,
          whatsapp_last_seen: whatsappData.whatsapp_last_seen,
          whatsapp_is_group: whatsappData.whatsapp_is_group,
          whatsapp_group_subject: whatsappData.whatsapp_group_subject,
          whatsapp_group_description: whatsappData.whatsapp_group_description,
          whatsapp_group_owner: whatsappData.whatsapp_group_owner,
          whatsapp_group_admins: whatsappData.whatsapp_group_admins,
          whatsapp_group_participants: whatsappData.whatsapp_group_participants,
          whatsapp_group_created: whatsappData.whatsapp_group_created,
          whatsapp_group_settings: whatsappData.whatsapp_group_settings,
          whatsapp_raw_data: whatsappData.whatsapp_raw_data,
          whatsapp_presence: whatsappData.whatsapp_presence,
          updated_at: new Date().toISOString()
        };

        // Atualizar nome se não existir ou se o Push Name for melhor
        if (whatsappData.wpp_name && (!contact.name || contact.name.startsWith('Contato'))) {
          updateData.name = whatsappData.wpp_name;
        }

        // Atualizar contato
        const { error } = await supabase
          .from('contacts')
          .update(updateData)
          .eq('id', contact.id);

        if (error) {
          throw new Error(`Erro ao atualizar contato ${contact.id}: ${error.message}`);
        }

        this.updatedContacts++;
        console.log(`✅ [UPDATER] Contato atualizado: ${contact.name || contact.phone} -> ${whatsappData.wpp_name || 'Sem nome'}`);

      } catch (error) {
        const errorMsg = `Erro ao atualizar contato ${contact.id} (${contact.phone}): ${error.message}`;
        this.errors.push(errorMsg);
        console.error(`❌ [UPDATER] ${errorMsg}`);
      }
    }
  }

  async updateMessagesWithPushNames(messages) {
    console.log('🔄 [UPDATER] Atualizando mensagens com Push Names...');

    for (const message of messages) {
      try {
        // Se já tem wpp_name, pular
        if (message.wpp_name) {
          continue;
        }

        // Tentar extrair nome do chat_id ou usar dados existentes
        let wpp_name = null;
        
        if (message.whatsapp_group_subject) {
          wpp_name = message.whatsapp_group_subject;
        } else if (message.whatsapp_business_name) {
          wpp_name = message.whatsapp_business_name;
        } else {
          // Usar parte do chat_id como fallback
          const phone = this.extractPhoneFromChatId(message.chat_id);
          wpp_name = phone ? `Contato ${phone}` : 'Contato Desconhecido';
        }

        // Atualizar mensagem
        const { error } = await supabase
          .from('whatsapp_mensagens')
          .update({
            wpp_name: wpp_name,
            updated_at: new Date().toISOString()
          })
          .eq('id', message.id);

        if (error) {
          throw new Error(`Erro ao atualizar mensagem ${message.id}: ${error.message}`);
        }

        this.updatedMessages++;
        console.log(`✅ [UPDATER] Mensagem atualizada: ${message.id} -> ${wpp_name}`);

      } catch (error) {
        const errorMsg = `Erro ao atualizar mensagem ${message.id}: ${error.message}`;
        this.errors.push(errorMsg);
        console.error(`❌ [UPDATER] ${errorMsg}`);
      }
    }
  }

  extractPhoneFromChatId(chatId) {
    if (!chatId) return null;
    if (chatId.includes('@g.us')) {
      return chatId.split('@')[0];
    }
    return chatId.split('@')[0];
  }
}

// Executar atualização
async function main() {
  try {
    const updater = new WhatsAppContactsUpdater();
    await updater.updateAllContacts();
    console.log('🎉 [MAIN] Atualização concluída com sucesso!');
  } catch (error) {
    console.error('💥 [MAIN] Erro fatal:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = WhatsAppContactsUpdater;
