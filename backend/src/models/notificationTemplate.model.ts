import { Schema, Document, Types } from 'mongoose';
import { NotificationChannel } from './notification.model';

export interface INotificationTemplateVersion {
  version: number;
  channels: NotificationChannel[];
  subject?: string;
  content: string;
  variables: string[];
  changeSummary?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

export interface INotificationTemplate extends Document {
  tenantId: Types.ObjectId;
  name: string;
  key: string;
  description?: string;
  category?: string;
  tags: string[];
  channels: NotificationChannel[];
  defaultSubject?: string;
  samplePayload?: Record<string, unknown>;
  currentVersion: number;
  versions: INotificationTemplateVersion[];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateVersionSchema = new Schema<INotificationTemplateVersion>(
  {
    version: { type: Number, required: true },
    channels: {
      type: [String],
      enum: ['email', 'sms', 'webhook', 'in_app'],
      default: ['email'],
    },
    subject: { type: String },
    content: { type: String, required: true },
    variables: { type: [String], default: [] },
    changeSummary: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

export const NotificationTemplateSchema = new Schema<INotificationTemplate>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String },
    category: { type: String },
    tags: { type: [String], default: [] },
    channels: {
      type: [String],
      enum: ['email', 'sms', 'webhook', 'in_app'],
      default: ['email'],
    },
    defaultSubject: { type: String },
    samplePayload: { type: Schema.Types.Mixed },
    currentVersion: { type: Number, default: 1 },
    versions: { type: [TemplateVersionSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

NotificationTemplateSchema.index({ tenantId: 1, key: 1 }, { unique: true });
NotificationTemplateSchema.index({ tenantId: 1, name: 1 });

