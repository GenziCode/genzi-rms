import { Schema, Document } from 'mongoose';

export interface IProductVariant {
  _id?: Schema.Types.ObjectId;
  name: string;
  sku: string;
  price: number;
  cost?: number;
  stock?: number;
  barcode?: string;
}

export interface IProduct extends Document {
  name: string;
  sku: string;
  barcode?: string;
  category: Schema.Types.ObjectId;
  description?: string;
  price: number;
  cost?: number;
  taxRate?: number;
  stock?: number;
  unit?: string;
  qrCode?: string;
  variants?: IProductVariant[];
  images?: string[];
  tags?: string[];
  isActive: boolean;
  trackInventory: boolean;
  allowNegativeStock: boolean;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  metadata?: Record<string, any>;
  createdBy: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    barcode: {
      type: String,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    cost: {
      type: Number,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      trim: true,
    },
    qrCode: {
      type: String,
      trim: true,
    },
    variants: [
      {
        name: { type: String, required: true },
        sku: { type: String, required: true },
        price: { type: Number, required: true },
        cost: Number,
        stock: { type: Number, default: 0 },
        barcode: String,
      },
    ],
    images: [String],
    tags: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
    trackInventory: {
      type: Boolean,
      default: true,
    },
    allowNegativeStock: {
      type: Boolean,
      default: false,
    },
    minStock: Number,
    maxStock: Number,
    reorderPoint: Number,
    reorderQuantity: Number,
    metadata: Schema.Types.Mixed,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ProductSchema.index({ sku: 1 });
ProductSchema.index({ barcode: 1 }, { sparse: true });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ isActive: 1 });

// Ensure variant SKUs are unique within product
ProductSchema.pre('save', function (next) {
  if (this.variants && this.variants.length > 0) {
    const skus = this.variants.map((v) => v.sku);
    const uniqueSkus = new Set(skus);
    if (skus.length !== uniqueSkus.size) {
      return next(new Error('Duplicate variant SKUs detected'));
    }
  }
  next();
});
