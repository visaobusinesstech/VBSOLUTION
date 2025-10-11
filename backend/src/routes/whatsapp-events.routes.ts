import { Router } from 'express';
import { WhatsAppEventsController } from '../controllers/whatsapp-events.controller';

const router = Router();
const eventsController = new WhatsAppEventsController();

// Get all events for a connection
router.get('/connections/:connectionId/events', eventsController.getEvents);

// Get events by type
router.get('/connections/:connectionId/events/:type', eventsController.getEventsByType);

// Clear events for a connection
router.delete('/connections/:connectionId/events', eventsController.clearEvents);

// APPLICATION_STARTUP
router.post('/connections/:connectionId/events/application-startup', eventsController.handleApplicationStartup);

// CALL
router.post('/connections/:connectionId/events/call', eventsController.handleCall);

// CHATS_DELETE
router.post('/connections/:connectionId/events/chats-delete', eventsController.handleChatsDelete);

// CHATS_SET
router.post('/connections/:connectionId/events/chats-set', eventsController.handleChatsSet);

// CHATS_UPDATE
router.post('/connections/:connectionId/events/chats-update', eventsController.handleChatsUpdate);

// CHATS_UPSERT
router.post('/connections/:connectionId/events/chats-upsert', eventsController.handleChatsUpsert);

// CONNECTION_UPDATE
router.post('/connections/:connectionId/events/connection-update', eventsController.handleConnectionUpdate);

// CONTACTS_SET
router.post('/connections/:connectionId/events/contacts-set', eventsController.handleContactsSet);

// CONTACTS_UPDATE
router.post('/connections/:connectionId/events/contacts-update', eventsController.handleContactsUpdate);

// CONTACTS_UPSERT
router.post('/connections/:connectionId/events/contacts-upsert', eventsController.handleContactsUpsert);

// GROUP_PARTICIPANTS_UPDATE
router.post('/connections/:connectionId/events/group-participants-update', eventsController.handleGroupParticipantsUpdate);

// GROUP_UPDATE
router.post('/connections/:connectionId/events/group-update', eventsController.handleGroupUpdate);

// GROUPS_UPSERT
router.post('/connections/:connectionId/events/groups-upsert', eventsController.handleGroupsUpsert);

// LABELS_ASSOCIATION
router.post('/connections/:connectionId/events/labels-association', eventsController.handleLabelsAssociation);

// LABELS_EDIT
router.post('/connections/:connectionId/events/labels-edit', eventsController.handleLabelsEdit);

// LOGOUT_INSTANCE
router.post('/connections/:connectionId/events/logout-instance', eventsController.handleLogoutInstance);

// MESSAGES_DELETE
router.post('/connections/:connectionId/events/messages-delete', eventsController.handleMessagesDelete);

// MESSAGES_SET
router.post('/connections/:connectionId/events/messages-set', eventsController.handleMessagesSet);

// MESSAGES_UPDATE
router.post('/connections/:connectionId/events/messages-update', eventsController.handleMessagesUpdate);

// MESSAGES_UPSERT
router.post('/connections/:connectionId/events/messages-upsert', eventsController.handleMessagesUpsert);

// PRESENCE_UPDATE
router.post('/connections/:connectionId/events/presence-update', eventsController.handlePresenceUpdate);

// QRCODE_UPDATED
router.post('/connections/:connectionId/events/qrcode-updated', eventsController.handleQRCodeUpdated);

// REMOVE_INSTANCE
router.post('/connections/:connectionId/events/remove-instance', eventsController.handleRemoveInstance);

// SEND_MESSAGE
router.post('/connections/:connectionId/events/send-message', eventsController.handleSendMessage);

// TYPEBOT_CHANGE_STATUS
router.post('/connections/:connectionId/events/typebot-change-status', eventsController.handleTypebotChangeStatus);

// TYPEBOT_START
router.post('/connections/:connectionId/events/typebot-start', eventsController.handleTypebotStart);

export default router;

