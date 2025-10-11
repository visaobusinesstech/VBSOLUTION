import { supabase } from '../integrations/supabase';
import { BaileysService } from './baileys.service';
import { WhatsAppAdvancedService } from './whatsapp-advanced.service';

export interface WhatsAppContactData {
  jid: string;
  phone: string;
  whatsappName?: string;
  whatsappProfilePicture?: string;
  whatsappBusinessProfile?: any;
  whatsappPresence?: any;
  whatsappLastSeen?: Date;
  whatsappIsTyping?: boolean;
  whatsappIsOnline?: boolean;
  connectionId: string;
  ownerId: string;
  lastMessageContent?: string;
  lastMessageType?: string;
  lastMessageAt?: Date;
}

export class WhatsAppContactRegistrationService {
  constructor(
    private baileysService: BaileysService,
    private advancedService: WhatsAppAdvancedService
  ) {}

  /**
   * Registrar contato automaticamente quando receber mensagem do WhatsApp
   */
  async registerContactFromMessage(contactData: WhatsAppContactData): Promise<any> {
    try {
      console.log('🔄 Registrando contato do WhatsApp:', contactData.jid);

      // Verificar se contato já existe
      const existingContact = await this.findExistingContact(
        contactData.ownerId,
        contactData.phone,
        contactData.jid
      );

      if (existingContact) {
        console.log('✅ Contato já existe, atualizando dados:', existingContact.id);
        return await this.updateContactFromWhatsApp(existingContact.id, contactData);
      }

      // Buscar informações adicionais do WhatsApp
      const whatsappInfo = await this.fetchWhatsAppContactInfo(contactData);

      // Criar novo contato
      const newContact = await this.createContactFromWhatsApp({
        ...contactData,
        ...whatsappInfo
      });

      console.log('✅ Contato registrado com sucesso:', newContact.id);
      return newContact;

    } catch (error) {
      console.error('❌ Erro ao registrar contato:', error);
      throw error;
    }
  }

