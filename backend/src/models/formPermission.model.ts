import mongoose, { Schema, Document } from 'mongoose';

export interface IFormPermission extends Document {
  tenantId: mongoose.Types.ObjectId;
  formName: string; // Unique form identifier (e.g., 'frmProductFields')
  formCaption: string; // Display name (e.g., 'Products')
  formCategory: string; // Category (e.g., 'Configuration', 'Shop Activities')
  module?: string; // Associated module (e.g., 'product', 'customer')
  route?: string; // API route pattern (e.g., '/api/products')
  httpMethods?: string[]; // Allowed HTTP methods (e.g., ['GET', 'POST'])
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FormPermissionSchema = new Schema<IFormPermission>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
    },
    formName: {
      type: String,
      required: true,
      trim: true,
    },
    formCaption: {
      type: String,
      required: true,
      trim: true,
    },
    formCategory: {
      type: String,
      required: true,
      trim: true,
    },
    module: {
      type: String,
      trim: true,
      lowercase: true,
    },
    route: {
      type: String,
      trim: true,
    },
    httpMethods: {
      type: [String],
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      default: ['GET', 'POST', 'PUT', 'DELETE'],
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
FormPermissionSchema.index({ tenantId: 1, formName: 1 }, { unique: true });
FormPermissionSchema.index({ tenantId: 1, formCategory: 1 });
FormPermissionSchema.index({ tenantId: 1, module: 1 });
FormPermissionSchema.index({ tenantId: 1, isActive: 1 });

// Don't export model directly (follows same pattern as User model)
export { FormPermissionSchema };

