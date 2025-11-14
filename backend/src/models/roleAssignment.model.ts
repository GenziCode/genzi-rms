import mongoose, { Schema, Document } from 'mongoose';

export interface IRoleAssignment extends Document {
  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  roleId: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  assignedAt: Date;
  expiresAt?: Date;
  scopeOverride?: {
    type: 'all' | 'store' | 'department' | 'custom';
    storeIds?: mongoose.Types.ObjectId[];
    departmentIds?: mongoose.Types.ObjectId[];
    customFilters?: any;
  };
  delegatedFrom?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleAssignmentSchema = new Schema<IRoleAssignment>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    roleId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Role',
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: Date,
    scopeOverride: {
      type: {
        type: String,
        enum: ['all', 'store', 'department', 'custom'],
      },
      storeIds: [Schema.Types.ObjectId],
      departmentIds: [Schema.Types.ObjectId],
      customFilters: Schema.Types.Mixed,
    },
    delegatedFrom: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
RoleAssignmentSchema.index({ tenantId: 1, userId: 1, roleId: 1 });
RoleAssignmentSchema.index({ userId: 1, isActive: 1 });
RoleAssignmentSchema.index({ roleId: 1, isActive: 1 });
RoleAssignmentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-cleanup

// Don't export model directly (follows same pattern as User model)
export { RoleAssignmentSchema };

