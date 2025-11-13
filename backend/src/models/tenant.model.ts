import mongoose, { Schema, Document } from 'mongoose';
import { TenantStatus, SubscriptionPlan, SubscriptionStatus } from '../types';

export interface ITenant extends Document {
  name: string;
  slug: string;
  subdomain: string;
  customDomain?: string;
  dbName: string;
  owner: {
    name: string;
    email: string;
    phone?: string;
  };
  subscription: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    trialStartDate?: Date;
    trialEndDate?: Date;
    billingCycle: 'monthly' | 'yearly';
    nextBillingDate?: Date;
  };
  billing?: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
  limits: {
    users: number;
    stores: number;
    products: number;
    monthlyTransactions: number;
    storageBytes: number;
  };
  usage: {
    users: number;
    stores: number;
    products: number;
    monthlyTransactions: number;
    storageBytes: number;
    lastReset?: Date;
  };
  features: {
    multiStore: boolean;
    restaurant: boolean;
    inventory: boolean;
    loyalty: boolean;
    reporting: boolean;
    api: boolean;
    webhooks: boolean;
  };
  settings: {
    timezone: string;
    currency: string;
    language: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
  };
  status: TenantStatus;
  suspendedAt?: Date;
  suspendedBy?: Schema.Types.ObjectId;
  suspendReason?: string;
  reactivatedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema = new Schema<ITenant>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    subdomain: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/,
    },
    customDomain: {
      type: String,
      trim: true,
    },
    dbName: {
      type: String,
      required: true,
      unique: true,
    },
    owner: {
      name: { type: String, required: true },
      email: { type: String, required: true, lowercase: true },
      phone: String,
    },
    subscription: {
      plan: {
        type: String,
        enum: Object.values(SubscriptionPlan),
        default: SubscriptionPlan.FREE,
      },
      status: {
        type: String,
        enum: Object.values(SubscriptionStatus),
        default: SubscriptionStatus.TRIAL,
      },
      trialStartDate: Date,
      trialEndDate: Date,
      billingCycle: {
        type: String,
        enum: ['monthly', 'yearly'],
        default: 'monthly',
      },
      nextBillingDate: Date,
    },
    billing: {
      stripeCustomerId: String,
      stripeSubscriptionId: String,
    },
    limits: {
      users: { type: Number, default: 5 },
      stores: { type: Number, default: 1 },
      products: { type: Number, default: 1000 },
      monthlyTransactions: { type: Number, default: 5000 },
      storageBytes: { type: Number, default: 1073741824 }, // 1GB
    },
    usage: {
      users: { type: Number, default: 0 },
      stores: { type: Number, default: 0 },
      products: { type: Number, default: 0 },
      monthlyTransactions: { type: Number, default: 0 },
      storageBytes: { type: Number, default: 0 },
      lastReset: Date,
    },
    features: {
      multiStore: { type: Boolean, default: false },
      restaurant: { type: Boolean, default: false },
      inventory: { type: Boolean, default: true },
      loyalty: { type: Boolean, default: false },
      reporting: { type: Boolean, default: true },
      api: { type: Boolean, default: false },
      webhooks: { type: Boolean, default: false },
    },
    settings: {
      timezone: { type: String, default: 'America/New_York' },
      currency: { type: String, default: 'USD' },
      language: { type: String, default: 'en' },
      dateFormat: { type: String, default: 'MM/DD/YYYY' },
      timeFormat: { type: String, enum: ['12h', '24h'], default: '12h' },
    },
    status: {
      type: String,
      enum: Object.values(TenantStatus),
      default: TenantStatus.ACTIVE,
    },
    suspendedAt: Date,
    suspendedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    suspendReason: String,
    reactivatedAt: Date,
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
TenantSchema.index({ subdomain: 1 }, { unique: true });
TenantSchema.index({ customDomain: 1 }, { unique: true, sparse: true });
TenantSchema.index({ status: 1 });
TenantSchema.index({ 'subscription.status': 1 });

// Methods
TenantSchema.methods.isActive = function (): boolean {
  return this.status === TenantStatus.ACTIVE && 
         (this.subscription.status === SubscriptionStatus.ACTIVE || 
          this.subscription.status === SubscriptionStatus.TRIAL);
};

TenantSchema.methods.isTrialExpired = function (): boolean {
  if (this.subscription.status !== SubscriptionStatus.TRIAL) {
    return false;
  }
  return this.subscription.trialEndDate ? new Date() > this.subscription.trialEndDate : false;
};

TenantSchema.methods.checkLimit = function (resource: string): boolean {
  return this.usage[resource] < this.limits[resource];
};

// Don't export model directly (will be created per connection)
export { TenantSchema };

