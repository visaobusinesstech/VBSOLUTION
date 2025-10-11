import { Request, Response } from 'express';
import { SimpleConnectionsService } from '../services/simple-connections.service';
import { PrismaClient } from '@prisma/client';

export class SimpleConnectionsController {
  private connectionsService: SimpleConnectionsService;

  constructor(prisma: PrismaClient) {
    this.connectionsService = new SimpleConnectionsService(prisma);
  }

  // Listar conexões
  async listConnections(req: Request, res: Response) {
    try {
      const connections = await this.connectionsService.getAllConnections();
      
      res.json({
        success: true,
        data: connections.map(conn => ({
          id: conn.connectionId,
          name: conn.name,
          connectionState: conn.status,
          isConnected: conn.status === 'connected',
          phoneNumber: conn.phoneNumber,
          whatsappInfo: conn.whatsappInfo,
          createdAt: conn.createdAt,
          updatedAt: conn.updatedAt,
          lastConnectedAt: conn.lastConnectedAt
        }))
      });
    } catch (error) {
      console.error('Error listing connections:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao listar conexões'
      });
    }
  }

  // Criar nova conexão
  async createConnection(req: Request, res: Response) {
    try {
      const { connectionId, name, phoneNumber } = req.body;

      if (!connectionId || !name) {
        return res.status(400).json({
          success: false,
          error: 'connectionId e name são obrigatórios'
        });
      }

      const connection = await this.connectionsService.saveConnection({
        connectionId,
        name,
        type: 'whatsapp_baileys',
        status: 'connecting',
        description: `Conexão Baileys - ${phoneNumber || 'Sem número'}`,
        phoneNumber
      });

      res.json({
        success: true,
        data: {
          id: connection.connectionId,
          name: connection.name,
          connectionState: connection.status,
          isConnected: connection.status === 'connected',
          phoneNumber: connection.phoneNumber,
          whatsappInfo: connection.whatsappInfo,
          createdAt: connection.createdAt,
          updatedAt: connection.updatedAt
        }
      });
    } catch (error) {
      console.error('Error creating connection:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao criar conexão'
      });
    }
  }

  // Obter informações da conexão
  async getConnectionInfo(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;
      const connection = await this.connectionsService.getConnectionById(connectionId);

      if (!connection) {
        return res.status(404).json({
          success: false,
          error: 'Conexão não encontrada'
        });
      }

      res.json({
        success: true,
        data: {
          id: connection.connectionId,
          name: connection.name,
          connectionState: connection.status,
          isConnected: connection.status === 'connected',
          phoneNumber: connection.phoneNumber,
          whatsappInfo: connection.whatsappInfo,
          qrCode: connection.qrCode,
          createdAt: connection.createdAt,
          updatedAt: connection.updatedAt,
          lastConnectedAt: connection.lastConnectedAt
        }
      });
    } catch (error) {
      console.error('Error getting connection info:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter informações da conexão'
      });
    }
  }

  // Atualizar status da conexão
  async updateConnectionStatus(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;
      const { status, whatsappInfo } = req.body;

      const connection = await this.connectionsService.updateConnectionStatus(
        connectionId, 
        status, 
        whatsappInfo
      );

      if (!connection) {
        return res.status(404).json({
          success: false,
          error: 'Conexão não encontrada'
        });
      }

      res.json({
        success: true,
        data: {
          id: connection.connectionId,
          name: connection.name,
          connectionState: connection.status,
          isConnected: connection.status === 'connected',
          phoneNumber: connection.phoneNumber,
          whatsappInfo: connection.whatsappInfo,
          updatedAt: connection.updatedAt,
          lastConnectedAt: connection.lastConnectedAt
        }
      });
    } catch (error) {
      console.error('Error updating connection status:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao atualizar status da conexão'
      });
    }
  }

  // Deletar conexão
  async deleteConnection(req: Request, res: Response) {
    try {
      const { connectionId } = req.params;
      const success = await this.connectionsService.deleteConnection(connectionId);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Conexão não encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Conexão deletada com sucesso'
      });
    } catch (error) {
      console.error('Error deleting connection:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao deletar conexão'
      });
    }
  }
}
