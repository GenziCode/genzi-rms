import { Schema, Document } from 'mongoose';

export interface IStore extends Document {
  tenantId: Schema.Types.ObjectId;
  name: string;
  code: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  phone?: string;
  email?: string;
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  businessDetails?: {
    registrationNumber?: string;
    taxId?: string;
    businessType?: string;
  };
  timezone?: string;
  currency?: string;
  manager?: Schema.Types.ObjectId;
  isActive: boolean;
  isDefault: boolean;
  settings?: {
    timezone?: string;
    taxRate?: number;
    currency?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const StoreSchema = new Schema<IStore>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    phone: String,
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    contact: {
      phone: String,
      email: String,
      website: String,
    },
    businessDetails: {
      registrationNumber: String,
      taxId: String,
      businessType: String,
    },
    timezone: { type: String, default: 'America/New_York' },
    currency: { type: String, default: 'USD' },
    manager: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    settings: {
      timezone: { type: String, default: 'America/New_York' },
      taxRate: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
StoreSchema.index({ tenantId: 1, code: 1 }, { unique: true });
StoreSchema.index({ tenantId: 1, isActive: 1 });

