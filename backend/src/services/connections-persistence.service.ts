import { PrismaClient } from '@prisma/client';

export interface PersistentConnection {
  id: string;
  connectionId: string;
  name: string;
  type: string;
  status: string;
  description?: string;
  phoneNumber?: string;
  whatsappInfo?: any;
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
  lastConnectedAt?: Date;
}

export class ConnectionsPersistenceService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Salvar conexão no banco
  async saveConnection(connection: {
    connectionId: string;
    name: string;
    type: string;
    status: string;
    description?: string;
    phoneNumber?: string;
    whatsappInfo?: any;
    qrCode?: string;
  }): Promise<PersistentConnection> {
    try {
      const saved = await this.prisma.whatsAppConnection.upsert({
        where: { connectionId: connection.connectionId },
        update: {
          name: connection.name,
          type: connection.type,
          status: connection.status,
          description: connection.description,
          phoneNumber: connection.phoneNumber,
          whatsappInfo: connection.whatsappInfo ? JSON.stringify(connection.whatsappInfo) : null,
          qrCode: connection.qrCode,
          updatedAt: new Date(),
          lastConnectedAt: connection.status === 'connected' ? new Date() : undefined
        },
        create: {
          connectionId: connection.connectionId,
          name: connection.name,
          type: connection.type,
          status: connection.status,
          description: connection.description,
          phoneNumber: connection.phoneNumber,
          whatsappInfo: connection.whatsappInfo ? JSON.stringify(connection.whatsappInfo) : null,
          qrCode: connection.qrCode,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastConnectedAt: connection.status === 'connected' ? new Date() : undefined
        }
      });

      return {
        ...saved,
        whatsappInfo: saved.whatsappInfo ? JSON.parse(saved.whatsappInfo) : undefined
      };
    } catch (error) {
      console.error('Error saving connection:', error);
      throw error;
    }
  }

  // Obter todas as conexões
  async getAllConnections(): Promise<PersistentConnection[]> {
    try {
      const connections = await this.prisma.whatsAppConnection.findMany({
        orderBy: { updatedAt: 'desc' }
      });

      return connections.map(conn => ({
        ...conn,
        whatsappInfo: conn.whatsappInfo ? JSON.parse(conn.whatsappInfo) : undefined
      }));
    } catch (error) {
      console.error('Error getting connections:', error);
      throw error;
    }
  }

  // Obter conexão por ID
  async getConnectionById(connectionId: string): Promise<PersistentConnection | null> {
    try {
      const connection = await this.prisma.whatsAppConnection.findUnique({
        where: { connectionId }
      });

      if (!connection) return null;

      return {
        ...connection,
        whatsappInfo: connection.whatsappInfo ? JSON.parse(connection.whatsappInfo) : undefined
      };
    } catch (error) {
      console.error('Error getting connection by ID:', error);
      throw error;
    }
  }

  // Atualizar status da conexão
  async updateConnectionStatus(connectionId: string, status: string, whatsappInfo?: any): Promise<PersistentConnection | null> {
    try {
      const connection = await this.prisma.whatsAppConnection.update({
        where: { connectionId },
        data: {
          status,
          whatsappInfo: whatsappInfo ? JSON.stringify(whatsappInfo) : undefined,
          updatedAt: new Date(),
          lastConnectedAt: status === 'connected' ? new Date() : undefined
        }
      });

      return {
        ...connection,
        whatsappInfo: connection.whatsappInfo ? JSON.parse(connection.whatsappInfo) : undefined
      };
    } catch (error) {
      console.error('Error updating connection status:', error);
      throw error;
    }
  }

  // Deletar conexão
  async deleteConnection(connectionId: string): Promise<boolean> {
    try {
      await this.prisma.whatsAppConnection.delete({
        where: { connectionId }
      });
      return true;
    } catch (error) {
      console.error('Error deleting connection:', error);
      return false;
    }
  }

  // Limpar conexões desconectadas (opcional)
  async cleanupDisconnectedConnections(): Promise<number> {
    try {
      const result = await this.prisma.whatsAppConnection.deleteMany({
        where: {
          status: 'disconnected',
          updatedAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 horas atrás
          }
        }
      });
      return result.count;
    } catch (error) {
      console.error('Error cleaning up disconnected connections:', error);
      return 0;
    }
  }
}
