import { logger } from './logger';

interface DeliveryEventPayload {
  tenantId: string;
  notificationId: string;
  channel: 'email' | 'sms' | 'push' | 'in_app';
  durationMs: number;
  success: boolean;
  metadata?: Record<string, any>;
  payload?: Record<string, any>;
  errorMessage?: string;
}

interface DeliveryFailurePayload {
  tenantId: string;
  notificationId: string;
  channel: 'email' | 'sms' | 'push' | 'in_app';
  reason: string;
  payload?: Record<string, any>;
}

interface AuditAnomalyPayload {
  tenantId: string;
  entityType: string;
  entityId?: string;
  action: string;
  details?: Record<string, any>;
}

interface HttpEventPayload {
  method: string;
  path: string;
  status: number;
  duration: number;
  tenantId?: string;
  userId?: string;
}

class MonitoringService {
  private emit(event: string, data: Record<string, any>) {
    logger.info(`[monitoring] ${event}: ${JSON.stringify(data)}`);

    if (process.env.MONITORING_WEBHOOK_URL) {
      fetch(process.env.MONITORING_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data }),
      }).catch((error) => {
        logger.error('Failed to send monitoring webhook:', error);
      });
    }
  }

  trackNotificationDelivery(payload: DeliveryEventPayload) {
    this.emit('notification.delivery', payload);

    if (!payload.success) {
      this.trackNotificationFailure({
        tenantId: payload.tenantId,
        notificationId: payload.notificationId,
        channel: payload.channel,
        reason: payload.errorMessage ?? 'unknown',
        payload: payload.payload,
      });
    }
  }

  trackNotificationFailure(payload: DeliveryFailurePayload) {
    this.emit('notification.failure', payload);
  }

  trackNotificationTest(payload: {
    tenantId: string;
    channel: 'email' | 'sms';
    success: boolean;
    target?: string;
    metadata?: Record<string, any>;
    errorMessage?: string;
  }) {
    this.emit('notification.test', payload);

    if (!payload.success) {
      this.trackNotificationFailure({
        tenantId: payload.tenantId,
        notificationId: 'test',
        channel: payload.channel,
        reason: payload.errorMessage ?? 'test_failed',
        payload: payload.metadata,
      });
    }
  }

  trackPaymentTest(payload: {
    tenantId: string;
    provider: 'stripe';
    success: boolean;
    metadata?: Record<string, any>;
    errorMessage?: string;
  }) {
    this.emit('payment.test', payload);

    if (!payload.success) {
      this.emit('payment.failure', {
        tenantId: payload.tenantId,
        provider: payload.provider,
        reason: payload.errorMessage ?? 'test_failed',
        metadata: payload.metadata,
      });
    }
  }

  trackAuditAnomaly(payload: AuditAnomalyPayload) {
    this.emit('audit.anomaly', payload);
  }

  trackHttpRequest(payload: HttpEventPayload) {
    this.emit('http.request', payload);
  }
}

export const monitoringService = new MonitoringService();


