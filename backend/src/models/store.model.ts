import { Schema, Document } from 'mongoose';

export interface IStore extends Document {
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
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
StoreSchema.index({ code: 1 });
StoreSchema.index({ isActive: 1 });

