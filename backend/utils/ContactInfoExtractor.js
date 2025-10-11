/**
 * ContactInfoExtractor - Módulo para extração de informações de contatos e grupos
 * Versão otimizada com logger profissional Pino
 */

const logger = require('./logger');

class ContactInfoExtractor {
  constructor(sock) {
    this.sock = sock;
    this.contactCache = new Map();
    this.groupCache = new Map();
  }

  // Método para obter todos os grupos participantes
  async fetchAllParticipatingGroups() {
    try {
      logger.trace('[GROUP-FETCH] Buscando grupos participantes...');
      
      if (typeof this.sock?.groupFetchAllParticipating === 'function') {
        const groups = await this.sock.groupFetchAllParticipating();
        logger.debug(`[GROUP-FETCH] Encontrados ${Object.keys(groups).length} grupos`);
        return groups;
      } else {
        logger.trace('[GROUP-FETCH] groupFetchAllParticipating não disponível');
        return {};
      }
    } catch (error) {
      logger.error('[GROUP-FETCH] Erro ao buscar grupos:', error);
      return {};
    }
  }

  // Método principal para extrair todas as informações de um contato
  async extractFullContactInfo(chatId, message = null) {
    logger.trace(`[CONTACT-EXTRACTOR] Iniciando extração: ${chatId}`);
    
    const contactInfo = {
      chatId,
      phone: this.extractPhoneFromChatId(chatId),
      isGroup: chatId.includes('@g.us'),
      isBusiness: false,
      isVerified: false,
      name: null,
      pushName: message?.pushName || null,
      businessName: null,
      businessDescription: null,
      businessCategory: null,
      businessEmail: null,
      businessWebsite: null,
      businessAddress: null,
      profilePicture: null,
      status: null,
      lastSeen: null,
      isOnline: false,
      isBlocked: false,
      isMuted: false,
      participants: [],
      groupSubject: null,
      groupDescription: null,
      groupOwner: null,
      groupAdmins: [],
      groupCreated: null,
      groupSettings: {},
      rawData: {}
    };

    try {
      // ETAPA 1: INFORMAÇÕES BÁSICAS
      if (this.sock?.store?.contacts?.[chatId]) {
        const contact = this.sock.store.contacts[chatId];
        contactInfo.name = contact.name || contact.notify || contact.vname;
        contactInfo.pushName = contact.pushName || contact.notify;
      }

      // ETAPA 2: INFORMAÇÕES DE NEGÓCIO
      if (typeof this.sock?.getBusinessProfile === 'function') {
        try {
          // Tentar com retry para business profile
          let businessProfile = null;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              businessProfile = await Promise.race([
                this.sock.getBusinessProfile(chatId),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
              ]);
              break;
            } catch (error) {
              if (attempt === 3) {
                logger.debug(`[BUSINESS] Tentativas esgotadas para ${chatId}`);
              }
            }
          }
          
          if (businessProfile) {
            contactInfo.isBusiness = true;
            contactInfo.businessName = businessProfile.business_name || null;
            contactInfo.businessDescription = businessProfile.description || null;
            contactInfo.businessCategory = businessProfile.category || null;
            contactInfo.businessEmail = businessProfile.email || null;
            contactInfo.businessWebsite = businessProfile.website ? (Array.isArray(businessProfile.website) ? businessProfile.website[0] : businessProfile.website) : null;
            contactInfo.businessAddress = businessProfile.address || null;
            contactInfo.isVerified = businessProfile.verified || false;
            logger.trace(`[BUSINESS] Perfil encontrado: ${contactInfo.businessName}`);
          }
        } catch (error) {
          logger.trace('[BUSINESS] Perfil não disponível');
        }
      }

      // ETAPA 3: INFORMAÇÕES DE PERFIL
      if (typeof this.sock?.profilePictureUrl === 'function') {
        try {
          const profilePic = await this.sock.profilePictureUrl(chatId);
          if (profilePic) {
            contactInfo.profilePicture = profilePic;
          }
        } catch (error) {
          logger.trace('[PROFILE] Foto não disponível');
        }
      }

      // ETAPA 4: STATUS E PRESENÇA
      if (typeof this.sock?.getStatus === 'function') {
        try {
          const status = await this.sock.getStatus(contactInfo.chatId);
          if (status) {
            contactInfo.status = status.status;
            contactInfo.lastSeen = status.setAt ? new Date(status.setAt).toISOString() : null;
          }
        } catch (error) {
          logger.trace('[STATUS] Status não disponível');
        }
      }

      // Verificar se está online
      if (this.sock?.store?.presences?.[contactInfo.chatId]) {
        const presence = this.sock.store.presences[contactInfo.chatId];
        contactInfo.isOnline = presence.lastSeen && (Date.now() - presence.lastSeen) < 30000;
        contactInfo.rawData.presence = presence;
      }

      // ETAPA 5: INFORMAÇÕES DE GRUPO
      if (contactInfo.isGroup) {
        if (typeof this.sock?.groupMetadata === 'function') {
          try {
            const groupMetadata = await this.sock.groupMetadata(chatId);
            if (groupMetadata) {
              contactInfo.groupSubject = groupMetadata.subject;
              contactInfo.groupDescription = groupMetadata.desc;
              contactInfo.groupOwner = groupMetadata.owner;
              contactInfo.groupAdmins = groupMetadata.participants.filter(p => p.admin === 'admin').map(p => p.id);
              contactInfo.groupCreated = groupMetadata.creation ? new Date(groupMetadata.creation * 1000).toISOString() : null;
              contactInfo.participants = groupMetadata.participants.map(p => ({
                id: p.id,
                admin: p.admin,
                name: p.name || p.id.split('@')[0]
              }));
              
              logger.trace(`[GROUP] Metadados: ${contactInfo.groupSubject} (${contactInfo.participants.length} participantes)`);
            }
          } catch (error) {
            logger.trace('[GROUP] Metadados não disponíveis');
          }
        }
      }

      // ETAPA 6: CONFIGURAÇÕES
      if (this.sock?.store?.chats?.[chatId]) {
        const chat = this.sock.store.chats[chatId];
        contactInfo.isBlocked = chat.blocked || false;
        contactInfo.isMuted = chat.muted || false;
        contactInfo.rawData.chat = chat;
      }

      logger.trace(`[CONTACT-EXTRACTOR] Extração completa: ${contactInfo.name || chatId}`);
      return contactInfo;

    } catch (error) {
      logger.error('[CONTACT-EXTRACTOR] Erro na extração:', error);
      return contactInfo; // Retornar informações parciais
    }
  }

  // Método auxiliar para extrair telefone do chatId
  extractPhoneFromChatId(chatId) {
    if (chatId.includes('@g.us')) {
      return chatId.split('@')[0];
    }
    return chatId.split('@')[0].replace('+', '');
  }
}

module.exports = ContactInfoExtractor;

