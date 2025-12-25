import { Schema, Document, Types } from 'mongoose';

export interface ICategoryWorkflow extends Document {
  name: string;
  description?: string;
  triggerEvents: string[]; // e.g., 'create', 'update', 'delete', 'activate', 'deactivate'
  conditions: {
    field: string;
    operator: string; // e.g., 'equals', 'notEquals', 'contains', 'greaterThan', 'lessThan'
    value: any;
  }[];
  actions: {
    type: string; // e.g., 'sendNotification', 'updateField', 'createTask', 'triggerAPI'
    config: any; // Configuration specific to the action type
  }[];
  isActive: boolean;
  tenantId: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const CategoryWorkflowSchema = new Schema<ICategoryWorkflow>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  triggerEvents: [{
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'activate', 'deactivate', 'archive', 'unarchive']
  }],
  conditions: [{
    field: String,
    operator: String,
    value: Schema.Types.Mixed,
  }],
  actions: [{
    type: String,
    config: Schema.Types.Mixed,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes
CategoryWorkflowSchema.index({ tenantId: 1 });
CategoryWorkflowSchema.index({ isActive: 1 });
CategoryWorkflowSchema.index({ triggerEvents: 1 });
CategoryWorkflowSchema.index({ createdAt: -1 });
CategoryWorkflowSchema.index({ name: 1, tenantId: 1 }, { unique: true });