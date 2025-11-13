import { Schema, Document } from 'mongoose';

export type PaymentMethod = 'cash' | 'card' | 'mobile' | 'bank' | 'cheque' | 'credit';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
export type PaymentGateway = 'stripe' | 'paypal' | 'square' | 'manual';

export interface IPayment extends Document {
  tenantId: Schema.Types.ObjectId;
  invoiceId?: Schema.Types.ObjectId;
  saleId?: Schema.Types.ObjectId;
  customerId?: Schema.Types.ObjectId;
  
  // Payment details
  amount: number;
  currency: string;
  method: PaymentMethod;
  gateway?: PaymentGateway;
  status: PaymentStatus;
  
  // Gateway-specific IDs
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  paypalOrderId?: string;
  
  // Card details (if applicable)
  cardLast4?: string;
  cardBrand?: string;
  
  // Reference & tracking
  reference?: string;
  transactionId?: string;
  receiptUrl?: string;
  
  // Refund tracking
  refundedAmount?: number;
  refundReason?: string;
  refundedAt?: Date;
  
  // Metadata
  description?: string;
  metadata?: Record<string, any>;
  
  // Audit
  createdBy: Schema.Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const PaymentSchema = new Schema<IPayment>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
    },
    saleId: {
      type: Schema.Types.ObjectId,
      ref: 'Sale',
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'mobile', 'bank', 'cheque', 'credit'],
      required: true,
    },
    gateway: {
      type: String,
      enum: ['stripe', 'paypal', 'square', 'manual'],
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending',
      required: true,
    },
    stripePaymentIntentId: String,
    stripeChargeId: String,
    paypalOrderId: String,
    cardLast4: String,
    cardBrand: String,
    reference: String,
    transactionId: String,
    receiptUrl: String,
    refundedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    refundReason: String,
    refundedAt: Date,
    description: String,
    metadata: Schema.Types.Mixed,
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    processedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
PaymentSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
PaymentSchema.index({ tenantId: 1, customerId: 1 });
PaymentSchema.index({ tenantId: 1, invoiceId: 1 });
PaymentSchema.index({ stripePaymentIntentId: 1 }, { sparse: true });
PaymentSchema.index({ transactionId: 1 }, { sparse: true });

