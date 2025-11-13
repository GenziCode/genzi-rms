import { Schema, Document } from 'mongoose';

export type SyncDeviceStatus = 'online' | 'offline' | 'degraded';

export interface ISyncDevice extends Document {
  tenantId: Schema.Types.ObjectId;
  deviceId: string;
  label?: string;
  store?: Schema.Types.ObjectId;
  location?: string;
  status: SyncDeviceStatus;
  lastSeenAt?: Date;
  lastSyncAt?: Date;
  lastPullAt?: Date;
  lastPushAt?: Date;
  queueSize: number;
  conflicts: number;
  appVersion?: string;
  platform?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export const SyncDeviceSchema = new Schema<ISyncDevice>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      trim: true,
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
    },
    location: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'degraded'],
      default: 'offline',
    },
    lastSeenAt: Date,
    lastSyncAt: Date,
    lastPullAt: Date,
    lastPushAt: Date,
    queueSize: {
      type: Number,
      default: 0,
      min: 0,
    },
    conflicts: {
      type: Number,
      default: 0,
      min: 0,
    },
    appVersion: String,
    platform: String,
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

SyncDeviceSchema.index({ tenantId: 1, deviceId: 1 }, { unique: true });


