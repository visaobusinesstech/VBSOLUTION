import { Router } from 'express';
import { MessagesController } from '../controllers/messages.controller';

const router = Router();
const messagesController = new MessagesController();

// POST /api/messages/send
router.post('/send', messagesController.sendMessage);

// POST /api/messages/read
router.post('/read', messagesController.markAsRead);

// POST /api/messages/typing
router.post('/typing', messagesController.setTyping);

export default router;

