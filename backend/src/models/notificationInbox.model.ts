import { Schema, Document, Types } from 'mongoose';
import { NotificationChannel } from './notification.model';

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

export interface INotificationInbox extends Document {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  notificationId?: Types.ObjectId;
  eventKey: string;
  title: string;
  message: string;
  channels: NotificationChannel[];
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  actionUrl?: string;
  severity: NotificationSeverity;
  read: boolean;
  readAt?: Date;
  archived: boolean;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const NotificationInboxSchema = new Schema<INotificationInbox>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    notificationId: { type: Schema.Types.ObjectId, ref: 'Notification' },
    eventKey: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    channels: {
      type: [String],
      enum: ['email', 'sms', 'webhook', 'in_app'],
      default: ['in_app'],
    },
    payload: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
    actionUrl: { type: String },
    severity: {
      type: String,
      enum: ['info', 'success', 'warning', 'error'],
      default: 'info',
    },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    archived: { type: Boolean, default: false, index: true },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

NotificationInboxSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });
NotificationInboxSchema.index({ tenantId: 1, userId: 1, read: 1, archived: 1 });


