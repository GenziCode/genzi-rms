import { Document, Schema, Types } from 'mongoose';

export type WarehouseZoneType = 'receiving' | 'storage' | 'picking' | 'staging';

export interface IWarehouseZone {
  name: string;
  code: string;
  type: WarehouseZoneType;
  description?: string;
}

export interface IWarehouseBin {
  code: string;
  zoneCode: string;
  capacity?: number;
  currentLoad?: number;
  allowOversize?: boolean;
  attributes?: Record<string, unknown>;
}

export interface IWarehouseTask {
  reference: string;
  type: 'putaway' | 'pick' | 'transfer' | 'count';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignedTo?: Types.ObjectId;
  product?: Types.ObjectId;
  quantity?: number;
  sourceBin?: string;
  destinationBin?: string;
  notes?: string;
  timeline: {
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
  };
}

export interface IWarehouse extends Document {
  tenantId: Types.ObjectId;
  store: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  zones: IWarehouseZone[];
  bins: IWarehouseBin[];
  tasks?: IWarehouseTask[];
  createdAt: Date;
  updatedAt: Date;
}

const WarehouseZoneSchema = new Schema<IWarehouseZone>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
    type: {
      type: String,
      enum: ['receiving', 'storage', 'picking', 'staging'],
      default: 'storage',
    },
    description: String,
  },
  { _id: false }
);

const WarehouseBinSchema = new Schema<IWarehouseBin>(
  {
    code: { type: String, required: true },
    zoneCode: { type: String, required: true },
    capacity: Number,
    currentLoad: { type: Number, default: 0 },
    allowOversize: { type: Boolean, default: false },
    attributes: Schema.Types.Mixed,
  },
  { _id: false }
);

const WarehouseTaskSchema = new Schema<IWarehouseTask>(
  {
    reference: { type: String, required: true },
    type: {
      type: String,
      enum: ['putaway', 'pick', 'transfer', 'count'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    sourceBin: String,
    destinationBin: String,
    notes: String,
    timeline: {
      createdAt: { type: Date, default: Date.now },
      startedAt: Date,
      completedAt: Date,
      cancelledAt: Date,
    },
  },
  { _id: false }
);

export const WarehouseSchema = new Schema<IWarehouse>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    store: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    description: String,
    zones: { type: [WarehouseZoneSchema], default: [] },
    bins: { type: [WarehouseBinSchema], default: [] },
    tasks: { type: [WarehouseTaskSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

WarehouseSchema.index({ tenantId: 1, code: 1 }, { unique: true });

