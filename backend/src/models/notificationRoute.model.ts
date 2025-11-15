import { Schema, Document, Types } from 'mongoose';
import { NotificationChannel } from './notification.model';

export interface INotificationRoute extends Document {
  tenantId: Types.ObjectId;
  eventKey: string;
  channels: Array<{
    channel: NotificationChannel;
    enabled: boolean;
    quietHours?: {
      start: string; // HH:mm
      end: string;
    };
    fallback?: NotificationChannel[];
  }>;
  filters?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const NotificationRouteSchema = new Schema<INotificationRoute>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    eventKey: { type: String, required: true },
    channels: [
      {
        channel: {
          type: String,
          enum: ['email', 'sms', 'webhook', 'in_app'],
          required: true,
        },
        enabled: { type: Boolean, default: true },
        quietHours: {
          start: { type: String },
          end: { type: String },
        },
        fallback: [
          { type: String, enum: ['email', 'sms', 'webhook', 'in_app'] },
        ],
      },
    ],
    filters: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

NotificationRouteSchema.index({ tenantId: 1, eventKey: 1 }, { unique: true });

