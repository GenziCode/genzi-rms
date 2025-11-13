import { Schema, Document } from 'mongoose';

export type WebhookEvent = 
  | 'sale.created'
  | 'sale.completed'
  | 'sale.refunded'
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'customer.created'
  | 'customer.updated'
  | 'inventory.low_stock'
  | 'invoice.created'
  | 'invoice.paid'
  | 'payment.completed'
  | 'order.created'
  | 'order.shipped';

export interface IWebhookDelivery extends Document {
  webhookId: Schema.Types.ObjectId;
  event: WebhookEvent;
  payload: Record<string, any>;
  responseStatus?: number;
  responseBody?: string;
  attempt: number;
  success: boolean;
  errorMessage?: string;
  deliveredAt?: Date;
  createdAt: Date;
}

export interface IWebhook extends Document {
  tenantId: Schema.Types.ObjectId;
  url: string;
  events: WebhookEvent[];
  secret: string; // For signing payloads
  active: boolean;
  description?: string;
  headers?: Record<string, string>;
  retryCount: number;
  lastDelivery?: Date;
  lastStatus?: 'success' | 'failed';
  deliveryCount: number;
  failureCount: number;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const WebhookDeliverySchema = new Schema<IWebhookDelivery>(
  {
    webhookId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Webhook',
    },
    event: {
      type: String,
      required: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    responseStatus: Number,
    responseBody: String,
    attempt: {
      type: Number,
      default: 1,
    },
    success: {
      type: Boolean,
      default: false,
    },
    errorMessage: String,
    deliveredAt: Date,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const WebhookSchema = new Schema<IWebhook>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
    },
    url: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^https?:\/\/.+/.test(v),
        message: 'Invalid webhook URL',
      },
    },
    events: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'At least one event must be selected',
      },
    },
    secret: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    description: String,
    headers: {
      type: Map,
      of: String,
    },
    retryCount: {
      type: Number,
      default: 3,
      min: 0,
      max: 10,
    },
    lastDelivery: Date,
    lastStatus: {
      type: String,
      enum: ['success', 'failed'],
    },
    deliveryCount: {
      type: Number,
      default: 0,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
WebhookSchema.index({ tenantId: 1, active: 1 });
WebhookSchema.index({ tenantId: 1, events: 1 });
WebhookDeliverySchema.index({ webhookId: 1, createdAt: -1 });

