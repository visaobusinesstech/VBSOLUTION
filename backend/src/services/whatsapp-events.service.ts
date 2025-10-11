import { EventEmitter } from 'events';
import logger from '../logger';

export interface WhatsAppEvent {
  type: string;
  data: any;
  timestamp: Date;
  connectionId: string;
}

export class WhatsAppEventsService extends EventEmitter {
  private logger = logger.child({ service: 'WhatsAppEvents' });
  private events: Map<string, WhatsAppEvent[]> = new Map();

  constructor() {
    super();
  }

  // APPLICATION_STARTUP
  handleApplicationStartup(connectionId: string, data: any) {
    this.emitEvent('APPLICATION_STARTUP', connectionId, data);
  }

  // CALL
  handleCall(connectionId: string, data: any) {
    this.emitEvent('CALL', connectionId, data);
  }

  // CHATS_DELETE
  handleChatsDelete(connectionId: string, data: any) {
    this.emitEvent('CHATS_DELETE', connectionId, data);
  }

  // CHATS_SET
  handleChatsSet(connectionId: string, data: any) {
    this.emitEvent('CHATS_SET', connectionId, data);
  }

  // CHATS_UPDATE
  handleChatsUpdate(connectionId: string, data: any) {
    this.emitEvent('CHATS_UPDATE', connectionId, data);
  }

  // CHATS_UPSERT
  handleChatsUpsert(connectionId: string, data: any) {
    this.emitEvent('CHATS_UPSERT', connectionId, data);
  }

  // CONNECTION_UPDATE
  handleConnectionUpdate(connectionId: string, data: any) {
    this.emitEvent('CONNECTION_UPDATE', connectionId, data);
  }

  // CONTACTS_SET
  handleContactsSet(connectionId: string, data: any) {
    this.emitEvent('CONTACTS_SET', connectionId, data);
  }

  // CONTACTS_UPDATE
  handleContactsUpdate(connectionId: string, data: any) {
    this.emitEvent('CONTACTS_UPDATE', connectionId, data);
  }

  // CONTACTS_UPSERT
  handleContactsUpsert(connectionId: string, data: any) {
    this.emitEvent('CONTACTS_UPSERT', connectionId, data);
  }

  // GROUP_PARTICIPANTS_UPDATE
  handleGroupParticipantsUpdate(connectionId: string, data: any) {
    this.emitEvent('GROUP_PARTICIPANTS_UPDATE', connectionId, data);
  }

  // GROUP_UPDATE
  handleGroupUpdate(connectionId: string, data: any) {
    this.emitEvent('GROUP_UPDATE', connectionId, data);
  }

  // GROUPS_UPSERT
  handleGroupsUpsert(connectionId: string, data: any) {
    this.emitEvent('GROUPS_UPSERT', connectionId, data);
  }

  // LABELS_ASSOCIATION
  handleLabelsAssociation(connectionId: string, data: any) {
    this.emitEvent('LABELS_ASSOCIATION', connectionId, data);
  }

  // LABELS_EDIT
  handleLabelsEdit(connectionId: string, data: any) {
    this.emitEvent('LABELS_EDIT', connectionId, data);
  }

  // LOGOUT_INSTANCE
  handleLogoutInstance(connectionId: string, data: any) {
    this.emitEvent('LOGOUT_INSTANCE', connectionId, data);
  }

  // MESSAGES_DELETE
  handleMessagesDelete(connectionId: string, data: any) {
    this.emitEvent('MESSAGES_DELETE', connectionId, data);
  }

  // MESSAGES_SET
  handleMessagesSet(connectionId: string, data: any) {
    this.emitEvent('MESSAGES_SET', connectionId, data);
  }

  // MESSAGES_UPDATE
  handleMessagesUpdate(connectionId: string, data: any) {
    this.emitEvent('MESSAGES_UPDATE', connectionId, data);
  }

  // MESSAGES_UPSERT
  handleMessagesUpsert(connectionId: string, data: any) {
    this.emitEvent('MESSAGES_UPSERT', connectionId, data);
  }

  // PRESENCE_UPDATE
  handlePresenceUpdate(connectionId: string, data: any) {
    this.emitEvent('PRESENCE_UPDATE', connectionId, data);
  }

  // QRCODE_UPDATED
  handleQRCodeUpdated(connectionId: string, data: any) {
    this.emitEvent('QRCODE_UPDATED', connectionId, data);
  }

  // REMOVE_INSTANCE
  handleRemoveInstance(connectionId: string, data: any) {
    this.emitEvent('REMOVE_INSTANCE', connectionId, data);
  }

  // SEND_MESSAGE
  handleSendMessage(connectionId: string, data: any) {
    this.emitEvent('SEND_MESSAGE', connectionId, data);
  }

  // TYPEBOT_CHANGE_STATUS
  handleTypebotChangeStatus(connectionId: string, data: any) {
    this.emitEvent('TYPEBOT_CHANGE_STATUS', connectionId, data);
  }

  // TYPEBOT_START
  handleTypebotStart(connectionId: string, data: any) {
    this.emitEvent('TYPEBOT_START', connectionId, data);
  }

  private emitEvent(type: string, connectionId: string, data: any) {
    const event: WhatsAppEvent = {
      type,
      data,
      timestamp: new Date(),
      connectionId
    };

    // Store event
    if (!this.events.has(connectionId)) {
      this.events.set(connectionId, []);
    }
    this.events.get(connectionId)!.push(event);

    // Keep only last 100 events per connection
    const events = this.events.get(connectionId)!;
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }

    // Emit event
    this.emit('event', event);
    this.emit(type, event);

    this.logger.info(`WhatsApp event emitted: ${type} for connection ${connectionId}`);
  }

  getEvents(connectionId: string, limit: number = 50): WhatsAppEvent[] {
    const events = this.events.get(connectionId) || [];
    return events.slice(-limit);
  }

  getEventsByType(connectionId: string, type: string, limit: number = 50): WhatsAppEvent[] {
    const events = this.events.get(connectionId) || [];
    return events.filter(event => event.type === type).slice(-limit);
  }

  clearEvents(connectionId: string) {
    this.events.delete(connectionId);
  }
}
