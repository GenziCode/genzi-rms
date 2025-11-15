import { Document, Schema, Types } from 'mongoose';

export type StockTransferStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'picking'
  | 'in_transit'
  | 'received'
  | 'cancelled'
  | 'rejected';

export type StockTransferPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface IStockTransferItem {
  product: Types.ObjectId;
  sku?: string;
  name?: string;
  requestedQty: number;
  approvedQty?: number;
  pickedQty?: number;
  receivedQty?: number;
  uom?: string;
  notes?: string;
}

export interface IStockTransferActivity {
  action: string;
  message?: string;
  performedBy: Types.ObjectId;
  performedByName?: string;
  createdAt: Date;
}

export interface IStockTransfer extends Document {
  tenantId: Types.ObjectId;
  reference: string;
  status: StockTransferStatus;
  priority: StockTransferPriority;
  fromStore: Types.ObjectId;
  toStore: Types.ObjectId;
  reason?: string;
  notes?: string;
  watcherEmails?: string[];
  items: IStockTransferItem[];
  attachments?: Array<{
    name: string;
    url: string;
    uploadedAt: Date;
    uploadedBy: Types.ObjectId;
  }>;
  timeline: {
    createdAt: Date;
    submittedAt?: Date;
    approvedAt?: Date;
    pickingStartedAt?: Date;
    inTransitAt?: Date;
    receivedAt?: Date;
    cancelledAt?: Date;
    rejectedAt?: Date;
  };
  approvals?: {
    requestedBy?: Types.ObjectId;
    requestedAt?: Date;
    approvedBy?: Types.ObjectId;
    approvedAt?: Date;
    rejectedBy?: Types.ObjectId;
    rejectedAt?: Date;
    decisionNotes?: string;
  };
  activity: IStockTransferActivity[];
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StockTransferItemSchema = new Schema<IStockTransferItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: String,
    name: String,
    requestedQty: { type: Number, required: true, min: 1 },
    approvedQty: Number,
    pickedQty: Number,
    receivedQty: Number,
    uom: String,
    notes: String,
  },
  { _id: false }
);

const StockTransferActivitySchema = new Schema<IStockTransferActivity>(
  {
    action: { type: String, required: true },
    message: String,
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    performedByName: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

export const StockTransferSchema = new Schema<IStockTransfer>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    reference: { type: String, required: true },
    status: {
      type: String,
      enum: [
        'draft',
        'pending_approval',
        'approved',
        'picking',
        'in_transit',
        'received',
        'cancelled',
        'rejected',
      ],
      default: 'draft',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
      index: true,
    },
    fromStore: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    toStore: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    reason: String,
    notes: String,
    watcherEmails: [{ type: String, lowercase: true, trim: true }],
    items: {
      type: [StockTransferItemSchema],
      validate: [
        (val: IStockTransferItem[]) => Array.isArray(val) && val.length > 0,
        'At least one item is required',
      ],
    },
    attachments: [
      {
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    timeline: {
      createdAt: { type: Date, default: Date.now },
      submittedAt: Date,
      approvedAt: Date,
      pickingStartedAt: Date,
      inTransitAt: Date,
      receivedAt: Date,
      cancelledAt: Date,
      rejectedAt: Date,
    },
    approvals: {
      requestedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      requestedAt: Date,
      approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      approvedAt: Date,
      rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      rejectedAt: Date,
      decisionNotes: String,
    },
    activity: { type: [StockTransferActivitySchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

StockTransferSchema.index({ tenantId: 1, reference: 1 }, { unique: true });
StockTransferSchema.index({ tenantId: 1, createdAt: -1 });

