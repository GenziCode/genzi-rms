import { Schema, Document } from 'mongoose';

export interface ICategoryTemplate extends Document {
  name: string;
  description?: string;
  categoryStructure: Array<{
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    sortOrder?: number;
    children?: Array<{
      name: string;
      description?: string;
      color?: string;
      icon?: string;
      sortOrder?: number;
    }>;
  }>;
  isPublic: boolean; // Whether this template is available to all tenants
  tenantId?: Schema.Types.ObjectId; // For tenant-specific templates
  createdBy: Schema.Types.ObjectId;
  updatedBy: Schema.Types.ObjectId;
  usageCount: number; // How many times this template has been used
  tags: string[]; // For categorization and search
  createdAt: Date;
  updatedAt: Date;
}

export const CategoryTemplateSchema = new Schema<ICategoryTemplate>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    categoryStructure: [{
      name: {
        type: String,
        required: true,
        trim: true,
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
      sortOrder: {
        type: Number,
        default: 0,
      },
      children: [{
        name: {
          type: String,
          required: true,
          trim: true,
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
        sortOrder: {
          type: Number,
          default: 0,
        },
      }],
    }],
    isPublic: {
      type: Boolean,
      default: false,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
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
    usageCount: {
      type: Number,
      default: 0,
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes
CategoryTemplateSchema.index({ name: 1 });
CategoryTemplateSchema.index({ isPublic: 1 });
CategoryTemplateSchema.index({ tenantId: 1 });
CategoryTemplateSchema.index({ tags: 1 });
CategoryTemplateSchema.index({ createdBy: 1 });
CategoryTemplateSchema.index({ usageCount: -1 });

// Compound indexes
CategoryTemplateSchema.index({ tenantId: 1, isPublic: 1 });
CategoryTemplateSchema.index({ name: 1, tenantId: 1 }, { unique: true });

// Pre-save middleware to ensure tenant-specific templates have unique names within tenant
CategoryTemplateSchema.pre('save', async function(next) {
  if (this.isNew && this.tenantId) {
    const CategoryTemplate = this.constructor as any;
    const existing = await CategoryTemplate.findOne({
      name: this.name,
      tenantId: this.tenantId,
    });
    if (existing) {
      const error = new Error('Template name already exists for this tenant');
      return next(error);
    }
  }
  next();
});