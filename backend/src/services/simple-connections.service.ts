import { PrismaClient } from '@prisma/client';

export interface SimpleConnection {
  id: string;
  connectionId: string;
  name: string;
  type: string;
  status: string;
  description?: string | null;
  phoneNumber?: string | null;
  whatsappInfo?: any;
  qrCode?: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastConnectedAt?: Date | null;
}

export class SimpleConnectionsService {
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
  }): Promise<SimpleConnection> {
    try {
      const saved = await this.prisma.whatsAppConnection.upsert({
        where: { connectionId: connection.connectionId },
        update: {
          name: connection.name,
          type: connection.type,
          status: connection.status,
          description: connection.description || null,
          phoneNumber: connection.phoneNumber || null,
          whatsappInfo: connection.whatsappInfo ? JSON.stringify(connection.whatsappInfo) : null,
          qrCode: connection.qrCode || null,
          updatedAt: new Date(),
          lastConnectedAt: connection.status === 'connected' ? new Date() : null
        },
        create: {
          connectionId: connection.connectionId,
          name: connection.name,
          type: connection.type,
          status: connection.status,
          description: connection.description || null,
          phoneNumber: connection.phoneNumber || null,
          whatsappInfo: connection.whatsappInfo ? JSON.stringify(connection.whatsappInfo) : null,
          qrCode: connection.qrCode || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastConnectedAt: connection.status === 'connected' ? new Date() : null
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
  async getAllConnections(): Promise<SimpleConnection[]> {
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
      return [];
    }
  }

  // Obter conexão por ID
  async getConnectionById(connectionId: string): Promise<SimpleConnection | null> {
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
      return null;
    }
  }

  // Atualizar status da conexão
  async updateConnectionStatus(connectionId: string, status: string, whatsappInfo?: any): Promise<SimpleConnection | null> {
    try {
      const connection = await this.prisma.whatsAppConnection.update({
        where: { connectionId },
        data: {
          status,
          whatsappInfo: whatsappInfo ? JSON.stringify(whatsappInfo) : null,
          updatedAt: new Date(),
          lastConnectedAt: status === 'connected' ? new Date() : null
        }
      });

      return {
        ...connection,
        whatsappInfo: connection.whatsappInfo ? JSON.parse(connection.whatsappInfo) : undefined
      };
    } catch (error) {
      console.error('Error updating connection status:', error);
      return null;
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
}
