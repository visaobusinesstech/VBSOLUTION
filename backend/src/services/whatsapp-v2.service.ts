import { create, Whatsapp, SocketState } from 'venom-bot';
import { PrismaClient } from '@prisma/client';
import logger from '../logger';
import env from '../env';
import path from 'path';
import fs from 'fs';
import { whatsappSupabaseIntegrationService } from './whatsapp-supabase-integration.service';
import { isWhatsAppV2Enabled } from '../config/supabase';
import { logInboundMessage, logOutboundMessage, logSessionStatus } from '../utils/observer-logger';
import { incrementInboundCount, incrementOutboundCount } from '../controllers/whatsapp-health.controller';

export interface WhatsAppSessionV2 {
  id: string;
  name: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'qr_ready' | 'error';
  qrCode?: string;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
  phoneNumber?: string;
  whatsappInfo?: any;
}

export interface WhatsAppStatusV2 {
  connected: boolean;
  sessionId: string;
  lastActivity: Date;
  qrCode?: string;
  status: string;
  phoneNumber?: string;
}

export class WhatsAppServiceV2 {
  private sessions: Map<string, Whatsapp> = new Map();
  private sessionData: Map<string, WhatsAppSessionV2> = new Map();
  private prisma: PrismaClient;
  private io: any;

  constructor(io: any, prisma: PrismaClient) {
    this.io = io;
    this.prisma = prisma;
    this.ensureSessionDirectory();
  }

  private ensureSessionDirectory() {
    const sessionDir = path.resolve(env.VENOM_SESSION_DIR);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
  }

