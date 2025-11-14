import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  code: string; // Unique identifier (e.g., 'admin', 'manager')
  description?: string;
  category: 'system' | 'custom';
  parentRole?: mongoose.Types.ObjectId;
  permissions: mongoose.Types.ObjectId[];
  scope: {
    type: 'all' | 'store' | 'department' | 'custom';
    storeIds?: mongoose.Types.ObjectId[];
    departmentIds?: mongoose.Types.ObjectId[];
    customFilters?: any;
  };
  isSystemRole: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: String,
    category: {
      type: String,
      enum: ['system', 'custom'],
      default: 'custom',
    },
    parentRole: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
    },
    permissions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Permission',
      },
    ],
    scope: {
      type: {
        type: String,
        enum: ['all', 'store', 'department', 'custom'],
        default: 'all',
      },
      storeIds: [Schema.Types.ObjectId],
      departmentIds: [Schema.Types.ObjectId],
      customFilters: Schema.Types.Mixed,
    },
    isSystemRole: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
RoleSchema.index({ tenantId: 1, code: 1 }, { unique: true });
RoleSchema.index({ tenantId: 1, isActive: 1 });
RoleSchema.index({ parentRole: 1 });
RoleSchema.index({ 'scope.type': 1 });

// Don't export model directly (follows same pattern as User model)
export { RoleSchema };