  /**
   * Buscar contato existente
   */
  private async findExistingContact(
    ownerId: string,
    phone: string,
    jid: string
  ): Promise<any> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('owner_id', ownerId)
      .or(`phone.eq.${phone},whatsapp_jid.eq.${jid}`)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar contato existente:', error);
      return null;
    }

    return data;
  }

  /**
   * Buscar informações adicionais do WhatsApp
   */
  private async fetchWhatsAppContactInfo(contactData: WhatsAppContactData): Promise<Partial<WhatsAppContactData>> {
    try {
      const connection = this.baileysService.getConnection(contactData.connectionId);
      if (!connection) {
        console.log('⚠️ Conexão WhatsApp não encontrada');
        return {};
      }

      const [profilePicture, businessProfile, presence] = await Promise.allSettled([
        this.advancedService.getProfilePicture(contactData.connectionId, contactData.jid),
        this.advancedService.getBusinessProfile(contactData.connectionId, contactData.jid),
        this.advancedService.subscribeToPresence(contactData.connectionId, contactData.jid)
      ]);

      return {
        whatsappProfilePicture: profilePicture.status === 'fulfilled' ? profilePicture.value : undefined,
        whatsappBusinessProfile: businessProfile.status === 'fulfilled' ? businessProfile.value : undefined,
        whatsappPresence: presence.status === 'fulfilled' ? presence.value : undefined,
        whatsappLastSeen: new Date(),
        whatsappIsOnline: true,
        whatsappIsTyping: false
      };

    } catch (error) {
      console.error('Erro ao buscar informações do WhatsApp:', error);
      return {};
    }
  }

  /**
   * Criar novo contato
   */
  private async createContactFromWhatsApp(contactData: WhatsAppContactData): Promise<any> {
    const contactPayload = {
      owner_id: contactData.ownerId,
      name: contactData.whatsappName || contactData.phone,
      phone: contactData.phone,
      whatsapp_jid: contactData.jid,
      whatsapp_name: contactData.whatsappName,
      whatsapp_profile_picture: contactData.whatsappProfilePicture,
      whatsapp_business_profile: contactData.whatsappBusinessProfile,
      whatsapp_presence: contactData.whatsappPresence,
      whatsapp_last_seen: contactData.whatsappLastSeen,
      whatsapp_is_typing: contactData.whatsappIsTyping || false,
      whatsapp_is_online: contactData.whatsappIsOnline || false,
      whatsapp_connection_id: contactData.connectionId,
      whatsapp_registered_at: new Date(),
      whatsapp_message_count: 1,
      whatsapp_last_message_at: contactData.lastMessageAt,
      whatsapp_last_message_content: contactData.lastMessageContent,
      whatsapp_last_message_type: contactData.lastMessageType,
      status: 'active',
      whatsapp_opted: true,
      ai_enabled: false,
      created_at: new Date(),
      updated_at: new Date(),
      last_contact_at: new Date()
    };

    const { data, error } = await supabase
      .from('contacts')
      .insert(contactPayload)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar contato:', error);
      throw error;
    }

    return data;
  }

  /**
   * Atualizar contato existente
   */
  private async updateContactFromWhatsApp(contactId: string, contactData: WhatsAppContactData): Promise<any> {
    const updatePayload: any = {
      whatsapp_name: contactData.whatsappName,
      whatsapp_profile_picture: contactData.whatsappProfilePicture,
      whatsapp_business_profile: contactData.whatsappBusinessProfile,
      whatsapp_presence: contactData.whatsappPresence,
      whatsapp_last_seen: contactData.whatsappLastSeen,
      whatsapp_is_typing: contactData.whatsappIsTyping,
      whatsapp_is_online: contactData.whatsappIsOnline,
      whatsapp_connection_id: contactData.connectionId,
      whatsapp_last_message_at: contactData.lastMessageAt,
      whatsapp_last_message_content: contactData.lastMessageContent,
      whatsapp_last_message_type: contactData.lastMessageType,
      last_contact_at: new Date(),
      updated_at: new Date()
    };

    // Incrementar contador de mensagens
    if (contactData.lastMessageAt) {
      updatePayload.whatsapp_message_count = supabase.rpc('increment_whatsapp_message_count', {
        contact_id: contactId
      });
    }

    const { data, error } = await supabase
      .from('contacts')
      .update(updatePayload)
      .eq('id', contactId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar contato:', error);
      throw error;
    }

    return data;
  }

  /**
   * Sincronizar todos os contatos de uma conexão WhatsApp
   */
  async syncAllWhatsAppContacts(connectionId: string, ownerId: string): Promise<any[]> {
    try {
      console.log('🔄 Sincronizando todos os contatos do WhatsApp...');

      const connection = this.baileysService.getConnection(connectionId);
      if (!connection) {
        throw new Error('Conexão WhatsApp não encontrada');
      }

      // Buscar todas as conversas do usuário
      const { data: conversations, error } = await supabase
        .from('whatsapp_mensagens')
        .select('chat_id, phone, wpp_name, connection_id')
        .eq('owner_id', ownerId)
        .eq('connection_id', connectionId)
        .not('chat_id', 'is', null);

      if (error) {
        throw error;
      }

      const registeredContacts = [];

      for (const conv of conversations || []) {
        try {
          const contactData: WhatsAppContactData = {
            jid: conv.chat_id,
            phone: conv.phone || conv.chat_id.split('@')[0],
            whatsappName: conv.wpp_name,
            connectionId: conv.connection_id,
            ownerId: ownerId
          };

          const contact = await this.registerContactFromMessage(contactData);
          registeredContacts.push(contact);

        } catch (error) {
          console.error(`Erro ao sincronizar contato ${conv.chat_id}:`, error);
        }
      }

      console.log(`✅ Sincronizados ${registeredContacts.length} contatos`);
      return registeredContacts;

    } catch (error) {
      console.error('❌ Erro ao sincronizar contatos:', error);
      throw error;
    }
  }

  /**
   * Atualizar informações de presença de um contato
   */
  async updateContactPresence(
    contactId: string,
    presence: any,
    isOnline: boolean,
    isTyping: boolean
  ): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update({
          whatsapp_presence: presence,
          whatsapp_is_online: isOnline,
          whatsapp_is_typing: isTyping,
          whatsapp_last_seen: isOnline ? new Date() : undefined,
          updated_at: new Date()
        })
        .eq('id', contactId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar presença:', error);
        throw error;
      }

      return data;

    } catch (error) {
      console.error('❌ Erro ao atualizar presença do contato:', error);
      throw error;
    }
  }

  /**
   * Atualizar foto de perfil de um contato
   */
  async updateContactProfilePicture(
    contactId: string,
    profilePictureUrl: string
  ): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update({
          whatsapp_profile_picture: profilePictureUrl,
          updated_at: new Date()
        })
        .eq('id', contactId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar foto de perfil:', error);
        throw error;
      }

      return data;

    } catch (error) {
      console.error('❌ Erro ao atualizar foto de perfil do contato:', error);
      throw error;
    }
  }

  /**
   * Buscar contato por JID do WhatsApp
   */
  async findContactByWhatsAppJid(ownerId: string, jid: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('owner_id', ownerId)
        .eq('whatsapp_jid', jid)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar contato por JID:', error);
        return null;
      }

      return data;

    } catch (error) {
      console.error('❌ Erro ao buscar contato por JID:', error);
      return null;
    }
  }

  /**
   * Buscar contato por número de telefone
   */
  async findContactByPhone(ownerId: string, phone: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('owner_id', ownerId)
        .eq('phone', phone)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar contato por telefone:', error);
        return null;
      }

      return data;

    } catch (error) {
      console.error('❌ Erro ao buscar contato por telefone:', error);
      return null;
    }
  }

  /**
   * Listar todos os contatos WhatsApp de um usuário
   */
  async listWhatsAppContacts(ownerId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('owner_id', ownerId)
        .not('whatsapp_jid', 'is', null)
        .order('last_contact_at', { ascending: false });

      if (error) {
        console.error('Erro ao listar contatos WhatsApp:', error);
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('❌ Erro ao listar contatos WhatsApp:', error);
      throw error;
    }
  }
}
