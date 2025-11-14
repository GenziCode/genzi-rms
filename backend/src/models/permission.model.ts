import mongoose, { Schema, Document } from 'mongoose';

export interface IPermission extends Document {
  code: string; // Unique identifier (e.g., 'product:create', 'user:read')
  name: string;
  module: string; // e.g., 'product', 'user', 'inventory'
  action: string; // e.g., 'create', 'read', 'update', 'delete'
  description?: string;
  category: 'crud' | 'action' | 'report' | 'admin';
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema = new Schema<IPermission>(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    module: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: String,
    category: {
      type: String,
      enum: ['crud', 'action', 'report', 'admin'],
      default: 'crud',
    },
    isSystem: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance (unique index on code)
PermissionSchema.index({ code: 1 }, { unique: true });
PermissionSchema.index({ module: 1, action: 1 });
PermissionSchema.index({ category: 1 });
PermissionSchema.index({ module: 1 });

// Don't export model directly (follows same pattern as User model)
export { PermissionSchema };

