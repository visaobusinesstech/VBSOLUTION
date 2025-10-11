import { Request, Response } from 'express';
import { WebhookService } from '../services/webhook.service';
import logger from '../logger';

export class WebhookController {
  private webhookService: WebhookService;

  constructor() {
    this.webhookService = new WebhookService();
  }

  // Process webhook
  processWebhook = (req: any, res: any) => this.webhookService.processWebhook(req, res);

  // Get webhook data
  getWebhookData = (req: any, res: any) => this.webhookService.getWebhookData(req, res);

  // Test webhook
  testWebhook = (req: any, res: any) => this.webhookService.testWebhook(req, res);

  // Test webhook with media
  testWebhookWithMedia = (req: any, res: any) => this.webhookService.testWebhookWithMedia(req, res);

  // Clear webhook data
  clearWebhookData = (req: any, res: any) => this.webhookService.clearWebhookData(req, res);
}
