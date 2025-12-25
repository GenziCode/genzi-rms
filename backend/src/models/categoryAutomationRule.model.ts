import { Schema, Document, Types } from 'mongoose';

export interface ICategoryAutomationRule extends Document {
  name: string;
  description?: string;
  triggerEvent: string; // e.g., 'create', 'update', 'delete', 'activate', 'deactivate'
  conditions: Array<{
    field: string;
    operator: string; // 'equals', 'notEquals', 'contains', 'greaterThan', 'lessThan', 'in'
    value: any;
  }>;
  actions: Array<{
    type: string; // 'sendNotification', 'updateField', 'createTask', 'triggerAPI', 'updateCategory'
    config: any; // Configuration specific to the action type
  }>;
  isActive: boolean;
  priority: number; // For ordering rule execution
  tenantId: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const CategoryAutomationRuleSchema = new Schema<ICategoryAutomationRule>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  triggerEvent: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'activate', 'deactivate', 'archive', 'unarchive'],
  },
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
  priority: {
    type: Number,
    default: 0,
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
CategoryAutomationRuleSchema.index({ tenantId: 1 });
CategoryAutomationRuleSchema.index({ isActive: 1 });
CategoryAutomationRuleSchema.index({ triggerEvent: 1 });
CategoryAutomationRuleSchema.index({ priority: -1 });
CategoryAutomationRuleSchema.index({ createdAt: -1 });
CategoryAutomationRuleSchema.index({ name: 1, tenantId: 1 }, { unique: true });