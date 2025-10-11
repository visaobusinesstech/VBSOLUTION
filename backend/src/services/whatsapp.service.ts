import { create, Whatsapp, SocketState } from 'venom-bot';
import { PrismaClient } from '@prisma/client';
import logger from '../logger';
import env from '../env';
import path from 'path';
import fs from 'fs';

export interface WhatsAppSession {
  id: string;
  name: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'qr_ready' | 'error';
  qrCode?: string;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhatsAppStatus {
  connected: boolean;
  sessionId: string;
  lastActivity: Date;
  qrCode?: string;
  status: string;
}

export class WhatsAppService {
  private sessions: Map<string, Whatsapp> = new Map();
  private sessionData: Map<string, WhatsAppSession> = new Map();
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
        const existingSession = this.sessions.get(sessionName);
        if (existingSession && existingSession.isConnected) {
          return {
            success: true,
            sessionId: sessionName,
            qrCode: undefined
          };
        }
      }

      // Criar ou atualizar sessão no banco
      let sessionRecord = await this.prisma.whatsAppSession.upsert({
        where: { name: sessionName },
        update: {
          status: 'connecting',
          updatedAt: new Date()
        },
        create: {
          name: sessionName,
          status: 'connecting',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Atualizar dados locais
      this.sessionData.set(sessionName, {
        id: sessionRecord.id,
        name: sessionName,
        status: 'connecting',
        createdAt: sessionRecord.createdAt,
        updatedAt: sessionRecord.updatedAt
      });

      // Criar sessão Venom
      const venomSession = await create({
        session: sessionName,
        multidevice: env.VENOM_MULTI_DEVICE === 'true',
        headless: true,
        useChrome: false,
        debug: env.NODE_ENV === 'development',
        logQR: true,
        disableWelcome: true,
        updatesLog: false,
        autoClose: 0,
        tokenStore: 'file',
        folderNameToken: env.VENOM_SESSION_DIR,
        mkdirFolderToken: '',
        devtools: false,
        addBrowserArgs: [],
        browserArgs: [],
        puppeteerOptions: {},
        disableSpins: false,
        disableWelcome: true,
        updatesLog: false,
        logQR: true,
        qrMax: 0,
        qrQualityOptions: {
          quality: 0.8,
          margin: 4,
          scale: 4,
          width: 800
        }
      });

      // Configurar eventos da sessão
      venomSession.onStateChange((state) => {
        this.handleStateChange(sessionName, state);
      });

      venomSession.onQRCode((qrCode) => {
        this.handleQRCode(sessionName, qrCode);
      });

      venomSession.onReady(() => {
        this.handleReady(sessionName);
      });

      venomSession.onMessage((message) => {
        this.handleMessage(sessionName, message);
      });

      venomSession.onIncomingCall((call) => {
        this.handleIncomingCall(sessionName, call);
      });

      // Armazenar sessão
      this.sessions.set(sessionName, venomSession);

      // Aguardar um pouco para ver se o QR code é gerado
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verificar se já está conectado
      if (venomSession.isConnected) {
        await this.handleReady(sessionName);
        return {
          success: true,
          sessionId: sessionName,
          qrCode: undefined
        };
      }

      // Se não estiver conectado, retornar que está aguardando QR
      return {
        success: true,
        sessionId: sessionName,
        qrCode: undefined
      };

    } catch (error) {
      logger.error('Erro ao iniciar sessão WhatsApp:', error);
      
      // Atualizar status no banco
      if (sessionName) {
        await this.prisma.whatsAppSession.updateMany({
          where: { name: sessionName },
          data: {
            status: 'error',
            updatedAt: new Date()
          }
        });
      }

      return {
        success: false,
        sessionId: sessionName,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  private async handleStateChange(sessionName: string, state: SocketState) {
    try {
      logger.info(`Estado da sessão ${sessionName} alterado:`, state);
      
      let status = 'disconnected';
      if (state === 'CONNECTED') status = 'connected';
      else if (state === 'CONNECTING') status = 'connecting';
      else if (state === 'QR_READY') status = 'qr_ready';

      // Atualizar no banco
      await this.prisma.whatsAppSession.updateMany({
        where: { name: sessionName },
        data: {
          status,
          updatedAt: new Date()
        }
      });

      // Atualizar dados locais
      const sessionData = this.sessionData.get(sessionName);
      if (sessionData) {
        sessionData.status = status;
        sessionData.updatedAt = new Date();
      }

      // Emitir via Socket.IO
      this.io.to(`whatsapp-${sessionName}`).emit('whatsapp:state_change', {
        sessionName,
        status,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('Erro ao processar mudança de estado:', error);
    }
  }

  private async handleQRCode(sessionName: string, qrCode: string) {
    try {
      logger.info(`QR Code gerado para sessão ${sessionName}`);
      
      // Atualizar no banco
      await this.prisma.whatsAppSession.updateMany({
        where: { name: sessionName },
        data: {
          status: 'qr_ready',
          qrCode,
          updatedAt: new Date()
        }
      });

      // Atualizar dados locais
      const sessionData = this.sessionData.get(sessionName);
      if (sessionData) {
        sessionData.status = 'qr_ready';
        sessionData.qrCode = qrCode;
        sessionData.updatedAt = new Date();
      }

      // Emitir QR code via Socket.IO
      this.io.to(`whatsapp-${sessionName}`).emit('whatsapp:qr_code', {
        sessionName,
        qrCode,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('Erro ao processar QR Code:', error);
    }
  }

  private async handleReady(sessionName: string) {
    try {
      logger.info(`Sessão ${sessionName} pronta e conectada`);
      
      // Atualizar no banco
      await this.prisma.whatsAppSession.updateMany({
        where: { name: sessionName },
        data: {
          status: 'connected',
          updatedAt: new Date()
        }
      });

      // Atualizar dados locais
      const sessionData = this.sessionData.get(sessionName);
      if (sessionData) {
        sessionData.status = 'connected';
        sessionData.updatedAt = new Date();
      }

      // Emitir via Socket.IO
      this.io.to(`whatsapp-${sessionName}`).emit('whatsapp:ready', {
        sessionName,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('Erro ao processar sessão pronta:', error);
    }
  }

  private async handleMessage(sessionName: string, message: any) {
    try {
      logger.info(`Mensagem recebida na sessão ${sessionName}:`, message);
      
      // Salvar mensagem no banco
      await this.prisma.whatsAppMessage.create({
        data: {
          sessionName,
          from: message.from,
          to: message.to,
          type: this.mapMessageType(message.type),
          content: message.text || message.body || '',
          timestamp: new Date(message.timestamp * 1000),
          rawData: JSON.stringify(message)
        }
      });

      // Emitir via Socket.IO
      this.io.to(`whatsapp-${sessionName}`).emit('whatsapp:message', {
        sessionName,
        message: {
          id: message.id,
          from: message.from,
          to: message.to,
          type: this.mapMessageType(message.type),
          content: message.text || message.body || '',
          timestamp: new Date(message.timestamp * 1000)
        }
      });

    } catch (error) {
      logger.error('Erro ao processar mensagem:', error);
    }
  }

  private async handleIncomingCall(sessionName: string, call: any) {
    try {
      logger.info(`Chamada recebida na sessão ${sessionName}:`, call);
      
      // Emitir via Socket.IO
      this.io.to(`whatsapp-${sessionName}`).emit('whatsapp:incoming_call', {
        sessionName,
        call: {
          id: call.id,
          from: call.peerJid,
          timestamp: new Date()
        }
      });

    } catch (error) {
      logger.error('Erro ao processar chamada:', error);
    }
  }

  private mapMessageType(venomType: string): string {
    const typeMap: { [key: string]: string } = {
      'chat': 'TEXT',
      'image': 'IMAGE',
      'audio': 'AUDIO',
      'video': 'VIDEO',
      'document': 'DOCUMENT',
      'sticker': 'STICKER',
      'location': 'LOCATION',
      'contact': 'CONTACT'
    };
    return typeMap[venomType] || 'UNKNOWN';
  }

  async getStatus(sessionName: string = 'default'): Promise<WhatsAppStatus> {
    try {
      const session = this.sessions.get(sessionName);
      const sessionData = this.sessionData.get(sessionName);
      
      if (!session) {
        return {
          connected: false,
          sessionId: sessionName,
          lastActivity: new Date(),
          status: 'disconnected'
        };
      }

      return {
        connected: session.isConnected || false,
        sessionId: sessionName,
        lastActivity: sessionData?.updatedAt || new Date(),
        qrCode: sessionData?.qrCode,
        status: sessionData?.status || 'disconnected'
      };

    } catch (error) {
      logger.error('Erro ao obter status:', error);
      return {
        connected: false,
        sessionId: sessionName,
        lastActivity: new Date(),
        status: 'error'
      };
    }
  }

  async stopSession(sessionName: string = 'default'): Promise<boolean> {
    try {
      const session = this.sessions.get(sessionName);
      
      if (session) {
        await session.close();
        this.sessions.delete(sessionName);
      }

      // Atualizar no banco
      await this.prisma.whatsAppSession.updateMany({
        where: { name: sessionName },
        data: {
          status: 'disconnected',
          updatedAt: new Date()
        }
      });

      // Limpar dados locais
      this.sessionData.delete(sessionName);

      logger.info(`Sessão ${sessionName} encerrada`);
      return true;

    } catch (error) {
      logger.error('Erro ao encerrar sessão:', error);
      return false;
    }
  }

  async sendText(sessionName: string, to: string, text: string): Promise<boolean> {
    try {
      const session = this.sessions.get(sessionName);
      
      if (!session || !session.isConnected) {
        throw new Error('Sessão não está conectada');
      }

      const result = await session.sendText(to, text);
      
      // Salvar mensagem enviada no banco
      await this.prisma.whatsAppMessage.create({
        data: {
          sessionName,
          from: 'SYSTEM',
          to,
          type: 'TEXT',
          content: text,
          timestamp: new Date(),
          direction: 'OUTBOUND'
        }
      });

      logger.info(`Mensagem enviada para ${to}: ${text}`);
      return true;

    } catch (error) {
      logger.error('Erro ao enviar mensagem:', error);
      return false;
    }
  }

  async sendFile(sessionName: string, to: string, filePath: string, caption?: string): Promise<boolean> {
    try {
      const session = this.sessions.get(sessionName);
      
      if (!session || !session.isConnected) {
        throw new Error('Sessão não está conectada');
      }

      const result = await session.sendFile(to, filePath, caption);
      
      // Salvar mensagem enviada no banco
      await this.prisma.whatsAppMessage.create({
        data: {
          sessionName,
          from: 'SYSTEM',
          to,
          type: 'DOCUMENT',
          content: caption || 'Arquivo enviado',
          timestamp: new Date(),
          direction: 'OUTBOUND',
          mediaPath: filePath
        }
      });

      logger.info(`Arquivo enviado para ${to}: ${filePath}`);
      return true;

    } catch (error) {
      logger.error('Erro ao enviar arquivo:', error);
      return false;
    }
  }

  async getSessions(): Promise<WhatsAppSession[]> {
    try {
      const sessions = await this.prisma.whatsAppSession.findMany({
        orderBy: { updatedAt: 'desc' }
      });

      return sessions.map(session => ({
        id: session.id,
        name: session.name,
        status: session.status as any,
        qrCode: session.qrCode || undefined,
        lastError: session.lastError || undefined,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }));

    } catch (error) {
      logger.error('Erro ao buscar sessões:', error);
      return [];
    }
  }

  async deleteSession(sessionName: string): Promise<boolean> {
    try {
      // Parar sessão se estiver ativa
      await this.stopSession(sessionName);

      // Remover do banco
      await this.prisma.whatsAppSession.deleteMany({
        where: { name: sessionName }
      });

      // Remover mensagens relacionadas
      await this.prisma.whatsAppMessage.deleteMany({
        where: { sessionName }
      });

      logger.info(`Sessão ${sessionName} removida completamente`);
      return true;

    } catch (error) {
      logger.error('Erro ao remover sessão:', error);
      return false;
    }
  }
}
