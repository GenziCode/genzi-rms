import axios from 'axios';
import crypto from 'crypto';
import { getTenantConnection } from '../config/database';
import { WebhookSchema, WebhookDeliverySchema, WebhookEvent } from '../models/webhook.model';
import { logger } from './logger';

/**
 * Trigger webhook for specific event
 */
export async function triggerWebhook(
  tenantId: string,
  event: WebhookEvent,
  payload: Record<string, any>
): Promise<void> {
  try {
    const tenantConn = await getTenantConnection(tenantId);
    const Webhook = tenantConn.model('Webhook', WebhookSchema);
    const WebhookDelivery = tenantConn.model('WebhookDelivery', WebhookDeliverySchema);

    // Find all active webhooks for this event
    const webhooks = await Webhook.find({
      tenantId,
      active: true,
      events: event,
    });

    if (webhooks.length === 0) {
      logger.debug(`No webhooks configured for event: ${event}`);
      return;
    }

    // Trigger each webhook
    for (const webhook of webhooks) {
      // Prepare payload
      const webhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        tenantId: tenantId,
        data: payload,
      };

      // Generate signature
      const signature = generateSignature(webhookPayload, webhook.secret);

      // Attempt delivery with retry
      await deliverWebhook(
        webhook._id.toString(),
        webhook.url,
        webhookPayload,
        signature,
        webhook.headers as any,
        webhook.retryCount,
        WebhookDelivery
      );
    }
  } catch (error) {
    logger.error(`Failed to trigger webhook for event ${event}:`, error);
    // Don't fail the main operation if webhook fails
  }
}

/**
 * Deliver webhook with retry logic
 */
async function deliverWebhook(
  webhookId: string,
  url: string,
  payload: any,
  signature: string,
  customHeaders: Record<string, string> = {},
  retryCount: number,
  WebhookDelivery: any
): Promise<void> {
  let attempt = 0;
  let success = false;
  let lastError: any = null;

  while (attempt < retryCount && !success) {
    attempt++;

    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': payload.event,
        'X-Webhook-Attempt': attempt.toString(),
        ...customHeaders,
      };

      const response = await axios.post(url, payload, {
        headers,
        timeout: 30000, // 30 seconds
      });

      // Record successful delivery
      await WebhookDelivery.create({
        webhookId,
        event: payload.event,
        payload,
        responseStatus: response.status,
        responseBody: JSON.stringify(response.data).substring(0, 1000),
        attempt,
        success: true,
        deliveredAt: new Date(),
      });

      success = true;
      logger.info(`Webhook delivered successfully: ${webhookId} to ${url}`);
    } catch (error: any) {
      lastError = error;
      
      // Record failed attempt
      await WebhookDelivery.create({
        webhookId,
        event: payload.event,
        payload,
        responseStatus: error.response?.status,
        responseBody: error.response?.data ? JSON.stringify(error.response.data).substring(0, 1000) : error.message,
        attempt,
        success: false,
        errorMessage: error.message,
      });

      logger.warn(`Webhook delivery failed (attempt ${attempt}/${retryCount}): ${url}`);

      // Wait before retry (exponential backoff)
      if (attempt < retryCount) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  // Update webhook stats
  const Webhook = WebhookDelivery.db.model('Webhook', WebhookSchema);
  await Webhook.findByIdAndUpdate(webhookId, {
    lastDelivery: new Date(),
    lastStatus: success ? 'success' : 'failed',
    $inc: {
      deliveryCount: success ? 1 : 0,
      failureCount: success ? 0 : 1,
    },
  });

  if (!success) {
    logger.error(`Webhook delivery failed after ${attempt} attempts: ${url}`, lastError);
  }
}

/**
 * Generate HMAC signature for webhook payload
 */
function generateSignature(payload: any, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: any,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

