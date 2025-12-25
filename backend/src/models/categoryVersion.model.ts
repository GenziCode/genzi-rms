import { Schema, Document } from 'mongoose';

export interface ICategoryVersion extends Document {
  categoryId: Schema.Types.ObjectId;
  version: number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  parent?: Schema.Types.ObjectId;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  changeReason?: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

export const CategoryVersionSchema = new Schema<ICategoryVersion>(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    version: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    image: String,
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    changeReason: {
      type: String,
      trim: true,
    },
    changes: [{
      field: {
        type: String,
        required: true,
      },
      oldValue: Schema.Types.Mixed,
      newValue: Schema.Types.Mixed,
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes
CategoryVersionSchema.index({ categoryId: 1, version: 1 }, { unique: true });
CategoryVersionSchema.index({ categoryId: 1, createdAt: -1 });