import { Schema, Document } from 'mongoose';

export interface IVendor extends Document {
  tenantId: Schema.Types.ObjectId;

  // Basic Info
  name: string;
  company: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string; // Tax registration number

  // Contact Person
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;

  // Payment Terms
  paymentTerms: string; // "Net 30", "Net 60", "COD", "Advance", etc.
  creditLimit: number;
  creditDays: number; // Credit period in days

  // Financial Tracking
  currentBalance: number; // Amount owed to vendor
  totalPurchased: number; // Lifetime purchases

  // Products
  products: Schema.Types.ObjectId[]; // Products they supply

  // Statistics
  totalPurchaseOrders: number;
  averageDeliveryTime: number; // In days
  lastPurchaseDate?: Date;

  // Settings
  isActive: boolean;
  notes?: string;
  tags?: string[];

  createdBy: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const VendorSchema = new Schema<IVendor>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: String,
    country: {
      type: String,
      default: 'USA',
    },
    taxId: String,
    contactPerson: String,
    contactPhone: String,
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    paymentTerms: {
      type: String,
      default: 'Net 30',
    },
    creditLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
    creditDays: {
      type: Number,
      default: 30,
      min: 0,
    },
    currentBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPurchased: {
      type: Number,
      default: 0,
      min: 0,
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    totalPurchaseOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageDeliveryTime: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastPurchaseDate: Date,
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    notes: String,
    tags: [String],
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    updatedBy: Schema.Types.ObjectId,
  },
  {
    timestamps: true,
  }
);

// Indexes
VendorSchema.index({ tenantId: 1, isActive: 1 });
VendorSchema.index({ tenantId: 1, phone: 1 });
VendorSchema.index({ tenantId: 1, email: 1 });
VendorSchema.index({ tenantId: 1, company: 1 });

