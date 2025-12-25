import { model, Schema, Document } from 'mongoose';

export interface ICategoryCollaboration extends Document {
  _id: string;
 tenantId: string;
  categoryId: string;
  userId: string;
  role: 'viewer' | 'editor' | 'admin';
  permissions: string[];
  invitedBy: string;
  invitedAt: Date;
 acceptedAt?: Date;
  isActive: boolean;
  notificationsEnabled: boolean;
  lastAccessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const CategoryCollaborationSchema = new Schema<ICategoryCollaboration>({
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  categoryId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['viewer', 'editor', 'admin'],
    default: 'viewer',
  },
  permissions: {
    type: [String],
    required: true,
    default: [],
  },
  invitedBy: {
    type: String,
    required: true,
  },
  invitedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  acceptedAt: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: false, // Initially false until user accepts invitation
  },
  notificationsEnabled: {
    type: Boolean,
    default: true,
  },
  lastAccessedAt: {
    type: Date,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      ret.id = ret._id.toString();
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    }
  }
});

// Compound index for efficient collaboration lookups
CategoryCollaborationSchema.index({ categoryId: 1, userId: 1 });
CategoryCollaborationSchema.index({ tenantId: 1, userId: 1 });
CategoryCollaborationSchema.index({ tenantId: 1, categoryId: 1, isActive: 1 });

export const CategoryCollaboration = model<ICategoryCollaboration>('CategoryCollaboration', CategoryCollaborationSchema);