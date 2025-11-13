import { Schema, Document } from 'mongoose';

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

export interface INotification extends Document {
  tenantId: Schema.Types.ObjectId;
  userId?: Schema.Types.ObjectId; // Target user (null for system-wide)
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  data?: Record<string, any>; // Additional payload
  read: boolean;
  readAt?: Date;
  sentAt?: Date;
  deliveryStatus: 'pending' | 'sent' | 'failed' | 'delivered';
  errorMessage?: string;
  entityType?: string; // Related entity (Sale, Product, etc.)
  entityId?: Schema.Types.ObjectId;
  actionUrl?: string; // URL to redirect when clicked
  createdBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchema = new Schema<INotification>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: ['system', 'sale', 'payment', 'inventory', 'order', 'customer', 'alert', 'reminder'],
      default: 'system',
      required: true,
    },
    channel: {
      type: String,
      enum: ['in_app', 'email', 'sms', 'push'],
      default: 'in_app',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    sentAt: Date,
    deliveryStatus: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'delivered'],
      default: 'pending',
    },
    errorMessage: String,
    entityType: String,
    entityId: {
      type: Schema.Types.ObjectId,
      refPath: 'entityType',
    },
    actionUrl: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
NotificationSchema.index({ tenantId: 1, userId: 1, read: 1 });
NotificationSchema.index({ tenantId: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ tenantId: 1, deliveryStatus: 1 });

