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

export type NotificationChannel = 
  | 'in_app'
  | 'email'
  | 'sms'
  | 'push';

export interface Notification {
  _id: string;
  id: string;
  tenantId: string;
  userId?: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  readAt?: string;
  sentAt?: string;
  deliveryStatus: 'pending' | 'sent' | 'failed' | 'delivered';
  errorMessage?: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
  types: {
    sale: boolean;
    payment: boolean;
    inventory: boolean;
    order: boolean;
    customer: boolean;
    alert: boolean;
    reminder: boolean;
  };
}

