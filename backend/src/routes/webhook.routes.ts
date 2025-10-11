import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';

const router = Router();
const webhookController = new WebhookController();

// Process webhook (POST)
router.post('/connections/:connectionId/webhook', webhookController.processWebhook);

// Get webhook data (GET)
router.get('/connections/:connectionId/webhook', webhookController.getWebhookData);

// Test webhook (POST)
router.post('/connections/:connectionId/webhook/test', webhookController.testWebhook);

// Test webhook with media (POST)
router.post('/connections/:connectionId/webhook/test-media', webhookController.testWebhookWithMedia);

// Clear webhook data (DELETE)
router.delete('/connections/:connectionId/webhook', webhookController.clearWebhookData);

export default router;

