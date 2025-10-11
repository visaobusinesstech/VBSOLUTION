/**
 * WhatsAppProfileSyncService - Serviço para sincronização de perfis
 * Versão otimizada com logger profissional Pino
 */

const { createClient } = require('@supabase/supabase-js');
const logger = require('./logger');

class WhatsAppProfileSyncService {
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.extractor = null;
    this.syncInProgress = false;
    this.lastSyncTime = null;
  }

  // Inicializar o serviço com extractor
  initialize(extractor) {
    this.extractor = extractor;
    logger.debug('[PROFILE-SYNC] Serviço inicializado');
  }

  // Sincronização completa de todos os contatos e grupos
  async syncAllProfiles(ownerId, connectionId) {
    if (this.syncInProgress) {
      logger.warn('[PROFILE-SYNC] Sincronização já em andamento');
      return;
    }

    if (!this.extractor) {
      logger.error('[PROFILE-SYNC] Extrator não inicializado');
      return;
    }

    this.syncInProgress = true;
    logger.info('[PROFILE-SYNC] Iniciando sincronização completa...');

    try {
      // 1. Buscar todos os grupos participantes
      const groups = await this.extractor.fetchAllParticipatingGroups();
      logger.info(`[PROFILE-SYNC] Encontrados ${Object.keys(groups).length} grupos`);

      // 2. Processar cada grupo
      for (const [groupId, groupData] of Object.entries(groups)) {
        try {
          await this.syncGroupProfile(groupId, ownerId, connectionId);
          await this.delay(1000); // Evitar rate limiting
        } catch (error) {
          logger.error(`[PROFILE-SYNC] Erro ao processar grupo ${groupId}:`, error.message);
        }
      }

      // 3. Buscar contatos individuais do store
      if (this.extractor.sock?.store?.contacts) {
        const individualContacts = Object.keys(this.extractor.sock.store.contacts)
          .filter(contactId => !contactId.includes('@g.us'));
        
        logger.info(`[PROFILE-SYNC] Encontrados ${individualContacts.length} contatos individuais`);

        for (const contactId of individualContacts) {
          try {
            await this.syncContactProfile(contactId, ownerId, connectionId);
            await this.delay(500); // Evitar rate limiting
          } catch (error) {
            logger.error(`[PROFILE-SYNC] Erro ao processar contato ${contactId}:`, error.message);
          }
        }
      }

      this.lastSyncTime = new Date();
      logger.success('[PROFILE-SYNC] Sincronização completa finalizada');

    } catch (error) {
      logger.error('[PROFILE-SYNC] Erro na sincronização:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sincronizar perfil de um grupo específico
  async syncGroupProfile(groupId, ownerId, connectionId) {
    try {
      logger.trace(`[GROUP-SYNC] Sincronizando grupo: ${groupId}`);

      const groupInfo = await this.extractor.extractFullContactInfo(groupId);
      
      if (!groupInfo) {
        logger.trace('[GROUP-SYNC] Informações não encontradas');
        return;
      }

      await this.saveGroupToContacts(groupInfo, ownerId, connectionId);
      logger.trace(`[GROUP-SYNC] Sincronizado: ${groupInfo.groupSubject || groupId}`);

    } catch (error) {
      logger.error(`[GROUP-SYNC] Erro em ${groupId}:`, error);
    }
  }

  // Sincronizar perfil de um contato específico
  async syncContactProfile(contactId, ownerId, connectionId) {
    try {
      logger.trace(`[CONTACT-SYNC] Sincronizando: ${contactId}`);

      const contactInfo = await this.extractor.extractFullContactInfo(contactId);
      
      if (!contactInfo) {
        logger.trace('[CONTACT-SYNC] Informações não encontradas');
        return;
      }

      await this.saveContactToContacts(contactInfo, ownerId, connectionId);
      logger.trace(`[CONTACT-SYNC] Sincronizado: ${contactInfo.name || contactId}`);

    } catch (error) {
      logger.error(`[CONTACT-SYNC] Erro em ${contactId}:`, error);
    }
  }

  // Salvar grupo na tabela contacts
  async saveGroupToContacts(groupInfo, ownerId, connectionId) {
    try {
      const { data: existingContact, error: findError } = await this.supabase
        .from('contacts')
        .select('id')
        .eq('whatsapp_jid', groupInfo.chatId)
        .eq('owner_id', ownerId)
        .single();

      const contactData = {
        owner_id: ownerId,
        connection_id: connectionId,
        name: groupInfo.groupSubject || groupInfo.phone || 'Grupo',
        phone: groupInfo.phone,
        whatsapp_jid: groupInfo.chatId,
        whatsapp_name: groupInfo.groupSubject,
        whatsapp_profile_picture: groupInfo.profilePicture,
        whatsapp_is_group: true,
        whatsapp_group_subject: groupInfo.groupSubject,
        whatsapp_group_description: groupInfo.groupDescription,
        whatsapp_group_owner: groupInfo.groupOwner,
        whatsapp_group_participants: groupInfo.participants,
        whatsapp_group_admins: groupInfo.groupAdmins,
        whatsapp_group_created: groupInfo.groupCreated,
        updated_at: new Date().toISOString()
      };

      if (existingContact) {
        await this.supabase
          .from('contacts')
          .update(contactData)
          .eq('id', existingContact.id);
        logger.trace(`[GROUP-SAVE] Atualizado: ${groupInfo.groupSubject}`);
      } else {
        contactData.created_at = new Date().toISOString();
        await this.supabase
          .from('contacts')
          .insert(contactData);
        logger.trace(`[GROUP-SAVE] Criado: ${groupInfo.groupSubject}`);
      }

    } catch (error) {
      logger.error('[GROUP-SAVE] Erro ao salvar:', error);
    }
  }

  // Salvar contato na tabela contacts
  async saveContactToContacts(contactInfo, ownerId, connectionId) {
    try {
      const { data: existingContact, error: findError } = await this.supabase
        .from('contacts')
        .select('id')
        .eq('whatsapp_jid', contactInfo.chatId)
        .eq('owner_id', ownerId)
        .single();

      const contactData = {
        owner_id: ownerId,
        connection_id: connectionId,
        name: contactInfo.name || contactInfo.pushName || contactInfo.phone || 'Contato',
        phone: contactInfo.phone,
        whatsapp_jid: contactInfo.chatId,
        whatsapp_name: contactInfo.name,
        whatsapp_profile_picture: contactInfo.profilePicture,
        whatsapp_is_business: contactInfo.isBusiness,
        whatsapp_verified: contactInfo.isVerified,
        whatsapp_business_name: contactInfo.businessName,
        whatsapp_business_description: contactInfo.businessDescription,
        whatsapp_business_category: contactInfo.businessCategory,
        whatsapp_business_email: contactInfo.businessEmail,
        whatsapp_business_website: contactInfo.businessWebsite,
        updated_at: new Date().toISOString()
      };

      if (existingContact) {
        await this.supabase
          .from('contacts')
          .update(contactData)
          .eq('id', existingContact.id);
        logger.trace(`[CONTACT-SAVE] Atualizado: ${contactInfo.name}`);
      } else {
        contactData.created_at = new Date().toISOString();
        await this.supabase
          .from('contacts')
          .insert(contactData);
        logger.trace(`[CONTACT-SAVE] Criado: ${contactInfo.name}`);
      }

    } catch (error) {
      logger.error('[CONTACT-SAVE] Erro ao salvar:', error);
    }
  }

  // Delay helper
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = WhatsAppProfileSyncService;

