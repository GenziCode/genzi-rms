import crypto from 'crypto';
import { getTenantConnection } from '../config/database';
import { WebhookSchema, WebhookDeliverySchema, IWebhook, WebhookEvent } from '../models/webhook.model';
import { NotFoundError } from '../utils/appError';
import { logger } from '../utils/logger';
import { triggerWebhook } from '../utils/webhook-trigger';

export class WebhookService {
  /**
   * Create webhook
   */
  async create(
    tenantId: string,
    userId: string,
    data: {
      url: string;
      events: WebhookEvent[];
      description?: string;
      headers?: Record<string, string>;
      retryCount?: number;
    }
  ): Promise<IWebhook> {
    const tenantConn = await getTenantConnection(tenantId);
    const Webhook = tenantConn.model<IWebhook>('Webhook', WebhookSchema);

    // Generate secret for signing
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = new Webhook({
      tenantId,
      url: data.url,
      events: data.events,
      secret,
      description: data.description,
      headers: data.headers,
      retryCount: data.retryCount || 3,
      createdBy: userId,
    });

    await webhook.save();

    logger.info(`Webhook created: ${webhook._id} - URL: ${data.url}`);

    return webhook;
  }

  /**
   * Get all webhooks
   */
  async getAll(tenantId: string): Promise<{ webhooks: IWebhook[] }> {
    const tenantConn = await getTenantConnection(tenantId);
    const Webhook = tenantConn.model<IWebhook>('Webhook', WebhookSchema);

    const webhooks = await Webhook.find({ tenantId })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'firstName lastName email');

    return { webhooks };
  }

  /**
   * Get webhook by ID
   */
  async getById(tenantId: string, webhookId: string): Promise<IWebhook> {
    const tenantConn = await getTenantConnection(tenantId);
    const Webhook = tenantConn.model<IWebhook>('Webhook', WebhookSchema);

    const webhook = await Webhook.findOne({ _id: webhookId, tenantId })
      .populate('createdBy', 'firstName lastName email');

    if (!webhook) {
      throw new NotFoundError('Webhook');
    }

    return webhook;
  }

  /**
   * Update webhook
   */
  async update(
    tenantId: string,
    webhookId: string,
    data: Partial<IWebhook>
  ): Promise<IWebhook> {
    const tenantConn = await getTenantConnection(tenantId);
    const Webhook = tenantConn.model<IWebhook>('Webhook', WebhookSchema);

    const webhook = await Webhook.findOne({ _id: webhookId, tenantId });

    if (!webhook) {
      throw new NotFoundError('Webhook');
    }

    Object.assign(webhook, data);
    await webhook.save();

    logger.info(`Webhook updated: ${webhookId}`);

    return webhook;
  }

  /**
   * Delete webhook
   */
  async delete(tenantId: string, webhookId: string): Promise<void> {
    const tenantConn = await getTenantConnection(tenantId);
    const Webhook = tenantConn.model<IWebhook>('Webhook', WebhookSchema);

    const result = await Webhook.deleteOne({ _id: webhookId, tenantId });

    if (result.deletedCount === 0) {
      throw new NotFoundError('Webhook');
    }

    logger.info(`Webhook deleted: ${webhookId}`);
  }

  /**
   * Get webhook delivery logs
   */
  async getLogs(
    tenantId: string,
    webhookId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    logs: Record<string, unknown>[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const tenantConn = await getTenantConnection(tenantId);
    const WebhookDelivery = tenantConn.model('WebhookDelivery', WebhookDeliverySchema);

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      WebhookDelivery.find({ webhookId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WebhookDelivery.countDocuments({ webhookId }),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Test webhook
   */
  async test(tenantId: string, webhookId: string): Promise<boolean> {
    await this.getById(tenantId, webhookId);

    const testPayload = {
      test: true,
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook',
      },
    };

    try {
      await triggerWebhook(tenantId, 'sale.created', testPayload);
      return true;
    } catch (error) {
      logger.error(`Webhook test failed for ${webhookId}:`, error);
      return false;
    }
  }

  /**
   * Enable/disable webhook
   */
  async toggleActive(tenantId: string, webhookId: string, active: boolean): Promise<IWebhook> {
    return this.update(tenantId, webhookId, { active });
  }
}

export const webhookService = new WebhookService();

