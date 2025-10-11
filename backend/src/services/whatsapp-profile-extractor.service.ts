import { WASocket } from '@whiskeysockets/baileys';
import { supabase } from '../supabaseClient';
import logger from '../logger';

export interface WhatsAppContactInfo {
  // Informações básicas
  phone: string;
  jid: string;
  wpp_name?: string; // pushName
  full_name?: string;
  
  // Informações de negócio
  business_name?: string;
  business_description?: string;
  business_email?: string;
  business_website?: string;
  business_verified?: boolean;
  business_category?: string;
  
  // Informações de grupo (se aplicável)
  is_group: boolean;
  group_subject?: string;
  group_description?: string;
  group_participants?: number;
  group_owner?: string;
  
  // Metadados
  profile_picture_url?: string;
  status?: string;
  is_business: boolean;
}

export interface GroupInfo {
  id: string;
  subject: string;
  description?: string;
  participants: number;
  owner?: string;
  creation?: number;
  participants_list?: any[];
}

export class WhatsAppProfileExtractorService {
  private socket: WASocket;
  private retryAttempts = 3;
  private retryDelay = 1000; // 1 segundo

  constructor(socket: WASocket) {
    this.socket = socket;
  }

  /**
   * Extrai informações completas de um contato ou grupo
   */
  async extractCompleteProfile(jid: string): Promise<WhatsAppContactInfo | null> {
    try {
      console.log(`🔍 [PROFILE-EXTRACTOR] Iniciando extração completa para: ${jid}`);
      
      const isGroup = jid.endsWith('@g.us');
      const phone = jid.replace('@s.whatsapp.net', '').replace('@g.us', '');
      
      const profileInfo: WhatsAppContactInfo = {
        phone,
        jid,
        is_group: isGroup,
        is_business: false
      };

      if (isGroup) {
        // Extrair informações do grupo
        await this.extractGroupInfo(jid, profileInfo);
      } else {
        // Extrair informações do contato individual
        await this.extractContactInfo(jid, profileInfo);
      }

      console.log(`✅ [PROFILE-EXTRACTOR] Extração completa finalizada para: ${jid}`);
      return profileInfo;

    } catch (error) {
      console.error(`❌ [PROFILE-EXTRACTOR] Erro na extração para ${jid}:`, error);
      return null;
    }
  }

  /**
   * Extrai informações de um contato individual
   */
  private async extractContactInfo(jid: string, profileInfo: WhatsAppContactInfo): Promise<void> {
    try {
      console.log(`👤 [CONTACT-INFO] Extraindo informações do contato: ${jid}`);

      // 1. Informações básicas do contato
      const contactInfo = await this.getContactBasicInfo(jid);
      if (contactInfo) {
        profileInfo.wpp_name = contactInfo.pushName || contactInfo.name;
        profileInfo.full_name = contactInfo.name;
        profileInfo.profile_picture_url = contactInfo.profilePictureUrl;
        profileInfo.status = contactInfo.status;
      }

      // 2. Verificar se é um negócio e extrair informações
      const isBusiness = await this.isBusinessContact(jid);
      if (isBusiness) {
        profileInfo.is_business = true;
        await this.extractBusinessInfo(jid, profileInfo);
      }

      console.log(`✅ [CONTACT-INFO] Informações do contato extraídas:`, {
        wpp_name: profileInfo.wpp_name,
        full_name: profileInfo.full_name,
        is_business: profileInfo.is_business,
        business_name: profileInfo.business_name
      });

    } catch (error) {
      console.error(`❌ [CONTACT-INFO] Erro ao extrair informações do contato:`, error);
    }
  }

