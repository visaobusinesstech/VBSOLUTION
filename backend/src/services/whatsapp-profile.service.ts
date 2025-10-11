import { BaileysService } from './baileys.service';

export interface WhatsAppProfile {
  jid: string;
  profilePictureUrl?: string;
  businessProfile?: {
    description?: string;
    category?: string;
    website?: string[];
    email?: string;
    businessHours?: any;
  };
  presence?: {
    lastSeen?: number;
    isOnline?: boolean;
    isTyping?: boolean;
  };
  name?: string;
  status?: string;
}

export class WhatsAppProfileService {
  constructor(private baileysService: BaileysService) {}

  /**
   * Busca a foto de perfil de um contato
   */
  async getProfilePicture(connectionId: string, jid: string, highRes: boolean = false): Promise<string | null> {
    try {
      const connection = this.baileysService.getConnection(connectionId);
      if (!connection || !connection.socket || !connection.isConnected) {
        throw new Error('Connection not available or not connected');
      }

      const sock = connection.socket;
      const profilePictureUrl = await sock.profilePictureUrl(jid, highRes ? 'image' : undefined);
      
      console.log(`📸 [PROFILE-PICTURE] Buscando foto para ${jid}:`, profilePictureUrl);
      return profilePictureUrl || null;
    } catch (error) {
      console.error(`❌ [PROFILE-PICTURE] Erro ao buscar foto de perfil para ${jid}:`, error);
      return null;
    }
  }

  /**
   * Busca o perfil de negócio de um contato
   */
  async getBusinessProfile(connectionId: string, jid: string): Promise<any | null> {
    try {
      const connection = this.baileysService.getConnection(connectionId);
      if (!connection || !connection.socket || !connection.isConnected) {
        throw new Error('Connection not available or not connected');
      }

      const sock = connection.socket;
      const businessProfile = await sock.getBusinessProfile(jid);
      
      console.log(`🏢 [BUSINESS-PROFILE] Buscando perfil de negócio para ${jid}:`, businessProfile);
      return businessProfile || null;
    } catch (error) {
      console.error(`❌ [BUSINESS-PROFILE] Erro ao buscar perfil de negócio para ${jid}:`, error);
      return null;
    }
  }

  /**
   * Busca informações de presença de um contato
   */
  async getPresence(connectionId: string, jid: string): Promise<any | null> {
    try {
      const connection = this.baileysService.getConnection(connectionId);
      if (!connection || !connection.socket || !connection.isConnected) {
        throw new Error('Connection not available or not connected');
      }

      const sock = connection.socket;
      
      // Subscribe to presence updates
      await sock.presenceSubscribe(jid);
      
      // Get current presence (if available)
      const presence = sock.presences[jid];
      
      console.log(`👁️ [PRESENCE] Buscando presença para ${jid}:`, presence);
      return presence || null;
    } catch (error) {
      console.error(`❌ [PRESENCE] Erro ao buscar presença para ${jid}:`, error);
      return null;
    }
  }

  /**
   * Busca informações completas do perfil (foto + negócio + presença)
   */
  async getFullProfile(connectionId: string, jid: string): Promise<WhatsAppProfile> {
    try {
      const [profilePictureUrl, businessProfile, presence] = await Promise.all([
        this.getProfilePicture(connectionId, jid, true), // High resolution
        this.getBusinessProfile(connectionId, jid),
        this.getPresence(connectionId, jid)
      ]);

      const profile: WhatsAppProfile = {
        jid,
        profilePictureUrl: profilePictureUrl || undefined,
        businessProfile: businessProfile || undefined,
        presence: presence || undefined
      };

      console.log(`📋 [FULL-PROFILE] Perfil completo para ${jid}:`, profile);
      return profile;
    } catch (error) {
      console.error(`❌ [FULL-PROFILE] Erro ao buscar perfil completo para ${jid}:`, error);
      return { jid };
    }
  }

  /**
   * Atualiza a foto de perfil do usuário ou grupo
   */
  async updateProfilePicture(connectionId: string, jid: string, imageData: Buffer | string): Promise<boolean> {
    try {
      const connection = this.baileysService.getConnection(connectionId);
      if (!connection || !connection.socket || !connection.isConnected) {
        throw new Error('Connection not available or not connected');
      }

      const sock = connection.socket;
      
      if (typeof imageData === 'string') {
        // URL provided
        await sock.updateProfilePicture(jid, { url: imageData });
      } else {
        // Buffer provided
        await sock.updateProfilePicture(jid, { stream: imageData });
      }

      console.log(`📸 [UPDATE-PROFILE-PICTURE] Foto de perfil atualizada para ${jid}`);
      return true;
    } catch (error) {
      console.error(`❌ [UPDATE-PROFILE-PICTURE] Erro ao atualizar foto de perfil para ${jid}:`, error);
      return false;
    }
  }

  /**
   * Remove a foto de perfil do usuário ou grupo
   */
  async removeProfilePicture(connectionId: string, jid: string): Promise<boolean> {
    try {
      const connection = this.baileysService.getConnection(connectionId);
      if (!connection || !connection.socket || !connection.isConnected) {
        throw new Error('Connection not available or not connected');
      }

      const sock = connection.socket;
      await sock.removeProfilePicture(jid);

      console.log(`🗑️ [REMOVE-PROFILE-PICTURE] Foto de perfil removida para ${jid}`);
      return true;
    } catch (error) {
      console.error(`❌ [REMOVE-PROFILE-PICTURE] Erro ao remover foto de perfil para ${jid}:`, error);
      return false;
    }
  }

  /**
   * Atualiza o nome do perfil
   */
  async updateProfileName(connectionId: string, name: string): Promise<boolean> {
    try {
      const connection = this.baileysService.getConnection(connectionId);
      if (!connection || !connection.socket || !connection.isConnected) {
        throw new Error('Connection not available or not connected');
      }

      const sock = connection.socket;
      await sock.updateProfileName(name);

      console.log(`✏️ [UPDATE-PROFILE-NAME] Nome do perfil atualizado para: ${name}`);
      return true;
    } catch (error) {
      console.error(`❌ [UPDATE-PROFILE-NAME] Erro ao atualizar nome do perfil:`, error);
      return false;
    }
  }

  /**
   * Atualiza o status do perfil
   */
  async updateProfileStatus(connectionId: string, status: string): Promise<boolean> {
    try {
      const connection = this.baileysService.getConnection(connectionId);
      if (!connection || !connection.socket || !connection.isConnected) {
        throw new Error('Connection not available or not connected');
      }

      const sock = connection.socket;
      await sock.updateProfileStatus(status);

      console.log(`📝 [UPDATE-PROFILE-STATUS] Status do perfil atualizado para: ${status}`);
      return true;
    } catch (error) {
      console.error(`❌ [UPDATE-PROFILE-STATUS] Erro ao atualizar status do perfil:`, error);
      return false;
    }
  }
}
