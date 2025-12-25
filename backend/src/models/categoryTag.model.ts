import { Schema, Document, Types } from 'mongoose';

export interface ICategoryTag extends Document {
  name: string;
  description?: string;
  color: string; // Hex color code for UI display
  icon?: string; // Optional icon for the tag
  tenantId: Types.ObjectId; // For multi-tenant support
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const CategoryTagSchema = new Schema<ICategoryTag>({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true, // Each tag name should be unique per tenant
  },
  description: {
    type: String,
    trim: true,
  },
  color: {
    type: String,
    required: true,
    trim: true,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format'],
  },
  icon: {
    type: String,
    trim: true,
  },
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
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
CategoryTagSchema.index({ tenantId: 1 });
CategoryTagSchema.index({ name: 1, tenantId: 1 }, { unique: true }); // Unique name per tenant
CategoryTagSchema.index({ isActive: 1 });
CategoryTagSchema.index({ color: 1 });