  /**
   * Extrai informações de um grupo
   */
  private async extractGroupInfo(jid: string, profileInfo: WhatsAppContactInfo): Promise<void> {
    try {
      console.log(`👥 [GROUP-INFO] Extraindo informações do grupo: ${jid}`);

      const groupInfo = await this.getGroupMetadata(jid);
      if (groupInfo) {
        profileInfo.group_subject = groupInfo.subject;
        profileInfo.group_description = groupInfo.description;
        profileInfo.group_participants = groupInfo.participants?.length || 0;
        profileInfo.group_owner = groupInfo.owner;
        profileInfo.wpp_name = groupInfo.subject; // Para grupos, o nome é o subject
      }

      console.log(`✅ [GROUP-INFO] Informações do grupo extraídas:`, {
        subject: profileInfo.group_subject,
        participants: profileInfo.group_participants,
        owner: profileInfo.group_owner
      });

    } catch (error) {
      console.error(`❌ [GROUP-INFO] Erro ao extrair informações do grupo:`, error);
    }
  }

  /**
   * Obtém informações básicas do contato
   */
  private async getContactBasicInfo(jid: string): Promise<any> {
    try {
      // Tentar obter informações do contato
      const contactInfo = await this.socket.getContactInfo(jid);
      return contactInfo;
    } catch (error) {
      console.log(`⚠️ [CONTACT-BASIC] Não foi possível obter informações básicas para ${jid}`);
      return null;
    }
  }

  /**
   * Verifica se o contato é um negócio
   */
  private async isBusinessContact(jid: string): Promise<boolean> {
    try {
      // Verificar se tem perfil de negócio
      const businessProfile = await this.getBusinessProfile(jid);
      return !!businessProfile;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtém perfil de negócio com retry
   */
  private async getBusinessProfile(jid: string): Promise<any> {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`🏢 [BUSINESS-PROFILE] Tentativa ${attempt}/${this.retryAttempts} para ${jid}`);
        
        const profile = await this.socket.getBusinessProfile(jid);
        
        if (profile) {
          console.log(`✅ [BUSINESS-PROFILE] Perfil de negócio encontrado na tentativa ${attempt}`);
          return profile;
        }
      } catch (error) {
        console.log(`⚠️ [BUSINESS-PROFILE] Tentativa ${attempt} falhou para ${jid}:`, error.message);
        
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }
    
    console.log(`❌ [BUSINESS-PROFILE] Todas as tentativas falharam para ${jid}`);
    return null;
  }

  /**
   * Extrai informações de negócio
   */
  private async extractBusinessInfo(jid: string, profileInfo: WhatsAppContactInfo): Promise<void> {
    try {
      const businessProfile = await this.getBusinessProfile(jid);
      
      if (businessProfile) {
        profileInfo.business_name = businessProfile.business_name;
        profileInfo.business_description = businessProfile.description;
        profileInfo.business_email = businessProfile.email;
        profileInfo.business_website = businessProfile.website?.[0]; // Primeiro website
        profileInfo.business_verified = businessProfile.verified;
        profileInfo.business_category = businessProfile.category;
        
        console.log(`✅ [BUSINESS-INFO] Informações de negócio extraídas:`, {
          name: profileInfo.business_name,
          description: profileInfo.business_description?.substring(0, 50) + '...',
          email: profileInfo.business_email,
          website: profileInfo.business_website,
          verified: profileInfo.business_verified,
          category: profileInfo.business_category
        });
      }
    } catch (error) {
      console.error(`❌ [BUSINESS-INFO] Erro ao extrair informações de negócio:`, error);
    }
  }

  /**
   * Obtém metadados do grupo
   */
  private async getGroupMetadata(jid: string): Promise<any> {
    try {
      const groupMetadata = await this.socket.groupMetadata(jid);
      return groupMetadata;
    } catch (error) {
      console.log(`⚠️ [GROUP-METADATA] Não foi possível obter metadados do grupo ${jid}`);
      return null;
    }
  }

