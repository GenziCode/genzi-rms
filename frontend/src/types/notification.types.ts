/**
 * Notification Types
 */

export type NotificationType = 
  | 'system'
  | 'sale'
  | 'payment'
  | 'inventory'
  | 'order'
  | 'customer'
  | 'alert'
  | 'reminder';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'webhook';

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

export interface InboxNotification {
  _id: string;
  notificationId?: string;
  eventKey: string;
  title: string;
  message: string;
  channels: NotificationChannel[];
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  actionUrl?: string;
  severity: NotificationSeverity;
  read: boolean;
  readAt?: string;
  archived: boolean;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationChannelPreference {
  enabled: boolean;
  quietHours?: {
    start?: string;
    end?: string;
  };
}

export interface NotificationPreferences {
  channels: Record<NotificationChannel, NotificationChannelPreference>;
  metadata?: Record<string, unknown>;
}

