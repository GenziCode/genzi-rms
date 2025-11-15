import { Schema, Document, Types } from 'mongoose';

export type NotificationChannel = 'email' | 'sms' | 'webhook' | 'in_app';

export type NotificationStatus =
  | 'pending'
  | 'scheduled'
  | 'sending'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface INotificationRecipient {
  user?: Types.ObjectId;
  email?: string;
  phone?: string;
  webhookUrl?: string;
  name?: string;
}

export interface INotification extends Document {
  tenantId: Types.ObjectId;
  eventKey: string;
  templateId?: Types.ObjectId;
  channels: NotificationChannel[];
  recipients: INotificationRecipient[];
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  status: NotificationStatus;
  attempts: number;
  lastAttemptAt?: Date;
  deliveredAt?: Date;
  lastError?: string;
  inboxOnly?: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RecipientSchema = new Schema<INotificationRecipient>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    webhookUrl: { type: String, trim: true },
    name: { type: String, trim: true },
  },
  { _id: false }
);

export const NotificationSchema = new Schema<INotification>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    eventKey: { type: String, required: true, index: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'NotificationTemplate' },
    channels: {
      type: [String],
      enum: ['email', 'sms', 'webhook', 'in_app'],
      default: ['in_app'],
    },
    recipients: { type: [RecipientSchema], default: [] },
    payload: { type: Schema.Types.Mixed, default: {} },
    metadata: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'sending', 'delivered', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: { type: Date },
    deliveredAt: { type: Date },
    lastError: { type: String },
    inboxOnly: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

NotificationSchema.index({ tenantId: 1, createdAt: -1 });
NotificationSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

