import { Schema, Document, Types } from 'mongoose';
import { NotificationChannel } from './notification.model';

export interface INotificationPreference extends Document {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  channels: Record<
    NotificationChannel,
    {
      enabled: boolean;
      quietHours?: {
        start: string;
        end: string;
      };
    }
  >;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ChannelPreferenceSchema = new Schema(
  {
    enabled: { type: Boolean, default: true },
    quietHours: {
      start: { type: String },
      end: { type: String },
    },
  },
  { _id: false }
);

export const NotificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    channels: {
      type: new Schema<Record<NotificationChannel, any>>(
        {
          email: { type: ChannelPreferenceSchema, default: () => ({ enabled: true }) },
          sms: { type: ChannelPreferenceSchema, default: () => ({ enabled: true }) },
          webhook: { type: ChannelPreferenceSchema, default: () => ({ enabled: true }) },
          in_app: { type: ChannelPreferenceSchema, default: () => ({ enabled: true }) },
        },
        { _id: false }
      ),
      default: () => ({
        email: { enabled: true },
        sms: { enabled: true },
        webhook: { enabled: true },
        in_app: { enabled: true },
      }),
    },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationPreferenceSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

