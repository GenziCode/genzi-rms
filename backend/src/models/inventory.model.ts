import { Schema, Document } from 'mongoose';

/**
 * Stock Movement Model
 * Tracks all inventory changes (sales, adjustments, transfers, etc.)
 */
export interface IStockMovement extends Document {
  tenantId: Schema.Types.ObjectId;
  product: Schema.Types.ObjectId;
  store: Schema.Types.ObjectId;

  type:
    | 'sale'
    | 'adjustment'
    | 'transfer_in'
    | 'transfer_out'
    | 'return'
    | 'damage'
    | 'restock'
    | 'initial';

  quantity: number; // Positive for increases, negative for decreases
  quantityBefore: number;
  quantityAfter: number;

  reason?: string;
  reference?: Schema.Types.ObjectId; // Sale ID, Transfer ID, etc.
  referenceType?: string; // 'Sale', 'Transfer', etc.

  notes?: string;

  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
}

export const StockMovementSchema = new Schema<IStockMovement>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'sale',
        'adjustment',
        'transfer_in',
        'transfer_out',
        'return',
        'damage',
        'restock',
        'initial',
      ],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    quantityBefore: {
      type: Number,
      required: true,
    },
    quantityAfter: {
      type: Number,
      required: true,
    },
    reason: String,
    reference: Schema.Types.ObjectId,
    referenceType: String,
    notes: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes for performance
StockMovementSchema.index({ tenantId: 1, product: 1, createdAt: -1 });
StockMovementSchema.index({ tenantId: 1, store: 1, createdAt: -1 });
StockMovementSchema.index({ tenantId: 1, type: 1 });

/**
 * Stock Alert Model
 * Tracks low stock, out of stock, and overstock alerts
 */
export interface IStockAlert extends Document {
  tenantId: Schema.Types.ObjectId;
  product: Schema.Types.ObjectId;
  store: Schema.Types.ObjectId;

  type: 'low_stock' | 'out_of_stock' | 'overstock';

  threshold: number; // The threshold that triggered the alert
  currentStock: number;

  status: 'active' | 'resolved' | 'acknowledged';

  acknowledgedBy?: Schema.Types.ObjectId;
  acknowledgedAt?: Date;

  resolvedBy?: Schema.Types.ObjectId;
  resolvedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const StockAlertSchema = new Schema<IStockAlert>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    type: {
      type: String,
      enum: ['low_stock', 'out_of_stock', 'overstock'],
      required: true,
    },
    threshold: {
      type: Number,
      required: true,
    },
    currentStock: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'acknowledged'],
      default: 'active',
    },
    acknowledgedBy: Schema.Types.ObjectId,
    acknowledgedAt: Date,
    resolvedBy: Schema.Types.ObjectId,
    resolvedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
StockAlertSchema.index({ tenantId: 1, status: 1 });
StockAlertSchema.index({ tenantId: 1, product: 1, status: 1 });
StockAlertSchema.index({ tenantId: 1, type: 1, status: 1 });

/**
 * Inventory Snapshot Model (Optional - for historical tracking)
 * Daily snapshots of inventory levels
 */
export interface IInventorySnapshot extends Document {
  tenantId: Schema.Types.ObjectId;
  date: Date;

  snapshots: Array<{
    product: Schema.Types.ObjectId;
    store: Schema.Types.ObjectId;
    quantity: number;
    value: number; // quantity * cost
  }>;

  totalValue: number;
  totalItems: number;

  createdAt: Date;
}

export const InventorySnapshotSchema = new Schema<IInventorySnapshot>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    snapshots: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        store: {
          type: Schema.Types.ObjectId,
          ref: 'Store',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        value: {
          type: Number,
          required: true,
        },
      },
    ],
    totalValue: {
      type: Number,
      required: true,
    },
    totalItems: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Unique index for one snapshot per day per tenant
InventorySnapshotSchema.index({ tenantId: 1, date: 1 }, { unique: true });
