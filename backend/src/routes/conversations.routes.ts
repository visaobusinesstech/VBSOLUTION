import { Router } from 'express';
import { ConversationsController } from '../controllers/conversations.controller';

const router = Router();
const conversationsController = new ConversationsController();

// GET /api/conversations?connectionId=&cursor=&limit=
router.get('/', conversationsController.getConversations);

// POST /api/conversations
router.post('/', conversationsController.createConversation);

// GET /api/conversations/:id/messages?cursor=&limit=
router.get('/:id/messages', conversationsController.getMessages);

export default router;

