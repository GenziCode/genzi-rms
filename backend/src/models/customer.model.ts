import { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  tenantId: Schema.Types.ObjectId;
  
  // Basic Info
  name: string;
  email?: string;
  phone: string;
  address?: string;
  dateOfBirth?: Date;
  
  // Loyalty Program
  loyaltyPoints: number;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  
  // Credit System
  creditLimit: number;
  creditBalance: number; // Current debt
  
  // Statistics
  totalPurchases: number; // Number of purchases
  totalSpent: number; // Total amount spent
  lastPurchase?: Date;
  averageOrderValue: number;
  
  // Metadata
  notes?: string;
  tags?: string[];
  isActive: boolean;
  
  createdBy: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const CustomerSchema = new Schema<ICustomer>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true, // Allow null but unique if exists
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    dateOfBirth: Date,
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    loyaltyTier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
    },
    creditLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
    creditBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPurchases: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastPurchase: Date,
    averageOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: String,
    tags: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
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

// Indexes for performance
CustomerSchema.index({ tenantId: 1, phone: 1 }, { unique: true });
CustomerSchema.index({ tenantId: 1, email: 1 }, { unique: true, sparse: true });
CustomerSchema.index({ tenantId: 1, isActive: 1 });
CustomerSchema.index({ tenantId: 1, loyaltyTier: 1 });
CustomerSchema.index({ tenantId: 1, totalSpent: -1 });

// Auto-update loyalty tier based on spending
CustomerSchema.pre('save', function (next) {
  if (this.isModified('totalSpent')) {
    if (this.totalSpent >= 10000) {
      this.loyaltyTier = 'platinum';
    } else if (this.totalSpent >= 5000) {
      this.loyaltyTier = 'gold';
    } else if (this.totalSpent >= 1000) {
      this.loyaltyTier = 'silver';
    } else {
      this.loyaltyTier = 'bronze';
    }
  }
  
  // Update average order value
  if (this.totalPurchases > 0) {
    this.averageOrderValue = this.totalSpent / this.totalPurchases;
  }
  
  next();
});

