import { Schema, Document } from 'mongoose';

export interface ISaleItem {
  product: Schema.Types.ObjectId;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  cost: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  tax: number;
  taxRate: number;
  subtotal: number;
  total: number;
}

export interface IPayment {
  method: 'cash' | 'card' | 'mobile' | 'bank' | 'credit' | 'other';
  amount: number;
  reference?: string;
  cardLast4?: string;
  transactionId?: string;
}

export interface ISale extends Document {
  saleNumber: string;
  tenantId: Schema.Types.ObjectId;
  store: Schema.Types.ObjectId;
  cashier: Schema.Types.ObjectId;
  customer?: Schema.Types.ObjectId;

  // Offline sync support
  clientId?: string; // UUID from offline client
  offlineCreatedAt?: Date; // When created offline
  syncedAt?: Date; // When synced to server
  syncStatus?: 'online' | 'synced' | 'conflict';

  items: ISaleItem[];

  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  tax: number;
  total: number;

  payments: IPayment[];
  amountPaid: number;
  change: number;

  status: 'completed' | 'held' | 'voided' | 'refunded' | 'partial_refund';
  notes?: string;
  receiptUrl?: string;

  // For held transactions
  heldAt?: Date;
  heldBy?: Schema.Types.ObjectId;

  // For voided/refunded
  voidedAt?: Date;
  voidedBy?: Schema.Types.ObjectId;
  voidReason?: string;
  refundedAt?: Date;
  refundedBy?: Schema.Types.ObjectId;
  refundAmount?: number;
  refundReason?: string;

  // Metadata
  metadata?: Record<string, any>;

  createdBy: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const SaleSchema = new Schema<ISale>(
  {
    saleNumber: {
      type: String,
      trim: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    cashier: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: { type: String, required: true },
        sku: { type: String, required: true },
        quantity: { type: Number, required: true, min: 0 },
        price: { type: Number, required: true, min: 0 },
        cost: { type: Number, default: 0, min: 0 },
        discount: { type: Number, default: 0, min: 0 },
        discountType: {
          type: String,
          enum: ['percentage', 'fixed'],
          default: 'fixed',
        },
        tax: { type: Number, default: 0, min: 0 },
        taxRate: { type: Number, default: 0, min: 0, max: 100 },
        subtotal: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'fixed',
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    payments: [
      {
        method: {
          type: String,
          enum: ['cash', 'card', 'mobile', 'bank', 'credit', 'other'],
          required: true,
        },
        amount: { type: Number, required: true, min: 0 },
        reference: String,
        cardLast4: String,
        transactionId: String,
      },
    ],
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    change: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['completed', 'held', 'voided', 'refunded', 'partial_refund'],
      default: 'completed',
    },
    notes: String,
    receiptUrl: String,
    heldAt: Date,
    heldBy: Schema.Types.ObjectId,
    voidedAt: Date,
    voidedBy: Schema.Types.ObjectId,
    voidReason: String,
    refundedAt: Date,
    refundedBy: Schema.Types.ObjectId,
    refundAmount: Number,
    refundReason: String,
    metadata: Schema.Types.Mixed,
    clientId: {
      type: String,
      trim: true,
    },
    offlineCreatedAt: Date,
    syncedAt: Date,
    syncStatus: {
      type: String,
      enum: ['online', 'synced', 'conflict'],
      default: 'online',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    updatedBy: Schema.Types.ObjectId,
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
SaleSchema.index({ tenantId: 1, createdAt: -1 });
SaleSchema.index({ tenantId: 1, status: 1 });
SaleSchema.index({ tenantId: 1, cashier: 1, createdAt: -1 });
SaleSchema.index({ tenantId: 1, customer: 1 });
SaleSchema.index({ saleNumber: 1 }, { unique: true });
SaleSchema.index({ clientId: 1 }, { unique: true, sparse: true }); // For offline sync
SaleSchema.index({ tenantId: 1, syncStatus: 1 });

// Virtual for profit
SaleSchema.virtual('profit').get(function () {
  const totalCost = this.items.reduce((sum, item) => sum + item.cost * item.quantity, 0);
  return this.total - totalCost;
});

// Auto-generate sale number before validation
SaleSchema.pre('validate', async function (next) {
  if (this.isNew && !this.saleNumber) {
    try {
      const Sale = this.constructor as any;
      const count = await Sale.countDocuments({ tenantId: this.tenantId });
      this.saleNumber = `SAL${String(count + 1).padStart(6, '0')}`;
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});
