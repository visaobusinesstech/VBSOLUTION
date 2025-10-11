import { Request, Response } from 'express';
import { WhatsAppEventsService } from '../services/whatsapp-events.service';
import logger from '../logger';

export class WhatsAppEventsController {
  private eventsService: WhatsAppEventsService;

  constructor() {
    this.eventsService = new WhatsAppEventsService();
  }

  // Get all events for a connection
  getEvents = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const events = this.eventsService.getEvents(connectionId, limit);

      res.json({
        success: true,
        data: events,
        count: events.length
      });
    } catch (error) {
      logger.error({ error }, 'Error getting events');
      res.status(500).json({
        success: false,
        error: 'Failed to get events',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Get events by type
  getEventsByType = async (req: Request, res: Response) => {
    try {
      const { connectionId, type } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const events = this.eventsService.getEventsByType(connectionId, type, limit);

      res.json({
        success: true,
        data: events,
        count: events.length
      });
    } catch (error) {
      logger.error({ error }, 'Error getting events by type');
      res.status(500).json({
        success: false,
        error: 'Failed to get events by type',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Clear events for a connection
  clearEvents = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;

      this.eventsService.clearEvents(connectionId);

      res.json({
        success: true,
        message: 'Events cleared successfully'
      });
    } catch (error) {
      logger.error({ error }, 'Error clearing events');
      res.status(500).json({
        success: false,
        error: 'Failed to clear events',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // APPLICATION_STARTUP
  handleApplicationStartup = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handleApplicationStartup(connectionId, data);

      res.json({
        success: true,
        message: 'Application startup event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling application startup');
      res.status(500).json({
        success: false,
        error: 'Failed to handle application startup',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // CALL
  handleCall = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handleCall(connectionId, data);

      res.json({
        success: true,
        message: 'Call event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling call');
      res.status(500).json({
        success: false,
        error: 'Failed to handle call',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // CHATS_DELETE
  handleChatsDelete = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handleChatsDelete(connectionId, data);

      res.json({
        success: true,
        message: 'Chats delete event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling chats delete');
      res.status(500).json({
        success: false,
        error: 'Failed to handle chats delete',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // CHATS_SET
  handleChatsSet = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handleChatsSet(connectionId, data);

      res.json({
        success: true,
        message: 'Chats set event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling chats set');
      res.status(500).json({
        success: false,
        error: 'Failed to handle chats set',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // CHATS_UPDATE
  handleChatsUpdate = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handleChatsUpdate(connectionId, data);

      res.json({
        success: true,
        message: 'Chats update event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling chats update');
      res.status(500).json({
        success: false,
        error: 'Failed to handle chats update',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // CHATS_UPSERT
  handleChatsUpsert = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handleChatsUpsert(connectionId, data);

      res.json({
        success: true,
        message: 'Chats upsert event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling chats upsert');
      res.status(500).json({
        success: false,
        error: 'Failed to handle chats upsert',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // CONNECTION_UPDATE
  handleConnectionUpdate = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handleConnectionUpdate(connectionId, data);

      res.json({
        success: true,
        message: 'Connection update event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling connection update');
      res.status(500).json({
        success: false,
        error: 'Failed to handle connection update',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // CONTACTS_SET
  handleContactsSet = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handleContactsSet(connectionId, data);

      res.json({
        success: true,
        message: 'Contacts set event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling contacts set');
      res.status(500).json({
        success: false,
        error: 'Failed to handle contacts set',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // CONTACTS_UPDATE
  handleContactsUpdate = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handleContactsUpdate(connectionId, data);

      res.json({
        success: true,
        message: 'Contacts update event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling contacts update');
      res.status(500).json({
        success: false,
        error: 'Failed to handle contacts update',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // CONTACTS_UPSERT
  handleContactsUpsert = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handleContactsUpsert(connectionId, data);

      res.json({
        success: true,
        message: 'Contacts upsert event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling contacts upsert');
      res.status(500).json({
        success: false,
        error: 'Failed to handle contacts upsert',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // GROUP_PARTICIPANTS_UPDATE
  handleGroupParticipantsUpdate = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handleGroupParticipantsUpdate(connectionId, data);

      res.json({
        success: true,
        message: 'Group participants update event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling group participants update');
      res.status(500).json({
        success: false,
        error: 'Failed to handle group participants update',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // GROUP_UPDATE
  handleGroupUpdate = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handleGroupUpdate(connectionId, data);

      res.json({
        success: true,
        message: 'Group update event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling group update');
      res.status(500).json({
        success: false,
        error: 'Failed to handle group update',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // GROUPS_UPSERT
  handleGroupsUpsert = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handleGroupsUpsert(connectionId, data);

      res.json({
        success: true,
        message: 'Groups upsert event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling groups upsert');
      res.status(500).json({
        success: false,
        error: 'Failed to handle groups upsert',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // LABELS_ASSOCIATION
  handleLabelsAssociation = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handleLabelsAssociation(connectionId, data);

      res.json({
        success: true,
        message: 'Labels association event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling labels association');
      res.status(500).json({
        success: false,
        error: 'Failed to handle labels association',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // LABELS_EDIT
  handleLabelsEdit = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handleLabelsEdit(connectionId, data);

      res.json({
        success: true,
        message: 'Labels edit event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling labels edit');
      res.status(500).json({
        success: false,
        error: 'Failed to handle labels edit',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // LOGOUT_INSTANCE
  handleLogoutInstance = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handleLogoutInstance(connectionId, data);

      res.json({
        success: true,
        message: 'Logout instance event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling logout instance');
      res.status(500).json({
        success: false,
        error: 'Failed to handle logout instance',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // MESSAGES_DELETE
  handleMessagesDelete = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handleMessagesDelete(connectionId, data);

      res.json({
        success: true,
        message: 'Messages delete event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling messages delete');
      res.status(500).json({
        success: false,
        error: 'Failed to handle messages delete',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // MESSAGES_SET
  handleMessagesSet = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handleMessagesSet(connectionId, data);

      res.json({
        success: true,
        message: 'Messages set event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling messages set');
      res.status(500).json({
        success: false,
        error: 'Failed to handle messages set',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // MESSAGES_UPDATE
  handleMessagesUpdate = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handleMessagesUpdate(connectionId, data);

      res.json({
        success: true,
        message: 'Messages update event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling messages update');
      res.status(500).json({
        success: false,
        error: 'Failed to handle messages update',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // MESSAGES_UPSERT
  handleMessagesUpsert = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handleMessagesUpsert(connectionId, data);

      res.json({
        success: true,
        message: 'Messages upsert event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling messages upsert');
      res.status(500).json({
        success: false,
        error: 'Failed to handle messages upsert',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // PRESENCE_UPDATE
  handlePresenceUpdate = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handlePresenceUpdate(connectionId, data);

      res.json({
        success: true,
        message: 'Presence update event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling presence update');
      res.status(500).json({
        success: false,
        error: 'Failed to handle presence update',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // QRCODE_UPDATED
  handleQRCodeUpdated = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handleQRCodeUpdated(connectionId, data);

      res.json({
        success: true,
        message: 'QR code updated event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling QR code updated');
      res.status(500).json({
        success: false,
        error: 'Failed to handle QR code updated',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // REMOVE_INSTANCE
  handleRemoveInstance = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handleRemoveInstance(connectionId, data);

      res.json({
        success: true,
        message: 'Remove instance event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling remove instance');
      res.status(500).json({
        success: false,
        error: 'Failed to handle remove instance',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // SEND_MESSAGE
  handleSendMessage = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handleSendMessage(connectionId, data);

      res.json({
        success: true,
        message: 'Send message event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling send message');
      res.status(500).json({
        success: false,
        error: 'Failed to handle send message',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // TYPEBOT_CHANGE_STATUS
  handleTypebotChangeStatus = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handleTypebotChangeStatus(connectionId, data);

      res.json({
        success: true,
        message: 'Typebot change status event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling typebot change status');
      res.status(500).json({
        success: false,
        error: 'Failed to handle typebot change status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // TYPEBOT_START
  handleTypebotStart = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const data = req.body;

      this.eventsService.handleTypebotStart(connectionId, data);

      res.json({
        success: true,
        message: 'Typebot start event handled'
      });
    } catch (error) {
      logger.error({ error }, 'Error handling typebot start');
      res.status(500).json({
        success: false,
        error: 'Failed to handle typebot start',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
