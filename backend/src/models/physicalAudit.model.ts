import { Document, Schema, Types } from 'mongoose';

export type PhysicalAuditStatus =
  | 'draft'
  | 'scheduled'
  | 'counting'
  | 'review'
  | 'completed'
  | 'cancelled';

export type PhysicalAuditType = 'cycle' | 'blind' | 'full';

export interface IPhysicalAuditEntry {
  product: Types.ObjectId;
  sku?: string;
  name?: string;
  category?: string;
  expectedQty: number;
  countedQty?: number;
  variance?: number;
  status: 'pending' | 'counted' | 'needs_review';
  notes?: string;
  lastCountedBy?: Types.ObjectId;
  lastCountedAt?: Date;
}

export interface IPhysicalAuditSession extends Document {
  tenantId: Types.ObjectId;
  name: string;
  reference: string;
  status: PhysicalAuditStatus;
  type: PhysicalAuditType;
  store: Types.ObjectId;
  scheduledFor?: Date;
  dueDate?: Date;
  instructions?: string;
  counters?: Array<{
    user: Types.ObjectId;
    role?: string;
    status: 'pending' | 'active' | 'complete';
  }>;
  entries: IPhysicalAuditEntry[];
  attachments?: Array<{
    name: string;
    url: string;
    uploadedAt: Date;
    uploadedBy: Types.ObjectId;
  }>;
  timeline: {
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
  };
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

const AuditEntrySchema = new Schema<IPhysicalAuditEntry>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: String,
    name: String,
    category: String,
    expectedQty: { type: Number, required: true },
    countedQty: Number,
    variance: Number,
    status: {
      type: String,
      enum: ['pending', 'counted', 'needs_review'],
      default: 'pending',
    },
    notes: String,
    lastCountedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    lastCountedAt: Date,
  },
  { _id: false }
);

export const PhysicalAuditSessionSchema = new Schema<IPhysicalAuditSession>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true },
    reference: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'counting', 'review', 'completed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    type: {
      type: String,
      enum: ['cycle', 'blind', 'full'],
      default: 'cycle',
    },
    store: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    scheduledFor: Date,
    dueDate: Date,
    instructions: String,
    counters: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        role: String,
        status: {
          type: String,
          enum: ['pending', 'active', 'complete'],
          default: 'pending',
        },
      },
    ],
    entries: {
      type: [AuditEntrySchema],
      validate: [
        (val: IPhysicalAuditEntry[]) => Array.isArray(val) && val.length > 0,
        'At least one product entry is required',
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
      startedAt: Date,
      completedAt: Date,
      cancelledAt: Date,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

PhysicalAuditSessionSchema.index({ tenantId: 1, reference: 1 }, { unique: true });
PhysicalAuditSessionSchema.index({ tenantId: 1, status: 1 });