  /**
   * Obtém todos os grupos participando
   */
  async getAllParticipatingGroups(): Promise<GroupInfo[]> {
    try {
      console.log(`👥 [ALL-GROUPS] Obtendo todos os grupos participantes`);
      
      const response = await this.socket.groupFetchAllParticipating();
      const groups: GroupInfo[] = [];
      
      for (const [groupId, groupData] of Object.entries(response)) {
        groups.push({
          id: groupId,
          subject: groupData.subject,
          description: groupData.desc,
          participants: groupData.participants?.length || 0,
          owner: groupData.owner,
          creation: groupData.creation,
          participants_list: groupData.participants
        });
      }
      
      console.log(`✅ [ALL-GROUPS] ${groups.length} grupos encontrados`);
      return groups;
      
    } catch (error) {
      console.error(`❌ [ALL-GROUPS] Erro ao obter grupos:`, error);
      return [];
    }
  }

  /**
   * Salva informações do contato no Supabase (apenas para novos contatos)
   */
  async saveContactToSupabase(contactInfo: WhatsAppContactInfo, ownerId: string): Promise<boolean> {
    try {
      console.log(`💾 [SAVE-CONTACT] Verificando se deve salvar contato: ${contactInfo.jid}`);
      
      // Verificar se o contato já existe
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id, name_wpp, whatsapp_name')
        .eq('phone', contactInfo.phone)
        .eq('owner_id', ownerId)
        .single();

      if (existingContact) {
        // Contato já existe - apenas atualizar informações se estão vazias
        const updateData: any = {};
        
        if (!existingContact.name_wpp && contactInfo.wpp_name) {
          updateData.name_wpp = contactInfo.wpp_name;
        }
        if (!existingContact.whatsapp_name && contactInfo.wpp_name) {
          updateData.whatsapp_name = contactInfo.wpp_name;
        }
        
        if (Object.keys(updateData).length > 0) {
          updateData.updated_at = new Date().toISOString();
          
          const { error } = await supabase
            .from('contacts')
            .update(updateData)
            .eq('id', existingContact.id);
          
          if (error) throw error;
          console.log(`✅ [SAVE-CONTACT] Contato atualizado com informações novas: ${existingContact.id}`);
        } else {
          console.log(`ℹ️ [SAVE-CONTACT] Contato já existe com todas as informações: ${existingContact.id}`);
        }
      } else {
        // Novo contato - criar com todas as informações
        const contactData = {
          owner_id: ownerId,
          phone: contactInfo.phone,
          name: contactInfo.wpp_name || contactInfo.full_name || `Contato ${contactInfo.phone}`,
          name_wpp: contactInfo.wpp_name,
          whatsapp_name: contactInfo.wpp_name,
          whatsapp_business_name: contactInfo.business_name,
          whatsapp_business_description: contactInfo.business_description,
          whatsapp_business_email: contactInfo.business_email,
          whatsapp_business_website: contactInfo.business_website,
          whatsapp_business_category: contactInfo.business_category,
          whatsapp_verified: contactInfo.business_verified,
          whatsapp_group_subject: contactInfo.group_subject,
          whatsapp_group_description: contactInfo.group_description,
          whatsapp_group_participants: contactInfo.group_participants,
          whatsapp_group_owner: contactInfo.group_owner,
          whatsapp_profile_picture_url: contactInfo.profile_picture_url,
          whatsapp_status: contactInfo.status,
          whatsapp_is_group: contactInfo.is_group,
          is_whatsapp_business: contactInfo.is_business,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('contacts')
          .insert([contactData])
          .select('id')
          .single();
        
        if (error) throw error;
        console.log(`✅ [SAVE-CONTACT] Novo contato criado: ${data.id}`);
      }

      return true;
    } catch (error) {
      console.error(`❌ [SAVE-CONTACT] Erro ao salvar contato:`, error);
      return false;
    }
  }

  /**
   * Obtém nome de exibição para a interface
   */
  getDisplayName(contactInfo: WhatsAppContactInfo): string {
    if (contactInfo.is_group) {
      return contactInfo.group_subject || `Grupo ${contactInfo.phone}`;
    }
    
    return contactInfo.wpp_name || 
           contactInfo.business_name || 
           contactInfo.full_name || 
           `Contato ${contactInfo.phone}`;
  }

  /**
   * Função auxiliar para delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
