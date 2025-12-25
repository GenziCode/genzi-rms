import { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  parent?: Schema.Types.ObjectId;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  isPublic: boolean;
  sharedWith: Schema.Types.ObjectId[];
  accessControl: {
   roles: {
     role: string;
     permissions: string[];
   }[];
   users: {
     userId: Schema.Types.ObjectId;
     permissions: string[];
   }[];
  };
  isArchived: boolean;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const CategorySchema = new Schema<ICategory>(
  {
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
    isPublic: {
       type: Boolean,
       default: false,
    },
    sharedWith: [{
       type: Schema.Types.ObjectId,
       ref: 'Tenant',
    }],
    accessControl: {
       roles: [{
         role: String,
         permissions: [String]
       }],
       users: [{
         userId: { type: Schema.Types.ObjectId, ref: 'User' },
         permissions: [String]
       }]
    },
    isArchived: {
       type: Boolean,
       default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

// Auto-generate slug from name before validation
CategorySchema.pre('validate', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  next();
});

// Indexes
CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ parent: 1 });
CategorySchema.index({ isActive: 1, sortOrder: 1 });

