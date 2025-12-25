import { model, Schema, Document, Types } from 'mongoose';
import { ICategory } from './category.model';

export interface ICategoryApproval extends Document {
  _id: string;
  tenantId: string;
  category: Types.ObjectId; // Reference to Category
  requestedBy: Types.ObjectId; // Reference to User
  requestedChanges: Partial<ICategory>; // Stores the proposed changes
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvers: Types.ObjectId[]; // List of users who need to approve
  currentApprover: Types.ObjectId; // Current user responsible for approval
  approvalChain: Types.ObjectId[]; // Order of approval
  reason?: string; // Reason for rejection or additional info
  approvedBy?: Types.ObjectId; // Reference to User who approved
  rejectedBy?: Types.ObjectId; // Reference to User who rejected
  approvedAt?: Date;
  rejectedAt?: Date;
  expiresAt?: Date; // When the approval request expires
  comments: Array<{
    user: Types.ObjectId; // Reference to User
    comment: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export const CategoryApprovalSchema = new Schema<ICategoryApproval>({
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true,
  },
  requestedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  requestedChanges: {
    name: String,
    description: String,
    color: String,
    icon: String,
    parent: Schema.Types.ObjectId,
    image: String,
    sortOrder: Number,
    isActive: Boolean,
    isPublic: Boolean,
    sharedWith: [Schema.Types.ObjectId],
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
    isArchived: Boolean,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
    index: true,
  },
  approvers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  currentApprover: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  approvalChain: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  reason: {
    type: String,
    trim: true,
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  rejectedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  },
  rejectedAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
  },
  comments: [{
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      (ret as any).id = (ret as any)._id.toString();
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    }
  }
});

// Compound index for efficient approval lookups
CategoryApprovalSchema.index({ category: 1, status: 1 });
CategoryApprovalSchema.index({ requestedBy: 1, status: 1 });
CategoryApprovalSchema.index({ currentApprover: 1, status: 1 });
CategoryApprovalSchema.index({ tenantId: 1, status: 1 });

export const CategoryApproval = model<ICategoryApproval>('CategoryApproval', CategoryApprovalSchema);