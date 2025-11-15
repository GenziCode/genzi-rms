import { logger } from '../../utils/logger';
import { INotification, NotificationChannel } from '../../models/notification.model';

export interface SendParams {
  tenantId: string;
  notification: INotification;
  recipient: INotification['recipients'][number];
}

export interface SendResult {
  success: boolean;
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface NotificationChannelAdapter {
  send(params: SendParams): Promise<SendResult>;
}

const missingRecipientError = (field: string) => `Recipient missing ${field} information`;

const emailProvider: NotificationChannelAdapter = {
  async send({ notification, recipient }: SendParams) {
    if (!recipient.email) {
      return { success: false, error: missingRecipientError('email') };
    }
    const from = process.env.NOTIFICATIONS_EMAIL_FROM || 'noreply@example.com';
    logger.info('Dispatching email notification', {
      NotificationId: notification._id,
      eventKey: notification.eventKey,
      to: recipient.email,
      from,
    });
    // TODO: integrate with actual provider (SES/SendGrid)
    return { success: true };
  },
};

const smsProvider: NotificationChannelAdapter = {
  async send({ notification, recipient }: SendParams) {
    if (!recipient.phone) {
      return { success: false, error: missingRecipientError('phone') };
    }
    logger.info('Dispatching SMS notification', {
      NotificationId: notification._id,
      eventKey: notification.eventKey,
      to: recipient.phone,
    });
    // TODO: integrate with actual provider (Twilio, etc.)
    return { success: true };
  },
};

const webhookProvider: NotificationChannelAdapter = {
  async send({ notification, recipient }: SendParams) {
    if (!recipient.webhookUrl) {
      return { success: false, error: missingRecipientError('webhookUrl') };
    }
    logger.info('Dispatching webhook notification', {
      NotificationId: notification._id,
      eventKey: notification.eventKey,
      url: recipient.webhookUrl,
    });
    // TODO: perform actual HTTP POST to webhook target
    return { success: true };
  },
};

const inAppProvider: NotificationChannelAdapter = {
  async send({ notification, recipient }: SendParams) {
    logger.debug('Recording in-app notification', {
      NotificationId: notification._id,
      user: recipient.user,
    });
    return { success: true };
  },
};

export const channelAdapters: Partial<Record<NotificationChannel, NotificationChannelAdapter>> = {
  email: emailProvider,
  sms: smsProvider,
  webhook: webhookProvider,
  in_app: inAppProvider,
};

