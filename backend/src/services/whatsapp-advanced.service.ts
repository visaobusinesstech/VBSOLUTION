import { BaileysService } from './baileys.service';
import { makeWASocket, DisconnectReason, useMultiFileAuthState, WASocket, WAMessage, WAMessageKey, proto, jidNormalizedUser, getContentType, downloadMediaMessage, makeInMemoryStore, ConnectionState, BaileysEventMap, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import P from 'pino';
import NodeCache from 'node-cache';
import fs from 'fs';
import path from 'path';

export interface WhatsAppAdvancedConfig {
  connectionId: string;
  authPath: string;
  enableLogging?: boolean;
  enableStore?: boolean;
  enableGroupCache?: boolean;
  markOnlineOnConnect?: boolean;
}

export interface MediaMessage {
  type: 'image' | 'video' | 'audio' | 'document' | 'sticker';
  url?: string;
  stream?: Buffer;
  caption?: string;
  mimetype?: string;
  fileName?: string;
  gifPlayback?: boolean;
  ptt?: boolean;
}

export interface PollMessage {
  name: string;
  values: string[];
  selectableCount: number;
  toAnnouncementGroup?: boolean;
}

export interface LocationMessage {
  degreesLatitude: number;
  degreesLongitude: number;
  name?: string;
  address?: string;
}

export interface ContactMessage {
  displayName: string;
  contacts: Array<{
    vcard: string;
  }>;
}

export class WhatsAppAdvancedService {
  private connections: Map<string, WASocket> = new Map();
  private stores: Map<string, any> = new Map();
  private groupCaches: Map<string, NodeCache> = new Map();
  private baileysService: BaileysService;

  constructor(baileysService: BaileysService) {
    this.baileysService = baileysService;
  }

  /**
   * Conectar ao WhatsApp com configurações avançadas
   */
  async connectAdvanced(config: WhatsAppAdvancedConfig): Promise<WASocket> {
    const { connectionId, authPath, enableLogging = true, enableStore = true, enableGroupCache = true, markOnlineOnConnect = true } = config;

    // Configurar logging
    const logger = enableLogging ? P({ level: 'debug' }) : P({ level: 'silent' });

    // Configurar auth state
    const { state, saveCreds } = await useMultiFileAuthState(authPath);

    // Configurar store se habilitado
    let store: any = null;
    if (enableStore) {
      store = makeInMemoryStore({ logger });
      this.stores.set(connectionId, store);
    }

    // Configurar cache de grupos se habilitado
    let groupCache: NodeCache | null = null;
    if (enableGroupCache) {
      groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });
      this.groupCaches.set(connectionId, groupCache);
    }

    // Obter versão mais recente do Baileys
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`📱 Usando Baileys v${version.join('.')}, isLatest: ${isLatest}`);

    // Criar socket
    const sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: true,
      auth: state,
      markOnlineOnConnect,
      getMessage: store ? async (key: WAMessageKey) => {
        return store.loadMessage(key.remoteJid!, key.id!);
      } : undefined,
      cachedGroupMetadata: groupCache ? async (jid: string) => {
        return groupCache!.get(jid);
      } : undefined,
    });

    // Configurar store se habilitado
    if (store) {
      store.bind(sock.ev);
    }

    // Configurar eventos
    this.setupEvents(sock, connectionId, groupCache);

    // Salvar credenciais quando atualizadas
    sock.ev.on('creds.update', saveCreds);

    // Salvar conexão
    this.connections.set(connectionId, sock);

    return sock;
  }

  /**
   * Configurar eventos do WhatsApp
   */
  private setupEvents(sock: WASocket, connectionId: string, groupCache: NodeCache | null) {
    // Evento de conexão
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update;
      
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log(`🔌 Conexão fechada: ${lastDisconnect?.error}, reconectando: ${shouldReconnect}`);
        
        if (shouldReconnect) {
          // Implementar reconexão automática se necessário
          setTimeout(() => {
            console.log('🔄 Tentando reconectar...');
          }, 5000);
        }
      } else if (connection === 'open') {
        console.log('✅ Conexão WhatsApp aberta');
      }
    });

    // Evento de mensagens
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      console.log(`📨 ${messages.length} mensagens recebidas (${type})`);
      
      for (const m of messages) {
        if (!m.message) continue;
        
        const messageType = getContentType(m.message);
        console.log(`📝 Tipo de mensagem: ${messageType}`);
        
        // Processar diferentes tipos de mensagem
        await this.processMessage(sock, m, messageType);
      }
    });

    // Evento de atualizações de mensagem
    sock.ev.on('messages.update', async (updates) => {
      for (const { key, update } of updates) {
        if (update.pollUpdates) {
          console.log('🗳️ Atualização de enquete recebida');
          // Processar votos de enquete
        }
      }
    });

    // Evento de presença
    sock.ev.on('presence.update', (presence) => {
      console.log(`👁️ Presença atualizada: ${presence.id} - ${presence.presences}`);
    });

    // Evento de grupos
    if (groupCache) {
      sock.ev.on('groups.update', async (updates) => {
        for (const update of updates) {
          const metadata = await sock.groupMetadata(update.id);
          groupCache.set(update.id, metadata);
        }
      });

      sock.ev.on('group-participants.update', async (event) => {
        const metadata = await sock.groupMetadata(event.id);
        groupCache.set(event.id, metadata);
      });
    }

    // Evento de contatos
    sock.ev.on('contacts.upsert', (contacts) => {
      console.log(`👥 ${contacts.length} contatos atualizados`);
    });

    // Evento de chats
    sock.ev.on('chats.upsert', (chats) => {
      console.log(`💬 ${chats.length} chats atualizados`);
    });
  }

  /**
   * Processar mensagem recebida
   */
  private async processMessage(sock: WASocket, message: WAMessage, messageType: string) {
    try {
      const jid = message.key.remoteJid!;
      const isGroup = jid.endsWith('@g.us');
      
      console.log(`📨 Processando mensagem de ${isGroup ? 'grupo' : 'contato'}: ${jid}`);

      // Baixar mídia se necessário
      if (['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(messageType)) {
        try {
          const stream = await downloadMediaMessage(
            message,
            'buffer',
            {},
            {
              logger: P({ level: 'silent' }),
              reuploadRequest: sock.updateMediaMessage
            }
          );
          
          // Salvar mídia localmente
          const mediaPath = path.join(process.cwd(), 'uploads', 'whatsapp', jid);
          if (!fs.existsSync(mediaPath)) {
            fs.mkdirSync(mediaPath, { recursive: true });
          }
          
          const fileName = `${message.key.id}.${this.getMediaExtension(messageType)}`;
          const filePath = path.join(mediaPath, fileName);
          
          fs.writeFileSync(filePath, stream);
          console.log(`💾 Mídia salva: ${filePath}`);
        } catch (error) {
          console.error('❌ Erro ao baixar mídia:', error);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
    }
  }

  /**
   * Obter extensão de arquivo baseada no tipo de mídia
   */
  private getMediaExtension(messageType: string): string {
    switch (messageType) {
      case 'imageMessage': return 'jpg';
      case 'videoMessage': return 'mp4';
      case 'audioMessage': return 'ogg';
      case 'documentMessage': return 'pdf';
      default: return 'bin';
    }
  }

  /**
   * Enviar mensagem de texto
   */
  async sendTextMessage(connectionId: string, jid: string, text: string, options?: any): Promise<any> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    return await sock.sendMessage(jid, { text }, options);
  }

  /**
   * Enviar mensagem de mídia
   */
  async sendMediaMessage(connectionId: string, jid: string, media: MediaMessage, options?: any): Promise<any> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    const content: any = {
      [media.type]: media.url ? { url: media.url } : media.stream,
      caption: media.caption,
    };

    if (media.type === 'audio') {
      content.mimetype = media.mimetype || 'audio/ogg';
      content.ptt = media.ptt || false;
    }

    if (media.type === 'video') {
      content.gifPlayback = media.gifPlayback || false;
    }

    if (media.type === 'document') {
      content.fileName = media.fileName || 'document';
      content.mimetype = media.mimetype;
    }

    return await sock.sendMessage(jid, content, options);
  }

  /**
   * Enviar mensagem de localização
   */
  async sendLocationMessage(connectionId: string, jid: string, location: LocationMessage, options?: any): Promise<any> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    return await sock.sendMessage(jid, { location }, options);
  }

  /**
   * Enviar mensagem de contato
   */
  async sendContactMessage(connectionId: string, jid: string, contact: ContactMessage, options?: any): Promise<any> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    return await sock.sendMessage(jid, { contacts: contact }, options);
  }

  /**
   * Enviar enquete
   */
  async sendPollMessage(connectionId: string, jid: string, poll: PollMessage, options?: any): Promise<any> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    return await sock.sendMessage(jid, { poll }, options);
  }

  /**
   * Reagir a mensagem
   */
  async reactToMessage(connectionId: string, jid: string, messageKey: WAMessageKey, emoji: string): Promise<any> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    return await sock.sendMessage(jid, {
      react: {
        text: emoji,
        key: messageKey
      }
    });
  }

  /**
   * Fixar mensagem
   */
  async pinMessage(connectionId: string, jid: string, messageKey: WAMessageKey, timeInSeconds: number = 86400): Promise<any> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    return await sock.sendMessage(jid, {
      pin: {
        type: 1,
        time: timeInSeconds,
        key: messageKey
      }
    });
  }

  /**
   * Marcar mensagens como lidas
   */
  async markMessagesAsRead(connectionId: string, jid: string, messageKeys: WAMessageKey[]): Promise<any> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    return await sock.readMessages(messageKeys);
  }

  /**
   * Atualizar presença
   */
  async updatePresence(connectionId: string, presence: 'available' | 'composing' | 'recording' | 'paused', jid?: string): Promise<any> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    return await sock.sendPresenceUpdate(presence, jid);
  }

  /**
   * Obter foto de perfil
   */
  async getProfilePicture(connectionId: string, jid: string, highRes: boolean = false): Promise<string | null> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    try {
      return await sock.profilePictureUrl(jid, highRes ? 'image' : undefined);
    } catch (error) {
      console.error('❌ Erro ao obter foto de perfil:', error);
      return null;
    }
  }

  /**
   * Obter perfil de negócio
   */
  async getBusinessProfile(connectionId: string, jid: string): Promise<any> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    try {
      return await sock.getBusinessProfile(jid);
    } catch (error) {
      console.error('❌ Erro ao obter perfil de negócio:', error);
      return null;
    }
  }

  /**
   * Inscrever-se em atualizações de presença
   */
  async subscribeToPresence(connectionId: string, jid: string): Promise<any> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    return await sock.presenceSubscribe(jid);
  }

  /**
   * Atualizar nome do perfil
   */
  async updateProfileName(connectionId: string, name: string): Promise<any> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    return await sock.updateProfileName(name);
  }

  /**
   * Atualizar status do perfil
   */
  async updateProfileStatus(connectionId: string, status: string): Promise<any> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    return await sock.updateProfileStatus(status);
  }

  /**
   * Atualizar foto de perfil
   */
  async updateProfilePicture(connectionId: string, jid: string, imageData: Buffer | string): Promise<any> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    if (typeof imageData === 'string') {
      return await sock.updateProfilePicture(jid, { url: imageData });
    } else {
      return await sock.updateProfilePicture(jid, { stream: imageData });
    }
  }

  /**
   * Remover foto de perfil
   */
  async removeProfilePicture(connectionId: string, jid: string): Promise<any> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    return await sock.removeProfilePicture(jid);
  }

  /**
   * Verificar se ID existe no WhatsApp
   */
  async checkWhatsAppId(connectionId: string, jid: string): Promise<boolean> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    try {
      const [result] = await sock.onWhatsApp(jid);
      return result?.exists || false;
    } catch (error) {
      console.error('❌ Erro ao verificar ID do WhatsApp:', error);
      return false;
    }
  }

  /**
   * Obter metadados do grupo
   */
  async getGroupMetadata(connectionId: string, jid: string): Promise<any> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    try {
      return await sock.groupMetadata(jid);
    } catch (error) {
      console.error('❌ Erro ao obter metadados do grupo:', error);
      return null;
    }
  }

  /**
   * Criar grupo
   */
  async createGroup(connectionId: string, subject: string, participants: string[]): Promise<any> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    return await sock.groupCreate(subject, participants);
  }

  /**
   * Atualizar participantes do grupo
   */
  async updateGroupParticipants(connectionId: string, jid: string, participants: string[], action: 'add' | 'remove' | 'promote' | 'demote'): Promise<any> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    return await sock.groupParticipantsUpdate(jid, participants, action);
  }

  /**
   * Atualizar assunto do grupo
   */
  async updateGroupSubject(connectionId: string, jid: string, subject: string): Promise<any> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    return await sock.groupUpdateSubject(jid, subject);
  }

  /**
   * Atualizar descrição do grupo
   */
  async updateGroupDescription(connectionId: string, jid: string, description: string): Promise<any> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    return await sock.groupUpdateDescription(jid, description);
  }

  /**
   * Sair do grupo
   */
  async leaveGroup(connectionId: string, jid: string): Promise<any> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    return await sock.groupLeave(jid);
  }

  /**
   * Obter código de convite do grupo
   */
  async getGroupInviteCode(connectionId: string, jid: string): Promise<string> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    return await sock.groupInviteCode(jid);
  }

  /**
   * Revogar código de convite do grupo
   */
  async revokeGroupInviteCode(connectionId: string, jid: string): Promise<string> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    return await sock.groupRevokeInvite(jid);
  }

  /**
   * Aceitar convite do grupo
   */
  async acceptGroupInvite(connectionId: string, code: string): Promise<any> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    return await sock.groupAcceptInvite(code);
  }

  /**
   * Obter informações do convite do grupo
   */
  async getGroupInviteInfo(connectionId: string, code: string): Promise<any> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    return await sock.groupGetInviteInfo(code);
  }

  /**
   * Bloquear/desbloquear usuário
   */
  async updateBlockStatus(connectionId: string, jid: string, action: 'block' | 'unblock'): Promise<any> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    return await sock.updateBlockStatus(jid, action);
  }

  /**
   * Obter configurações de privacidade
   */
  async getPrivacySettings(connectionId: string): Promise<any> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    return await sock.fetchPrivacySettings(true);
  }

  /**
   * Obter lista de bloqueados
   */
  async getBlockList(connectionId: string): Promise<string[]> {
    const sock = this.connections.get(connectionId);
    if (!sock) throw new Error('Conexão não encontrada');

    return await sock.fetchBlocklist();
  }

  /**
   * Desconectar
   */
  async disconnect(connectionId: string): Promise<void> {
    const sock = this.connections.get(connectionId);
    if (sock) {
      await sock.logout();
      this.connections.delete(connectionId);
      this.stores.delete(connectionId);
      this.groupCaches.delete(connectionId);
    }
  }

  /**
   * Obter conexão
   */
  getConnection(connectionId: string): WASocket | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Obter store
   */
  getStore(connectionId: string): any {
    return this.stores.get(connectionId);
  }
}