  async startSession(sessionName: string = 'default'): Promise<{ success: boolean; sessionId: string; qrCode?: string; error?: string }> {
    try {
      const sessionId = `session_${sessionName}_${Date.now()}`;
      
      // Verificar se já existe uma sessão ativa
      if (this.sessions.has(sessionName)) {
        return {
          success: false,
          sessionId,
          error: 'Sessão já está ativa'
        };
      }

      // Atualizar status da sessão
      this.updateSessionStatus(sessionName, 'connecting');
      
      // Notificar Supabase sobre conexão
      if (isWhatsAppV2Enabled()) {
        await whatsappSupabaseIntegrationService.handleConnectionEvent({
          connectionId: sessionId,
          status: 'CONNECTING'
        });
      }

      // Criar instância do WhatsApp
      const client = await create({
        session: sessionName,
        puppeteerOptions: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        },
        multiDevice: true,
        disableWelcome: true,
        logQR: false
      });

      // Armazenar sessão
      this.sessions.set(sessionName, client);
      this.updateSessionStatus(sessionName, 'qr_ready');

      // Configurar eventos
      this.setupEventHandlers(client, sessionName, sessionId);

      return {
        success: true,
        sessionId,
        qrCode: this.sessionData.get(sessionName)?.qrCode
      };

    } catch (error) {
      logger.error('Erro ao iniciar sessão WhatsApp:', error);
      this.updateSessionStatus(sessionName, 'error', (error as Error).message);
      
      return {
        success: false,
        sessionId: `session_${sessionName}_${Date.now()}`,
        error: (error as Error).message
      };
    }
  }

  private setupEventHandlers(client: Whatsapp, sessionName: string, sessionId: string) {
    // QR Code
    client.onQRCode((qrCode) => {
      logger.info(`QR Code gerado para sessão ${sessionName}`);
      this.updateSessionStatus(sessionName, 'qr_ready', undefined, qrCode);
      
      // Emitir QR Code via Socket.IO
      if (this.io) {
        this.io.emit('whatsapp:qr', { sessionName, qrCode });
      }
    });

    // Status da conexão
    client.onStateChange((state) => {
      logger.info(`Status da sessão ${sessionName}: ${state}`);
      
      switch (state) {
        case SocketState.CONNECTED:
          this.updateSessionStatus(sessionName, 'connected');
          
          // Log de observação
          logSessionStatus(sessionName, 'CONNECTED', new Date().toISOString());
          
          // Notificar Supabase sobre conexão
          if (isWhatsAppV2Enabled()) {
            whatsappSupabaseIntegrationService.handleConnectionEvent({
              connectionId: sessionId,
              status: 'CONNECTED',
              phoneNumber: this.extractPhoneNumber(client),
              whatsappInfo: this.extractWhatsAppInfo(client)
            });
          }
          
          // Emitir status via Socket.IO
          if (this.io) {
            this.io.emit('whatsapp:connected', { sessionName, sessionId });
          }
          break;
          
        case SocketState.DISCONNECTED:
          this.updateSessionStatus(sessionName, 'disconnected');
          
          // Log de observação
          logSessionStatus(sessionName, 'DISCONNECTED', new Date().toISOString());
          
          // Notificar Supabase sobre desconexão
          if (isWhatsAppV2Enabled()) {
            whatsappSupabaseIntegrationService.handleConnectionEvent({
              connectionId: sessionId,
              status: 'DISCONNECTED'
            });
          }
          
          // Emitir status via Socket.IO
          if (this.io) {
            this.io.emit('whatsapp:disconnected', { sessionName, sessionId });
          }
          break;
      }
    });

    // Mensagens recebidas
    client.onMessage(async (message) => {
      try {
        logger.info(`Mensagem recebida na sessão ${sessionName}:`, message.body);
        
        // Log de observação
        const messageType = this.mapMessageType(message.type);
        const remetente = message.fromMe ? 'ATENDENTE' : 'CLIENTE';
        logInboundMessage(message.id, message.chatId, messageType, remetente, new Date().toISOString());
        incrementInboundCount();
        
        // Notificar Supabase sobre mensagem
        if (isWhatsAppV2Enabled()) {
          await whatsappSupabaseIntegrationService.handleMessageEvent({
            connectionId: sessionId,
            chatId: message.chatId,
            messageId: message.id,
            from: message.from,
            to: message.to,
            message: message,
            timestamp: message.timestamp,
            isFromMe: message.fromMe
          });
        }
        
        // Emitir mensagem via Socket.IO
        if (this.io) {
          this.io.emit('whatsapp:message', {
            sessionName,
            sessionId,
            message: {
              id: message.id,
              chatId: message.chatId,
              from: message.from,
              to: message.to,
              body: message.body,
              timestamp: message.timestamp,
              fromMe: message.fromMe,
              type: message.type
            }
          });
        }
      } catch (error) {
        logger.error('Erro ao processar mensagem:', error);
      }
    });

    // Erro
    client.onIncomingCall(async (call) => {
      logger.info(`Chamada recebida na sessão ${sessionName}:`, call);
    });
  }

  private extractPhoneNumber(client: Whatsapp): string | undefined {
    try {
      // Tentar extrair número do telefone do cliente
      return (client as any).info?.wid?.user;
    } catch (error) {
      logger.error('Erro ao extrair número do telefone:', error);
      return undefined;
    }
  }

  private extractWhatsAppInfo(client: Whatsapp): any {
    try {
      return {
        info: (client as any).info,
        user: (client as any).user
      };
    } catch (error) {
      logger.error('Erro ao extrair informações do WhatsApp:', error);
      return {};
    }
  }

  private mapMessageType(venomType: string): string {
    const typeMap: { [key: string]: string } = {
      'chat': 'TEXTO',
      'image': 'IMAGEM',
      'audio': 'AUDIO',
      'video': 'VIDEO',
      'document': 'DOCUMENTO',
      'sticker': 'STICKER',
      'location': 'LOCALIZACAO',
      'contact': 'CONTATO'
    };
    return typeMap[venomType] || 'DESCONHECIDO';
  }

  private updateSessionStatus(sessionName: string, status: WhatsAppSessionV2['status'], error?: string, qrCode?: string) {
    const existingSession = this.sessionData.get(sessionName);
    const now = new Date();
    
    const sessionData: WhatsAppSessionV2 = {
      id: existingSession?.id || `session_${sessionName}_${Date.now()}`,
      name: sessionName,
      status,
      qrCode: qrCode || existingSession?.qrCode,
      lastError: error || existingSession?.lastError,
      createdAt: existingSession?.createdAt || now,
      updatedAt: now
    };

    this.sessionData.set(sessionName, sessionData);
  }

  async stopSession(sessionName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.sessions.get(sessionName);
      if (!client) {
        return {
          success: false,
          error: 'Sessão não encontrada'
        };
      }

      // Fechar cliente
      await client.close();
      
      // Remover da memória
      this.sessions.delete(sessionName);
      this.sessionData.delete(sessionName);

      // Notificar Supabase sobre desconexão
      if (isWhatsAppV2Enabled()) {
        await whatsappSupabaseIntegrationService.handleConnectionEvent({
          connectionId: `session_${sessionName}`,
          status: 'DISCONNECTED'
        });
      }

      // Emitir status via Socket.IO
      if (this.io) {
        this.io.emit('whatsapp:stopped', { sessionName });
      }

      return { success: true };
    } catch (error) {
      logger.error('Erro ao parar sessão WhatsApp:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async sendMessage(sessionName: string, to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const client = this.sessions.get(sessionName);
      if (!client) {
        return {
          success: false,
          error: 'Sessão não encontrada'
        };
      }

      // Enviar mensagem
      const result = await client.sendText(to, message);
      
      // Log de observação
      logOutboundMessage(result.id, to, 'TEXTO', 'ATENDENTE', new Date().toISOString());
      incrementOutboundCount();
      
      // Notificar Supabase sobre mensagem enviada
      if (isWhatsAppV2Enabled()) {
        await whatsappSupabaseIntegrationService.handleMessageEvent({
          connectionId: `session_${sessionName}`,
          chatId: to,
          messageId: result.id,
          from: (client as any).info?.wid?.user || 'system',
          to: to,
          message: { conversation: message },
          timestamp: Math.floor(Date.now() / 1000),
          isFromMe: true
        });
      }

      return {
        success: true,
        messageId: result.id
      };
    } catch (error) {
      logger.error('Erro ao enviar mensagem:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  getSessionStatus(sessionName: string): WhatsAppStatusV2 | null {
    const session = this.sessionData.get(sessionName);
    if (!session) {
      return null;
    }

    return {
      connected: session.status === 'connected',
      sessionId: session.id,
      lastActivity: session.updatedAt,
      qrCode: session.qrCode,
      status: session.status,
      phoneNumber: session.phoneNumber
    };
  }

  getAllSessions(): WhatsAppSessionV2[] {
    return Array.from(this.sessionData.values());
  }

  async getHealthStatus(): Promise<{
    sessions: number;
    connected: number;
    supabaseIntegration: any;
  }> {
    const sessions = this.getAllSessions();
    const connected = sessions.filter(s => s.status === 'connected').length;
    
    let supabaseIntegration = null;
    if (isWhatsAppV2Enabled()) {
      supabaseIntegration = await whatsappSupabaseIntegrationService.getHealthStatus();
    }

    return {
      sessions: sessions.length,
      connected,
      supabaseIntegration
    };
  }
}

export const whatsappServiceV2 = new WhatsAppServiceV2(null, null);
