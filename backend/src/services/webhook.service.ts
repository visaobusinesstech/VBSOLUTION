import { Request, Response } from 'express';
import logger from '../logger';
import fs from 'fs';
import path from 'path';

export interface WebhookData {
  type: string;
  data: any;
  timestamp: Date;
  connectionId: string;
  media?: {
    type: string;
    data: string; // Base64 encoded
    filename?: string;
    mimeType?: string;
  };
}

export class WebhookService {
  private webhookData: Map<string, WebhookData[]> = new Map();

  constructor() {
    this.ensureUploadsDirectory();
  }

  private ensureUploadsDirectory() {
    const uploadsDir = path.resolve('./uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  }

  // Process webhook with Base64 media support
  processWebhook = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      if (!connectionId) {
        return res.status(400).json({
          success: false,
          error: 'Connection ID is required'
        });
      }
      
      const webhookData: WebhookData = {
        type: req.body.type || 'webhook',
        data: req.body,
        timestamp: new Date(),
        connectionId,
        media: req.body.media
      };

      // Store webhook data
      if (!this.webhookData.has(connectionId)) {
        this.webhookData.set(connectionId, []);
      }
      this.webhookData.get(connectionId)!.push(webhookData);

      // Keep only last 100 webhooks per connection
      const webhooks = this.webhookData.get(connectionId)!;
      if (webhooks.length > 100) {
        webhooks.splice(0, webhooks.length - 100);
      }

      // Process media if present
      if (webhookData.media) {
        await this.processMedia(webhookData.media, connectionId);
      }

      logger.info(`Webhook processed successfully: ${webhookData.type} for connection ${connectionId}`);

      res.json({
        success: true,
        message: 'Webhook processed successfully',
        data: {
          type: webhookData.type,
          timestamp: webhookData.timestamp,
          connectionId
        }
      });
    } catch (error) {
      logger.error(`Error processing webhook: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to process webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Process Base64 media
  private async processMedia(media: WebhookData['media'], connectionId: string): Promise<void> {
    if (!media || !media.data) return;

    try {
      // Decode Base64 data
      const base64Data = media.data.replace(/^data:.*,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Create filename
      const extension = this.getFileExtension(media.mimeType || '');
      const filename = media.filename || `media_${Date.now()}.${extension}`;
      
      // Create connection directory
      const connectionDir = path.resolve('./uploads', connectionId);
      if (!fs.existsSync(connectionDir)) {
        fs.mkdirSync(connectionDir, { recursive: true });
      }

      // Save file
      const filePath = path.join(connectionDir, filename);
      fs.writeFileSync(filePath, buffer);

      logger.info(`Media saved successfully: ${filename} (${buffer.length} bytes, ${media.mimeType}) for connection ${connectionId}`);

    } catch (error) {
      logger.error(`Error processing media for connection ${connectionId}: ${error}`);
      throw error;
    }
  }

  // Get file extension from MIME type
  private getFileExtension(mimeType: string): string {
    const mimeToExt: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/avi': 'avi',
      'video/mov': 'mov',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'text/plain': 'txt'
    };

    return mimeToExt[mimeType] || 'bin';
  }

  // Get webhook data for a connection
  getWebhookData = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      if (!connectionId) {
        return res.status(400).json({
          success: false,
          error: 'Connection ID is required'
        });
      }
      
      const limit = parseInt(req.query['limit'] as string) || 50;

      const webhooks = this.webhookData.get(connectionId) || [];
      const limitedWebhooks = webhooks.slice(-limit);

      res.json({
        success: true,
        data: limitedWebhooks,
        count: limitedWebhooks.length
      });
    } catch (error) {
      logger.error(`Error getting webhook data: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get webhook data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Test webhook with sample data
  testWebhook = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      if (!connectionId) {
        return res.status(400).json({
          success: false,
          error: 'Connection ID is required'
        });
      }
      
      // Sample webhook data
      const sampleData: WebhookData = {
        type: 'test_webhook',
        data: {
          message: 'Test webhook from VBSolutionCRM',
          timestamp: new Date().toISOString(),
          connectionId,
          user: {
            id: 'test_user_123',
            name: 'Test User',
            email: 'test@example.com'
          },
          company: {
            id: 'test_company_456',
            name: 'Test Company'
          }
        },
        timestamp: new Date(),
        connectionId
      };

      // Store test data
      if (!this.webhookData.has(connectionId)) {
        this.webhookData.set(connectionId, []);
      }
      this.webhookData.get(connectionId)!.push(sampleData);

      logger.info(`Test webhook sent successfully for connection ${connectionId}`);

      res.json({
        success: true,
        message: 'Test webhook sent successfully',
        data: sampleData
      });
    } catch (error) {
      logger.error(`Error sending test webhook: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to send test webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Test webhook with Base64 media
  testWebhookWithMedia = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      if (!connectionId) {
        return res.status(400).json({
          success: false,
          error: 'Connection ID is required'
        });
      }
      
      // Sample webhook data with media
      const sampleData: WebhookData = {
        type: 'test_webhook_with_media',
        data: {
          message: 'Test webhook with media from VBSolutionCRM',
          timestamp: new Date().toISOString(),
          connectionId,
          user: {
            id: 'test_user_123',
            name: 'Test User',
            email: 'test@example.com'
          }
        },
        timestamp: new Date(),
        connectionId,
        media: {
          type: 'image',
          data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1 transparent PNG
          filename: 'test_image.png',
          mimeType: 'image/png'
        }
      };

      // Store test data
      if (!this.webhookData.has(connectionId)) {
        this.webhookData.set(connectionId, []);
      }
      this.webhookData.get(connectionId)!.push(sampleData);

      // Process media
      if (sampleData.media) {
        await this.processMedia(sampleData.media, connectionId);
      }

      logger.info(`Test webhook with media sent successfully for connection ${connectionId}`);

      res.json({
        success: true,
        message: 'Test webhook with media sent successfully',
        data: sampleData
      });
    } catch (error) {
      logger.error(`Error sending test webhook with media: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to send test webhook with media',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Clear webhook data for a connection
  clearWebhookData = async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      if (!connectionId) {
        return res.status(400).json({
          success: false,
          error: 'Connection ID is required'
        });
      }

      this.webhookData.delete(connectionId);

      // Also clear uploaded files
      const connectionDir = path.resolve('./uploads', connectionId);
      if (fs.existsSync(connectionDir)) {
        fs.rmSync(connectionDir, { recursive: true, force: true });
      }

      res.json({
        success: true,
        message: 'Webhook data cleared successfully'
      });
    } catch (error) {
      logger.error(`Error clearing webhook data: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to clear webhook data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
