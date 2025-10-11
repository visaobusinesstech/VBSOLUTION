import { EventEmitter } from 'events';
import { Server as SocketIOServer } from 'socket.io';
import { getBaileysService } from './baileys.service';

export interface RealtimeEvent {
  type: string;
  connectionId: string;
  data: any;
  timestamp: Date;
}

export class RealtimeEventsService extends EventEmitter {
  private io: SocketIOServer;
  private baileysService: any;
  private connectedClients: Map<string, Set<string>> = new Map(); // connectionId -> Set of socketIds

  constructor(io: SocketIOServer) {
    super();
    this.io = io;
    this.baileysService = getBaileysService();
    this.setupBaileysEventListeners();
    this.setupSocketIO();
  }

  private setupSocketIO() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Join connection room
      socket.on('join-connection', (connectionId: string) => {
        socket.join(`connection:${connectionId}`);
        
        // Track connected clients
        if (!this.connectedClients.has(connectionId)) {
          this.connectedClients.set(connectionId, new Set());
        }
        this.connectedClients.get(connectionId)?.add(socket.id);
        
        console.log(`Client ${socket.id} joined connection ${connectionId}`);
      });

      // Leave connection room
      socket.on('leave-connection', (connectionId: string) => {
        socket.leave(`connection:${connectionId}`);
        
        // Remove from tracking
        const clients = this.connectedClients.get(connectionId);
        if (clients) {
          clients.delete(socket.id);
          if (clients.size === 0) {
            this.connectedClients.delete(connectionId);
          }
        }
        
        console.log(`Client ${socket.id} left connection ${connectionId}`);
      });

      // Handle message sending
      socket.on('send-message', async (data: { connectionId: string; jid: string; message: any }) => {
        try {
          const result = await this.baileysService.sendMessage(
            data.connectionId, 
            data.jid, 
            data.message
          );
          
          socket.emit('message-sent', { success: true, data: result });
        } catch (error) {
          socket.emit('message-sent', { success: false, error: error.message });
        }
      });

      // Handle marking messages as read
      socket.on('mark-message-read', async (data: { connectionId: string; jid: string; messageId: string }) => {
        try {
          await this.baileysService.markMessageAsRead(
            data.connectionId, 
            data.jid, 
            data.messageId
          );
          
          socket.emit('message-marked-read', { success: true });
        } catch (error) {
          socket.emit('message-marked-read', { success: false, error: error.message });
        }
      });

      // Handle presence updates
      socket.on('update-presence', async (data: { connectionId: string; presence: string }) => {
        try {
          await this.baileysService.updatePresence(data.connectionId, data.presence);
          socket.emit('presence-updated', { success: true });
        } catch (error) {
          socket.emit('presence-updated', { success: false, error: error.message });
        }
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        
        // Clean up tracking
        for (const [connectionId, clients] of this.connectedClients.entries()) {
          if (clients.has(socket.id)) {
            clients.delete(socket.id);
            if (clients.size === 0) {
              this.connectedClients.delete(connectionId);
            }
            break;
          }
        }
      });
    });
  }

  private setupBaileysEventListeners() {
    // Message events
    this.baileysService.on('messagesUpsert', (data: any) => {
      this.broadcastToConnection(data.connectionId, 'messages-upsert', data);
    });

    this.baileysService.on('messagesUpdate', (data: any) => {
      this.broadcastToConnection(data.connectionId, 'messages-update', data);
    });

    this.baileysService.on('messagesDelete', (data: any) => {
      this.broadcastToConnection(data.connectionId, 'messages-delete', data);
    });

    this.baileysService.on('messagesReaction', (data: any) => {
      this.broadcastToConnection(data.connectionId, 'messages-reaction', data);
    });

    this.baileysService.on('messageReceiptUpdate', (data: any) => {
      this.broadcastToConnection(data.connectionId, 'message-receipt-update', data);
    });

    // Chat events
    this.baileysService.on('chatsUpsert', (data: any) => {
      this.broadcastToConnection(data.connectionId, 'chats-upsert', data);
    });

    this.baileysService.on('chatsUpdate', (data: any) => {
      this.broadcastToConnection(data.connectionId, 'chats-update', data);
    });

    this.baileysService.on('chatsDelete', (data: any) => {
      this.broadcastToConnection(data.connectionId, 'chats-delete', data);
    });

    // Contact events
    this.baileysService.on('contactsUpsert', (data: any) => {
      this.broadcastToConnection(data.connectionId, 'contacts-upsert', data);
    });

    this.baileysService.on('contactsUpdate', (data: any) => {
      this.broadcastToConnection(data.connectionId, 'contacts-update', data);
    });

    // Group events
    this.baileysService.on('groupsUpsert', (data: any) => {
      this.broadcastToConnection(data.connectionId, 'groups-upsert', data);
    });

    this.baileysService.on('groupUpdate', (data: any) => {
      this.broadcastToConnection(data.connectionId, 'group-update', data);
    });

    this.baileysService.on('groupParticipantsUpdate', (data: any) => {
      this.broadcastToConnection(data.connectionId, 'group-participants-update', data);
    });

    // Presence events
    this.baileysService.on('presence', (data: any) => {
      this.broadcastToConnection(data.connectionId, 'presence', data);
    });

    // Connection events
    this.baileysService.on('connectionCreated', (data: any) => {
      this.broadcastToConnection(data.id, 'connection-created', data);
    });

    this.baileysService.on('connectionUpdate', (data: any) => {
      this.broadcastToConnection(data.connectionId, 'connection-update', data);
    });

    // History sync events
    this.baileysService.on('historySync', (data: any) => {
      this.broadcastToConnection(data.connectionId, 'history-sync', data);
    });

    // Blocklist events
    this.baileysService.on('blocklistSet', (data: any) => {
      this.broadcastToConnection(data.connectionId, 'blocklist-set', data);
    });

    this.baileysService.on('blocklistUpdate', (data: any) => {
      this.broadcastToConnection(data.connectionId, 'blocklist-update', data);
    });

    // Call events
    this.baileysService.on('call', (data: any) => {
      this.broadcastToConnection(data.connectionId, 'call', data);
    });
  }

  private broadcastToConnection(connectionId: string, event: string, data: any) {
    const room = `connection:${connectionId}`;
    this.io.to(room).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });

    // Log for debugging
    console.log(`Broadcasted ${event} to connection ${connectionId} (${this.connectedClients.get(connectionId)?.size || 0} clients)`);
  }

  // Get connected clients count for a connection
  getConnectedClientsCount(connectionId: string): number {
    return this.connectedClients.get(connectionId)?.size || 0;
  }

  // Get all connected connections
  getConnectedConnections(): string[] {
    return Array.from(this.connectedClients.keys());
  }

  // Broadcast custom event to a connection
  broadcastCustomEvent(connectionId: string, event: string, data: any) {
    this.broadcastToConnection(connectionId, event, data);
  }

  // Broadcast to all connections
  broadcastToAll(event: string, data: any) {
    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }
}

// Singleton instance
let realtimeEventsService: RealtimeEventsService | null = null;

export const getRealtimeEventsService = (io?: SocketIOServer) => {
  if (!realtimeEventsService && io) {
    realtimeEventsService = new RealtimeEventsService(io);
  }
  return realtimeEventsService;
};
