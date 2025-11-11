import { Schema, Document } from 'mongoose';

export interface IPurchaseOrderItem {
  product: Schema.Types.ObjectId;
  name: string;
  sku: string;
  quantity: number;
  unitCost: number;
  tax: number;
  taxRate: number;
  total: number;
  receivedQuantity?: number;
}

export interface IPurchaseOrder extends Document {
  poNumber: string;
  tenantId: Schema.Types.ObjectId;
  vendor: Schema.Types.ObjectId;
  store: Schema.Types.ObjectId;

  items: IPurchaseOrderItem[];

  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;

  status: 'draft' | 'sent' | 'confirmed' | 'partially_received' | 'received' | 'cancelled';

  // Dates
  orderDate: Date;
  expectedDate?: Date;
  confirmedDate?: Date;
  receivedDate?: Date;
  cancelledDate?: Date;

  // References
  vendorInvoiceNumber?: string;
  notes?: string;

  // Tracking
  sentBy?: Schema.Types.ObjectId;
  receivedBy?: Schema.Types.ObjectId;
  cancelledBy?: Schema.Types.ObjectId;
  cancellationReason?: string;

  createdBy: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
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
        unitCost: { type: Number, required: true, min: 0 },
        tax: { type: Number, default: 0, min: 0 },
        taxRate: { type: Number, default: 0, min: 0, max: 100 },
        total: { type: Number, required: true, min: 0 },
        receivedQuantity: { type: Number, default: 0, min: 0 },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled'],
      default: 'draft',
      index: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    expectedDate: Date,
    confirmedDate: Date,
    receivedDate: Date,
    cancelledDate: Date,
    vendorInvoiceNumber: String,
    notes: String,
    sentBy: Schema.Types.ObjectId,
    receivedBy: Schema.Types.ObjectId,
    cancelledBy: Schema.Types.ObjectId,
    cancellationReason: String,
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

// Indexes
PurchaseOrderSchema.index({ tenantId: 1, status: 1 });
PurchaseOrderSchema.index({ tenantId: 1, vendor: 1 });
PurchaseOrderSchema.index({ tenantId: 1, orderDate: -1 });
PurchaseOrderSchema.index({ poNumber: 1 }, { unique: true });

// Auto-generate PO number before validation
PurchaseOrderSchema.pre('validate', async function (next) {
  if (this.isNew && !this.poNumber) {
    try {
      const PO = this.constructor as any;
      const count = await PO.countDocuments({ tenantId: this.tenantId });
      this.poNumber = `PO${String(count + 1).padStart(6, '0')}`;
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

