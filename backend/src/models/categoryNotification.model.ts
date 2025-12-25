import { Schema, Document } from 'mongoose';

export interface ICategoryNotification extends Document {
  category: Schema.Types.ObjectId;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'critical';
  recipients: {
    user: Schema.Types.ObjectId;
    readAt?: Date;
    acknowledgedAt?: Date;
  }[];
  sender: Schema.Types.ObjectId;
  isRead: boolean;
  isAcknowledged: boolean;
  scheduledAt?: Date;
  sentAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export const CategoryNotificationSchema = new Schema<ICategoryNotification>(
  {
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'error', 'success'],
      default: 'info',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    recipients: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      readAt: Date,
      acknowledgedAt: Date,
    }],
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isAcknowledged: {
      type: Boolean,
      default: false,
    },
    scheduledAt: Date,
    sentAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: Date,
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CategoryNotificationSchema.index({ category: 1 });
CategoryNotificationSchema.index({ sender: 1 });
CategoryNotificationSchema.index({ type: 1 });
CategoryNotificationSchema.index({ priority: 1 });
CategoryNotificationSchema.index({ sentAt: -1 });
CategoryNotificationSchema.index({ expiresAt: 1 });
CategoryNotificationSchema.index({ 'recipients.user': 1, isRead: 1 });