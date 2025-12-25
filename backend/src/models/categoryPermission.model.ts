import { model, Schema, Document } from 'mongoose';

export interface ICategoryPermission extends Document {
  _id: string;
  tenantId: string;
  userId: string;
 categoryId: string;
 permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const CategoryPermissionSchema = new Schema<ICategoryPermission>({
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  categoryId: {
    type: String,
    required: true,
    index: true,
  },
  permissions: {
    type: [String],
    required: true,
    enum: [
      'read',
      'write',
      'delete',
      'manage',
      'assign',
      'viewHierarchy',
      'createSubcategory'
    ],
    default: ['read']
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      ret.id = ret._id.toString();
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    }
  }
});

// Compound index for efficient permission lookups
CategoryPermissionSchema.index({ userId: 1, categoryId: 1 });
CategoryPermissionSchema.index({ tenantId: 1, categoryId: 1 });

export const CategoryPermission = model<ICategoryPermission>('CategoryPermission', CategoryPermissionSchema);